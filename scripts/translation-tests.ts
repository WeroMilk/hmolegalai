/**
 * Suite de pruebas completa para el sistema de traducción
 * Prueba todas las direcciones y casos edge
 */

import { corpusTranslate } from "../lib/tri-translator";
import { validateBidirectionalTranslation, detectPolysemicContext, getPolysemicTranslation } from "../lib/translation-validation";
import type { Locale } from "../lib/translations";

type TriLang = Locale;

interface TestCase {
  name: string;
  fromLang: TriLang;
  toLang: TriLang;
  input: string;
  expectedOutput?: string;
  minScore?: number;
  shouldUseCorpus?: boolean;
}

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  actualOutput?: string;
  corpusScore?: number;
  bidirectionalValid?: boolean;
  error?: string;
}

/**
 * Casos de prueba exhaustivos
 */
const TEST_CASES: TestCase[] = [
  // ========== SALUDOS BÁSICOS ==========
  {
    name: "Hola → Hant (Español → Comca'ac)",
    fromLang: "es",
    toLang: "seri",
    input: "Hola",
    expectedOutput: "Hant",
    shouldUseCorpus: true,
  },
  {
    name: "Hant → Hola (Comca'ac → Español)",
    fromLang: "seri",
    toLang: "es",
    input: "Hant",
    expectedOutput: "Hola",
    shouldUseCorpus: true,
  },
  {
    name: "Hello → Hant (English → Comca'ac)",
    fromLang: "en",
    toLang: "seri",
    input: "Hello",
    expectedOutput: "Hant",
    shouldUseCorpus: true,
  },
  {
    name: "Hant → Hello (Comca'ac → English)",
    fromLang: "seri",
    toLang: "en",
    input: "Hant",
    expectedOutput: "Hello",
    shouldUseCorpus: true,
  },
  
  // ========== FRASES COMUNES ==========
  {
    name: "Gracias → Tahejöc",
    fromLang: "es",
    toLang: "seri",
    input: "Gracias",
    expectedOutput: "Tahejöc",
    shouldUseCorpus: true,
  },
  {
    name: "Tahejöc → Gracias",
    fromLang: "seri",
    toLang: "es",
    input: "Tahejöc",
    expectedOutput: "Gracias",
    shouldUseCorpus: true,
  },
  {
    name: "Sí → Hac",
    fromLang: "es",
    toLang: "seri",
    input: "Sí",
    expectedOutput: "Hac",
    shouldUseCorpus: true,
  },
  {
    name: "No → Ziix iti",
    fromLang: "es",
    toLang: "seri",
    input: "No",
    expectedOutput: "Ziix iti",
    shouldUseCorpus: true,
  },
  
  // ========== MENSAJES DE VALIDACIÓN ==========
  {
    name: "Te falta decirme el nombre → Comca'ac",
    fromLang: "es",
    toLang: "seri",
    input: "Te falta decirme el nombre de la persona que quieres demandar",
    minScore: 0.7,
  },
  {
    name: "You need to tell me → Comca'ac",
    fromLang: "en",
    toLang: "seri",
    input: "You need to tell me the name of the person you want to sue",
    minScore: 0.7,
  },
  
  // ========== PREGUNTAS COMUNES ==========
  {
    name: "¿Cómo estás? → Comca'ac",
    fromLang: "es",
    toLang: "seri",
    input: "¿Cómo estás?",
    minScore: 0.7,
  },
  {
    name: "¿Cuál es tu nombre? → Comca'ac",
    fromLang: "es",
    toLang: "seri",
    input: "¿Cuál es tu nombre?",
    minScore: 0.7,
  },
  {
    name: "¿Dónde está? → Comca'ac",
    fromLang: "es",
    toLang: "seri",
    input: "¿Dónde está?",
    minScore: 0.7,
  },
  
  // ========== TRADUCCIONES BIDIRECCIONALES CRÍTICAS ==========
  {
    name: "Bidireccional: Hola ↔ Hant",
    fromLang: "es",
    toLang: "seri",
    input: "Hola",
    expectedOutput: "Hant",
    shouldUseCorpus: true,
  },
  {
    name: "Bidireccional inverso: Hant ↔ Hola",
    fromLang: "seri",
    toLang: "es",
    input: "Hant",
    expectedOutput: "Hola",
    shouldUseCorpus: true,
  },
  
  // ========== CASOS EDGE ==========
  {
    name: "Hant con mayúsculas → Hola",
    fromLang: "seri",
    toLang: "es",
    input: "HANT",
    expectedOutput: "Hola",
    shouldUseCorpus: true,
  },
  {
    name: "Hola con puntuación → Hant",
    fromLang: "es",
    toLang: "seri",
    input: "Hola.",
    expectedOutput: "Hant",
    shouldUseCorpus: true,
  },
  {
    name: "Hant con espacios → Hola",
    fromLang: "seri",
    toLang: "es",
    input: "  Hant  ",
    expectedOutput: "Hola",
    shouldUseCorpus: true,
  },
  
  // ========== FRASES LEGALES ==========
  {
    name: "Nombre del quejoso → Comca'ac",
    fromLang: "es",
    toLang: "seri",
    input: "Nombre completo del quejoso",
    minScore: 0.6,
  },
  {
    name: "Autoridad responsable → Comca'ac",
    fromLang: "es",
    toLang: "seri",
    input: "Autoridad responsable",
    minScore: 0.6,
  },
];

/**
 * Ejecuta un caso de prueba individual
 */
