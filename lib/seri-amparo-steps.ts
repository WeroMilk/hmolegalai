/**
 * Pasos y opciones del cuestionario Seri para Demanda de Amparo.
 * Cada paso tiene iconos ilustrativos y claves i18n para las etiquetas.
 */

import type { TranslationKey } from "./translations";

export type AmparoStepId =
  | "quejoso"
  | "autoridad"
  | "acto"
  | "preceptos"
  | "hechos"
  | "conceptos"
  | "pretensiones"
  | "domicilio";

export interface AmparoOption {
  id: string;
  icon: string;
  labelKey: TranslationKey;
  /** Valor en español para el documento */
  valueEs: string;
  /** Valor en Seri (cmiique iitom) */
  valueSeri: string;
}

export interface AmparoTextInput {
  fieldKey: string;
  labelKey: TranslationKey;
  placeholderKey: TranslationKey;
}

export interface AmparoStep {
  id: AmparoStepId;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon: string;
  /** Campos de texto para este paso */
  textInputs?: AmparoTextInput[];
  /** Si permite múltiple selección de opciones */
  multiSelect?: boolean;
  options: AmparoOption[];
}

export interface AmparoQuestionnaireData {
  quejoso: { nombre: string; domicilio: string; curp?: string; telefono?: string };
  autoridad: { opcionIds: string[]; texto?: string };
  acto: { opcionIds: string[]; numeroExpediente?: string; fecha?: string };
  preceptos: { opcionIds: string[]; otros?: string };
  hechos: { opcionIds: string[]; relatoSeri?: string };
  conceptos: { opcionIds: string[]; otros?: string };
  pretensiones: { opcionIds: string[]; otros?: string };
  domicilio: { direccion: string; mismoQueQuejoso?: boolean };
}

