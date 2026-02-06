/**
 * Variaciones Dialectales de Comca'ac (Cmiique Iitom)
 * 
 * El pueblo comca'ac habita principalmente en:
 * - El Desemboque del Río San Ignacio
 * - Punta Chueca
 * - Tradicionalmente en la Isla Tiburón (Tahejöc)
 * 
 * Fuentes: Documentación SIL, estudios dialectológicos
 */

export interface DialectVariation {
  region: string;
  community: string;
  variations: {
    word: string;
    standard: string;
    dialect: string;
    context?: string;
  }[];
  grammaticalDifferences?: {
    feature: string;
    standard: string;
    dialect: string;
    examples: string[];
  }[];
  notes?: string;
}

/**
 * Variaciones por Comunidad
 */
export const DIALECT_VARIATIONS: DialectVariation[] = [
  {
    region: "El Desemboque del Río San Ignacio",
    community: "Desemboque",
    variations: [
      {
        word: "casa",
        standard: "hehe",
        dialect: "hehe",
        context: "Mantiene forma estándar",
      },
      // Agregar más variaciones según documentación disponible
    ],
    notes: "Comunidad costera principal, mantiene formas estándar mayormente",
  },
  {
    region: "Punta Chueca",
    community: "Punta Chueca",
    variations: [
      {
        word: "casa",
        standard: "hehe",
        dialect: "hehe",
        context: "Mantiene forma estándar",
      },
    ],
    notes: "Segunda comunidad principal, variaciones menores",
  },
  {
    region: "Isla Tiburón (Tahejöc)",
    community: "Tradicional",
    variations: [
      {
        word: "tierra",
        standard: "hant iiha",
        dialect: "hant iiha",
        context: "Forma tradicional mantenida",
      },
    ],
    notes: "Territorio tradicional, algunas formas arcaicas pueden persistir",
  },
];

/**
 * Variaciones Generacionales
 * Diferencias entre hablantes mayores y jóvenes
 */
export const GENERATIONAL_VARIATIONS = {
  older: {
    description: "Hablantes mayores (60+ años)",
    characteristics: [
      "Mantienen formas tradicionales",
      "Vocabulario más extenso",
      "Pronunciación más conservadora",
    ],
    examples: [],
  },
  middle: {
    description: "Hablantes de mediana edad (30-60 años)",
    characteristics: [
      "Formas estándar modernas",
      "Influencia del español",
      "Uso activo del idioma",
    ],
    examples: [],
  },
  younger: {
    description: "Hablantes jóvenes (menos de 30 años)",
    characteristics: [
      "Mayor influencia del español",
      "Algunas simplificaciones",
      "Uso más limitado del vocabulario tradicional",
    ],
    examples: [],
  },
};

/**
 * Variaciones por Dominio de Uso
 * Diferencias según contexto (legal, cotidiano, ceremonial)
 */
export const DOMAIN_VARIATIONS = {
  legal: {
    description: "Lenguaje legal y formal",
    characteristics: [
      "Vocabulario específico legal",
      "Estructuras formales",
      "Precisión terminológica",
    ],
    examples: [
      "cöihcapxöt (ley)",
      "hast cöpaac (juez)",
      "cöihcaaitoj (testigo)",
    ],
  },
  everyday: {
    description: "Lenguaje cotidiano",
    characteristics: [
      "Formas coloquiales",
      "Simplificaciones",
      "Préstamos del español",
    ],
    examples: [
      "hamiigo (amigo - préstamo del español)",
    ],
  },
  ceremonial: {
    description: "Lenguaje ceremonial y tradicional",
    characteristics: [
      "Formas arcaicas",
      "Vocabulario cultural específico",
      "Estructuras rituales",
    ],
    examples: [],
  },
};

/**
 * Preferencias Gramaticales por Región
 */
export const GRAMMATICAL_PREFERENCES = {
  wordOrder: {
    standard: "SOV (Sujeto + Objeto + Verbo)",
    variations: [
      {
        region: "Todas",
        preference: "SOV mantenido consistentemente",
        examples: ["Cöihcaaitoj xaap iti ziix hapáctim"],
      },
    ],
  },
  plural: {
    standard: "Prefijo 'com' o formas irregulares",
    variations: [
      {
        region: "Todas",
        preference: "Mantiene sistema estándar",
        examples: ["cmiique → comcaac", "ziix → xiica"],
      },
    ],
  },
  possessive: {
    standard: "hac (mi), mapt (tu)",
    variations: [
      {
        region: "Todas",
        preference: "Sistema consistente",
        examples: ["zo hehe (en mi casa)", "hehe mapt (tu casa)"],
      },
    ],
  },
};

/**
 * Función helper para detectar variación dialectal
 */
export function detectDialect(text: string): {
  likelyDialect: string;
  confidence: "high" | "medium" | "low";
  indicators: string[];
} {
  const indicators: string[] = [];
  let likelyDialect = "standard";
  let confidence: "high" | "medium" | "low" = "low";
  
  // Análisis básico - expandir con más patrones
  if (text.includes("hehe")) {
    indicators.push("Uso de forma estándar 'hehe'");
  }
  
  return {
    likelyDialect,
    confidence,
    indicators,
  };
}

/**
 * Función helper para normalizar a forma estándar
 */
export function normalizeToStandard(text: string, dialect?: string): string {
  // Por ahora retorna el texto sin cambios
  // Expandir con reglas de normalización específicas
  return text;
}

/**
 * Función helper para obtener variaciones de una palabra
 */
export function getDialectVariations(word: string): string[] {
  const variations: string[] = [];
  
  DIALECT_VARIATIONS.forEach((dialect) => {
    dialect.variations.forEach((variation) => {
      if (variation.standard.toLowerCase() === word.toLowerCase()) {
        variations.push(variation.dialect);
      } else if (variation.dialect.toLowerCase() === word.toLowerCase()) {
        variations.push(variation.standard);
      }
    });
  });
  
  return variations.length > 0 ? variations : [word];
}
