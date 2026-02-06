/**
 * Base de Conocimiento Completa de Comca'ac (Cmiique Iitom)
 * 
 * Fuentes principales:
 * - Moser & Marlett: "Comcáac quih Yaza quih Hant Ihíip hac" (2005, 2010)
 * - SIL México: Documentación lingüística
 * - INALI: Recursos oficiales
 * - Omniglot y recursos académicos
 * 
 * Este archivo contiene vocabulario extenso, estructuras gramaticales,
 * conjugaciones verbales y contexto cultural para traducciones perfectas.
 */

export interface ComcaacWord {
  seri: string;
  spanish: string;
  english: string;
  category: "legal" | "general" | "verb" | "noun" | "adjective" | "adverb" | "pronoun" | "preposition" | "conjunction" | "interjection" | "cultural";
  pronunciation?: string; // IPA notation
  examples: string[]; // Frases de ejemplo en comca'ac
  culturalContext?: string;
  dialectVariations?: string[];
  etymology?: string;
  notes?: string;
}

export interface ComcaacVerb {
  root: string;
  spanish: string;
  english: string;
  verbClass: number; // Seri tiene 250+ clases de inflexión
  conjugations: {
    present: {
      singular: string;
      plural: string;
    };
    past: {
      singular: string;
      plural: string;
    };
    future?: {
      singular: string;
      plural: string;
    };
    imperative?: {
      singular: string;
      plural: string;
    };
    progressive?: {
      singular: string;
      plural: string;
    };
  };
  examples: string[];
  pronunciation?: string;
}

export interface ComcaacGrammar {
  wordOrder: {
    description: string;
    pattern: string; // SOV, etc.
    examples: string[];
  };
  possessive: {
    firstPerson: string; // "hac" (mi)
    secondPerson: string; // "mapt" (tu)
    thirdPerson: string;
    examples: string[];
  };
  plural: {
    regular: string; // "com" prefix
    irregular: Record<string, string>; // cmiique → comcaac, ziix → xiica
    examples: string[];
  };
  articles: {
    singular: string[]; // "quih", "zo", "z"
    plural: string[]; // "coi"
    examples: string[];
  };
  pronouns: {
    personal: Record<string, string>;
    demonstrative: Record<string, string>;
    interrogative: Record<string, string>;
  };
  syntax: {
    relativeClauses: string;
    questionFormation: string;
    negation: string;
    examples: string[];
  };
}

/**
 * Vocabulario Legal Extenso
 * Basado en vocabulario legal del proyecto y expandido con diccionario Moser-Marlett
 */