export const AMPARO_STEPS: AmparoStep[] = [
  {
    id: "quejoso",
    titleKey: "amparo_q_quejoso_title",
    descKey: "amparo_q_quejoso_desc",
    icon: "User",
    textInputs: [
      { fieldKey: "nombre", labelKey: "amparo_q_quejoso_nombre", placeholderKey: "amparo_q_quejoso_nombre_ph" },
      { fieldKey: "domicilio", labelKey: "amparo_q_quejoso_domicilio", placeholderKey: "amparo_q_quejoso_domicilio_ph" },
    ],
    options: [],
  },
  {
    id: "autoridad",
    titleKey: "amparo_q_autoridad_title",
    descKey: "amparo_q_autoridad_desc",
    icon: "Landmark",
    textInputs: [
      { fieldKey: "texto", labelKey: "amparo_q_autoridad_nombre", placeholderKey: "amparo_q_autoridad_nombre_ph" },
    ],
    options: [
      { id: "aut-juez-dist", icon: "Scale", labelKey: "amparo_opt_juez_distrito", valueEs: "Juez de Distrito", valueSeri: "Hast cöpaac" },
      { id: "aut-trib-coleg", icon: "Building2", labelKey: "amparo_opt_tribunal_colegiado", valueEs: "Tribunal Colegiado de Circuito", valueSeri: "Hast cöpaac com" },
      { id: "aut-juzgado-local", icon: "Landmark", labelKey: "amparo_opt_juzgado_local", valueEs: "Juzgado local o estatal", valueSeri: "Hast ziix" },
      { id: "aut-admin", icon: "Building", labelKey: "amparo_opt_autoridad_admin", valueEs: "Autoridad administrativa (Presidencia, Ayuntamiento)", valueSeri: "Hast" },
      { id: "aut-otra", icon: "HelpCircle", labelKey: "amparo_opt_otra", valueEs: "Otra autoridad", valueSeri: "Hast ziix" },
    ],
  },
  {
    id: "acto",
    titleKey: "amparo_q_acto_title",
    descKey: "amparo_q_acto_desc",
    icon: "FileCheck",
    textInputs: [
      { fieldKey: "numeroExpediente", labelKey: "amparo_q_acto_expediente", placeholderKey: "amparo_q_acto_expediente_ph" },
      { fieldKey: "fecha", labelKey: "amparo_q_acto_fecha", placeholderKey: "amparo_q_acto_fecha_ph" },
    ],
    options: [
      { id: "acto-sentencia", icon: "Gavel", labelKey: "amparo_opt_sentencia", valueEs: "Sentencia o fallo del juez", valueSeri: "Ziix quih yaza hast cöpaac" },
      { id: "acto-laudo", icon: "Scale", labelKey: "amparo_opt_laudo", valueEs: "Laudo arbitral", valueSeri: "Ziix hapáctim" },
      { id: "acto-resolucion", icon: "FileText", labelKey: "amparo_opt_resolucion", valueEs: "Resolución administrativa", valueSeri: "Ziix hapáctim hast" },
      { id: "acto-negativa", icon: "XCircle", labelKey: "amparo_opt_negativa", valueEs: "Negativa de la autoridad", valueSeri: "Hast quih yoocz" },
      { id: "acto-otro", icon: "FileQuestion", labelKey: "amparo_opt_otro_acto", valueEs: "Otro acto", valueSeri: "Ziix ziix" },
    ],
  },
  {
    id: "preceptos",
    titleKey: "amparo_q_preceptos_title",
    descKey: "amparo_q_preceptos_desc",
    icon: "BookOpen",
    multiSelect: true,
    options: [
      { id: "art14", icon: "Equal", labelKey: "amparo_opt_art14", valueEs: "Artículo 14 (igualdad, legalidad)", valueSeri: "Cöihcapxöt 14" },
      { id: "art16", icon: "Shield", labelKey: "amparo_opt_art16", valueEs: "Artículo 16 (legalidad, domicilio)", valueSeri: "Cöihcapxöt 16" },
      { id: "art17", icon: "Scale", labelKey: "amparo_opt_art17", valueEs: "Artículo 17 (acceso a la justicia)", valueSeri: "Cöihcapxöt 17" },
      { id: "art1", icon: "Heart", labelKey: "amparo_opt_art1", valueEs: "Artículo 1 (derechos humanos)", valueSeri: "Cöihcapxöt 1" },
      { id: "art27", icon: "TreePine", labelKey: "amparo_opt_art27", valueEs: "Artículo 27 (propiedad, tierra)", valueSeri: "Cöihcapxöt 27" },
      { id: "art123", icon: "Briefcase", labelKey: "amparo_opt_art123", valueEs: "Artículo 123 (derechos laborales)", valueSeri: "Cöihcapxöt 123" },
      { id: "preceptos-otro", icon: "FileEdit", labelKey: "amparo_opt_otro_precepto", valueEs: "Otro artículo", valueSeri: "Cöihcapxöt ziix" },
    ],
  },
  {
    id: "hechos",
    titleKey: "amparo_q_hechos_title",
    descKey: "amparo_q_hechos_desc",
    icon: "ClipboardList",
    multiSelect: true,
    options: [
      { id: "h-problema", icon: "AlertTriangle", labelKey: "amparo_opt_hecho_problema", valueEs: "Tengo un problema con la autoridad", valueSeri: "Hant ihiip hac hast" },
      { id: "h-negaron", icon: "XCircle", labelKey: "amparo_opt_hecho_negaron", valueEs: "La autoridad me negó algo", valueSeri: "Hast quih yoocz hac" },
      { id: "h-fallo-contra", icon: "Scale", labelKey: "amparo_opt_hecho_fallo_contra", valueEs: "El juez falló en mi contra", valueSeri: "Hast cöpaac quih yaza hac" },
      { id: "h-desalojaron", icon: "Home", labelKey: "amparo_opt_hecho_desalojaron", valueEs: "Me desalojaron de mi casa o tierra", valueSeri: "Quih yoocz hac hant" },
      { id: "h-quitaron-tierra", icon: "TreePine", labelKey: "amparo_opt_hecho_quitaron_tierra", valueEs: "Me quitaron mi tierra o propiedad", valueSeri: "Quih yoocz hac hant" },
      { id: "h-multaron", icon: "Receipt", labelKey: "amparo_opt_hecho_multaron", valueEs: "Me multaron injustamente", valueSeri: "Quih islixp hac ziix" },
      { id: "h-detuvieron", icon: "Shield", labelKey: "amparo_opt_hecho_detuvieron", valueEs: "Me detuvieron sin razón", valueSeri: "Quih ano coti hac ziix" },
      { id: "h-sin-audiencia", icon: "Mic", labelKey: "amparo_opt_hecho_sin_audiencia", valueEs: "No me dieron audiencia o defensa", valueSeri: "Ziix iti quih ano coti hac" },
      { id: "h-otro", icon: "MessageSquare", labelKey: "amparo_opt_hecho_otro", valueEs: "Otro (describir)", valueSeri: "Ziix ziix" },
    ],
  },
  {
    id: "conceptos",
    titleKey: "amparo_q_conceptos_title",
    descKey: "amparo_q_conceptos_desc",
    icon: "Lightbulb",
    multiSelect: true,
    options: [
      { id: "c-falta-fund", icon: "FileX", labelKey: "amparo_opt_concepto_falta_fund", valueEs: "Falta de fundamentación", valueSeri: "Ziix iti hapáctim" },
      { id: "c-procedimiento", icon: "ListOrdered", labelKey: "amparo_opt_concepto_procedimiento", valueEs: "Procedimiento irregular", valueSeri: "Ziix iti quih yaza" },
      { id: "c-inconstitucional", icon: "Ban", labelKey: "amparo_opt_concepto_inconstitucional", valueEs: "Inconstitucional", valueSeri: "Cöihcapxöt iti" },
      { id: "c-incompetencia", icon: "UserX", labelKey: "amparo_opt_concepto_incompetencia", valueEs: "Incompetencia de la autoridad", valueSeri: "Hast ziix iti" },
      { id: "c-arbitrario", icon: "AlertOctagon", labelKey: "amparo_opt_concepto_arbitrario", valueEs: "Arbitrariedad", valueSeri: "Ziix iti hapáctim" },
      { id: "c-otro", icon: "MoreHorizontal", labelKey: "amparo_opt_concepto_otro", valueEs: "Otro", valueSeri: "Ziix ziix" },
    ],
  },
  {
    id: "pretensiones",
    titleKey: "amparo_q_pretensiones_title",
    descKey: "amparo_q_pretensiones_desc",
    icon: "Target",
    multiSelect: true,
    options: [
      { id: "p-nulidad", icon: "FileX", labelKey: "amparo_opt_pret_nulidad", valueEs: "Que anulen el acto (nulidad)", valueSeri: "Ziix quih yoocz quih ano coti" },
      { id: "p-reposicion", icon: "RotateCcw", labelKey: "amparo_opt_pret_reposicion", valueEs: "Que repongan las cosas como estaban", valueSeri: "Ziix quih yaza hac an" },
      { id: "p-razon", icon: "CheckCircle", labelKey: "amparo_opt_pret_razon", valueEs: "Que me den la razón", valueSeri: "Quih iti capxöt hac" },
      { id: "p-suspension", icon: "Pause", labelKey: "amparo_opt_pret_suspension", valueEs: "Que suspendan el acto mientras se resuelve", valueSeri: "Ziix quih yoocz ziix hac" },
      { id: "p-otro", icon: "MoreHorizontal", labelKey: "amparo_opt_pret_otro", valueEs: "Otro", valueSeri: "Ziix ziix" },
    ],
  },
  {
    id: "domicilio",
    titleKey: "amparo_q_domicilio_title",
    descKey: "amparo_q_domicilio_desc",
    icon: "MapPin",
    textInputs: [
      { fieldKey: "direccion", labelKey: "amparo_q_domicilio_direccion", placeholderKey: "amparo_q_domicilio_direccion_ph" },
    ],
    options: [
      { id: "dom-mismo", icon: "Copy", labelKey: "amparo_opt_domicilio_mismo", valueEs: "Es el mismo que mi domicilio arriba", valueSeri: "Ziix hac hant" },
    ],
  },
];

