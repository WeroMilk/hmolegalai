import { translations, type Locale, type TranslationKey } from "@/lib/translations";

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
    const score = scoreTextMatch(query, fromText);
    if (score >= minScore) scored.push({ key: row.key, fromText, toText, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const suggestions = scored.slice(0, limit);
  const best = suggestions[0];
  return { best, suggestions };
}

