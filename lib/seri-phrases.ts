/**
 * Frases y vocabulario legal en Seri (cmiique iitom) para el teclado basado en iconos.
 * Fuente: AGENT_PROMPT_SERI_LEGAL.md y diccionario Seri-Español-Inglés (COMCAAC).
 * Diseñado para usuarios que no leen ni escriben; cada frase tiene icono y etiqueta.
 */

import type { TranslationKey } from "./translations";

export type SeriPhraseCategory =
  | "situacion" // Mi situación
  | "autoridad" // Autoridad, juez, policía
  | "documento" // Documento, firma
  | "ayuda" // Necesito ayuda, abogado
  | "justicia" // Derecho, justicia
  | "accion"; // Demandar, prometer, etc.

export interface SeriPhrase {
  id: string;
  seri: string;
  label: string; // fallback español
  labelKey: TranslationKey; // clave para i18n (seri_phrase_xxx)
  icon: string; // Nombre del icono Lucide
  category: SeriPhraseCategory;
}

/** Frases ordenadas por categoría para el teclado basado en iconos */
export const SERI_PHRASES: SeriPhrase[] = [
  // --- SITUACIÓN ---
  { id: "sit-1", seri: "Ziix hac", label: "Mi situación", labelKey: "seri_phrase_sit_1", icon: "User", category: "situacion" },
  { id: "sit-2", seri: "Ziix hac quih ano coti", label: "Quiero demandar", labelKey: "seri_phrase_sit_2", icon: "AlertCircle", category: "situacion" },
  { id: "sit-3", seri: "Hant ihiip hac", label: "Tengo un problema", labelKey: "seri_phrase_sit_3", icon: "AlertTriangle", category: "situacion" },
  { id: "sit-4", seri: "Haxt quih anxö iti", label: "Alguien me hizo daño", labelKey: "seri_phrase_sit_4", icon: "HeartCrack", category: "situacion" },

  // --- AUTORIDAD ---
  { id: "aut-1", seri: "Hast", label: "Autoridad", labelKey: "seri_phrase_aut_1", icon: "Shield", category: "autoridad" },
  { id: "aut-2", seri: "Hast cöpaac", label: "Juez", labelKey: "seri_phrase_aut_2", icon: "Scale", category: "autoridad" },
  { id: "aut-3", seri: "Ziix quixaaza", label: "Policía / soldado", labelKey: "seri_phrase_aut_3", icon: "ShieldCheck", category: "autoridad" },
  { id: "aut-4", seri: "Haxt", label: "Persona", labelKey: "seri_phrase_aut_4", icon: "Users", category: "autoridad" },

  // --- DOCUMENTO ---
  { id: "doc-1", seri: "Ziix hapáctim", label: "Documento", labelKey: "seri_phrase_doc_1", icon: "FileText", category: "documento" },
  { id: "doc-2", seri: "Xaap iti", label: "Firmar", labelKey: "seri_phrase_doc_2", icon: "PenTool", category: "documento" },
  { id: "doc-3", seri: "Ziix hac xaap iti", label: "Yo firmo", labelKey: "seri_phrase_doc_3", icon: "Edit3", category: "documento" },
  { id: "doc-4", seri: "Cöihcapxöt ziix", label: "Contrato", labelKey: "seri_phrase_doc_4", icon: "FileSignature", category: "documento" },

  // --- AYUDA ---
  { id: "ayu-1", seri: "Haxt quih ooca", label: "Abogado", labelKey: "seri_phrase_ayu_1", icon: "Briefcase", category: "ayuda" },
  { id: "ayu-2", seri: "Quih ano coti", label: "Pedir / demandar", labelKey: "seri_phrase_ayu_2", icon: "HandHelping", category: "ayuda" },
  { id: "ayu-3", seri: "Ziix hac quih ano coti ziix hapáctim", label: "Quiero un documento", labelKey: "seri_phrase_ayu_3", icon: "FilePlus", category: "ayuda" },

  // --- JUSTICIA ---
  { id: "jus-1", seri: "Quih iti capxöt", label: "Justicia", labelKey: "seri_phrase_jus_1", icon: "Scale", category: "justicia" },
  { id: "jus-2", seri: "Cöihyáax", label: "Derecho", labelKey: "seri_phrase_jus_2", icon: "Gavel", category: "justicia" },
  { id: "jus-3", seri: "Cöihcapxöt", label: "Ley", labelKey: "seri_phrase_jus_3", icon: "BookOpen", category: "justicia" },
  { id: "jus-4", seri: "Hapáctim", label: "Verdad", labelKey: "seri_phrase_jus_4", icon: "CheckCircle", category: "justicia" },

  // --- ACCIÓN ---
  { id: "acc-1", seri: "Quih yaza", label: "Cumplir", labelKey: "seri_phrase_acc_1", icon: "Check", category: "accion" },
  { id: "acc-2", seri: "Quih islixp", label: "Prometer", labelKey: "seri_phrase_acc_2", icon: "MessageCircle", category: "accion" },
  { id: "acc-3", seri: "Cöihcaaitoj", label: "Testigo", labelKey: "seri_phrase_acc_3", icon: "Eye", category: "accion" },
  { id: "acc-4", seri: "Cöihcaaitoj xaap iti ziix hapáctim", label: "El testigo firma el documento", labelKey: "seri_phrase_acc_4", icon: "FileCheck", category: "accion" },
];

/** Categorías para el teclado (labelKey = clave i18n) */
export const SERI_CATEGORIES: { id: SeriPhraseCategory; labelKey: TranslationKey }[] = [
  { id: "situacion", labelKey: "seri_cat_situacion" },
  { id: "autoridad", labelKey: "seri_cat_autoridad" },
  { id: "documento", labelKey: "seri_cat_documento" },
  { id: "ayuda", labelKey: "seri_cat_ayuda" },
  { id: "justicia", labelKey: "seri_cat_justicia" },
  { id: "accion", labelKey: "seri_cat_accion" },
];

export function getPhrasesByCategory(category: SeriPhraseCategory): SeriPhrase[] {
  return SERI_PHRASES.filter((p) => p.category === category);
}
