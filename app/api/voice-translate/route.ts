import { NextRequest, NextResponse } from "next/server";
import { getAllVocabularyText, GRAMMAR_RULES, VERBS_WITH_CONJUGATIONS } from "@/lib/comcaac-knowledge-base";
import { PRONUNCIATION_RULES, TTS_PRONUNCIATION_GUIDE } from "@/lib/comcaac-phonetics";
import { DIALECT_VARIATIONS } from "@/lib/comcaac-dialects";
import { detectPolysemicContext, getPolysemicTranslation } from "@/lib/translation-validation";
import { corpusTranslate } from "@/lib/tri-translator";

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

REGLAS ESTRICTAS DE TRADUCCIÓN PROFESIONAL:
1. Traduce texto comca'ac al español de manera clara, natural y culturalmente apropiada.
2. Si mezcla español con comca'ac, integra ambos coherentemente.
3. Detecta intención legal y exprésala en español jurídico mexicano formal.
4. Usa vocabulario completo listado. Para palabras desconocidas: analiza morfología, aplica reglas gramaticales, considera contexto.
5. Prioriza intención del hablante sobre traducción literal.
6. Respeta orden SOV al entender estructura.
7. Identifica conjugaciones verbales correctamente.
8. Considera variaciones dialectales si son evidentes.
9. Mantén contexto cultural comca'ac.
10. NUNCA repitas palabras o frases innecesariamente. Si detectas repeticiones obvias en el texto comca'ac, elimínalas y traduce solo la intención única.
11. Si la frase comienza con "Hant" seguido de otra frase, traduce ambas partes: "Hant, [frase]" → "Hola, [traducción]".
12. Traduce la intención completa de la frase, NO palabra por palabra. Evita traducciones literales que generen repeticiones en español.

10. MANEJO DE PALABRAS POLISÉMICAS (CRÍTICO - REGLA MÁS IMPORTANTE):
    Si una palabra comca'ac tiene múltiples significados, usa estas reglas de prioridad:
    
    "Hant" (palabra más polisémica):
    - Si aparece SOLA o como primera palabra → "hola" (SALUDO - PRIORIDAD MÁXIMA)
    - Si aparece con "quih iti" o contexto de lugar → "aquí" o "dónde"
    - Si aparece con "hac" o "coi" y contexto de cuerpo → "pie" o "pies"
    - Si aparece con "nav" o contexto web → "inicio"
    - Si aparece con "tierra" o "territorio" → "tierra"
    
    REGLA DE ORO: "Hant" solo = "Hola" (99% de los casos cuando es saludo)

11. TRADUCCIONES ESPECÍFICAS CRÍTICAS (MEMORIZAR):
    - "Hant" (solo, sin contexto) → "Hola"
    - "Hant quih iti?" → "¿Dónde está?"
    - "Hant hac" → "Mi pie" o "Hola" (según contexto)
    - "Tahejöc" → "gracias"
    - "Haxt ziix hac" → "nombre" o "nombre de la persona"
    - "quih ano coti" → "pedir" o "demandar" (según contexto legal)
    - "quih ano coti mapt hac" → "te falta" o "necesitas"

12. CONSISTENCIA BIDIRECCIONAL OBLIGATORIA:
    Si "Hola" se traduce a "Hant", entonces "Hant" DEBE traducirse de vuelta a "Hola" cuando es saludo.
    Verifica siempre la traducción inversa para mantener consistencia.

13. FORMATO DE RESPUESTA:
    - Responde ÚNICAMENTE con la traducción al español
    - Sin explicaciones
    - Sin puntos adicionales al final
    - Sin comillas
    - Sin notas
    - Solo el texto traducido, limpio y directo`;
  }
  if (from === "es" && to === "seri") {
    return `Eres un traductor experto nativo en lengua comca'ac (cmiique iitom) de Sonora, México. Tienes conocimiento completo del idioma: vocabulario extenso, gramática avanzada, conjugaciones verbales (250+ clases), fonética, variaciones dialectales y contexto cultural profundo.

${seriKnowledge}

