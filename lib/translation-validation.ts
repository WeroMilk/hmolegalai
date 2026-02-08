/**
 * Sistema de validación bidireccional para traducciones
 * Asegura que las traducciones sean consistentes en ambas direcciones
 */

import { corpusTranslate } from "./tri-translator";
import type { Locale } from "./translations";

type TriLang = Locale;

/**
 * Valida que una traducción sea bidireccionalmente consistente
 * Ejemplo: Si "Hola" → "Hant", entonces "Hant" → "Hola"
 */
export function validateBidirectionalTranslation(
  text: string,
  fromLang: TriLang,
  toLang: TriLang,
  translation: string
): { isValid: boolean; confidence: number; reverseTranslation?: string } {
  // Intentar traducir de vuelta
  const reverse = corpusTranslate(translation, toLang, fromLang, {
    minScore: 0.85,
    limit: 1,
  });

  if (reverse.best) {
    const normalizedOriginal = text.trim().toLowerCase();
    const normalizedReverse = reverse.best.toText.trim().toLowerCase();
    
    // Si la traducción inversa coincide exactamente, es válida
    if (normalizedOriginal === normalizedReverse) {
      return {
        isValid: true,
        confidence: 1.0,
        reverseTranslation: reverse.best.toText,
      };
    }
    
    // Si la traducción inversa es similar (score alto), es probablemente válida
    if (reverse.best.score >= 0.9) {
      return {
        isValid: true,
        confidence: 0.9,
        reverseTranslation: reverse.best.toText,
      };
    }
  }

  return {
    isValid: false,
    confidence: 0.5,
  };
}

/**
 * Detecta el contexto de una palabra polisémica en comca'ac
 */
export function detectPolysemicContext(text: string, surroundingText?: string): string | null {
  const lowerText = text.toLowerCase().trim().replace(/[.,;:!?¿¡]/g, "");
  
  // Palabras polisémicas conocidas
  const polysemicMap: Record<string, { contexts: string[]; keywords: Record<string, string[]>; defaultContext: string }> = {
    hant: {
      contexts: ["saludo", "ubicación", "cuerpo", "navegación", "tierra"],
      keywords: {
        saludo: ["hola", "hello", "saludo", "greeting", "hi", "hey"],
        ubicación: ["aquí", "here", "dónde", "where", "lugar", "place", "ubicación", "location"],
        cuerpo: ["pie", "foot", "pies", "feet", "cuerpo", "body", "dedo", "toe"],
        navegación: ["inicio", "home", "principal", "main", "nav", "menú", "menu"],
        tierra: ["tierra", "land", "territorio", "territory", "propiedad", "property"],
      },
      defaultContext: "saludo", // Contexto por defecto cuando no hay información adicional
    },
  };

  if (!polysemicMap[lowerText]) return null;

  const wordInfo = polysemicMap[lowerText];
  const fullContext = ((surroundingText || "") + " " + text).toLowerCase()
    .replace(/[.,;:!?¿¡]/g, " ")
    .replace(/\s+/g, " ");

  // Buscar keywords en el contexto (orden de prioridad)
  const contextScores: Record<string, number> = {};
  for (const [context, keywords] of Object.entries(wordInfo.keywords)) {
    let score = 0;
    for (const keyword of keywords) {
      // Buscar palabra completa (no substring)
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      if (regex.test(fullContext)) {
        score += 2; // Match de palabra completa vale más
      } else if (fullContext.includes(keyword)) {
        score += 1; // Substring match vale menos
      }
    }
    if (score > 0) {
      contextScores[context] = score;
    }
  }

  // Si hay scores, retornar el contexto con mayor score
  if (Object.keys(contextScores).length > 0) {
    const bestContext = Object.entries(contextScores).sort((a, b) => b[1] - a[1])[0][0];
    return bestContext;
  }

  // Si no hay contexto, usar el contexto por defecto
  if (lowerText === "hant" && !surroundingText) {
    return wordInfo.defaultContext || "saludo";
  }

  return null;
}

/**
 * Obtiene la traducción correcta para una palabra polisémica según el contexto
 */
export function getPolysemicTranslation(
  word: string,
  context: string | null,
  toLang: TriLang
): string | null {
  const lowerWord = word.toLowerCase().trim();
  
  const translations: Record<string, Record<string, Record<TriLang, string>>> = {
    hant: {
      saludo: { es: "hola", en: "hello", seri: "Hant" },
      ubicación: { es: "aquí", en: "here", seri: "Hant" },
      cuerpo: { es: "pie", en: "foot", seri: "Hant" },
      navegación: { es: "inicio", en: "home", seri: "Hant" },
      tierra: { es: "tierra", en: "land", seri: "Hant" },
    },
  };

  if (!translations[lowerWord] || !context) return null;
  return translations[lowerWord][context]?.[toLang] || null;
}
