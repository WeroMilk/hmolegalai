import { NextRequest, NextResponse } from "next/server";

const SERI_LEGAL_VOCAB = `
VOCABULARIO LEGAL SERI-ESPAÑOL:
- ley = cöihcapxöt, documento = ziix hapáctim, persona = haxt, firma = xaap iti, testigo = cöihcaaitoj
- juez = hast cöpaac, abogado = haxt quih ooca, derecho = cöihyáax, justicia = quih iti capxöt
- demandar = quih ano coti, autoridad = hast, cmiique = persona comca'ac, comcaac = pueblo comca'ac
`;

type LangPair = "seri-es" | "es-seri" | "en-es" | "es-en";

function getSystemPrompt(from: string, to: string): string {
  if (from === "seri" && to === "es") {
    return `Eres un traductor experto en lengua comca'ac (cmiique iitom) de Sonora, México.
${SERI_LEGAL_VOCAB}
Traduce el texto en comca'ac al español. Responde ÚNICAMENTE con la traducción, sin explicaciones.`;
  }
  if (from === "es" && to === "seri") {
    return `Eres un traductor experto en lengua comca'ac (cmiique iitom) de Sonora, México.
${SERI_LEGAL_VOCAB}
Traduce el texto en español al comca'ac (cmiique iitom). Responde ÚNICAMENTE con la traducción, sin explicaciones.`;
  }
  if (from === "en" && to === "es") {
    return "Traduce el siguiente texto del inglés al español. Responde ÚNICAMENTE con la traducción, sin explicaciones.";
  }
  if (from === "es" && to === "en") {
    return "Traduce el siguiente texto del español al inglés. Responde ÚNICAMENTE con la traducción, sin explicaciones.";
  }
  return "Traduce el texto. Responde ÚNICAMENTE con la traducción, sin explicaciones.";
}

export async function POST(request: NextRequest) {
  try {
    const { text, fromLang, toLang } = await request.json();
    if (!text || typeof text !== "string" || !fromLang || !toLang) {
      return NextResponse.json({ error: "text, fromLang y toLang requeridos" }, { status: 400 });
    }

    const pair = `${fromLang}-${toLang}` as LangPair;
    const validPairs: LangPair[] = ["seri-es", "es-seri", "en-es", "es-en"];
    if (!validPairs.includes(pair)) {
      return NextResponse.json({ error: "Par de idiomas no soportado" }, { status: 400 });
    }

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key || key.length < 10) {
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
    }

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: key });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: getSystemPrompt(fromLang, toLang) },
        { role: "user", content: text.trim() },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const result = completion.choices[0]?.message?.content?.trim() || "";
    const outKey = toLang === "seri" ? "seri" : toLang === "es" ? "spanish" : "english";
    return NextResponse.json({ [outKey]: result, result });
  } catch (error: unknown) {
    console.error("Error voice-translate:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al traducir" },
      { status: 500 }
    );
  }
}
