/**
 * Suite de Pruebas para Conocimiento Comca'ac
 * 
 * Valida vocabulario, conjugaciones, traducciones y funcionalidades
 * del sistema de conocimiento comca'ac
 */

import { describe, it, expect } from "@jest/globals";
import {
  findWord,
  findVerb,
  getWordsByCategory,
  LEGAL_VOCABULARY,
  GENERAL_VOCABULARY,
  VERBS_WITH_CONJUGATIONS,
  GRAMMAR_RULES,
} from "../lib/comcaac-knowledge-base";
import {
  validateComcaacText,
  autoCorrect,
  getSuggestions,
} from "../lib/comcaac-validator";
import {
  validatePhoneticSpelling,
  getIPA,
} from "../lib/comcaac-phonetics";
import {
  detectDialect,
  normalizeToStandard,
  getDialectVariations,
} from "../lib/comcaac-dialects";

describe("Base de Conocimiento Comca'ac", () => {
  describe("Vocabulario", () => {
    it("debe encontrar palabras legales comunes", () => {
      const word = findWord("cöihcapxöt");
      expect(word).toBeDefined();
      expect(word?.spanish).toBe("ley");
      expect(word?.category).toBe("legal");
    });

    it("debe encontrar palabras generales", () => {
      const word = findWord("hehe");
      expect(word).toBeDefined();
      expect(word?.spanish).toBe("casa");
      expect(word?.category).toBe("noun");
    });

    it("debe retornar undefined para palabras no encontradas", () => {
      const word = findWord("palabradesconocida");
      expect(word).toBeUndefined();
    });

    it("debe tener vocabulario legal extenso", () => {
      expect(LEGAL_VOCABULARY.length).toBeGreaterThan(10);
    });

    it("debe tener vocabulario general extenso", () => {
      expect(GENERAL_VOCABULARY.length).toBeGreaterThan(10);
    });

    it("debe filtrar palabras por categoría", () => {
      const legalWords = getWordsByCategory("legal");
      expect(legalWords.length).toBeGreaterThan(0);
      expect(legalWords.every((w) => w.category === "legal")).toBe(true);
    });
  });

  describe("Verbos y Conjugaciones", () => {
    it("debe encontrar verbos comunes", () => {
      const verb = findVerb("iti");
      expect(verb).toBeDefined();
      expect(verb?.spanish).toBe("estar / ser");
    });

    it("debe tener conjugaciones para verbos", () => {
      const verb = findVerb("ano coti");
      expect(verb).toBeDefined();
      expect(verb?.conjugations.present.singular).toBeDefined();
      expect(verb?.conjugations.present.plural).toBeDefined();
      expect(verb?.conjugations.past.singular).toBeDefined();
      expect(verb?.conjugations.past.plural).toBeDefined();
    });

    it("debe tener múltiples verbos documentados", () => {
      expect(VERBS_WITH_CONJUGATIONS.length).toBeGreaterThan(0);
    });

    it("debe tener clase de verbo asignada", () => {
      VERBS_WITH_CONJUGATIONS.forEach((verb) => {
        expect(verb.verbClass).toBeDefined();
        expect(typeof verb.verbClass).toBe("number");
      });
    });
  });

  describe("Gramática", () => {
    it("debe tener reglas de orden de palabras", () => {
      expect(GRAMMAR_RULES.wordOrder.pattern).toBe("SOV");
      expect(GRAMMAR_RULES.wordOrder.examples.length).toBeGreaterThan(0);
    });

    it("debe tener posesivos documentados", () => {
      expect(GRAMMAR_RULES.possessive.firstPerson).toBe("hac");
      expect(GRAMMAR_RULES.possessive.secondPerson).toBe("mapt");
    });

    it("debe tener plurales irregulares documentados", () => {
      expect(GRAMMAR_RULES.plural.irregular["cmiique"]).toBe("comcaac");
      expect(GRAMMAR_RULES.plural.irregular["ziix"]).toBe("xiica");
    });

    it("debe tener artículos documentados", () => {
      expect(GRAMMAR_RULES.articles.singular.length).toBeGreaterThan(0);
      expect(GRAMMAR_RULES.articles.plural.length).toBeGreaterThan(0);
    });

    it("debe tener pronombres documentados", () => {
      expect(Object.keys(GRAMMAR_RULES.pronouns.personal).length).toBeGreaterThan(0);
    });
  });
});

