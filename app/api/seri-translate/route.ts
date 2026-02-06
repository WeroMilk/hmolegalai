import { NextRequest, NextResponse } from "next/server";

/** Vocabulario legal y general Seri–Español (cmiique iitom). Fuentes: SIL, INALI, Pueblos Indígenas, Moser & Marlett. */
const SERI_LEGAL_VOCAB = `
VOCABULARIO LEGAL SERI-ESPAÑOL:
- ley = cöihcapxöt
- contrato = cöihcapxöt ziix
- documento = ziix hapáctim
- persona = haxt
- firma = xaap iti
- testigo = cöihcaaitoj
- juez = hast cöpaac
- abogado = haxt quih ooca
- derecho = cöihyáax
- verdad = hapáctim
- justicia = quih iti capxöt
- firmar = xaap iti
- prometer = quih islixp
- cumplir = quih yaza
- demandar / pedir = quih ano coti
- autoridad = hast
- acto = ziix
- violación = ziix coii

VOCABULARIO GENERAL (documentación y comunidad):
- cmiique = persona comca'ac (singular)
- comcaac = pueblo comca'ac / personas comca'ac (plural de cmiique)
- cocsar iitom = idioma español
- hehe = casa
- zo hehe = en mi casa
- hant iiha = la tierra (lugar, territorio)
- hant iicp = mi tierra
- tahejöc = gracias
- caacoj = trabajo
- quííp = dinero
- iizax = océano / mar
- xicaast = enseñar
- hapaspoj = papel
- tooj = sol
- xnoois = luna
- cöicöt = estrella
- haxöl = historia / relato
- xepe ania = mariposa
- ziix = cosa, acto, cosa (también usado como artículo/objeto)
- cocáac = pelícano (referencia cultural)
- hamiigo = amigo (préstamo del español "amigo")

GRAMÁTICA:
- Orden típico: Sujeto + Objeto + Verbo (SOV).
- Posesivo: "hac" (mi), "mapt" (tu). Ej: zo hehe = en mi casa.
- Plural: "com" en muchos nombres; algunos tienen plural irregular (cmiique → comca'ac, ziix → xiica).
- Artículos: quih (singular), coi (plural); zo/z = un/una.
`;

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
          content: `Eres un traductor experto en la lengua comca'ac (cmiique iitom) de Sonora, México. Tu tarea es traducir texto en comca'ac al español.

${SERI_LEGAL_VOCAB}

Reglas:
1. Traduce el texto en cmiique iitom (comca'ac) al español de manera clara y natural.
2. Si el usuario mezcla español (cocsar iitom) con comca'ac, integra ambos en una sola traducción coherente.
3. Si detectas intención legal (demanda, queja, denuncia, solicitud de justicia), exprésala en español jurídico adecuado.
4. Usa el vocabulario listado arriba; si una palabra no la conoces, haz tu mejor aproximación semántica.
5. Prioriza la intención del hablante sobre la traducción literal.
6. Responde ÚNICAMENTE con la traducción al español, sin explicaciones adicionales.`,
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