/** Mapeo id de opción -> valor en español para construir el prompt */
const OPTION_VALUE_ES: Record<string, string> = {};
for (const s of AMPARO_STEPS) {
  for (const o of s.options) {
    OPTION_VALUE_ES[o.id] = o.valueEs;
  }
}

/** Construye el texto en español para generar el documento a partir de los datos del cuestionario */
export function buildSpanishPromptFromAmparoData(data: AmparoQuestionnaireData): string {
  const lines: string[] = [];

  lines.push("IDENTIFICACIÓN DEL QUEJOSO:");
  lines.push(`- Nombre completo: ${data.quejoso.nombre || "(no indicado)"}`);
  lines.push(`- Domicilio: ${data.quejoso.domicilio || "(no indicado)"}`);

  lines.push("");
  lines.push("AUTORIDAD RESPONSABLE:");
  const autLabels = (data.autoridad.opcionIds || []).map((id) => OPTION_VALUE_ES[id] || id).join(", ");
  lines.push(`- Tipo: ${autLabels || "(no seleccionado)"}`);
  if (data.autoridad.texto) lines.push(`- Nombre del juzgado/tribunal: ${data.autoridad.texto}`);

  lines.push("");
  lines.push("ACTO RECLAMADO:");
  const actoLabels = (data.acto.opcionIds || []).map((id) => OPTION_VALUE_ES[id] || id).join(", ");
  lines.push(`- Tipo de acto: ${actoLabels || "(no seleccionado)"}`);
  if (data.acto.numeroExpediente) lines.push(`- Número de expediente: ${data.acto.numeroExpediente}`);
  if (data.acto.fecha) lines.push(`- Fecha: ${data.acto.fecha}`);

  lines.push("");
  lines.push("PRECEPTOS VIOLADOS:");
  const precLabels = (data.preceptos.opcionIds || []).map((id) => OPTION_VALUE_ES[id] || id).join(", ");
  lines.push(precLabels || "(no seleccionados)");
  if (data.preceptos.otros) lines.push(`Otros: ${data.preceptos.otros}`);

  lines.push("");
  lines.push("HECHOS:");
  const hechosLabels = (data.hechos.opcionIds || []).map((id) => OPTION_VALUE_ES[id] || id).join(", ");
  lines.push(hechosLabels || "(no seleccionados)");
  if (data.hechos.relatoSeri) lines.push(`Relato adicional: ${data.hechos.relatoSeri}`);

  lines.push("");
  lines.push("CONCEPTOS DE VIOLACIÓN:");
  const concLabels = (data.conceptos.opcionIds || []).map((id) => OPTION_VALUE_ES[id] || id).join(", ");
  lines.push(concLabels || "(no seleccionados)");
  if (data.conceptos.otros) lines.push(`Otros: ${data.conceptos.otros}`);

  lines.push("");
  lines.push("PRETENSIONES:");
  const pretLabels = (data.pretensiones.opcionIds || []).map((id) => OPTION_VALUE_ES[id] || id).join(", ");
  lines.push(pretLabels || "(no seleccionadas)");
  if (data.pretensiones.otros) lines.push(`Otras: ${data.pretensiones.otros}`);

  lines.push("");
  lines.push("DOMICILIO PARA NOTIFICACIONES:");
  lines.push(data.domicilio.direccion || "(no indicado)");
  if (data.domicilio.mismoQueQuejoso) lines.push("(Es el mismo que el domicilio del quejoso)");

  return lines.join("\n");
}