REGLAS ESTRICTAS DE TRADUCCIÓN PROFESIONAL:
1. Traduce texto español al comca'ac (cmiique iitom) usando vocabulario y gramática correctos.
2. Mantén orden SOV (Sujeto + Objeto + Verbo) estrictamente. Ejemplo: "Yo quiero un documento" → "Ziix hac quih ano coti ziix hapáctim".
3. Usa conjugaciones verbales apropiadas según clase de inflexión.
4. Aplica reglas de plurales (regular "com" o formas irregulares como cmiique→comcaac, ziix→xiica).
5. Usa artículos correctos: quih/zo/z (singular), coi (plural).
6. Mantén ortografía seri consistente según estándar Moser-Marlett.
7. Si es contexto legal, usa vocabulario legal apropiado del corpus.
8. NUNCA repitas palabras o frases innecesariamente. Cada palabra debe aparecer solo una vez a menos que sea gramaticalmente necesario.
9. Si la frase contiene "hola" seguido de otra frase, traduce ambas partes separadas por una coma: "hola, [frase]" → "Hant, [traducción]".
10. Traduce la intención completa de la frase, NO palabra por palabra. Evita traducciones literales que generen repeticiones.

8. TRADUCCIONES ESPECÍFICAS CRÍTICAS (MEMORIZAR):
   - "hola" o "hello" → "Hant" (saludo común - SIEMPRE)
   - "gracias" o "thank you" → "Tahejöc"
   - "quien eres?" o "who are you?" → "Haxt mapt hac?" (pregunta sobre identidad - SIEMPRE)
   - "nombre" → "Haxt ziix hac" o "ziix hac" según contexto
   - "persona" → "Haxt" o "cmiique" según contexto
   - "demandar" → "quih ano coti" (en contexto legal)
   - "te falta" → "mapt quih itaal hac an" o "mapt quih ano coti mapt hac quih itaal hac an"
   - "te falta decirme" → "mapt quih ano coti mapt hac quih itaal hac an"
   - "te falta decirme el nombre de la persona que quieres demandar" → "Haxt ziix hac mapt quih ano coti mapt hac ziix hac quih ano coti mapt quih itaal hac an"
   - "te falta decirme a que persona quieres demandar" → "Haxt ziix hac mapt quih ano coti mapt hac quih ano coti mapt quih itaal hac an"
   - "el nombre de la persona" → "Haxt ziix hac"
   - "que quieres demandar" → "quih ano coti mapt"
   
   IMPORTANTE: "QUIEN ERES?" es una pregunta sobre identidad, NO un mensaje de validación. 
   NO debe traducirse como "Haxt ziix hac mapt quih ano coti..." (mensaje de validación).
   Debe traducirse como "Haxt mapt hac?" (pregunta sobre quién eres).
   
   IMPORTANTE: Si la frase comienza con "hola" seguido de una coma o espacio y luego otra frase, traduce ambas partes:
   - "hola, te falta decirme..." → "Hant, Haxt ziix hac mapt quih ano coti..."
   - NO repitas palabras innecesariamente
   - NO traduzcas palabra por palabra, traduce la intención completa de la frase

9. CONSISTENCIA BIDIRECCIONAL OBLIGATORIA:
   Si traduces "Hola" → "Hant", entonces "Hant" DEBE traducirse de vuelta a "Hola".
   Verifica siempre la traducción inversa para mantener consistencia.

10. FORMATO DE RESPUESTA:
    - Responde ÚNICAMENTE con la traducción en comca'ac
    - Sin explicaciones
    - Sin puntos adicionales al final
    - Sin comillas
    - Sin notas
    - Solo el texto traducido, limpio y directo`;
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
    return `Eres un traductor profesional experto en inglés y español.

REGLAS:
1. Traduce el texto del inglés al español de manera natural y precisa.
2. Mantén el tono y registro del texto original (formal, informal, técnico, etc.).
3. Adapta expresiones idiomáticas al español equivalente cuando sea apropiado.
4. Respeta la puntuación y formato del texto original.
5. Responde ÚNICAMENTE con la traducción al español, sin explicaciones, sin comillas adicionales.`;
  }
  if (from === "es" && to === "en") {
    return `You are a professional expert translator in Spanish and English.