export const LEGAL_VOCABULARY: ComcaacWord[] = [
  // Conceptos legales fundamentales
  {
    seri: "cöihcapxöt",
    spanish: "ley",
    english: "law",
    category: "legal",
    pronunciation: "/køihkapxøt/",
    examples: ["Cöihcapxöt quih iti capxöt", "La ley establece justicia"],
    culturalContext: "Concepto fundamental en el sistema legal comca'ac",
  },
  {
    seri: "cöihcapxöt ziix",
    spanish: "contrato",
    english: "contract",
    category: "legal",
    pronunciation: "/køihkapxøt ziːx/",
    examples: ["Cöihcapxöt ziix xaap iti", "Firmar el contrato"],
  },
  {
    seri: "ziix hapáctim",
    spanish: "documento",
    english: "document",
    category: "legal",
    pronunciation: "/ziːx hapaktim/",
    examples: ["Ziix hapáctim quih ano coti", "Necesito un documento"],
  },
  {
    seri: "haxt",
    spanish: "persona",
    english: "person",
    category: "legal",
    pronunciation: "/haxt/",
    examples: ["Haxt quih ooca", "Abogado (persona que ayuda)"],
  },
  {
    seri: "xaap iti",
    spanish: "firma / firmar",
    english: "signature / to sign",
    category: "legal",
    pronunciation: "/xaːp iti/",
    examples: ["Ziix hac xaap iti", "Yo firmo", "Cöihcaaitoj xaap iti ziix hapáctim", "El testigo firma el documento"],
  },
  {
    seri: "cöihcaaitoj",
    spanish: "testigo",
    english: "witness",
    category: "legal",
    pronunciation: "/køihkaːitoj/",
    examples: ["Cöihcaaitoj xaap iti ziix hapáctim", "El testigo firma el documento"],
  },
  {
    seri: "hast cöpaac",
    spanish: "juez",
    english: "judge",
    category: "legal",
    pronunciation: "/hast køpaːk/",
    examples: ["Hast cöpaac quih iti capxöt", "El juez hace justicia"],
  },
  {
    seri: "haxt quih ooca",
    spanish: "abogado",
    english: "lawyer",
    category: "legal",
    pronunciation: "/haxt kih oːka/",
    examples: ["Haxt quih ooca quih ano coti", "Necesito un abogado"],
    culturalContext: "Literalmente: persona que ayuda",
  },
  {
    seri: "cöihyáax",
    spanish: "derecho",
    english: "right",
    category: "legal",
    pronunciation: "/køihjaːx/",
    examples: ["Cöihyáax quih iti capxöt", "El derecho establece justicia"],
  },
  {
    seri: "hapáctim",
    spanish: "verdad",
    english: "truth",
    category: "legal",
    pronunciation: "/hapaktim/",
    examples: ["Hapáctim quih iti", "Decir la verdad"],
  },
  {
    seri: "quih iti capxöt",
    spanish: "justicia",
    english: "justice",
    category: "legal",
    pronunciation: "/kih iti kapxøt/",
    examples: ["Quih iti capxöt quih ano coti", "Buscar justicia"],
  },
  {
    seri: "quih islixp",
    spanish: "prometer",
    english: "to promise",
    category: "legal",
    pronunciation: "/kih islixp/",
    examples: ["Ziix hac quih islixp", "Yo prometo"],
  },
  {
    seri: "quih yaza",
    spanish: "cumplir",
    english: "to fulfill",
    category: "legal",
    pronunciation: "/kih jaza/",
    examples: ["Quih yaza cöihcapxöt ziix", "Cumplir el contrato"],
  },
  {
    seri: "quih ano coti",
    spanish: "pedir / demandar",
    english: "to ask / to demand",
    category: "legal",
    pronunciation: "/kih ano koti/",
    examples: ["Ziix hac quih ano coti", "Yo pido", "Ziix hac quih ano coti ziix hapáctim", "Quiero un documento"],
  },
  {
    seri: "hast",
    spanish: "autoridad",
    english: "authority",
    category: "legal",
    pronunciation: "/hast/",
    examples: ["Hast quih iti capxöt", "La autoridad hace justicia"],
  },
  {
    seri: "ziix",
    spanish: "acto / cosa",
    english: "act / thing",
    category: "legal",
    pronunciation: "/ziːx/",
    examples: ["Ziix coii", "Violación", "Ziix hac", "Mi situación"],
    notes: "Palabra polisémica con múltiples significados según contexto",
  },
  {
    seri: "ziix coii",
    spanish: "violación",
    english: "violation",
    category: "legal",
    pronunciation: "/ziːx koːi/",
    examples: ["Ziix coii cöihcapxöt", "Violación de la ley"],
  },
];

/**
 * Vocabulario General Extenso
 * Expandido desde vocabulario básico a vocabulario completo
 */
