import { NextRequest, NextResponse } from "next/server";
import { findWord, findVerb, GRAMMAR_RULES, VERBS_WITH_CONJUGATIONS, LEGAL_VOCABULARY, GENERAL_VOCABULARY } from "@/lib/comcaac-knowledge-base";
import { validatePhoneticSpelling, getIPA } from "@/lib/comcaac-phonetics";
import { detectDialect, getDialectVariations } from "@/lib/comcaac-dialects";

/**
 * Endpoint para análisis profundo de texto comca'ac
 * Proporciona análisis morfológico, identificación de conjugaciones,
 * detección de dialecto y validación gramatical
 */

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Se requiere texto en comca'ac para analizar" },
        { status: 400 }
      );
    }

    const analysis = analyzeComcaacText(text.trim());
    
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Error analyzing Comca'ac text:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al analizar texto",
      },
      { status: 500 }
    );
  }
}

interface WordAnalysis {
  word: string;
  found: boolean;
  meaning?: {
    spanish: string;
    english: string;
  };
  category?: string;
  pronunciation?: string;
  examples?: string[];
  phoneticValidation?: {
    valid: boolean;
    issues: string[];
    suggestions?: string[];
  };
}

interface VerbAnalysis {
  root?: string;
  found: boolean;
  conjugations?: {
    present: { singular: string; plural: string };
    past: { singular: string; plural: string };
  };
  verbClass?: number;
}

interface GrammarAnalysis {
  wordOrder: {
    detected: boolean;
    pattern: string;
    matches: boolean;
  };
  plural: {
    detected: boolean;
    form?: string;
    isIrregular?: boolean;
  };
  possessive: {
    detected: boolean;
    form?: string;
    person?: "first" | "second" | "third";
  };
  articles: {
    detected: boolean;
    articles?: string[];
  };
}

interface TextAnalysis {
  text: string;
  words: WordAnalysis[];
  verbs: VerbAnalysis[];
  grammar: GrammarAnalysis;
  dialect: {
    likelyDialect: string;
    confidence: "high" | "medium" | "low";
    indicators: string[];
  };
  overall: {
    vocabularyCoverage: number; // Porcentaje de palabras encontradas
    grammarCompliance: number; // Porcentaje de cumplimiento gramatical
    suggestions: string[];
  };
}