RULES:
1. Translate the text from Spanish to English naturally and accurately.
2. Maintain the tone and register of the original text (formal, informal, technical, etc.).
3. Adapt idiomatic expressions to equivalent English when appropriate.
4. Respect the punctuation and format of the original text.
5. Reply ONLY with the English translation, no explanations, no additional quotes.`;
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
      temperature: 0.2, // Reducido para mayor consistencia
      max_tokens: 1500, // Aumentado para frases más largas
      top_p: 0.9, // Añadido para mejor control de diversidad
    });

    let result = completion.choices[0]?.message?.content?.trim() || "";
    
    // Limpiar resultado: remover comillas, puntos adicionales, explicaciones
    result = result
      .replace(/^["'`]|["'`]$/g, "") // Remover comillas simples, dobles y backticks
      .replace(/^[\.\s]+|[\.\s]+$/g, "") // Remover puntos y espacios al inicio/final
      .replace(/\s+/g, " ") // Normalizar espacios múltiples
      .trim();
    
    // Si el resultado contiene explicaciones (líneas múltiples), tomar solo la primera línea
    const lines = result.split("\n").filter(line => {
      const trimmed = line.trim();
      // Ignorar líneas que parecen explicaciones (muy largas, contienen "significa", etc.)
      if (trimmed.length > 100) return false;
      if (/significa|means|traduce|translate/i.test(trimmed)) return false;
      return trimmed.length > 0;
    });
    if (lines.length > 0) {
      result = lines[0].trim();
    }
    
    // Remover patrones comunes de explicaciones
    result = result
      .replace(/^(La traducción es|The translation is|Traducción:|Translation:)\s*/i, "")
      .replace(/^(En comca'ac|In comca'ac|En seri|In seri)\s*/i, "")
      .trim();
    
    // Detectar y eliminar repeticiones obvias en el resultado
    const words = result.split(/\s+/);
    const cleanedWords: string[] = [];
    const seenPhrases = new Set<string>();
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const twoWordPhrase = i > 0 ? `${words[i-1]} ${word}` : "";
      const threeWordPhrase = i > 1 ? `${words[i-2]} ${words[i-1]} ${word}` : "";
      
      // Evitar repeticiones de frases de 2-3 palabras
      if (threeWordPhrase && seenPhrases.has(threeWordPhrase)) {
        continue; // Saltar esta palabra si la frase de 3 palabras ya se vio
      }
      if (twoWordPhrase && seenPhrases.has(twoWordPhrase) && i < words.length - 1) {
        // Solo evitar si no es el final de la frase
        const nextWord = words[i + 1];
        if (nextWord !== word) {
          continue;
        }
      }
      
      cleanedWords.push(word);
      if (twoWordPhrase) seenPhrases.add(twoWordPhrase);
      if (threeWordPhrase) seenPhrases.add(threeWordPhrase);
    }
    
    result = cleanedWords.join(" ").trim();
    
    // Si después de limpiar está vacío o es muy corto, usar el resultado original sin limpieza de repeticiones
    if (!result || result.length < 2) {
      result = completion.choices[0]?.message?.content?.trim() || "";
      result = result
        .replace(/^["'`]|["'`]$/g, "")
        .replace(/^[\.\s]+|[\.\s]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
    
    // Validación especial para palabras polisémicas en comca'ac
    if (fromLang === "seri" && toLang === "es") {
      const normalizedInput = text.trim().toLowerCase();
      
      // Detectar repeticiones obvias y limpiarlas primero
      const words = text.trim().split(/\s+/);
      const cleanedWords: string[] = [];
      const seenPhrases = new Set<string>();
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const twoWordPhrase = i > 0 ? `${words[i-1]} ${word}`.toLowerCase() : "";
        const threeWordPhrase = i > 1 ? `${words[i-2]} ${words[i-1]} ${word}`.toLowerCase() : "";
        
        // Evitar repeticiones de frases de 2-3 palabras
        if (threeWordPhrase && seenPhrases.has(threeWordPhrase)) {
          continue;
        }
        if (twoWordPhrase && seenPhrases.has(twoWordPhrase) && i < words.length - 1) {
          const nextWord = words[i + 1];
          if (nextWord.toLowerCase() !== word.toLowerCase()) {
            continue;
          }
        }
        
        cleanedWords.push(word);
        if (twoWordPhrase) seenPhrases.add(twoWordPhrase);
        if (threeWordPhrase) seenPhrases.add(threeWordPhrase);
      }
      
      const cleanedText = cleanedWords.join(" ");
      
      // Si es "hant" solo (sin contexto adicional), forzar "hola"
      const cleanedNormalized = cleanedText.toLowerCase().trim();
      if (cleanedNormalized === "hant" || cleanedNormalized === "hant." || cleanedNormalized === "hant?") {
        result = "Hola";
      } 
      // Detectar preguntas sobre nombres que contienen "Haxt ziix hac quih ano coti"
      // Estas NO son sobre "demandar", sino sobre "nombre de patrón/jefe"
      else if (cleanedNormalized.includes("haxt ziix hac") && cleanedNormalized.includes("quih ano coti")) {
        // Esto es una pregunta sobre nombre, no sobre "demandar"
        // "Haxt ziix hac quih ano coti mapt?" = "¿Cómo se llama tu patrón? ¿Tu jefe?"
        if (cleanedNormalized.includes("mapt")) {
          result = "¿Cómo se llama tu patrón? ¿Tu jefe?";
        } else {
          // Usar corpus para mejor traducción
          const corpus = corpusTranslate(cleanedText, fromLang, toLang, { minScore: 0.7, limit: 1 });
          if (corpus.best && corpus.best.score >= 0.75) {
            result = corpus.best.toText;
          } else {
            result = "¿Cuál es el nombre?";
          }
        }
      } else {
        // Detectar si comienza con "Hant" seguido de otra frase
        const hantPattern = /^(hant|Hant)[\s,]+(.+)$/i;
        const hantMatch = cleanedText.match(hantPattern);
        
        if (hantMatch) {
          const mainPhrase = hantMatch[2].trim();
          // Traducir la frase principal usando corpus primero
          const mainCorpus = corpusTranslate(mainPhrase, fromLang, toLang, { minScore: 0.6, limit: 5 });
          if (mainCorpus.best && mainCorpus.best.score >= 0.70) {
            result = `Hola, ${mainCorpus.best.toText}`;
          } else {
            // Si no hay match, usar el resultado de OpenAI pero con "Hola" al inicio
            result = result ? `Hola, ${result}` : "Hola";
          }
        } else {
          // Validación especial para mensajes de validación de campos
          // Reconocer variaciones de "te falta decirme el nombre" / "te falta mencionar a quien demandar"
          const validationPatterns = [
            {
              pattern: /haxt\s+ziix\s+hac\s+mapt\s+quih\s+ano\s+coti\s+mapt\s+hac\s+ziix\s+hac\s+quih\s+ano\s+coti\s+mapt\s+quih\s+itaal\s+hac\s+an/i,
              translations: {
                es: "Te falta decirme el nombre de la persona que quieres demandar",
                en: "You need to tell me the name of the person you want to sue",
              },
            },
            {
              pattern: /ziix\s+hac\s+mapt\s+quih\s+ano\s+coti\s+mapt\s+hac\s+(ziix\s+hac\s+)?quih\s+ano\s+coti\s+mapt\s+quih\s+itaal\s+hac\s+an/i,
              translations: {
                es: "Te falta decirme a quien demandar",
                en: "You need to tell me who you want to sue",
              },
            },
            {
              pattern: /haxt\s+ziix\s+hac\s+mapt\s+quih\s+ano\s+coti\s+mapt\s+hac\s+quih\s+ano\s+coti\s+mapt\s+quih\s+itaal\s+hac\s+an/i,
              translations: {
                es: "Te falta decirme a que persona quieres demandar",
                en: "You need to tell me who you want to sue",
              },
            },
          ];
          
          let matched = false;
          for (const { pattern, translations } of validationPatterns) {
            if (pattern.test(cleanedText)) {
              // toLang debería ser "es" o "en" en este contexto (traduciendo de seri a es/en)
              const targetLang = (toLang === "es" || toLang === "en") ? toLang : "es";
              result = translations[targetLang] || translations.es;
              matched = true;
              break;
            }
          }
          
          if (!matched) {
            // Intentar usar corpus con el texto limpio
            const corpus = corpusTranslate(cleanedText, fromLang, toLang, { minScore: 0.6, limit: 5 });
            if (corpus.best && corpus.best.score >= 0.70) {
              result = corpus.best.toText;
            } else {
              // Intentar detectar contexto para otras palabras polisémicas
              const context = detectPolysemicContext(cleanedText.trim());
              const polysemicTranslation = getPolysemicTranslation(cleanedText.trim(), context, toLang);
              if (polysemicTranslation && context === "saludo") {
                result = polysemicTranslation; // Forzar "hola" para "Hant" como saludo
              }
            }
          }
        }
      }
    }
    
    // Validación especial para traducciones de español/inglés a comca'ac
    if ((fromLang === "es" || fromLang === "en") && toLang === "seri") {
      const normalizedInput = text.trim().toLowerCase()
        .replace(/[¿?¡!.,;:]/g, "") // Remover puntuación
        .trim();
      
      // PRIMERO: Verificar preguntas comunes sobre identidad ANTES de cualquier otra lógica
      const identityQuestionPatterns = {
        es: [
          /^quien eres\??$/i,
          /^quien sos\??$/i,
          /^quien es usted\??$/i,
        ],
        en: [
          /^who are you\??$/i,
        ],
      };
      
      const patterns = identityQuestionPatterns[fromLang] || [];
      const isIdentityQuestion = patterns.some(pattern => pattern.test(text.trim()));
      
      if (isIdentityQuestion) {
        // Para "QUIEN ERES?" traducir correctamente - NO es un mensaje de validación
        if (normalizedInput === "quien eres" || normalizedInput === "quien eres?" || normalizedInput === "who are you" || normalizedInput === "who are you?") {
          // Traducción correcta: "Haxt mapt hac?" = "¿Quién eres tú?"
          result = "Haxt mapt hac?";
          // Retornar inmediatamente, no continuar con otra lógica
          const outKey = toLang === "seri" ? "seri" : toLang === "es" ? "spanish" : "english";
          return NextResponse.json({ [outKey]: result, result });
        }
      }
      
      // Si es "hola" o "hello" y no hay contexto adicional, traducir a "Hant" (saludo)
      if (normalizedInput === "hola" || normalizedInput === "hello") {
        result = "Hant";
      }
      
      // Otras preguntas sobre nombres (pero NO "quien eres")
      const nameQuestionPatterns = {
        es: [
          /^como se llama tu patron\??$/i,
          /^como se llama tu jefe\??$/i,
          /^cual es el nombre de tu\??$/i,
          /^como se llama\??$/i,
        ],
        en: [
          /^who is your boss\??$/i,
          /^what is your employer\??$/i,
          /^what is.*name\??$/i,
        ],
      };
      
      const namePatterns = nameQuestionPatterns[fromLang] || [];
      const isNameQuestion = namePatterns.some(pattern => pattern.test(text.trim()));
      
      if (isNameQuestion) {
        // Usar corpus para otras preguntas sobre nombres
        const corpus = corpusTranslate(text, fromLang, toLang, { minScore: 0.7, limit: 1 });
        if (corpus.best && corpus.best.score >= 0.75) {
          result = corpus.best.toText;
        }
      }
      
      // Detectar si la frase comienza con "hola" seguido de otra frase
      const holaPattern = /^(hola|hello)[\s,]+(.+)$/i;
      const holaMatch = text.trim().match(holaPattern);
      
      if (holaMatch) {
        // Separar el saludo de la frase principal
        const greeting = holaMatch[1].toLowerCase() === "hola" ? "Hant" : "Hant";
        const mainPhrase = holaMatch[2].trim();
        
        // Traducir la frase principal
        const mainCorpus = corpusTranslate(mainPhrase, fromLang, toLang, { minScore: 0.6, limit: 5 });
        if (mainCorpus.best && mainCorpus.best.score >= 0.70) {
          result = `${greeting}, ${mainCorpus.best.toText}`;
        } else {
          // Si no hay match en corpus, traducir con OpenAI solo la parte principal
          const mainCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: getSystemPrompt(fromLang, toLang) },
              { role: "user", content: mainPhrase },
            ],
            temperature: 0.2,
            max_tokens: 1500,
            top_p: 0.9,
          });
          const mainTranslation = mainCompletion.choices[0]?.message?.content?.trim() || "";
          const cleanedMain = mainTranslation
            .replace(/^["'`]|["'`]$/g, "")
            .replace(/^[\.\s]+|[\.\s]+$/g, "")
            .replace(/\s+/g, " ")
            .trim();
          result = `${greeting}, ${cleanedMain}`;
        }
      } else {
        // Validación especial SOLO para mensajes de validación de campos
        // DEBE contener palabras clave de validación explícitas (te falta, te faltó, you need to tell me, etc.)
        // NO debe activarse para preguntas normales como "QUIEN ERES?"
        const validationKeywords = {
          es: [
            "te falta decirme",
            "te faltó mencionar",
            "te falta mencionar",
            "te falta decirme el nombre",
            "te falta decirme a quien",
            "te falta decirme a que persona",
            "disculpa, te faltó",
            "te falta completar",
            "falta información",
          ],
          en: [
            "you need to tell me",
            "you forgot to mention",
            "you need to tell me the name",
            "you need to tell me who",
            "sorry, you forgot",
            "you need to complete",
            "missing information",
          ],
        };
        
        const keywords = validationKeywords[fromLang] || [];
        // CRÍTICO: Solo activar si contiene palabras clave de validación EXPLÍCITAS
        const hasValidationKeywords = keywords.some(keyword => 
          normalizedInput.includes(keyword.toLowerCase()) || text.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // SOLO activar si tiene palabras clave de validación Y además menciona "demandar" o "persona" en contexto de validación
        // NO activar para preguntas normales como "QUIEN ERES?" que solo contiene "quien"
        if (hasValidationKeywords && (normalizedInput.includes("demandar") || normalizedInput.includes("sue") || normalizedInput.includes("demand") || normalizedInput.includes("persona") || normalizedInput.includes("person"))) {
          // Usar la traducción del corpus si está disponible (con score más bajo para mejor matching)
          const corpus = corpusTranslate(text, fromLang, toLang, { minScore: 0.6, limit: 5 });
          if (corpus.best && corpus.best.score >= 0.70) {
            result = corpus.best.toText;
          } else {
            // Fallback: usar traducción estándar basada en la variante más cercana
            if (normalizedInput.includes("nombre") || normalizedInput.includes("name")) {
              result = "Haxt ziix hac mapt quih ano coti mapt hac ziix hac quih ano coti mapt quih itaal hac an";
            } else if (normalizedInput.includes("quien") || normalizedInput.includes("who")) {
              result = "Haxt ziix hac mapt quih ano coti mapt hac quih ano coti mapt quih itaal hac an";
            } else {
              result = "Haxt ziix hac mapt quih ano coti mapt hac quih ano coti mapt quih itaal hac an";
            }
          }
        } else {
          // NO es un mensaje de validación, traducir normalmente con OpenAI
          // Esto incluye preguntas normales como "QUIEN ERES?"
          // El resultado ya viene de OpenAI arriba, así que no hacer nada adicional aquí
        }
      }
    }
    
    // Validación especial para inglés ↔ español (mejorar calidad)
    if ((fromLang === "en" && toLang === "es") || (fromLang === "es" && toLang === "en")) {
      // Asegurar que las traducciones comunes sean precisas
      const normalizedInput = text.trim().toLowerCase();
      const commonTranslations: Record<string, Record<string, string>> = {
        "hello": { es: "Hola", en: "Hello" },
        "hola": { es: "Hola", en: "Hello" },
        "thank you": { es: "Gracias", en: "Thank you" },
        "gracias": { es: "Gracias", en: "Thank you" },
        "yes": { es: "Sí", en: "Yes" },
        "sí": { es: "Sí", en: "Yes" },
        "no": { es: "No", en: "No" },
      };
      
      if (commonTranslations[normalizedInput]) {
        const translation = commonTranslations[normalizedInput][toLang];
        if (translation) {
          result = translation;
        }
      }
    }
    
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
