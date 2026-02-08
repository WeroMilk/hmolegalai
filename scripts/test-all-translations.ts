/**
 * Script exhaustivo para probar TODAS las traducciones
 * Ejecutar con: npx tsx scripts/test-all-translations.ts
 */

import { corpusTranslate } from "../lib/tri-translator";
import { translations } from "../lib/translations";

// Helper para obtener todas las traducciones
function getAllTranslations() {
  return {
    es: translations.es,
    en: translations.en,
    seri: translations.seri,
  };
}

interface TestResult {
  input: string;
  expected?: string;
  actual: string;
  fromLang: "es" | "en" | "seri";
  toLang: "es" | "en" | "seri";
  score?: number;
  isError: boolean;
  errorType: "wrong_translation" | "missing_translation" | "low_score" | "repetition" | "validation_triggered";
  errorMessage?: string;
}

const results: TestResult[] = [];

// Frases comunes para probar
const commonPhrases = {
  es: [
    // Saludos y cortesías
    "hola",
    "Hola",
    "HOLA",
    "hola, como estas?",
    "hola, quien eres?",
    "gracias",
    "Gracias",
    "muchas gracias",
    "de nada",
    "por favor",
    "disculpa",
    
    // Preguntas básicas
    "quien eres?",
    "QUIEN ERES?",
    "Quien eres?",
    "quien eres",
    "como estas?",
    "como te llamas?",
    "donde estas?",
    "que haces?",
    "que es esto?",
    "cual es tu nombre?",
    
    // Frases de validación (deben traducirse correctamente)
    "te falta decirme el nombre de la persona que quieres demandar",
    "te falta decirme a que persona quieres demandar",
    "te falta decirme a quien demandar",
    "te falta completar",
    
    // Frases legales comunes
    "quiero demandar",
    "necesito un contrato",
    "nombre de la persona",
    "persona que demanda",
    "persona demandada",
    
    // Frases que NO deben activar validación
    "quien es esa persona?",
    "que persona es?",
    "como se llama esa persona?",
    "donde esta esa persona?",
    
    // Palabras comunes
    "si",
    "no",
    "tal vez",
    "claro",
    "exacto",
  ],
  en: [
    "hello",
    "Hello",
    "HELLO",
    "hello, how are you?",
    "hello, who are you?",
    "thank you",
    "Thank you",
    "thanks",
    "you're welcome",
    "please",
    "sorry",
    "who are you?",
    "WHO ARE YOU?",
    "Who are you?",
    "who are you",
    "how are you?",
    "what's your name?",
    "where are you?",
    "what are you doing?",
    "what is this?",
  ],
  seri: [
    "Hant",
    "hant",
    "HANT",
    "Hant, haxt mapt hac?",
    "Tahejöc",
    "tahejöc",
    "Haxt mapt hac?",
    "haxt mapt hac?",
    "Haxt ziix hac mapt quih ano coti mapt hac ziix hac quih ano coti mapt quih itaal hac an",
  ],
};

