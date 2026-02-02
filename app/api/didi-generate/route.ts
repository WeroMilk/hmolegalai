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

4. TABLA SEMANAL (en Markdown): Una tabla con:
   - Columnas: | | LUNES | MARTES | MIÉRCOLES | JUEVES | VIERNES | SÁBADO | DOMINGO |
   - Filas: Desayuno | Comida | Cena | Colación | Total
   - En cada celda: nombre corto del platillo + (XXX kcal). Ejemplo: "Burritos de machaca con huevo (600 kcal)"
   - Fila Total: suma del día, ej. "2,290 kcal"
   - Los platillos deben ser concretos y regionales (ej. "Tacos de carne asada", "Chilaquiles verdes", "Caldo de queso")
   - Las calorías por comida deben sumar aproximadamente las calorías objetivo del día

5. DETALLE DE PORCIONES (OBLIGATORIO - SEGÚN SMAE): Usa ÚNICAMENTE las medidas del Sistema Mexicano de Alimentos Equivalentes (SMAE): TAZA, CUCHARADA, PIEZA y GRAMO. Para cada ingrediente usa la medida que corresponde en SMAE:
   - TAZA: para arroz, frijol, avena, cereales, verduras cocidas, fruta picada, etc. Ej: "1/2 taza de frijol cocido", "1 taza de arroz"
   - CUCHARADA: para aceite, crema, mantequilla, mermelada, etc. Ej: "1 cucharada de aceite", "2 cucharadas de crema"
   - PIEZA: para huevos, tortillas, pan, frutas enteras, etc. Ej: "2 piezas de huevo", "3 piezas de tortilla de maíz", "1 pieza de plátano", "1 pieza de manzana"
   - GRAMO (g): para carnes, quesos, jamón, pollo, etc. cuando SMAE lo indique en gramos. Ej: "120 g de pechuga de pollo", "40 g de queso panela", "60 g de jamón"
   Ejemplo tostadas de tinga: "3 piezas de tostada de maíz, 45 g de tinga de pollo por tostada, 1 cucharada de crema por tostada, 1/4 taza de lechuga, 30 g de queso fresco"
   Ejemplo tacos: "4 piezas de tortilla de maíz (2 por taco), 50 g de carne por taco, 2 cucharadas de cebolla, 1 cucharada de cilantro"
   NUNCA uses "rebanadas" ni medidas fuera de SMAE; si aplica pieza pequeña usa "pieza" o los gramos según tabla SMAE.
   Evita platillos exóticos o de restaurante: melón con requesón, sandía con cottage, pescado al mojo de ajo, pescado a la plancha, mariscos, etc. Usa comidas típicas que la gente come diario: huevos con jamón, chilaquiles, tacos, caldo, tinga, enchiladas, quesadillas, tortas, sopes, tostadas, frijoles con arroz, etc.

6. RECOMENDACIONES GENERALES (lista con guiones, 2-4 ítems):
   - Mantén una buena hidratación...
   - Distribuye tus comidas...
   - etc.

7. PIE: "Elaborado por: Diana Gallardo, Lic. en Nutriología."

IMPORTANTE SOBRE LA TABLA: La tabla DEBE incluir las 7 columnas (LUNES a DOMINGO). Cada celda: nombre corto del platillo (máx 4-5 palabras) + (XXX kcal). Ejemplo de formato Markdown:
| | LUNES | MARTES |
|--|-------|--------|
| **Desayuno** | Huevos rancheros (500 kcal) | Molletes (500 kcal) |
| **Comida** | Tacos de carne asada (700 kcal) | Caldo de queso (600 kcal) |
| **Cena** | Ensalada de pollo (450 kcal) | Quesadillas (400 kcal) |
| **Colación** | Plátano y nueces (190 kcal) | Yogur (150 kcal) |
| **Total** | 2,290 kcal | 2,040 kcal |

NO escribas el plan día por día en párrafos. USA SIEMPRE el formato de tabla como arriba. El documento debe verse limpio, profesional y fácil de leer en una sola vista.

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

Entrega el plan en formato Markdown: (1) TABLA semanal con platillo + kcal por celda, (2) DETALLE DE PORCIONES usando SOLO medidas SMAE: TAZA, CUCHARADA, PIEZA y GRAMO. Cada ingrediente con su medida correcta según SMAE. Evita comidas exóticas. Listo para enviar al cliente.`;

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
