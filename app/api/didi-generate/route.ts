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

1. TÍTULO: # PLAN NUTRICIONAL (primera línea) y debajo ## L.N.H. DIANA GALLARDO

2. DATOS DEL PACIENTE (una línea, formato): Datos del Paciente: Nombre: [nombre] Peso: [X] kg Estatura: [X] m Edad: [X] años Sexo: [X] Calorías objetivo: [X] kcal/día Tipo de dieta: [X]. Fecha del plan: [día de mes de año].

3. Si hay condiciones de salud, añadir línea: Consideraciones: [lista breve].

4. PLAN SEMANAL (formato de cada comida): Cada comida debe seguir este formato exacto:
   [Nombre del platillo]. ([plato principal con cantidades]) [acompañamientos con cantidades]
   Ejemplos:
   - "Huevos con espinaca. (3 huevos revueltos con ½ taza de espinacas cocidas) 2 piezas de tortilla de maíz y ½ taza de frijol."
   - "Pollo a la plancha. (120 gr de pechuga de pollo a la plancha) 2 tazas de ensalada mixta, 1 cdita de vinagreta."
   - "Sándwich de pollo. (120 gr de pollo cocido) 1 taza de verduras mixtas, 1 cdita de mayonesa."
   Usa: "cdita" para cucharadita, "cda" para cucharada, "gr" para gramos, "½" para medio, "rebanadas" para jamón/pan cuando aplique. Medidas SMAE: taza, pieza, cdita, cda, gr.

   ESTRUCTURA VERTICAL (obligatorio, sin tabla): Cada día como bloque que baja hacia abajo. NO uses tabla horizontal. Formato:

   ## LUNES
   - **Desayuno:** [platillo]. ([detalle]) [acompañamientos]
   - **Comida:** [platillo]. ([detalle]) [acompañamientos]
   - **Cena:** [platillo]. ([detalle]) [acompañamientos]
   - **Colación:** [platillo]. ([detalle]) [acompañamientos]
   - **Total del día:** X kcal

   ## MARTES
   - **Desayuno:** ...
   (repetir para MIÉRCOLES, JUEVES, VIERNES, SÁBADO, DOMINGO)

   Todo acomodado hacia abajo, sin scroll horizontal. Cada línea envuelve el texto naturalmente.

5. RECOMENDACIONES GENERALES (lista con guiones, 2-4 ítems):
   - Mantén una buena hidratación...
   - Distribuye tus comidas...
   - etc.

6. PIE: "L.N.H. Diana Gallardo"

IMPORTANTE: NO uses tabla. USA formato VERTICAL día por día: ## LUNES, luego lista con - **Desayuno:**, - **Comida:**, etc. Todo hacia abajo, bien organizado, sin scroll horizontal. Ejemplo: "- **Desayuno:** Huevos con espinaca. (3 huevos revueltos con ½ taza espinacas cocidas) 2 piezas tortilla de maíz y ½ taza frijol."

CÁLCULO CALÓRICO SEGÚN EDAD (OBLIGATORIO - CRÍTICO):

**NO uses Harris-Benedict ni Mifflin-St Jeor en menores de 18 años.** Esas fórmulas subestiman o sobreestiman en población pediátrica. Usa rangos de referencia FAO/OMS por grupo etario:

| Grupo etario | Edad | kcal/día aproximadas (referencia) | Consideraciones |
|--------------|------|-----------------------------------|-----------------|
| Lactantes    | 1-2 años | 800-1,200 | Texturas blandas, purés, evitar atragantamiento. Porciones muy pequeñas (½ cdita a 2 cdas). 4-5 comidas. |
| Preescolares | 2-5 años | 1,000-1,400 | Porciones reducidas (¼ a ½ de adulto). Alimentos fáciles de masticar. Evitar uvas enteras, frutos secos, caramelos duros. 4-5 comidas. |
| Escolares    | 5-12 años | 1,400-2,200 | Varía por sexo y actividad. Niñas 1,400-1,900; niños 1,600-2,200. Porciones moderadas. |
| Adolescentes | 12-18 años | 1,800-3,200 | Similar a adultos pero considerar crecimiento. Chicos 2,200-3,200; chicas 1,800-2,400 según actividad. |
| Adultos      | 18-59 años | Mifflin-St Jeor + factor actividad | Fórmula estándar. "Bajar peso" -300 a -500 kcal; "Subir peso" +300 a +500 kcal. |
| Adultos mayores | 60+ años | Reducir 10-20% vs adulto | 60-70 años: -10%. 70+ años: -20%. Priorizar proteína, fibra, hidratación. Texturas suaves si hay limitaciones. |

**Ejemplo 3 años:** Rango 1,000-1,400 kcal. Un niño de 3 años sedentario ≈ 1,100 kcal; activo ≈ 1,300 kcal. NUNCA dar 1,800+ kcal a un niño de 3 años.
**Ejemplo 80 años:** Aplicar fórmula adulta y reducir ~20%. Evitar porciones muy grandes.

ALIMENTOS Y TEXTURAS POR EDAD:
- 1-5 años: Purés, alimentos bien cocidos, picados finos, sin huesos/espinas. Tortilla suave, arroz, huevo revuelto, fruta madura en trozos pequeños, yogur.
- 6-12 años: Porciones adaptadas (no igual que adulto). Variedad de texturas.
- 60+ años: Si hay dificultad para masticar: cocinar más, cortar en trozos pequeños, preferir pescado sin espinas, carnes tiernas.

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

PASO 1 - CALCULA LAS CALORÍAS (OBLIGATORIO SEGÚN EDAD):
- **Si edad < 18 años:** NO uses Harris-Benedict ni Mifflin-St Jeor. Usa rangos FAO/OMS por grupo etario: 1-2 años 800-1,200 kcal; 2-5 años 1,000-1,400 kcal; 5-12 años 1,400-2,200 kcal según sexo/actividad; 12-18 años 1,800-3,200 kcal. Un niño de 3 años NUNCA debe superar ~1,400 kcal.
- **Si edad 18-59 años:** Usa Mifflin-St Jeor + factor de actividad. "Bajar de peso" resta 300-500 kcal; "Subir de peso" suma 300-500 kcal; "Mantener peso" mantén.
- **Si edad ≥ 60 años:** Calcula como adulto y reduce 10% (60-70 años) o 20% (70+ años).
Indica en el encabezado la meta calórica calculada. La edad del paciente es CRÍTICA para el cálculo.

PASO 2 - ADAPTA PORCIONES Y TEXTURAS SEGÚN EDAD:
- 1-5 años: Porciones muy reducidas (¼ a ½ de adulto), texturas blandas, alimentos cocidos/picados, sin riesgo de atragantamiento. 4-5 comidas pequeñas.
- 6-12 años: Porciones moderadas, adaptadas al tamaño del niño.
- 60+ años: Considerar texturas suaves, porciones manejables, buena hidratación.

PASO 3 - GENERA EL PLAN: Encabezado con nombre, fecha, datos del paciente y calorías objetivo; luego cada día (Lunes a Domingo) con DESAYUNO, COMIDA, CENA y COLACIÓN. Total de calorías por día DEBE aproximarse a la meta. Usa SOLO comidas regionales de Hermosillo/Sonora/México (asequibles).

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

Entrega el plan en Markdown VERTICAL (día por día, sin tabla). ## LUNES, ## MARTES, etc. con lista - **Desayuno:**, - **Comida:**, - **Cena:**, - **Colación:**, - **Total del día.** Cada comida: "[Platillo]. ([detalle]) [acompañamientos]". Todo hacia abajo, sin scroll horizontal. Usa cdita, cda, gr, ½. Evita comidas exóticas.`;

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