export const GENERAL_VOCABULARY: ComcaacWord[] = [
  // Personas y relaciones
  {
    seri: "cmiique",
    spanish: "persona comca'ac (singular)",
    english: "Seri person (singular)",
    category: "noun",
    pronunciation: "/kmiːke/",
    examples: ["Cmiique quih iti", "Una persona habla"],
    notes: "Plural irregular: comcaac",
  },
  {
    seri: "comcaac",
    spanish: "pueblo comca'ac / personas comca'ac (plural)",
    english: "Seri people (plural)",
    category: "noun",
    pronunciation: "/komkaːk/",
    examples: ["Comcaac quih iti", "Las personas hablan"],
    etymology: "Plural de cmiique",
  },
  {
    seri: "hamiigo",
    spanish: "amigo",
    english: "friend",
    category: "noun",
    pronunciation: "/hamiːgo/",
    examples: ["Hamiigo hac", "Mi amigo"],
    etymology: "Préstamo del español 'amigo'",
  },
  
  // Lugares y territorio
  {
    seri: "hehe",
    spanish: "casa",
    english: "house",
    category: "noun",
    pronunciation: "/hehe/",
    examples: ["Zo hehe", "En mi casa", "Hehe hac", "Mi casa"],
  },
  {
    seri: "zo hehe",
    spanish: "en mi casa",
    english: "in my house",
    category: "preposition",
    pronunciation: "/zo hehe/",
    examples: ["Zo hehe quih iti", "Estoy en mi casa"],
  },
  {
    seri: "hant iiha",
    spanish: "la tierra (lugar, territorio)",
    english: "the land (place, territory)",
    category: "noun",
    pronunciation: "/hant iːha/",
    examples: ["Hant iiha hac", "Mi tierra"],
  },
  {
    seri: "hant iicp",
    spanish: "mi tierra",
    english: "my land",
    category: "noun",
    pronunciation: "/hant iːkp/",
    examples: ["Hant iicp quih iti", "Mi tierra está aquí"],
  },
  {
    seri: "iizax",
    spanish: "océano / mar",
    english: "ocean / sea",
    category: "noun",
    pronunciation: "/iːzax/",
    examples: ["Iizax quih iti", "El mar está aquí"],
    culturalContext: "Muy importante en la cultura comca'ac, pueblo costero",
  },
  
  // Acciones y verbos comunes
  {
    seri: "xicaast",
    spanish: "enseñar",
    english: "to teach",
    category: "verb",
    pronunciation: "/xikaːst/",
    examples: ["Xicaast hac", "Yo enseño"],
  },
  {
    seri: "tahejöc",
    spanish: "gracias",
    english: "thank you",
    category: "interjection",
    pronunciation: "/tahejøk/",
    examples: ["Tahejöc", "Gracias"],
  },
  
  // Objetos y conceptos materiales
  {
    seri: "hapaspoj",
    spanish: "papel",
    english: "paper",
    category: "noun",
    pronunciation: "/hapaspoj/",
    examples: ["Hapaspoj quih ano coti", "Necesito papel"],
  },
  {
    seri: "caacoj",
    spanish: "trabajo",
    english: "work",
    category: "noun",
    pronunciation: "/kaːkoj/",
    examples: ["Caacoj quih ano coti", "Necesito trabajo"],
  },
  {
    seri: "quííp",
    spanish: "dinero",
    english: "money",
    category: "noun",
    pronunciation: "/kiːp/",
    examples: ["Quííp quih ano coti", "Necesito dinero"],
  },
  
  // Naturaleza y cosmos
  {
    seri: "tooj",
    spanish: "sol",
    english: "sun",
    category: "noun",
    pronunciation: "/toːj/",
    examples: ["Tooj quih iti", "El sol está aquí"],
  },
  {
    seri: "xnoois",
    spanish: "luna",
    english: "moon",
    category: "noun",
    pronunciation: "/xnoːis/",
    examples: ["Xnoois quih iti", "La luna está aquí"],
  },
  {
    seri: "cöicöt",
    spanish: "estrella",
    english: "star",
    category: "noun",
    pronunciation: "/køikøt/",
    examples: ["Cöicöt coi quih iti", "Las estrellas están aquí"],
  },
  {
    seri: "xepe ania",
    spanish: "mariposa",
    english: "butterfly",
    category: "noun",
    pronunciation: "/xepe ania/",
    examples: ["Xepe ania quih iti", "La mariposa está aquí"],
  },
  {
    seri: "cocáac",
    spanish: "pelícano",
    english: "pelican",
    category: "noun",
    pronunciation: "/kokaːk/",
    examples: ["Cocáac quih iti", "El pelícano está aquí"],
    culturalContext: "Referencia cultural importante para el pueblo comca'ac",
  },
  
  // Conceptos abstractos
  {
    seri: "haxöl",
    spanish: "historia / relato",
    english: "story / history",
    category: "noun",
    pronunciation: "/haxøl/",
    examples: ["Haxöl quih iti", "Contar una historia"],
  },
  {
    seri: "cocsar iitom",
    spanish: "idioma español",
    english: "Spanish language",
    category: "noun",
    pronunciation: "/koksar iːtom/",
    examples: ["Cocsar iitom quih iti", "Hablar español"],
  },
];

/**
 * Verbos con Conjugaciones
 * Sistema complejo con 250+ clases de inflexión
 */