async function runTestCase(testCase: TestCase): Promise<TestResult> {
  try {
    // 1. Probar traducción con corpus
    const corpusResult = corpusTranslate(testCase.input, testCase.fromLang, testCase.toLang, {
      minScore: testCase.minScore ?? 0.75,
      limit: 5,
    });
    
    const corpusScore = corpusResult.best?.score ?? 0;
    const actualOutput = corpusResult.best?.toText;
    
    // 2. Si hay output esperado, verificar
    let passed = false;
    if (testCase.expectedOutput) {
      const normalizedExpected = testCase.expectedOutput.toLowerCase().trim();
      const normalizedActual = actualOutput?.toLowerCase().trim() ?? "";
      passed = normalizedExpected === normalizedActual;
    } else {
      // Si no hay output esperado, solo verificar que haya resultado
      passed = !!actualOutput && actualOutput.length > 0;
    }
    
    // 3. Validación bidireccional si hay resultado
    let bidirectionalValid: boolean | undefined;
    if (actualOutput && testCase.expectedOutput) {
      const validation = validateBidirectionalTranslation(
        testCase.input,
        testCase.fromLang,
        testCase.toLang,
        actualOutput
      );
      bidirectionalValid = validation.isValid;
    }
    
    // 4. Verificar si debería usar corpus
    if (testCase.shouldUseCorpus && corpusScore < 0.85) {
      passed = false;
    }
    
    return {
      testCase,
      passed,
      actualOutput,
      corpusScore,
      bidirectionalValid,
    };
  } catch (error) {
    return {
      testCase,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Ejecuta todas las pruebas y genera reporte
 */
export async function runAllTranslationTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
  report: string;
}> {
  const results: TestResult[] = [];
  
  console.log("🧪 Iniciando pruebas del sistema de traducción...\n");
  
  for (const testCase of TEST_CASES) {
    const result = await runTestCase(testCase);
    results.push(result);
    
    const status = result.passed ? "✅" : "❌";
    console.log(`${status} ${testCase.name}`);
    if (result.actualOutput) {
      console.log(`   Input: "${testCase.input}"`);
      console.log(`   Output: "${result.actualOutput}"`);
      if (testCase.expectedOutput) {
        console.log(`   Expected: "${testCase.expectedOutput}"`);
      }
      if (result.corpusScore !== undefined) {
        console.log(`   Corpus Score: ${(result.corpusScore * 100).toFixed(1)}%`);
      }
      if (result.bidirectionalValid !== undefined) {
        console.log(`   Bidireccional: ${result.bidirectionalValid ? "✅" : "❌"}`);
      }
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log("");
  }
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  const report = `
═══════════════════════════════════════════════════════
  REPORTE DE PRUEBAS DEL TRADUCTOR
═══════════════════════════════════════════════════════

Total de pruebas: ${total}
✅ Pasadas: ${passed}
❌ Fallidas: ${failed}
📊 Tasa de éxito: ${((passed / total) * 100).toFixed(1)}%

${failed > 0 ? `
PRUEBAS FALLIDAS:
${results.filter(r => !r.passed).map((r, i) => `${i + 1}. ${r.testCase.name}\n   Input: "${r.testCase.input}"\n   ${r.error ? `Error: ${r.error}` : `Output: "${r.actualOutput || "N/A"}"`}`).join("\n")}
` : "🎉 ¡Todas las pruebas pasaron!"}
═══════════════════════════════════════════════════════
`;
  
  console.log(report);
  
  return {
    total,
    passed,
    failed,
    results,
    report,
  };
}

/**
 * Prueba específica de palabras polisémicas
 */
export function testPolysemicWords(): void {
  console.log("🔍 Probando palabras polisémicas...\n");
  
  const testWord = "Hant";
  const contexts = ["saludo", "ubicación", "cuerpo", "navegación", "tierra"];
  
  for (const context of contexts) {
    const detectedContext = detectPolysemicContext(testWord, context);
    const translation = getPolysemicTranslation(testWord, detectedContext, "es");
    
    console.log(`Contexto: ${context}`);
    console.log(`  Detectado: ${detectedContext || "null"}`);
    console.log(`  Traducción: ${translation || "null"}`);
    console.log("");
  }
}

/**
 * Prueba de consistencia bidireccional
 */
export function testBidirectionalConsistency(): void {
  console.log("🔄 Probando consistencia bidireccional...\n");
  
  const testPairs = [
    { es: "Hola", seri: "Hant" },
    { es: "Gracias", seri: "Tahejöc" },
    { es: "Sí", seri: "Hac" },
    { es: "No", seri: "Ziix iti" },
  ];
  
  for (const pair of testPairs) {
    // Español → Comca'ac
    const forward = corpusTranslate(pair.es, "es", "seri", { minScore: 0.85, limit: 1 });
    const forwardResult = forward.best?.toText.toLowerCase().trim();
    
    // Comca'ac → Español
    const backward = corpusTranslate(pair.seri, "seri", "es", { minScore: 0.85, limit: 1 });
    const backwardResult = backward.best?.toText.toLowerCase().trim();
    
    const forwardMatch = forwardResult === pair.seri.toLowerCase();
    const backwardMatch = backwardResult === pair.es.toLowerCase();
    
    console.log(`${pair.es} ↔ ${pair.seri}`);
    console.log(`  ${pair.es} → ${forwardResult || "N/A"} ${forwardMatch ? "✅" : "❌"}`);
    console.log(`  ${pair.seri} → ${backwardResult || "N/A"} ${backwardMatch ? "✅" : "❌"}`);
    console.log(`  Consistencia: ${forwardMatch && backwardMatch ? "✅" : "❌"}`);
    console.log("");
  }
}
