/**
 * Validador y Corrector de Texto Comca'ac
 * 
 * Proporciona validación de ortografía, verificación gramatical
 * y sugerencias de corrección para texto en comca'ac
 */

import { findWord, GRAMMAR_RULES, LEGAL_VOCABULARY, GENERAL_VOCABULARY } from "@/lib/comcaac-knowledge-base";
import { validatePhoneticSpelling } from "@/lib/comcaac-phonetics";
import { normalizeToStandard } from "@/lib/comcaac-dialects";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  suggestions: string[];
  correctedText?: string;
}

export interface ValidationError {
  type: "spelling" | "grammar" | "vocabulary" | "phonetic" | "wordOrder";
  word?: string;
  position?: number;
  message: string;
  suggestion?: string;
  severity: "error" | "warning" | "info";
}

/**
 * Valida texto completo en comca'ac
 */
export function validateComcaacText(text: string): ValidationResult {
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  let correctedText = text;

  // Validar cada palabra
  words.forEach((word, index) => {
    // Validación fonética
    const phoneticValidation = validatePhoneticSpelling(word);
    if (!phoneticValidation.valid) {
      errors.push({
        type: "phonetic",
        word,
        position: index,
        message: `Problemas fonéticos en "${word}": ${phoneticValidation.issues.join(", ")}`,
        suggestion: phoneticValidation.suggestions?.[0],
        severity: "warning",
      });
      if (phoneticValidation.suggestions && phoneticValidation.suggestions.length > 0) {
        correctedText = correctedText.replace(word, phoneticValidation.suggestions[0]);
      }
    }

    // Validación de vocabulario
    const foundWord = findWord(word);
    if (!foundWord) {
      // Verificar si es una palabra común que debería estar en el diccionario
      const isCommonPattern = checkCommonPatterns(word);
      if (!isCommonPattern) {
        errors.push({
          type: "vocabulary",
          word,
          position: index,
          message: `Palabra "${word}" no encontrada en vocabulario base`,
          severity: "warning",
        });
      }
    }

    // Validación de ortografía específica
    const spellingErrors = validateSpelling(word);
    if (spellingErrors.length > 0) {
      errors.push(...spellingErrors.map((err) => ({
        ...err,
        word,
        position: index,
      })));
    }
  });

  // Validación gramatical global
  const grammarErrors = validateGrammar(text, words);
  errors.push(...grammarErrors);

  // Validación de orden de palabras
  const wordOrderErrors = validateWordOrder(words);
  errors.push(...wordOrderErrors);

  // Generar sugerencias
  if (errors.length > 0) {
    const errorCount = errors.filter((e) => e.severity === "error").length;
    const warningCount = errors.filter((e) => e.severity === "warning").length;
    
    if (errorCount > 0) {
      suggestions.push(`Se encontraron ${errorCount} error(es) que requieren corrección`);
    }
    if (warningCount > 0) {
      suggestions.push(`Se encontraron ${warningCount} advertencia(s) que podrían mejorarse`);
    }
  } else {
    suggestions.push("El texto parece estar bien formado");
  }

  return {
    valid: errors.filter((e) => e.severity === "error").length === 0,
    errors,
    suggestions,
    correctedText: errors.length > 0 ? correctedText : undefined,
  };
}

/**
 * Valida ortografía específica de comca'ac
 */
function validateSpelling(word: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validar uso de 'c' vs 'qu'
  if (word.match(/c[ei]/i)) {
    errors.push({
      type: "spelling",
      message: "Usar 'qu' antes de e, i en lugar de 'c'",
      suggestion: word.replace(/c([ei])/gi, "qu$1"),
      severity: "error",
    });
  }

  // Validar vocales largas (no más de 2 vocales seguidas)
  if (word.match(/[aeiouö]{3,}/i)) {
    errors.push({
      type: "spelling",
      message: "Vocales largas se indican con duplicación (aa, ii, oo), no triplicación",
      severity: "warning",
    });
  }

  // Validar caracteres válidos en comca'ac
  const validChars = /^[a-zöA-ZÖ\s]+$/;
  if (!validChars.test(word)) {
    errors.push({
      type: "spelling",
      message: "Caracteres no válidos en comca'ac",
      severity: "error",
    });
  }

  return errors;
}

