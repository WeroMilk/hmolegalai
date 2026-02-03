import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyIdToken } from "@/lib/auth-server";
import { isDidiUser } from "@/lib/didi";

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "") throw new Error("OPENAI_API_KEY no configurada.");
  return new OpenAI({ apiKey: key });
}

const SYSTEM_PROMPT = `Eres una nutrióloga experta. Te pasan un plan nutricional en Markdown y una instrucción del usuario para modificarlo.

REGLAS:
1. Respeta EXACTAMENTE la estructura del plan: # PLAN NUTRICIONAL, ## L.N.H. [nombre], Datos del Paciente, ## LUNES / MARTES / etc. con - **Desayuno:**, - **Comida:**, - **Cena:**, - **Colación:**, - **Total del día:**, ## RECOMENDACIONES GENERALES, pie con nombre.
2. Aplica SOLO los cambios que el usuario pida (sustituir alimentos que no le gustan, corregir errores, cambiar porciones, etc.). No inventes cambios adicionales.
3. Mantén el mismo formato Markdown, las mismas calorías por día salvo que el usuario pida cambiarlas, y comidas regionales de México/Hermosillo/Sonora (asequibles, nada exótico).
4. Si piden quitar un alimento (ej. "no le gusta el huevo"), sustituye por alternativas equivalentes en proteína y calorías (ej. queso, jamón, avena, yogur, etc.) en todas las comidas donde aparezca.
5. Devuelve ÚNICAMENTE el plan completo en Markdown, sin explicaciones ni texto extra antes o después.`;

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
    const { content, prompt } = body as { content?: string; prompt?: string };
    if (!content || typeof content !== "string" || !prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Faltan 'content' (plan actual) o 'prompt' (instrucción)" },
        { status: 400 }
      );
    }

    const userMessage = `Plan actual (Markdown):\n\n${content.trim()}\n\n---\n\nInstrucción del usuario: ${prompt.trim()}\n\nDevuelve el plan completo modificado en Markdown, sin texto adicional.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 8000,
    });

    const newContent = completion.choices[0]?.message?.content?.trim() || "";
    if (!newContent) throw new Error("No se generó contenido");

    return NextResponse.json({ success: true, content: newContent });
  } catch (error: unknown) {
    console.error("Error DIDI edit:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: msg.includes("OPENAI") ? msg : "Error al editar el plan con el prompt" },
      { status: 500 }
    );
  }
}
