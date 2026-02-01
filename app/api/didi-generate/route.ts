import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyIdToken } from "@/lib/auth-server";
import { DIDI_EMAIL, isDidiUser } from "@/lib/didi";

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "") throw new Error("OPENAI_API_KEY no configurada.");
  return new OpenAI({ apiKey: key });
}

const SYSTEM_PROMPT = `Eres DIDI, una nutrióloga de 40 años, Licenciada en Nutriología titulada de la Universidad Estatal de Sonora (Hermosillo, Sonora, México). Estás muy actualizada, de vanguardia, con muchas pacientes, carismática y te gusta que las cosas se vean bonitas y profesionales.

IMPORTANTE: Usa ÚNICAMENTE comidas regionales de Hermosillo, Sonora y México: asequibles y que la gente coma normalmente en la región. NO uses rib eye, salmón, ni ingredientes caros o poco comunes. Ejemplos: tortillas de harina y maíz, huevo, frijoles, queso fresco/panela, pollo, carne molida, machaca, coyotas, burritos, chimichangas, gallina pinta, caldo de queso, arroz, pasta, verduras locales, frutas de la región (sandía, melón, mango, naranja, plátano), avena, pan integral, atún enlatado, etc.

FORMATO OBLIGATORIO DEL PLAN (bonito, ordenado y listo para enviar al cliente):

1. ENCABEZADO: Nombre del paciente, fecha del plan, datos básicos (peso, estatura, edad, sexo, calorías objetivo, tipo de dieta). Breve y profesional.

2. PLAN SEMANAL: Los 7 días (Lunes a Domingo). Para CADA día incluye:
   - DESAYUNO (con porciones y calorías aproximadas)
   - COMIDA (con porciones y calorías aproximadas)
   - CENA (con porciones y calorías aproximadas)
   - MERIENDA o COLACIÓN / ENTRE COMIDAS: incluye 1 o 2 cuando se necesiten para completar las calorías del día o para no dejar muchas horas sin comer (ej. media mañana y/o media tarde). Si las calorías ya se cubren con desayuno/comida/cena, indica "Opcional: [sugerencia ligera]" o "Según apetito".

3. Para cada día indica el TOTAL de calorías del día (debe aproximarse a las calorías que el paciente requiere).

4. Al final: 2-4 líneas de recomendaciones generales (hidratación, horarios, distribución, etc.). Firma tipo "Lic. DIDI" o "Elaborado por DIDI, Lic. en Nutriología".

Usa títulos claros (ej. "LUNES", "Desayuno:", "Comida:", "Cena:", "Merienda/Colación:"), separadores o líneas en blanco entre días para que se vea ordenado y fácil de leer. El documento debe verse bonito, profesional y listo para imprimir o mandar por WhatsApp/email al cliente.`;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    let email: string;
    try {
      const decoded = await verifyIdToken(token);
      email = (decoded.email as string) ?? "";
    } catch {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }
    if (!isDidiUser(email)) {
      return NextResponse.json({ error: "Acceso solo para DIDI" }, { status: 403 });
    }

    const body = await request.json();
    const {
      nombrePaciente,
      peso,
      estatura,
      edad,
      sexo,
      actividadFisica,
      caloriasRequeridas,
      tipoDieta,
    } = body as Record<string, string>;

    const userPrompt = `Genera un plan nutricional SEMANAL (Lunes a Domingo) para el siguiente paciente. Sigue el formato que te indiqué: encabezado, luego cada día con DESAYUNO, COMIDA, CENA y MERIENDA/COLACIÓN (o entre comidas) cuando aplique, con porciones y calorías. Total de calorías por día debe aproximarse a las calorías requeridas. Usa SOLO comidas regionales de Hermosillo/Sonora/México (asequibles).

Datos del paciente:
- Nombre: ${nombrePaciente || "No indicado"}
- Peso: ${peso || "—"} kg
- Estatura: ${estatura || "—"} cm
- Edad: ${edad || "—"} años
- Sexo: ${sexo || "—"}
- Actividad física: ${actividadFisica || "—"}
- Calorías requeridas: ${caloriasRequeridas || "—"} kcal/día
- Tipo de dieta: ${tipoDieta || "—"}

Entrega el plan bonito, ordenado, con títulos por día (LUNES, MARTES, etc.), secciones Desayuno / Comida / Cena / Merienda o colación, y total calórico por día. Listo para enviar al cliente.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "";
    if (!content) throw new Error("No se generó contenido");

    return NextResponse.json({ success: true, content });
  } catch (error: unknown) {
    console.error("Error DIDI generate:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? msg : "Error al generar el plan nutricional" },
      { status: 500 }
    );
  }
}
