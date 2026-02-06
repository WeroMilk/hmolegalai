/**
 * Sistema Fonético Completo de Comca'ac (Cmiique Iitom)
 * 
 * Basado en:
 * - "Illustrations of the IPA: Seri" (Marlett, Moreno Herrera, Herrera Astorga, 2005)
 * - Documentación SIL México
 * - Análisis fonológico de Moser & Marlett
 * 
 * IPA: [kw̃ĩːkɛˈiːtom] para "cmiique iitom"
 */

export interface Phoneme {
  ipa: string;
  orthography: string; // Representación en ortografía Seri
  description: string;
  examples: string[];
  position?: "initial" | "medial" | "final" | "any";
}

export interface PhoneticRule {
  description: string;
  pattern: string;
  examples: string[];
  exceptions?: string[];
}

/**
 * Consonantes del Sistema Fonológico Comca'ac
 * Basado en análisis IPA completo
 */
export const CONSONANTS: Phoneme[] = [
  // Oclusivas
  {
    ipa: "/p/",
    orthography: "p",
    description: "Oclusiva bilabial sorda",
    examples: ["hapaspoj", "papel"],
    position: "any",
  },
  {
    ipa: "/t/",
    orthography: "t",
    description: "Oclusiva alveolar sorda",
    examples: ["tahejöc", "gracias", "tooj", "sol"],
    position: "any",
  },
  {
    ipa: "/k/",
    orthography: "c (antes de a, o, u) / qu (antes de e, i)",
    description: "Oclusiva velar sorda",
    examples: ["caacoj", "trabajo", "quih", "artículo"],
    position: "any",
  },
  
  // Fricativas
  {
    ipa: "/x/",
    orthography: "x",
    description: "Fricativa velar sorda",
    examples: ["xaap", "firma", "xicaast", "enseñar"],
    position: "any",
  },
  {
    ipa: "/h/",
    orthography: "h",
    description: "Fricativa glotal sorda",
    examples: ["haxt", "persona", "hehe", "casa"],
    position: "initial",
  },
  
  // Nasales
  {
    ipa: "/m/",
    orthography: "m",
    description: "Nasal bilabial",
    examples: ["mapt", "tu", "cmiique", "persona Seri"],
    position: "any",
  },
  {
    ipa: "/n/",
    orthography: "n",
    description: "Nasal alveolar",
    examples: ["xnoois", "luna"],
    position: "any",
  },
  
  // Aproximantes
  {
    ipa: "/j/",
    orthography: "y",
    description: "Aproximante palatal",
    examples: ["yaza", "cumplir"],
    position: "any",
  },
  {
    ipa: "/w/",
    orthography: "w",
    description: "Aproximante labiovelar",
    examples: ["kw̃ĩːkɛ", "cmiique (en IPA)"],
    position: "any",
  },
  
  // Lateral
  {
    ipa: "/l/",
    orthography: "l",
    description: "Lateral alveolar sonora (marcada con subrayado en algunos textos)",
    examples: ["islixp", "prometer"],
    position: "any",
  },
  
  // Vibrante
  {
    ipa: "/r/",
    orthography: "r",
    description: "Vibrante alveolar",
    examples: [],
    position: "medial",
  },
];

/**
 * Vocales del Sistema Fonológico Comca'ac
 */
export const VOWELS: Phoneme[] = [
  {
    ipa: "/a/",
    orthography: "a",
    description: "Vocal abierta central no redondeada",
    examples: ["haxt", "persona", "caacoj", "trabajo"],
    position: "any",
  },
  {
    ipa: "/e/",
    orthography: "e",
    description: "Vocal media anterior no redondeada",
    examples: ["hehe", "casa"],
    position: "any",
  },
  {
    ipa: "/i/",
    orthography: "i",
    description: "Vocal cerrada anterior no redondeada",
    examples: ["iti", "estar", "iitom", "idioma"],
    position: "any",
  },
  {
    ipa: "/o/",
    orthography: "o",
    description: "Vocal media posterior redondeada",
    examples: ["ooca", "ayudar", "tooj", "sol"],
    position: "any",
  },
  {
    ipa: "/ø/",
    orthography: "ö",
    description: "Vocal media anterior redondeada",
    examples: ["cöihcapxöt", "ley", "tahejöc", "gracias"],
    position: "any",
  },
  
  // Vocales largas (indicadas por duplicación)
  {
    ipa: "/aː/",
    orthography: "aa",
    description: "Vocal larga /a/",
    examples: ["caacoj", "trabajo"],
    position: "any",
  },
  {
    ipa: "/eː/",
    orthography: "ee",
    description: "Vocal larga /e/",
    examples: [],
    position: "any",
  },
  {
    ipa: "/iː/",
    orthography: "ii",
    description: "Vocal larga /i/",
    examples: ["iitom", "idioma", "iizax", "océano"],
    position: "any",
  },
  {
    ipa: "/oː/",
    orthography: "oo",
    description: "Vocal larga /o/",
    examples: ["ooca", "ayudar"],
    position: "any",
  },
];

