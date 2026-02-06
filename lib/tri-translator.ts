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
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // remove diacritics
    .replace(/[\u0300-\u036f]/g, "")
    // normalize quotes/punctuation spacing a bit
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
}

function tokenSet(input: string): Set<string> {
  const norm = normalizeForSearch(input);
  const parts = norm.split(/[^a-z0-9öáéíóúüñ]+/i).filter(Boolean);
  return new Set(parts);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function scoreTextMatch(query: string, candidate: string): number {
  const q = normalizeForSearch(query);
  const c = normalizeForSearch(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;

  // substring match (good for slight variations)
  if (c.includes(q) || q.includes(c)) {
    const min = Math.min(q.length, c.length);
    const max = Math.max(q.length, c.length);
    return 0.85 * (min / max);
  }

  // token similarity
  const sim = jaccard(tokenSet(q), tokenSet(c));
  return sim * 0.75;
}

/**
 * Mejora el matching usando conocimiento completo de comca'ac
 */
function enhancedScoreTextMatch(query: string, candidate: string, fromLang: TriLang, toLang: TriLang): number {
  const baseScore = scoreTextMatch(query, candidate);
  
  // Si es comca'ac, usar conocimiento adicional
  if (fromLang === "seri" || toLang === "seri") {
    // Buscar palabra en base de conocimiento
    const foundWord = findWord(query);
    if (foundWord) {
      // Si la palabra está en el conocimiento base, aumentar confianza
      const candidateWord = findWord(candidate);
      if (candidateWord && foundWord.seri === candidateWord.seri) {
        return Math.min(1.0, baseScore + 0.1); // Boost para palabras conocidas
      }
    }
    
    // Validar fonética para mejorar matching
    const phoneticValidation = validatePhoneticSpelling(query);
    if (phoneticValidation.valid && phoneticValidation.suggestions) {
      // Si hay sugerencias fonéticas, considerar variaciones
      for (const suggestion of phoneticValidation.suggestions) {
        if (suggestion.toLowerCase() === candidate.toLowerCase()) {
          return Math.min(1.0, baseScore + 0.05);
        }
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
  for (const row of CORPUS) {
    const fromText = getByLang(row, fromLang);
    const toText = getByLang(row, toLang);
    if (!fromText || !toText) continue;
    // Usar scoring mejorado con conocimiento completo
    const score = enhancedScoreTextMatch(query, fromText, fromLang, toLang);
    if (score >= minScore) scored.push({ key: row.key, fromText, toText, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const suggestions = scored.slice(0, limit);
  const best = suggestions[0];
  return { best, suggestions };
}