function analyzeComcaacText(text: string): TextAnalysis {
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  const wordAnalyses: WordAnalysis[] = [];
  const verbAnalyses: VerbAnalysis[] = [];
  const suggestions: string[] = [];

  // Analizar cada palabra
  for (const word of words) {
    const wordAnalysis: WordAnalysis = {
      word,
      found: false,
    };

    // Buscar en vocabulario
    const foundWord = findWord(word);
    if (foundWord) {
      wordAnalysis.found = true;
      wordAnalysis.meaning = {
        spanish: foundWord.spanish,
        english: foundWord.english,
      };
      wordAnalysis.category = foundWord.category;
      wordAnalysis.pronunciation = foundWord.pronunciation;
      wordAnalysis.examples = foundWord.examples;
    }

    // Validar fonética
    const phoneticValidation = validatePhoneticSpelling(word);
    wordAnalysis.phoneticValidation = phoneticValidation;
    if (!phoneticValidation.valid && phoneticValidation.suggestions) {
      suggestions.push(`Considerar ortografía alternativa para "${word}": ${phoneticValidation.suggestions.join(", ")}`);
    }

    // Obtener IPA si está disponible
    if (!wordAnalysis.pronunciation) {
      const ipa = getIPA(word);
      if (ipa) {
        wordAnalysis.pronunciation = ipa;
      }
    }

    wordAnalyses.push(wordAnalysis);
  }

  // Analizar verbos
  for (const word of words) {
    // Buscar raíz verbal común
    const commonVerbRoots = ["iti", "ano coti", "xaap iti", "islixp", "yaza"];
    for (const root of commonVerbRoots) {
      if (word.includes(root) || text.includes(root)) {
        const verb = findVerb(root);
        if (verb) {
          verbAnalyses.push({
            root: verb.root,
            found: true,
            conjugations: verb.conjugations,
            verbClass: verb.verbClass,
          });
          break;
        }
      }
    }
  }

  // Si no se encontraron verbos específicos, buscar patrones verbales
  if (verbAnalyses.length === 0) {
    // Buscar palabras que podrían ser verbos (contienen "quih" que es común en verbos)
    const potentialVerbs = words.filter((w) => w.includes("quih"));
    for (const potentialVerb of potentialVerbs) {
      verbAnalyses.push({
        found: false,
      });
    }
  }

  // Análisis gramatical
  const grammar: GrammarAnalysis = {
    wordOrder: {
      detected: false,
      pattern: GRAMMAR_RULES.wordOrder.pattern,
      matches: false,
    },
    plural: {
      detected: false,
    },
    possessive: {
      detected: false,
    },
    articles: {
      detected: false,
    },
  };

  // Detectar orden de palabras (buscar patrón SOV básico)
  const hasSubject = words.some((w) => ["haxt", "cmiique", "comcaac", "hast"].includes(w.toLowerCase()));
  const hasVerb = words.some((w) => w.includes("iti") || w.includes("quih"));
  if (hasSubject && hasVerb) {
    grammar.wordOrder.detected = true;
    // Verificar si sigue patrón SOV (simplificado)
    const subjectIndex = words.findIndex((w) => ["haxt", "cmiique", "comcaac", "hast"].includes(w.toLowerCase()));
    const verbIndex = words.findIndex((w) => w.includes("iti") || w.includes("quih"));
    grammar.wordOrder.matches = subjectIndex < verbIndex; // Sujeto antes del verbo
  }

  // Detectar plurales
  const pluralWords = words.filter((w) => 
    w.toLowerCase().startsWith("com") || 
    ["comcaac", "xiica"].includes(w.toLowerCase())
  );
  if (pluralWords.length > 0) {
    grammar.plural.detected = true;
    grammar.plural.form = pluralWords[0];
    grammar.plural.isIrregular = ["comcaac", "xiica"].includes(pluralWords[0].toLowerCase());
  }

  // Detectar posesivos
  const possessiveWords = words.filter((w) => 
    w.includes("hac") || w.includes("mapt") || w.includes("zo")
  );
  if (possessiveWords.length > 0) {
    grammar.possessive.detected = true;
    const possessiveWord = possessiveWords[0];
    if (possessiveWord.includes("hac") || possessiveWord.includes("zo")) {
      grammar.possessive.form = possessiveWord.includes("hac") ? "hac" : "zo";
      grammar.possessive.person = "first";
    } else if (possessiveWord.includes("mapt")) {
      grammar.possessive.form = "mapt";
      grammar.possessive.person = "second";
    }
  }

  // Detectar artículos
  const articles = words.filter((w) => 
    ["quih", "coi", "zo", "z"].includes(w.toLowerCase())
  );
  if (articles.length > 0) {
    grammar.articles.detected = true;
    grammar.articles.articles = articles;
  }

  // Detectar dialecto
  const dialect = detectDialect(text);

  // Calcular cobertura de vocabulario
  const foundWords = wordAnalyses.filter((w) => w.found).length;
  const vocabularyCoverage = words.length > 0 ? (foundWords / words.length) * 100 : 0;

  // Calcular cumplimiento gramatical
  let grammarScore = 0;
  if (grammar.wordOrder.detected) grammarScore += 25;
  if (grammar.plural.detected) grammarScore += 25;
  if (grammar.possessive.detected) grammarScore += 25;
  if (grammar.articles.detected) grammarScore += 25;
  const grammarCompliance = grammarScore;

  // Sugerencias adicionales
  if (vocabularyCoverage < 50) {
    suggestions.push("Muchas palabras no se encontraron en el vocabulario base. Considera verificar ortografía o usar formas estándar.");
  }
  if (!grammar.wordOrder.detected) {
    suggestions.push("No se detectó claramente el orden SOV. Verifica que el texto siga el patrón Sujeto + Objeto + Verbo.");
  }
  if (verbAnalyses.length === 0) {
    suggestions.push("No se identificaron verbos claramente. Verifica conjugaciones verbales.");
  }

  return {
    text,
    words: wordAnalyses,
    verbs: verbAnalyses,
    grammar,
    dialect,
    overall: {
      vocabularyCoverage: Math.round(vocabularyCoverage),
      grammarCompliance: Math.round(grammarCompliance),
      suggestions,
    },
  };
}