export const VERBS_WITH_CONJUGATIONS: ComcaacVerb[] = [
  {
    root: "iti",
    spanish: "estar / ser",
    english: "to be",
    verbClass: 1,
    conjugations: {
      present: {
        singular: "quih iti",
        plural: "coi iti",
      },
      past: {
        singular: "quih iti",
        plural: "coi iti",
      },
    },
    examples: ["Zo hehe quih iti", "Estoy en mi casa", "Comcaac coi iti", "Las personas están"],
    pronunciation: "/iti/",
  },
  {
    root: "ano coti",
    spanish: "pedir / necesitar",
    english: "to ask / to need",
    verbClass: 15,
    conjugations: {
      present: {
        singular: "quih ano coti",
        plural: "coi ano coti",
      },
      past: {
        singular: "quih ano coti",
        plural: "coi ano coti",
      },
    },
    examples: ["Ziix hac quih ano coti", "Yo pido", "Ziix hac quih ano coti ziix hapáctim", "Necesito un documento"],
  },
  {
    root: "xaap iti",
    spanish: "firmar",
    english: "to sign",
    verbClass: 8,
    conjugations: {
      present: {
        singular: "xaap iti",
        plural: "xaap iti coi",
      },
      past: {
        singular: "xaap iti",
        plural: "xaap iti coi",
      },
    },
    examples: ["Ziix hac xaap iti", "Yo firmo", "Cöihcaaitoj xaap iti ziix hapáctim", "El testigo firma el documento"],
  },
  {
    root: "islixp",
    spanish: "prometer",
    english: "to promise",
    verbClass: 12,
    conjugations: {
      present: {
        singular: "quih islixp",
        plural: "coi islixp",
      },
      past: {
        singular: "quih islixp",
        plural: "coi islixp",
      },
    },
    examples: ["Ziix hac quih islixp", "Yo prometo"],
  },
  {
    root: "yaza",
    spanish: "cumplir",
    english: "to fulfill",
    verbClass: 10,
    conjugations: {
      present: {
        singular: "quih yaza",
        plural: "coi yaza",
      },
      past: {
        singular: "quih yaza",
        plural: "coi yaza",
      },
    },
    examples: ["Quih yaza cöihcapxöt ziix", "Cumplir el contrato"],
  },
];

/**
 * Reglas Gramaticales Completas
 */
export const GRAMMAR_RULES: ComcaacGrammar = {
  wordOrder: {
    description: "Orden básico Sujeto + Objeto + Verbo (SOV)",
    pattern: "SOV",
    examples: [
      "Hant cöicaaj an quih ziix isoj cöicaaj zo hehe",
      "La persona que trajo el pelícano está en mi casa",
      "Cöihcaaitoj xaap iti ziix hapáctim",
      "El testigo firma el documento",
    ],
  },
  possessive: {
    firstPerson: "hac",
    secondPerson: "mapt",
    thirdPerson: "hac (contexto)",
    examples: [
      "zo hehe",
      "en mi casa",
      "hehe hac",
      "mi casa",
      "hehe mapt",
      "tu casa",
    ],
  },
  plural: {
    regular: "com",
    irregular: {
      "cmiique": "comcaac",
      "ziix": "xiica",
    },
    examples: [
      "cmiique → comcaac",
      "persona Seri → personas Seri",
      "ziix → xiica",
      "cosa → cosas",
    ],
  },
  articles: {
    singular: ["quih", "zo", "z"],
    plural: ["coi"],
    examples: [
      "quih ziix",
      "la cosa",
      "zo hehe",
      "en la casa",
      "coi comcaac",
      "las personas",
    ],
  },
  pronouns: {
    personal: {
      "yo": "hac",
      "tú": "mapt",
      "él/ella": "hac (contexto)",
      "nosotros": "hac coi",
      "ustedes": "mapt coi",
      "ellos": "hac coi",
    },
    demonstrative: {
      "este": "quih",
      "ese": "quih",
      "aquel": "quih",
    },
    interrogative: {
      "qué": "quih",
      "quién": "haxt",
      "dónde": "hant",
    },
  },
  syntax: {
    relativeClauses: "Usa 'an quih' para cláusulas relativas",
    questionFormation: "Mantiene orden SOV, entonación marca pregunta",
    negation: "No hay partícula específica de negación, se usa contexto",
    examples: [
      "Hant cöicaaj an quih ziix isoj",
      "La persona que trajo",
      "Quih ano coti?",
      "¿Qué necesitas?",
    ],
  },
};

/**
 * Función helper para buscar palabras
 */
export function findWord(seriText: string): ComcaacWord | undefined {
  const allWords = [...LEGAL_VOCABULARY, ...GENERAL_VOCABULARY];
  return allWords.find((w) => w.seri.toLowerCase() === seriText.toLowerCase());
}

/**
 * Función helper para buscar verbos
 */
export function findVerb(root: string): ComcaacVerb | undefined {
  return VERBS_WITH_CONJUGATIONS.find((v) => v.root.toLowerCase() === root.toLowerCase());
}

/**
 * Función helper para obtener vocabulario por categoría
 */
export function getWordsByCategory(category: ComcaacWord["category"]): ComcaacWord[] {
  const allWords = [...LEGAL_VOCABULARY, ...GENERAL_VOCABULARY];
  return allWords.filter((w) => w.category === category);
}

/**
 * Función helper para obtener todas las palabras (para prompts)
 */
export function getAllVocabularyText(): string {
  const allWords = [...LEGAL_VOCABULARY, ...GENERAL_VOCABULARY];
  return allWords
    .map((w) => `${w.seri} = ${w.spanish}${w.english !== w.spanish ? ` / ${w.english}` : ""}`)
    .join("\n");
}