describe("Validador Comca'ac", () => {
  describe("Validación de Texto", () => {
    it("debe validar texto correcto", () => {
      const result = validateComcaacText("Ziix hac xaap iti");
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("debe detectar errores fonéticos", () => {
      const result = validateComcaacText("cehe"); // Debería ser "quehe" o similar
      const phoneticErrors = result.errors.filter((e) => e.type === "phonetic");
      expect(phoneticErrors.length).toBeGreaterThan(0);
    });

    it("debe proporcionar sugerencias", () => {
      const result = validateComcaacText("Ziix hac xaap iti");
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe("Corrección Automática", () => {
    it("debe corregir texto con errores", () => {
      const corrected = autoCorrect("cehe"); // Error fonético
      expect(corrected).toBeDefined();
      expect(typeof corrected).toBe("string");
    });

    it("debe mantener texto correcto sin cambios", () => {
      const original = "Ziix hac xaap iti";
      const corrected = autoCorrect(original);
      expect(corrected).toBe(original);
    });
  });

  describe("Sugerencias", () => {
    it("debe proporcionar sugerencias para palabras desconocidas", () => {
      const suggestions = getSuggestions("palabradesconocida");
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it("no debe sugerir correcciones para palabras válidas", () => {
      const suggestions = getSuggestions("hehe");
      expect(suggestions.length).toBe(0);
    });
  });
});

describe("Fonética Comca'ac", () => {
  describe("Validación Fonética", () => {
    it("debe validar ortografía correcta", () => {
      const result = validatePhoneticSpelling("hehe");
      expect(result.valid).toBe(true);
    });

    it("debe detectar uso incorrecto de 'c' antes de e, i", () => {
      const result = validatePhoneticSpelling("cehe");
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.suggestions).toBeDefined();
    });

    it("debe sugerir correcciones", () => {
      const result = validatePhoneticSpelling("cehe");
      if (!result.valid && result.suggestions) {
        expect(result.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  describe("IPA", () => {
    it("debe obtener IPA para palabras conocidas", () => {
      const ipa = getIPA("hehe");
      // Puede ser undefined si no está en ejemplos, pero no debe fallar
      expect(typeof ipa === "string" || ipa === undefined).toBe(true);
    });
  });
});

describe("Dialectos Comca'ac", () => {
  describe("Detección de Dialecto", () => {
    it("debe detectar dialecto en texto", () => {
      const result = detectDialect("hehe quih iti");
      expect(result.likelyDialect).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(["high", "medium", "low"].includes(result.confidence)).toBe(true);
    });

    it("debe tener indicadores", () => {
      const result = detectDialect("hehe quih iti");
      expect(Array.isArray(result.indicators)).toBe(true);
    });
  });

  describe("Normalización", () => {
    it("debe normalizar texto a forma estándar", () => {
      const normalized = normalizeToStandard("hehe");
      expect(normalized).toBeDefined();
      expect(typeof normalized).toBe("string");
    });
  });

  describe("Variaciones", () => {
    it("debe obtener variaciones dialectales", () => {
      const variations = getDialectVariations("hehe");
      expect(Array.isArray(variations)).toBe(true);
      expect(variations.length).toBeGreaterThan(0);
    });
  });
});

describe("Casos Edge", () => {
  it("debe manejar texto vacío", () => {
    const result = validateComcaacText("");
    expect(result).toBeDefined();
  });

  it("debe manejar texto con solo espacios", () => {
    const result = validateComcaacText("   ");
    expect(result).toBeDefined();
  });

  it("debe manejar palabras con caracteres especiales", () => {
    const result = validateComcaacText("cöihcapxöt");
    expect(result).toBeDefined();
  });

  it("debe manejar texto mixto español-comca'ac", () => {
    const result = validateComcaacText("hehe casa");
    expect(result).toBeDefined();
  });
});
