/**
 * Script para ejecutar pruebas del traductor
 * Ejecutar con: npx tsx scripts/test-translator.ts
 */

import { runAllTranslationTests, testPolysemicWords, testBidirectionalConsistency } from "../lib/translation-tests";

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  SISTEMA DE PRUEBAS DEL TRADUCTOR");
  console.log("═══════════════════════════════════════════════════════\n");
  
  // Prueba 1: Palabras polisémicas
  testPolysemicWords();
  
  // Prueba 2: Consistencia bidireccional
  testBidirectionalConsistency();
  
  // Prueba 3: Todas las pruebas
  await runAllTranslationTests();
}

main().catch(console.error);