/**
 * Reglas de Pronunciación
 */
export const PRONUNCIATION_RULES: PhoneticRule[] = [
  {
    description: "La 'c' se pronuncia /k/ antes de a, o, u; 'qu' se usa antes de e, i",
    pattern: "c → /k/ (a,o,u) | qu → /k/ (e,i)",
    examples: ["caacoj /kaːkoj/", "quih /kih/"],
  },
  {
    description: "Vocales largas se indican con duplicación en ortografía",
    pattern: "aa → /aː/, ii → /iː/, oo → /oː/",
    examples: ["caacoj /kaːkoj/", "iitom /iːtom/", "ooca /oːka/"],
  },
  {
    description: "La 'x' representa fricativa velar /x/",
    pattern: "x → /x/",
    examples: ["xaap /xaːp/", "xicaast /xikaːst/"],
  },
  {
    description: "La 'h' inicial representa fricativa glotal /h/",
    pattern: "h → /h/ (inicial)",
    examples: ["haxt /haxt/", "hehe /hehe/"],
  },
  {
    description: "La 'ö' representa vocal media anterior redondeada /ø/",
    pattern: "ö → /ø/",
    examples: ["cöihcapxöt /køihkapxøt/", "tahejöc /tahejøk/"],
  },
];

/**
 * Patrones de Acentuación
 * El acento puede marcarse con acento agudo en ortografía
 */
export const STRESS_PATTERNS: PhoneticRule[] = [
  {
    description: "Acento primario puede marcarse con acento agudo",
    pattern: "Vocal acentuada → acento agudo",
    examples: ["cmiique iitom /kw̃ĩːkɛˈiːtom/", "La segunda sílaba de iitom lleva acento"],
  },
  {
    description: "Patrones de acentuación varían según estructura morfológica",
    pattern: "Acento en raíz verbal o nominal",
    examples: ["xaap iti", "firmar"],
  },
];

/**
 * Variaciones Fonéticas por Contexto
 */
export const CONTEXTUAL_VARIATIONS: PhoneticRule[] = [
  {
    description: "Asimilación nasal en algunos contextos",
    pattern: "Nasalización en contacto con nasales",
    examples: ["cmiique /kw̃ĩːkɛ/ (con nasalización)"],
  },
  {
    description: "Elisión de vocales en contextos rápidos",
    pattern: "Vocal → Ø (en habla rápida)",
    examples: ["zo hehe → [zohehe]"],
  },
];

/**
 * Guía de Pronunciación para TTS
 * Información específica para síntesis de voz
 */
export const TTS_PRONUNCIATION_GUIDE = {
  speed: 0.85, // Velocidad recomendada para mejor comprensión
  pitch: 1.0, // Tono normal
  emphasis: {
    legalTerms: "Pronunciar con claridad y pausa ligera",
    verbs: "Énfasis en raíz verbal",
    nouns: "Énfasis en primera sílaba típicamente",
  },
  pauses: {
    afterClauses: "Pausa breve después de cláusulas relativas",
    beforeVerbs: "Pausa mínima antes de verbos en orden SOV",
  },
};

/**
 * Función helper para obtener pronunciación IPA de una palabra
 */
export function getIPA(word: string): string | undefined {
  // Buscar en consonantes y vocales
  const allPhonemes = [...CONSONANTS, ...VOWELS];
  const phoneme = allPhonemes.find((p) => 
    p.examples.some((ex) => ex.toLowerCase().includes(word.toLowerCase()))
  );
  return phoneme?.ipa;
}

/**
 * Función helper para validar ortografía fonética
 */
export function validatePhoneticSpelling(word: string): {
  valid: boolean;
  issues: string[];
  suggestions?: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Validar uso de 'c' vs 'qu'
  if (word.match(/c[ei]/i)) {
    issues.push("Usar 'qu' antes de e, i en lugar de 'c'");
    suggestions.push(word.replace(/c([ei])/gi, "qu$1"));
  }
  
  // Validar vocales largas
  if (word.match(/[aeiou]{3,}/i)) {
    issues.push("Vocales largas se indican con duplicación (aa, ii, oo), no triplicación");
  }
  
  return {
    valid: issues.length === 0,
    issues,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Función helper para convertir texto a guía de pronunciación
 */
export function createPronunciationGuide(text: string): string {
  const words = text.split(/\s+/);
  return words
    .map((word) => {
      const ipa = getIPA(word);
      return ipa ? `${word} [${ipa}]` : word;
    })
    .join(" ");
}