async function testTranslation(
  input: string,
  fromLang: "es" | "en" | "seri",
  toLang: "es" | "en" | "seri",
  expected?: string
): Promise<TestResult> {
  try {
    // Primero intentar con corpus
    const corpus = corpusTranslate(input, fromLang, toLang, { minScore: 0.6, limit: 5 });
    
    let actual = "";
    let score = 0;
    
    if (corpus.best && corpus.best.score >= 0.7) {
      actual = corpus.best.toText;
      score = corpus.best.score;
    } else {
      // Si no hay match en corpus, simular llamada a API (sin hacerla realmente)
      // En producción esto usaría OpenAI
      actual = "[REQUIRES_API]";
      score = 0;
    }
    
    // Detectar errores comunes
    let isError = false;
    let errorType: TestResult["errorType"] = "wrong_translation";
    let errorMessage = "";
    
    // Error 1: Repeticiones obvias
    const words = actual.split(/\s+/);
    const seenPhrases = new Set<string>();
    let repetitionCount = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const twoWords = `${words[i]} ${words[i + 1]}`;
      if (seenPhrases.has(twoWords)) {
        repetitionCount++;
      }
      seenPhrases.add(twoWords);
    }
    if (repetitionCount > 2) {
      isError = true;
      errorType = "repetition";
      errorMessage = `Repeticiones detectadas: ${repetitionCount} frases repetidas`;
    }
    
    // Error 2: Traducción incorrecta de "QUIEN ERES?"
    if ((input.toLowerCase() === "quien eres?" || input.toLowerCase() === "quien eres" || 
         input.toLowerCase() === "who are you?" || input.toLowerCase() === "who are you") &&
        fromLang !== "seri" && toLang === "seri") {
      if (!actual.includes("Haxt mapt hac")) {
        isError = true;
        errorType = "wrong_translation";
        errorMessage = `"QUIEN ERES?" debe traducirse como "Haxt mapt hac?" pero obtuvo: "${actual}"`;
      }
    }
    
    // Error 3: Activación incorrecta de validación
    if ((input.toLowerCase().includes("quien eres") || input.toLowerCase().includes("who are you")) &&
        !input.toLowerCase().includes("te falta") && !input.toLowerCase().includes("you need to tell me") &&
        fromLang !== "seri" && toLang === "seri" &&
        actual.includes("mapt quih ano coti mapt hac")) {
      isError = true;
      errorType = "validation_triggered";
      errorMessage = `Pregunta normal activó incorrectamente lógica de validación: "${actual}"`;
    }
    
    // Error 4: Score muy bajo cuando debería haber match
    if (score < 0.7 && expected && corpus.best) {
      isError = true;
      errorType = "low_score";
      errorMessage = `Score muy bajo (${score}) para traducción esperada`;
    }
    
    // Error 5: Traducción no coincide con esperada
    if (expected && actual !== expected && actual !== "[REQUIRES_API]") {
      // Normalizar para comparar
      const normalizedActual = actual.toLowerCase().trim().replace(/[.,;:!?¿¡]/g, "");
      const normalizedExpected = expected.toLowerCase().trim().replace(/[.,;:!?¿¡]/g, "");
      if (normalizedActual !== normalizedExpected) {
        isError = true;
        errorType = "wrong_translation";
        errorMessage = `Esperado: "${expected}", Obtenido: "${actual}"`;
      }
    }
    
    return {
      input,
      expected,
      actual,
      fromLang,
      toLang,
      score,
      isError,
      errorType,
      errorMessage,
    };
  } catch (error) {
    return {
      input,
      expected,
      actual: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
      fromLang,
      toLang,
      isError: true,
      errorType: "missing_translation",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testAllCorpusTranslations() {
  console.log("📚 Probando todas las traducciones del corpus...\n");
  
  const allTranslations = getAllTranslations();
  let tested = 0;
  let errors = 0;
  
  // Probar español → comca'ac
  for (const [key, esText] of Object.entries(allTranslations.es)) {
    if (typeof esText !== "string" || esText.length === 0) continue;
    
    const seriText = allTranslations.seri[key];
    if (!seriText || typeof seriText !== "string") continue;
    
    tested++;
    const result = await testTranslation(esText, "es", "seri", seriText);
    results.push(result);
    
    if (result.isError) {
      errors++;
      console.log(`❌ [ES→SERI] ${key}:`);
      console.log(`   Input: "${esText}"`);
      console.log(`   Esperado: "${seriText}"`);
      console.log(`   Obtenido: "${result.actual}"`);
      console.log(`   Error: ${result.errorMessage || result.errorType}\n`);
    }
    
    // También probar inversa: comca'ac → español
    const reverseResult = await testTranslation(seriText, "seri", "es", esText);
    results.push(reverseResult);
    
    if (reverseResult.isError) {
      errors++;
      console.log(`❌ [SERI→ES] ${key}:`);
      console.log(`   Input: "${seriText}"`);
      console.log(`   Esperado: "${esText}"`);
      console.log(`   Obtenido: "${reverseResult.actual}"`);
      console.log(`   Error: ${reverseResult.errorMessage || reverseResult.errorType}\n`);
    }
  }
  
  console.log(`\n✅ Probadas ${tested} traducciones del corpus`);
  console.log(`❌ Encontrados ${errors} errores\n`);
}

async function testCommonPhrases() {
  console.log("💬 Probando frases comunes...\n");
  
  let tested = 0;
  let errors = 0;
  
  // Probar español → comca'ac
  for (const phrase of commonPhrases.es) {
    tested++;
    const result = await testTranslation(phrase, "es", "seri");
    results.push(result);
    
    if (result.isError) {
      errors++;
      console.log(`❌ [ES→SERI] "${phrase}":`);
      console.log(`   Obtenido: "${result.actual}"`);
      console.log(`   Error: ${result.errorMessage || result.errorType}\n`);
    }
  }
  
  // Probar comca'ac → español
  for (const phrase of commonPhrases.seri) {
    tested++;
    const result = await testTranslation(phrase, "seri", "es");
    results.push(result);
    
    if (result.isError) {
      errors++;
      console.log(`❌ [SERI→ES] "${phrase}":`);
      console.log(`   Obtenido: "${result.actual}"`);
      console.log(`   Error: ${result.errorMessage || result.errorType}\n`);
    }
  }
  
  console.log(`\n✅ Probadas ${tested} frases comunes`);
  console.log(`❌ Encontrados ${errors} errores\n`);
}

function generateReport() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  REPORTE FINAL");
  console.log("═══════════════════════════════════════════════════════\n");
  
  const total = results.length;
  const errors = results.filter(r => r.isError);
  const byType = errors.reduce((acc, r) => {
    acc[r.errorType] = (acc[r.errorType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`Total de pruebas: ${total}`);
  console.log(`Errores encontrados: ${errors.length}`);
  console.log(`Tasa de éxito: ${((total - errors.length) / total * 100).toFixed(2)}%\n`);
  
  console.log("Errores por tipo:");
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }
  
  console.log("\n═══════════════════════════════════════════════════════\n");
  
  // Generar archivo de reporte
  const reportContent = JSON.stringify({
    timestamp: new Date().toISOString(),
    total,
    errors: errors.length,
    successRate: ((total - errors.length) / total * 100).toFixed(2),
    errorsByType: byType,
    errorDetails: errors.map(e => ({
      input: e.input,
      expected: e.expected,
      actual: e.actual,
      fromLang: e.fromLang,
      toLang: e.toLang,
      errorType: e.errorType,
      errorMessage: e.errorMessage,
    })),
  }, null, 2);
  
  // En un entorno real, escribiríamos esto a un archivo
  // fs.writeFileSync('translation-test-report.json', reportContent);
  
  return errors;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  SISTEMA EXHAUSTIVO DE PRUEBAS DE TRADUCCIÓN");
  console.log("═══════════════════════════════════════════════════════\n");
  
  await testAllCorpusTranslations();
  await testCommonPhrases();
  
  const errors = generateReport();
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Se encontraron ${errors.length} errores que requieren corrección.`);
    console.log("Revisa los detalles arriba para corregir las traducciones.\n");
    process.exit(1);
  } else {
    console.log("\n✅ Todas las pruebas pasaron correctamente!\n");
    process.exit(0);
  }
}

main().catch(console.error);