/**
 * Valida gramática
 */
function validateGrammar(text: string, words: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Verificar uso correcto de artículos
  const articles = words.filter((w) => ["quih", "coi", "zo", "z"].includes(w.toLowerCase()));
  if (articles.length > 0) {
    // Verificar que los artículos estén en posiciones apropiadas
    articles.forEach((article, index) => {
      const wordIndex = words.indexOf(article);
      if (wordIndex > 0) {
        const prevWord = words[wordIndex - 1];
        // Los artículos generalmente preceden a sustantivos
        // Esta es una validación básica, expandir según necesidad
      }
    });
  }

  // Verificar plurales irregulares
  const irregularPlurals = {
    "cmiique": "comcaac",
    "ziix": "xiica",
  };
  
  Object.entries(irregularPlurals).forEach(([singular, plural]) => {
    if (words.includes(singular) && words.includes(plural)) {
      errors.push({
        type: "grammar",
        message: `No uses "${singular}" y "${plural}" en el mismo texto a menos que sea intencional`,
        severity: "info",
      });
    }
  });

  return errors;
}

/**
 * Valida orden de palabras (SOV)
 */
function validateWordOrder(words: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Buscar sujetos comunes
  const subjects = ["haxt", "cmiique", "comcaac", "hast", "cöihcaaitoj"];
  const subjectIndex = words.findIndex((w) => subjects.includes(w.toLowerCase()));
  
  // Buscar verbos comunes
  const verbIndicators = words.filter((w) => 
    w.includes("iti") || 
    w.includes("quih") || 
    w.includes("ano") ||
    w.includes("xaap")
  );
  
  if (subjectIndex >= 0 && verbIndicators.length > 0) {
    const verbIndex = words.findIndex((w) => 
      w.includes("iti") || 
      w.includes("quih") || 
      w.includes("ano") ||
      w.includes("xaap")
    );
    
    if (verbIndex < subjectIndex) {
      errors.push({
        type: "wordOrder",
        message: "El orden debería ser Sujeto + Objeto + Verbo (SOV). Verifica la posición del verbo",
        severity: "warning",
      });
    }
  }

  return errors;
}

/**
 * Verifica si una palabra sigue patrones comunes aunque no esté en el diccionario
 */
function checkCommonPatterns(word: string): boolean {
  // Patrones comunes en comca'ac
  const commonPatterns = [
    /^[a-z]+$/i, // Solo letras
    /quih/, // Artículo común
    /hac|mapt/, // Posesivos comunes
    /zo|z$/, // Artículos/preposiciones
    /coi/, // Plural
  ];

  return commonPatterns.some((pattern) => pattern.test(word));
}

/**
 * Corrige texto automáticamente aplicando correcciones sugeridas
 */
export function autoCorrect(text: string): string {
  const validation = validateComcaacText(text);
  let corrected = text;

  // Aplicar correcciones de errores
  validation.errors.forEach((error) => {
    if (error.suggestion && error.word) {
      corrected = corrected.replace(error.word, error.suggestion);
    }
  });

  // Normalizar a forma estándar
  corrected = normalizeToStandard(corrected);

  return corrected;
}

/**
 * Obtiene sugerencias de corrección para una palabra específica
 */
export function getSuggestions(word: string): string[] {
  const suggestions: string[] = [];
  
  // Buscar palabra en vocabulario
  const foundWord = findWord(word);
  if (foundWord) {
    return []; // Palabra válida, no necesita corrección
  }

  // Validación fonética
  const phoneticValidation = validatePhoneticSpelling(word);
  if (phoneticValidation.suggestions) {
    suggestions.push(...phoneticValidation.suggestions);
  }

  // Buscar palabras similares
  const allWords = [...LEGAL_VOCABULARY, ...GENERAL_VOCABULARY];
  const similarWords = allWords
    .filter((w) => {
      const similarity = calculateSimilarity(word.toLowerCase(), w.seri.toLowerCase());
      return similarity > 0.7;
    })
    .map((w) => w.seri)
    .slice(0, 3);
  
  suggestions.push(...similarWords);

  return suggestions;
}

/**
 * Calcula similitud entre dos palabras (Levenshtein simplificado)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Distancia de Levenshtein
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
