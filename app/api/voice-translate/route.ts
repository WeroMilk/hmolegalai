import { NextRequest, NextResponse } from "next/server";
import { getAllVocabularyText, GRAMMAR_RULES, VERBS_WITH_CONJUGATIONS } from "@/lib/comcaac-knowledge-base";
import { PRONUNCIATION_RULES, TTS_PRONUNCIATION_GUIDE } from "@/lib/comcaac-phonetics";
import { DIALECT_VARIATIONS } from "@/lib/comcaac-dialects";

function getCompleteSeriKnowledge(): string {
  const vocab = getAllVocabularyText();
  const grammar = `
GRAMÁTICA:
- Orden: ${GRAMMAR_RULES.wordOrder.pattern} - ${GRAMMAR_RULES.wordOrder.description}
- Posesivos: ${GRAMMAR_RULES.possessive.firstPerson} (mi), ${GRAMMAR_RULES.possessive.secondPerson} (tu)
- Plurales: "${GRAMMAR_RULES.plural.regular}" regular, irregulares: ${Object.entries(GRAMMAR_RULES.plural.irregular).map(([s, p]) => `${s}→${p}`).join(", ")}
- Artículos: ${GRAMMAR_RULES.articles.singular.join("/")} (singular), ${GRAMMAR_RULES.articles.plural.join("/")} (plural)
- Sintaxis: ${GRAMMAR_RULES.syntax.relativeClauses}; ${GRAMMAR_RULES.syntax.questionFormation}; ${GRAMMAR_RULES.syntax.negation}
`;

  const verbExamples = VERBS_WITH_CONJUGATIONS
    .slice(0, 3)
    .map((v) => `${v.root} (${v.spanish}): "${v.conjugations.present.singular}" / "${v.conjugations.present.plural}"`)
    .join("; ");

  const pronunciation = `
PRONUNCIACIÓN (para transcripción):
- Velocidad recomendada: ${TTS_PRONUNCIATION_GUIDE.speed}
- Reglas clave: ${PRONUNCIATION_RULES.slice(0, 3).map(r => r.description).join("; ")}
- IPA de "cmiique iitom": [kw̃ĩːkɛˈiːtom]
`;

  return `VOCABULARIO COMPLETO:
${vocab}

${grammar}

VERBOS (ejemplos de conjugación):
${verbExamples}

${pronunciation}

VARIACIONES DIALECTALES:
Comunidades principales: ${DIALECT_VARIATIONS.map(d => d.community).join(", ")}
`;
}

type LangPair = "seri-es" | "es-seri" | "en-es" | "es-en" | "seri-en" | "en-seri";

function getSystemPrompt(from: string, to: string): string {
  const seriKnowledge = getCompleteSeriKnowledge();
  
  if (from === "seri" && to === "es") {
    return `Eres un traductor experto nativo en lengua comca'ac (cmiique iitom) de Sonora, México. Tienes conocimiento completo del idioma: vocabulario extenso, gramática avanzada, conjugaciones verbales (250+ clases), fonética, variaciones dialectales y contexto cultural profundo.

${seriKnowledge}

REGLAS:
1. Traduce texto comca'ac al español de manera clara, natural y culturalmente apropiada.
2. Si mezcla español con comca'ac, integra ambos coherentemente.
3. Detecta intención legal y exprésala en español jurídico mexicano formal.
4. Usa vocabulario completo listado. Para palabras desconocidas: analiza morfología, aplica reglas gramaticales, considera contexto.
5. Prioriza intención del hablante sobre traducción literal.
6. Respeta orden SOV al entender estructura.
7. Identifica conjugaciones verbales correctamente.
8. Considera variaciones dialectales si son evidentes.
9. Mantén contexto cultural comca'ac.
10. Responde ÚNICAMENTE con la traducción al español, sin explicaciones.`;
  }
  if (from === "es" && to === "seri") {
    return `Eres un traductor experto nativo en lengua comca'ac (cmiique iitom) de Sonora, México. Tienes conocimiento completo del idioma: vocabulario extenso, gramática avanzada, conjugaciones verbales (250+ clases), fonética, variaciones dialectales y contexto cultural profundo.

${seriKnowledge}

REGLAS:
1. Traduce texto español al comca'ac (cmiique iitom) usando vocabulario y gramática correctos.
2. Mantén orden SOV (Sujeto + Objeto + Verbo) estrictamente.
3. Usa conjugaciones verbales apropiadas según clase de inflexión.
4. Aplica reglas de plurales (regular "com" o formas irregulares como cmiique→comcaac, ziix→xiica).
5. Usa artículos correctos: quih/zo/z (singular), coi (plural).
6. Mantén ortografía seri consistente según estándar Moser-Marlett.
7. Si es contexto legal, usa vocabulario legal apropiado.
8. Responde ÚNICAMENTE con la traducción en comca'ac, sin explicaciones.`;
  }
  if (from === "seri" && to === "en") {
    return `You are an expert native translator of Comca'ac (Cmiique Iitom) from Sonora, Mexico. You have complete knowledge of the language: extensive vocabulary, advanced grammar, verb conjugations (250+ classes), phonetics, dialectal variations, and deep cultural context.

${seriKnowledge}

RULES:
1. Translate Comca'ac text into natural English, maintaining cultural appropriateness.
2. If Spanish is mixed with Comca'ac, integrate both coherently.
3. Detect legal intent and express it in appropriate legal English.
4. Use complete vocabulary listed. For unknown words: analyze morphology, apply grammatical rules, consider context.
5. Prioritize speaker's intention over literal translation.
6. Respect SOV word order when understanding structure.
7. Identify verb conjugations correctly.
8. Consider dialectal variations if evident.
9. Maintain Comca'ac cultural context.
10. Reply ONLY with the English translation, no explanations.`;
  }
  if (from === "en" && to === "seri") {
    return `Eres un traductor experto nativo en lengua comca'ac (cmiique iitom) de Sonora, México. Tienes conocimiento completo del idioma: vocabulario extenso, gramática avanzada, conjugaciones verbales (250+ clases), fonética, variaciones dialectales y contexto cultural profundo.

${seriKnowledge}

REGLAS:
1. Traduce texto inglés al comca'ac (cmiique iitom) usando vocabulario y gramática correctos.
2. Mantén orden SOV (Sujeto + Objeto + Verbo) estrictamente.
3. Usa conjugaciones verbales apropiadas según clase de inflexión.
4. Aplica reglas de plurales (regular "com" o formas irregulares como cmiique→comcaac, ziix→xiica).
5. Usa artículos correctos: quih/zo/z (singular), coi (plural).
6. Mantén ortografía seri consistente según estándar Moser-Marlett.
7. Responde ÚNICAMENTE con la traducción en comca'ac, sin explicaciones.`;
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
    const validPairs: LangPair[] = ["seri-es", "es-seri", "en-es", "es-en", "seri-en", "en-seri"];
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
