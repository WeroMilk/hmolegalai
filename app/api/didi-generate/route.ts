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

IMPORTANTE: Usa ÚNICAMENTE comidas regionales de Hermosillo, Sonora y México: asequibles y que la gente coma normalmente en la región. NO uses rib eye, salmón, ni ingredientes caros o poco comunes. NO uses combinaciones raras ni platillos exóticos o de restaurante (ej. melón con requesón, sandía con cottage, pescado al mojo de ajo, pescado a la plancha, mariscos, cortes especiales). Usa platillos típicos del día a día: huevos con jamón, chilaquiles, tacos, caldo de queso, tinga, enchiladas, quesadillas, tortas, sopes, tostadas, frijoles con arroz, machaca, burritos, gallina pinta, pollo asado, atún, pasta con salsa roja, avena, pan integral, plátano, manzana, yogur natural, etc.

FORMATO OBLIGATORIO: Entregar el plan en Markdown con la siguiente estructura EXACTA:

1. TÍTULO: # PLAN NUTRICIONAL SEMANAL (primera línea)

2. INFORMACIÓN DEL PACIENTE (en una línea o dos):
   - Nombre del paciente: [nombre]
   - Fecha del plan: [fecha actual en formato "día de mes de año"]
   - Si hay condiciones de salud, añadir: "Consideraciones: [lista breve]"

3. DATOS BÁSICOS (como lista con guiones):
   - Peso: X kg
   - Estatura: X m
   - Edad: X años
   - Sexo: X
   - Calorías objetivo: X,XXX kcal/día
   - Tipo de dieta: X

4. PLAN SEMANAL (formato vertical, día por día): NO uses tabla horizontal. Escribe cada día como bloque vertical para que se vea bien en móvil y sin scroll horizontal. Formato:

   ## LUNES
   - **Desayuno:** 2 piezas de huevo con 90 g de jamón, 1 cucharada de aceite (500 kcal)
   - **Comida:** 4 tacos, 2 tortillas c/u, 50 g carne por taco (700 kcal)
   - **Cena:** 3 tostadas, 40 g tinga por tostada, 1 cucharada crema c/u (450 kcal)
   - **Colación:** 1 pieza de plátano, 30 g de nueces (190 kcal)
   - **Total del día:** 2,000 kcal

   ## MARTES
   - **Desayuno:** ...
   - **Comida:** ...
   (y así para MIÉRCOLES, JUEVES, VIERNES, SÁBADO, DOMINGO)

   Usa medidas SMAE: TAZA, CUCHARADA, PIEZA, GRAMO. Porciones dentro de cada línea. Formato vertical = sin scroll horizontal.

5. RECOMENDACIONES GENERALES (lista con guiones, 2-4 ítems):
   - Mantén una buena hidratación...
   - Distribuye tus comidas...
   - etc.

6. PIE: "Elaborado por: Diana Gallardo, Lic. en Nutriología."

IMPORTANTE: NO uses tabla horizontal con 7 columnas (provoca scroll horizontal). USA formato VERTICAL: cada día como bloque con ## DÍA y lista de comidas debajo. Ejemplo:
## LUNES
- **Desayuno:** 2 piezas de huevo con 90 g de jamón (500 kcal)
- **Comida:** 4 tacos, 2 tortillas c/u, 50 g carne/taco (700 kcal)
- **Cena:** 120 g pollo, 1 taza ensalada (450 kcal)
- **Colación:** 1 pieza plátano, 30 g nueces (190 kcal)
- **Total del día:** 2,000 kcal

## MARTES
... (repite para los 7 días)

Todo en formato vertical para lectura fácil sin scroll horizontal.

CONDICIONES DE SALUD: Si el paciente tiene alguna condición, adapta el plan de forma estricta:
- Diabetes: control de carbohidratos y azúcares, índice glucémico bajo, porciones de carbohidratos consistentes, evitar azúcares añadidos.
- Colesterol alto: bajo en grasas saturadas y trans, preferir grasas insaturadas, más fibra, avena, legumbres.
- Hipertensión: dieta baja en sodio, evitar embutidos y enlatados altos en sal, moderar sal de mesa.
- Triglicéridos altos: limitar azúcares refinados y alcohol, control de carbohidratos, grasas saludables.
- Gastritis o reflujo: evitar irritantes (picante, café, alcohol, cítricos en exceso), comidas ligeras y frecuentes.
- Ácido úrico elevado (gota): limitar purinas (vísceras, mariscos, carnes rojas en exceso), evitar alcohol, hidratación adecuada.
- Hipertiroidismo: moderar yodo (evitar exceso de mariscos y algas), limitar cafeína y estimulantes, plan puede requerir más calorías por metabolismo acelerado.
- Hipotiroidismo: asegurar yodo adecuado (sal yodada), moderar bociógenos (col, brócoli crudo en exceso), fibra para estreñimiento si aplica.`;

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

Entrega el plan en formato Markdown VERTICAL (día por día, sin tabla horizontal): ## LUNES, ## MARTES, etc. con lista de Desayuno, Comida, Cena, Colación y Total del día. Porciones en cada línea. Ej: "- **Desayuno:** 2 piezas de huevo con 90 g de jamón (500 kcal)". Usa medidas SMAE. Evita comidas exóticas. Listo para copiar y enviar.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
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
