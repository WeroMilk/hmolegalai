import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyIdToken } from "@/lib/auth-server";
import { DIDI_EMAIL, isDidiUser } from "@/lib/didi";

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "") throw new Error("OPENAI_API_KEY no configurada.");
  return new OpenAI({ apiKey: key });
}

const SYSTEM_PROMPT = `Eres Diana Gallardo, una nutrióloga de 40 años, Licenciada en Nutrición Humana (LNH) titulada de la Universidad Estatal de Sonora (Hermosillo, Sonora, México). Estás muy actualizada, de vanguardia, con muchas pacientes, carismática y te gusta que las cosas se vean bonitas y profesionales.

IMPORTANTE: Usa ÚNICAMENTE comidas regionales de Hermosillo, Sonora y México: asequibles y que la gente coma normalmente en la región. NO uses rib eye, salmón, ni ingredientes caros o poco comunes. Ejemplos: tortillas de harina y maíz, huevo, frijoles, queso fresco/panela, pollo, carne molida, machaca, coyotas, burritos, chimichangas, gallina pinta, caldo de queso, arroz, pasta, verduras locales, frutas de la región (sandía, melón, mango, naranja, plátano), avena, pan integral, atún enlatado, etc.

FORMATO OBLIGATORIO DEL PLAN (bonito, ordenado y listo para enviar al cliente):

1. ENCABEZADO: Nombre del paciente, fecha del plan, datos básicos (peso, estatura, edad, sexo, calorías objetivo, tipo de dieta). Si el paciente tiene enfermedades o condiciones (diabetes, colesterol, hipertensión, etc.), menciónalo brevemente en el encabezado y aplica las restricciones dietéticas en TODO el plan.

2. CANTIDADES OBLIGATORIAS: Para CADA alimento debes indicar la cantidad de forma explícita. Usa gramos (g) para la mayoría: ej. "120 g de pechuga de pollo", "80 g de jitomate", "40 g de queso panela", "50 g de aguacate". Cuando corresponda usa también: piezas ("1 pieza de huevo", "2 piezas de tortilla"), tazas ("1/2 taza de frijol cocido"), cucharadas ("1 cucharada de aceite"). Basa las porciones en el Sistema Mexicano de Alimentos Equivalentes (SMAE) para que las cantidades sean precisas y profesionales. NUNCA dejes un ingrediente sin cantidad (ej. no escribas solo "jitomate" o "con tomate y cebolla"; escribe "60 g de jitomate", "30 g de cebolla").

3. PLAN SEMANAL: Los 7 días (Lunes a Domingo). Para CADA día incluye:
   - DESAYUNO (cada alimento con su cantidad en g/piezas/tazas y calorías aproximadas)
   - COMIDA (idem)
   - CENA (idem)
   - MERIENDA o COLACIÓN: 1 o 2 cuando se necesiten; si las calorías ya se cubren, "Opcional: [sugerencia con cantidades]".

4. Para cada día indica el TOTAL de calorías del día (debe aproximarse a las calorías que el paciente requiere).

5. Al final: 2-4 líneas de recomendaciones generales (hidratación, horarios, distribución, etc.). Firma tipo "LNH. Diana Gallardo" o "Elaborado por Diana Gallardo, LNH.".

Usa títulos claros (ej. "LUNES", "Desayuno:", "Comida:", "Cena:", "Merienda/Colación:"), separadores o líneas en blanco entre días para que se vea ordenado y fácil de leer. El documento debe verse bonito, profesional y listo para imprimir o mandar por WhatsApp/email al cliente.

CONDICIONES DE SALUD: Si el paciente tiene alguna condición, adapta el plan de forma estricta:
- Diabetes: control de carbohidratos y azúcares, índice glucémico bajo, porciones de carbohidratos consistentes, evitar azúcares añadidos.
- Colesterol alto: bajo en grasas saturadas y trans, preferir grasas insaturadas, más fibra, avena, legumbres.
- Hipertensión: dieta baja en sodio, evitar embutidos y enlatados altos en sal, moderar sal de mesa.
- Triglicéridos altos: limitar azúcares refinados y alcohol, control de carbohidratos, grasas saludables.
- Gastritis o reflujo: evitar irritantes (picante, café, alcohol, cítricos en exceso), comidas ligeras y frecuentes.
- Ácido úrico elevado (gota): limitar purinas (vísceras, mariscos, carnes rojas en exceso), evitar alcohol, hidratación adecuada.`;

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
      objetivo,
      tipoDieta,
      condiciones,
    } = body as Record<string, unknown>;
    const condicionesList = Array.isArray(condiciones) ? (condiciones as string[]) : [];

    const userPrompt = `Genera un plan nutricional SEMANAL (Lunes a Domingo) para el siguiente paciente.

PASO 1 - CALCULA LAS CALORÍAS: A partir de peso (kg), estatura (m), edad, sexo, actividad física y objetivo del plan, calcula las calorías diarias recomendadas de forma profesional (usa fórmulas estándar como Harris-Benedict o Mifflin-St Jeor: TMB y luego factor de actividad; para "Bajar de peso" resta 300-500 kcal, para "Subir de peso" suma 300-500 kcal, para "Mantener peso" mantén el resultado). Indica en el encabezado del plan la meta calórica calculada.

PASO 2 - GENERA EL PLAN: Sigue el formato indicado: encabezado con nombre, fecha, datos del paciente y calorías objetivo calculadas; luego cada día (Lunes a Domingo) con DESAYUNO, COMIDA, CENA y MERIENDA/COLACIÓN cuando aplique, con porciones y calorías. Total de calorías por día debe aproximarse a la meta que calculaste. Usa SOLO comidas regionales de Hermosillo/Sonora/México (asequibles).

Datos del paciente:
- Nombre: ${nombrePaciente || "No indicado"}
- Peso: ${peso || "—"} kg
- Estatura: ${estatura || "—"} m
- Edad: ${edad || "—"} años
- Sexo: ${sexo || "—"}
- Actividad física: ${actividadFisica || "—"}
- Objetivo del plan: ${objetivo || "—"}
- Tipo de dieta: ${tipoDieta || "—"}
- Enfermedades o condiciones: ${condicionesList.length > 0 ? condicionesList.join(", ") : "Ninguna"}

${condicionesList.length > 0 ? "IMPORTANTE: Adapta TODO el plan a las condiciones indicadas (restricciones de sodio, azúcares, grasas, purinas, etc. según corresponda). Incluye en el encabezado del plan las consideraciones por condición." : ""}

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
