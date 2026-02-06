import { NextRequest, NextResponse } from "next/server";
import { getAllVocabularyText, GRAMMAR_RULES, VERBS_WITH_CONJUGATIONS } from "@/lib/comcaac-knowledge-base";

/** Vocabulario legal y general Seri–Español (cmiique iitom). 
 * Fuentes: SIL, INALI, Pueblos Indígenas, Moser & Marlett.
 * Expandido con base de conocimiento completa.
 */
function getSeriLegalVocab(): string {
  const vocab = getAllVocabularyText();
  const grammar = `
GRAMÁTICA COMPLETA:
- Orden: ${GRAMMAR_RULES.wordOrder.pattern} (${GRAMMAR_RULES.wordOrder.description})
  Ejemplos: ${GRAMMAR_RULES.wordOrder.examples.join("; ")}

- Posesivos: 
  * Primera persona: ${GRAMMAR_RULES.possessive.firstPerson} (mi)
  * Segunda persona: ${GRAMMAR_RULES.possessive.secondPerson} (tu)
  Ejemplos: ${GRAMMAR_RULES.possessive.examples.join("; ")}

- Plurales:
  * Regular: prefijo "${GRAMMAR_RULES.plural.regular}"
  * Irregulares: ${Object.entries(GRAMMAR_RULES.plural.irregular).map(([s, p]) => `${s} → ${p}`).join(", ")}
  Ejemplos: ${GRAMMAR_RULES.plural.examples.join("; ")}

- Artículos:
  * Singular: ${GRAMMAR_RULES.articles.singular.join(", ")}
  * Plural: ${GRAMMAR_RULES.articles.plural.join(", ")}
  Ejemplos: ${GRAMMAR_RULES.articles.examples.join("; ")}

- Pronombres personales:
  ${Object.entries(GRAMMAR_RULES.pronouns.personal).map(([es, seri]) => `  * ${es}: ${seri}`).join("\n")}

- Sintaxis:
  * Cláusulas relativas: ${GRAMMAR_RULES.syntax.relativeClauses}
  * Formación de preguntas: ${GRAMMAR_RULES.syntax.questionFormation}
  * Negación: ${GRAMMAR_RULES.syntax.negation}
  Ejemplos: ${GRAMMAR_RULES.syntax.examples.join("; ")}
`;

  const verbExamples = VERBS_WITH_CONJUGATIONS
    .slice(0, 5)
    .map((v) => `- ${v.root} (${v.spanish}): presente singular "${v.conjugations.present.singular}", plural "${v.conjugations.present.plural}"`)
    .join("\n");

  return `VOCABULARIO COMPLETO SERI-ESPAÑOL-INGLÉS:
${vocab}

${grammar}

CONJUGACIONES VERBALES (ejemplos):
${verbExamples}

NOTA: El sistema verbal comca'ac tiene más de 250 clases de inflexión. Cada verbo tiene su propia conjugación específica.
`;
}

export async function POST(request: NextRequest) {
  try {
    const { promptSeri } = await request.json();
    if (!promptSeri || typeof promptSeri !== "string") {
      return NextResponse.json({ error: "promptSeri requerido" }, { status: 400 });
    }

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key || key.length < 10) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: key });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Eres un traductor experto nativo en la lengua comca'ac (cmiique iitom) de Sonora, México. Tienes conocimiento completo del idioma, incluyendo vocabulario extenso, gramática avanzada, conjugaciones verbales, fonética, variaciones dialectales y contexto cultural profundo.

${getSeriLegalVocab()}

CONTEXTO CULTURAL IMPORTANTE:
- El pueblo comca'ac es un pueblo costero con fuerte conexión al mar (iizax)
- El pelícano (cocáac) tiene significado cultural especial
- La tierra (hant iiha) es territorio ancestral importante
- El idioma refleja valores comunitarios y relación con la naturaleza

REGLAS DE TRADUCCIÓN (NIVEL EXPERTO):
1. Traduce el texto en cmiique iitom (comca'ac) al español de manera clara, natural y culturalmente apropiada.
2. Si el usuario mezcla español (cocsar iitom) con comca'ac, integra ambos en una sola traducción coherente manteniendo el significado completo.
3. Si detectas intención legal (demanda, queja, denuncia, solicitud de justicia), exprésala en español jurídico mexicano adecuado y formal.
4. Usa el vocabulario completo listado arriba. Si encuentras una palabra no listada:
   - Analiza su estructura morfológica (raíz, prefijos, sufijos)
   - Considera el contexto y la intención del hablante
   - Aplica reglas gramaticales conocidas
   - Haz tu mejor aproximación semántica basada en conocimiento del idioma
5. Prioriza SIEMPRE la intención del hablante sobre la traducción literal.
6. Respeta el orden SOV (Sujeto + Objeto + Verbo) al entender la estructura.
7. Identifica conjugaciones verbales correctamente según las clases de inflexión.
8. Considera variaciones dialectales si son evidentes en el texto.
9. Mantén el contexto cultural comca'ac en la traducción.
10. Responde ÚNICAMENTE con la traducción al español, sin explicaciones adicionales, sin notas, sin comentarios.`,
        },
        {
          role: "user",
          content: promptSeri.trim(),
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const spanish = completion.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ spanish });
  } catch (error: unknown) {
    console.error("Error translating Seri:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al traducir" },
      { status: 500 }
    );
  }
}
