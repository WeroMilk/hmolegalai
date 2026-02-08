import { translations, type Locale, type TranslationKey } from "@/lib/translations";
import { findWord, GRAMMAR_RULES } from "@/lib/comcaac-knowledge-base";
import { validatePhoneticSpelling } from "@/lib/comcaac-phonetics";

type TriLang = Locale; // "es" | "en" | "seri"

export type CorpusSuggestion = {
  key: TranslationKey;
  fromText: string;
  toText: string;
  score: number; // 0..1
};

function normalizeForSearch(input: string): string {
  if (!input) return "";
  
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // remove diacritics
    .replace(/[\u0300-\u036f]/g, "")
    // normalize quotes/punctuation spacing a bit
    .replace(/[’'`]/g, "'")
    // normalize signos de interrogación/exclamación
    .replace(/[¿?¡!]/g, "")
    // normalize espacios múltiples
    .replace(/\s+/g, " ")
    // remover puntuación al inicio/final
    .replace(/^[.,;:]+|[.,;:]+$/g, "")
    .trim();
}

function tokenSet(input: string): Set<string> {
  if (!input) return new Set();
  const norm = normalizeForSearch(input);
  const parts = norm
    .split(/[^a-z0-9öáéíóúüñ]+/i)
    .filter(Boolean)
    .filter(p => p.length > 0); // Filtrar tokens vacíos
  return new Set(parts);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1.0; // Ambos vacíos = match perfecto
  if (a.size === 0 || b.size === 0) return 0;
  
  let inter = 0;
  for (const t of a) {
    if (b.has(t)) inter++;
  }
  
  const union = a.size + b.size - inter;
  if (union === 0) return 0;
  
  return inter / union;
}

function scoreTextMatch(query: string, candidate: string): number {
  const q = normalizeForSearch(query);
  const c = normalizeForSearch(candidate);
  if (!q || !c) return 0;
  
  // Coincidencia exacta (máxima prioridad) - score 1.0
  if (q === c) return 1.0;
  
  // Coincidencia exacta sin considerar mayúsculas/minúsculas - score 0.99
  const qLower = q.toLowerCase();
  const cLower = c.toLowerCase();
  if (qLower === cLower) return 0.99;
  
  // Coincidencia exacta de palabras (ignorando espacios extra y puntuación) - score 0.98
  const qWordsNormalized = q.split(/\s+/).filter(Boolean).join(" ");
  const cWordsNormalized = c.split(/\s+/).filter(Boolean).join(" ");
  if (qWordsNormalized === cWordsNormalized) return 0.98;
  
  // Coincidencia exacta sin puntuación al inicio/final - score 0.97
  const qNoPunct = q.replace(/^[.,;:!?\s]+|[.,;:!?\s]+$/g, "").trim();
  const cNoPunct = c.replace(/^[.,;:!?\s]+|[.,;:!?\s]+$/g, "").trim();
  if (qNoPunct === cNoPunct && qNoPunct.length > 0) return 0.97;
  
  // Coincidencia exacta sin signos de interrogación/exclamación - score 0.96
  const qNoQMark = q.replace(/[¿?¡!]/g, "").trim();
  const cNoQMark = c.replace(/[¿?¡!]/g, "").trim();
  if (qNoQMark === cNoQMark && qNoQMark.length > 0) return 0.96;

  // Substring match completo (una frase contiene a la otra) - score 0.85-0.95
  if (c.includes(q) || q.includes(c)) {
    const min = Math.min(q.length, c.length);
    const max = Math.max(q.length, c.length);
    const ratio = min / max;
    // Si la relación es muy alta (>0.9), dar score más alto
    if (ratio > 0.9) return 0.95;
    if (ratio > 0.7) return 0.90;
    return 0.85 * ratio;
  }
  
  // Match mejorado para frases con palabras clave importantes (especialmente para validaciones legales)
  // Si la query contiene palabras clave importantes del candidato, dar boost
  const importantKeywords = q.split(/\s+/).filter(w => w.length > 4); // Palabras de 5+ letras
  if (importantKeywords.length > 0) {
    const matchingKeywords = importantKeywords.filter(kw => 
      c.toLowerCase().includes(kw.toLowerCase())
    );
    if (matchingKeywords.length >= Math.ceil(importantKeywords.length * 0.6)) {
      // Si al menos 60% de las palabras clave importantes coinciden, dar boost
      const keywordRatio = matchingKeywords.length / importantKeywords.length;
      return Math.max(0.75, keywordRatio * 0.90);
    }
  }
  
  // Match parcial mejorado: si hay palabras clave importantes en común
  const qWords = q.split(/\s+/).filter(w => w.length > 3); // Palabras significativas (>3 letras)
  const cWords = c.split(/\s+/).filter(w => w.length > 3);
  if (qWords.length > 0 && cWords.length > 0) {
    const commonWords = qWords.filter(w => cWords.includes(w));
    const wordMatchRatio = commonWords.length / Math.max(qWords.length, cWords.length);
    if (wordMatchRatio > 0.5) {
      // Si más del 50% de las palabras significativas coinciden, dar boost
      return Math.max(0.80, wordMatchRatio * 0.95);
    }
  }

  // Token similarity usando Jaccard mejorado - score 0.6-0.85
  const sim = jaccard(tokenSet(q), tokenSet(c));
  if (sim > 0.8) return 0.85;
  if (sim > 0.6) return 0.75;
  if (sim > 0.4) return 0.65;
  
  return sim * 0.75;
}

/**
 * Mejora el matching usando conocimiento completo de comca'ac
 */
function enhancedScoreTextMatch(query: string, candidate: string, fromLang: TriLang, toLang: TriLang): number {
  let baseScore = scoreTextMatch(query, candidate);
  
  // Si es comca'ac, usar conocimiento adicional
  if (fromLang === "seri" || toLang === "seri") {
    const queryLower = query.toLowerCase().trim();
    const candidateLower = candidate.toLowerCase().trim();
    
    // Buscar palabra en base de conocimiento
    const foundWord = findWord(query);
    if (foundWord) {
      // Si la palabra está en el conocimiento base, aumentar confianza
      const candidateWord = findWord(candidate);
      if (candidateWord && foundWord.seri === candidateWord.seri) {
        return Math.min(1.0, baseScore + 0.15); // Boost aumentado para palabras conocidas
      }
      
      // Si el candidato coincide con alguna traducción conocida de la palabra encontrada
      if (
        foundWord.spanish.toLowerCase() === candidateLower ||
        foundWord.english.toLowerCase() === candidateLower ||
        foundWord.seri.toLowerCase() === queryLower
      ) {
        return Math.min(1.0, baseScore + 0.12); // Boost para traducciones conocidas
      }
    }
    
    // Validar fonética para mejorar matching
    const phoneticValidation = validatePhoneticSpelling(query);
    if (phoneticValidation.valid && phoneticValidation.suggestions) {
      // Si hay sugerencias fonéticas, considerar variaciones
      for (const suggestion of phoneticValidation.suggestions) {
        if (suggestion.toLowerCase() === candidateLower) {
          return Math.min(1.0, baseScore + 0.08);
        }
      }
    }
    
    // Boost especial para frases de validación de campos (reconocer variaciones)
    const validationKeywords = {
      es: ["te falta", "te faltó", "disculpa", "mencionar", "decirme", "demandar", "persona", "nombre", "quien", "a quien"],
      en: ["you need", "you forgot", "sorry", "mention", "tell me", "sue", "person", "name", "who", "who you"],
      seri: ["ziix", "hac", "mapt", "quih", "ano", "coti", "itaal", "haxt"],
    };
    
    // Verificar si tanto query como candidate contienen palabras clave de validación
    const queryHasValidationKeywords = (validationKeywords[fromLang] || []).some(kw => queryLower.includes(kw));
    const candidateHasValidationKeywords = (validationKeywords[toLang] || []).some(kw => candidateLower.includes(kw));
    
    if (queryHasValidationKeywords && candidateHasValidationKeywords && baseScore > 0.5) {
      // Si ambos tienen palabras clave de validación, dar boost significativo
      baseScore = Math.min(1.0, baseScore + 0.12);
    }
    
    // Manejo especial para palabras polisémicas comunes
    const polysemicWords: Record<string, { contexts: string[]; translations: Record<string, string[]> }> = {
      "hant": {
        contexts: ["saludo", "ubicación", "cuerpo", "navegación", "tierra"],
        translations: {
          saludo: ["hola", "hello"],
          ubicación: ["aquí", "here", "dónde", "where"],
          cuerpo: ["pie", "foot", "pies", "feet"],
          navegación: ["inicio", "home", "principal"],
          tierra: ["tierra", "land", "territorio"],
        },
      },
    };
    
    if (polysemicWords[queryLower]) {
      const translations = polysemicWords[queryLower].translations;
      for (const [context, translationOptions] of Object.entries(translations)) {
        // Verificar si el candidato coincide con alguna traducción de este contexto
        const matches = translationOptions.some(t => 
          candidateLower === t || candidateLower.includes(t) || t.includes(candidateLower)
        );
        
        if (matches) {
          // Si es saludo y la query es exactamente "hant", dar máxima prioridad
          if (context === "saludo" && queryLower === "hant" && 
              (candidateLower === "hola" || candidateLower === "hello")) {
            return Math.max(baseScore, 0.99); // Máxima prioridad para saludo
          }
          // Para otros contextos, dar boost moderado
          return Math.min(1.0, baseScore + 0.12);
        }
      }
    }
    
    // Manejo inverso: si estamos traduciendo de español/inglés a comca'ac
    if ((fromLang === "es" || fromLang === "en") && toLang === "seri") {
      // Si la query es "hola" o "hello", buscar "Hant" en el corpus
      if ((queryLower === "hola" || queryLower === "hello") && candidateLower === "hant") {
        return Math.max(baseScore, 0.99); // Máxima prioridad
      }
    }
  }
  
  return baseScore;
}

type CorpusRow = {
  key: TranslationKey;
  es: string;
  en: string;
  seri: string;
};

const CORPUS: CorpusRow[] = Object.keys(translations.es).map((k) => {
  const key = k as TranslationKey;
  return {
    key,
    es: translations.es[key],
    en: translations.en[key],
    seri: translations.seri[key],
  };
});

function getByLang(row: CorpusRow, lang: TriLang): string {
  return lang === "es" ? row.es : lang === "en" ? row.en : row.seri;
}

export function corpusTranslate(
  inputText: string,
  fromLang: TriLang,
  toLang: TriLang,
  opts?: { minScore?: number; limit?: number }
): { best?: CorpusSuggestion; suggestions: CorpusSuggestion[] } {
  const minScore = opts?.minScore ?? 0.6;
  const limit = opts?.limit ?? 5;

  const query = inputText.trim();
  if (!query) return { suggestions: [] };
  if (fromLang === toLang) return { suggestions: [] };

  const scored: CorpusSuggestion[] = [];
  const normalizedQuery = normalizeForSearch(query);
  
  for (const row of CORPUS) {
    const fromText = getByLang(row, fromLang);
    const toText = getByLang(row, toLang);
    if (!fromText || !toText) continue;
    
    const normalizedFromText = normalizeForSearch(fromText);
    
    // Calcular score base mejorado
    let score = enhancedScoreTextMatch(query, fromText, fromLang, toLang);
    
    // Boost adicional para coincidencias exactas normalizadas (máxima prioridad)
    if (normalizedQuery === normalizedFromText) {
      score = Math.max(score, 0.99);
    }
    
    // Boost para palabras comunes de saludo y cortesía
    const greetingKeys = ["greeting_hello", "greeting_goodbye", "greeting_thanks"];
    if (greetingKeys.includes(row.key)) {
      score = Math.min(1.0, score + 0.08); // Boost aumentado para saludos
    }
    
    // Boost para palabras comunes (common_*)
    if (row.key.startsWith("common_")) {
      score = Math.min(1.0, score + 0.06); // Boost para frases comunes
    }
    
    // Boost para palabras cortas comunes (hola, sí, no, etc.)
    if (query.length <= 5 && fromText.length <= 5 && score > 0.7) {
      score = Math.min(1.0, score + 0.04); // Boost aumentado
    }
    
    // Boost para traducciones legales si el contexto es legal
    const legalKeys = ["amparo_", "doc_", "field_", "legal_"];
    if (legalKeys.some(prefix => row.key.startsWith(prefix)) && score > 0.7) {
      score = Math.min(1.0, score + 0.05); // Boost aumentado para mensajes legales
    }
    
    // Boost especial para mensajes de validación de campos (doc_missing_field_name*)
    if (row.key.startsWith("doc_missing_field_name") && score > 0.6) {
      score = Math.min(1.0, score + 0.08); // Boost alto para mensajes de validación de nombres
    }
    
    // Boost especial para "Hola" ↔ "Hant" (máxima prioridad)
    const isHolaHant = (
      (normalizedQuery === "hola" || normalizedQuery === "hello") && 
      normalizedFromText === "hant"
    ) || (
      normalizedQuery === "hant" && 
      (normalizedFromText === "hola" || normalizedFromText === "hello")
    );
    if (isHolaHant) {
      score = Math.max(score, 0.99); // Forzar score muy alto
    }
    
    // CRÍTICO: Para palabras/frases muy cortas (< 15 caracteres), requerir coincidencia exacta o casi exacta
    // Esto evita que palabras polisémicas cortas como "Ziix quih yaza" matcheen incorrectamente
    if (query.length < 15 && fromText.length < 15) {
      const exactMatch = normalizedQuery === normalizedFromText;
      const veryCloseMatch = Math.abs(query.length - fromText.length) <= 2 && 
                            (normalizedQuery.includes(normalizedFromText) || normalizedFromText.includes(normalizedQuery));
      
      // Si NO es una coincidencia exacta o muy cercana, reducir significativamente el score
      if (!exactMatch && !veryCloseMatch && score < 0.95) {
        score = score * 0.5; // Reducir score a la mitad para coincidencias parciales en palabras cortas
      }
      
      // Si ES una coincidencia exacta, dar score máximo
      if (exactMatch) {
        score = Math.max(score, 0.98);
      }
    }
    
    // CRÍTICO: Penalizar traducciones que son demasiado genéricas para palabras específicas
    // Por ejemplo, "Ziix quih yaza" no debería matchear con "Acción" cuando el contexto es "Dashboard"
    if (query.length < 20 && fromText.length < 20) {
      // Si la query es más específica que el candidato, penalizar
      const queryWords = query.split(/\s+/).length;
      const fromWords = fromText.split(/\s+/).length;
      if (queryWords > fromWords + 1) {
        score = score * 0.7; // Penalizar si la query tiene más palabras (más específica)
      }
    }
    
    if (score >= minScore) scored.push({ key: row.key, fromText, toText, score });
  }

  scored.sort((a, b) => {
    // Primero ordenar por score (diferencia significativa > 0.01)
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) > 0.01) {
      return scoreDiff;
    }
    
    // Si los scores son muy similares, usar criterios de desempate:
    
    // 0. CRÍTICO: Priorizar coincidencias exactas sobre parciales
    const aExactMatch = normalizeForSearch(a.fromText) === normalizedQuery;
    const bExactMatch = normalizeForSearch(b.fromText) === normalizedQuery;
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    
    // 1. Priorizar saludos y palabras comunes (máxima prioridad)
    const aIsGreeting = a.key.startsWith("greeting_");
    const bIsGreeting = b.key.startsWith("greeting_");
    if (aIsGreeting && !bIsGreeting) return -1;
    if (!aIsGreeting && bIsGreeting) return 1;
    
    // 2. Priorizar frases comunes (common_*)
    const aIsCommon = a.key.startsWith("common_");
    const bIsCommon = b.key.startsWith("common_");
    if (aIsCommon && !bIsCommon) return -1;
    if (!aIsCommon && bIsCommon) return 1;
    
    // 3. Priorizar coincidencias exactas de longitud (más importante para palabras cortas)
    const aLengthMatch = Math.abs(a.fromText.length - query.length);
    const bLengthMatch = Math.abs(b.fromText.length - query.length);
    if (query.length < 20 && aLengthMatch !== bLengthMatch) {
      return aLengthMatch - bLengthMatch; // Menor diferencia = mejor
    }
    
    // 4. Priorizar traducciones más cortas (más precisas) para palabras simples
    if (query.length <= 10 && a.toText.length !== b.toText.length) {
      return a.toText.length - b.toText.length;
    }
    
    // 5. Priorizar keys más específicas (menos genéricas)
    const aSpecificity = a.key.split("_").length;
    const bSpecificity = b.key.split("_").length;
    if (aSpecificity !== bSpecificity) {
      return bSpecificity - aSpecificity; // Más específico = mejor
    }
    
    // 6. Para palabras cortas, priorizar matches que tienen la misma cantidad de palabras
    if (query.length < 20) {
      const aWordCount = a.fromText.split(/\s+/).length;
      const bWordCount = b.fromText.split(/\s+/).length;
      const queryWordCount = query.split(/\s+/).length;
      const aWordDiff = Math.abs(aWordCount - queryWordCount);
      const bWordDiff = Math.abs(bWordCount - queryWordCount);
      if (aWordDiff !== bWordDiff) {
        return aWordDiff - bWordDiff; // Menor diferencia en cantidad de palabras = mejor
      }
    }
    
    return 0;
  });
  
  const suggestions = scored.slice(0, limit);
  const best = suggestions[0];
  
  // Validación adicional: si el mejor score es muy alto (>0.95), confiar en él
  // Si es bajo (<0.7), considerar que puede necesitar OpenAI
  return { best, suggestions };
}

