export interface LegalDocument {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
  fields: DocumentField[];
  /** Nombre de la primera parte para domicilio notificaciones. */
  parte1Label?: string;
  /** Nombre de la segunda parte. */
  parte2Label?: string;
}

export interface DocumentField {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select" | "person_list";
  required: boolean;
  placeholder?: string;
  options?: string[];
  personLabel?: string;
  money?: boolean;
  capitalizeWords?: boolean;
}

/** Campos comunes en documentos de amparo. Las etiquetas se personalizan por documento según parte1Label/parte2Label. */
export const COMMON_FIELDS: DocumentField[] = [
  {
    id: "ciudad_pie",
    label: "Ciudad y entidad federativa (para el pie del documento)",
    type: "text",
    required: false,
    placeholder: "Ej: Hermosillo, Sonora",
  },
  {
    id: "fecha_pie",
    label: "Fecha para el pie del documento",
    type: "date",
    required: false,
    placeholder: "dd/mm/aaaa",
  },
  {
    id: "domicilio_notificaciones_1",
    label: "Domicilio para oír y recibir notificaciones (Quejoso)",
    type: "textarea",
    required: false,
    placeholder: "Calle, número, colonia, CP, ciudad, estado",
  },
  {
    id: "domicilio_notificaciones_2",
    label: "Domicilio para oír y recibir notificaciones (Tercero interesado)",
    type: "textarea",
    required: false,
    placeholder: "Calle, número, colonia, CP, ciudad, estado",
  },
];

export function getFieldsForForm(doc: LegalDocument): DocumentField[] {
  const parte1 = doc.parte1Label ?? "Quejoso";
  const parte2 = doc.parte2Label ?? "Tercero interesado";
  const common: DocumentField[] = [
    ...COMMON_FIELDS.slice(0, 2),
    { ...COMMON_FIELDS[2], label: `Domicilio para oír y recibir notificaciones (${parte1})` },
    { ...COMMON_FIELDS[3], label: `Domicilio para oír y recibir notificaciones (${parte2})` },
  ];
  return [...doc.fields, ...common];
}

/** Precio base por documento (entrega en 24-48 h tras aprobación del abogado). */
export const BASE_PRICE = 1990;
/** Precio con almacenamiento permanente en Mi cuenta. */
export const SAVE_FOREVER_PRICE = 2990;

export const PARENTESCO_OPTIONS = [
  "Hijo/a",
  "Padre",
  "Madre",
  "Cónyuge",
  "Hermano/a",
  "Abuelo/a",
  "Tío/a",
  "Primo/a",
  "Familiar",
  "Testigo",
  "Otro",
] as const;

/** Documentos exclusivos de Ley de Amparo (México). Precios según mercado: plantillas $40-400 MXN; con IA + revisión abogado: $1,990-2,990 MXN. */
export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: "demanda-amparo-indirecto",
    name: "Demanda de Amparo Indirecto",
    description: "Contra actos de autoridades distintas de tribunales judiciales, administrativos o del trabajo. Se presenta ante el Juez de Distrito.",
    price: BASE_PRICE,
    category: "Ley de Amparo",
    icon: "⚖️",
    parte1Label: "Quejoso",
    parte2Label: "Tercero interesado",
    fields: [
      { id: "nombre_quejoso", label: "Nombre completo del quejoso (agravado / parte actora)", type: "text", required: true, capitalizeWords: true, placeholder: "Ej: Juan Pérez López" },
      { id: "domicilio_quejoso", label: "Domicilio particular del quejoso (Art. 108 Ley de Amparo)", type: "textarea", required: true, placeholder: "Calle, número, colonia, CP, ciudad, estado" },
      { id: "quien_promueve", label: "Quien promueve en nombre del quejoso", type: "text", required: false, placeholder: "Ej: El quejoso por su propio derecho; o nombre del representante legal" },
      { id: "nombre_tercero_interesado", label: "Nombre del tercero interesado (contraparte en el juicio de origen)", type: "text", required: false, placeholder: "Si no lo conoce: No los conozco" },
      { id: "domicilio_tercero_interesado", label: "Domicilio del tercero interesado", type: "textarea", required: false, placeholder: "Deje en blanco si no los conoce" },
      { id: "autoridad_responsable", label: "Autoridad responsable (órgano que emitió el acto reclamado)", type: "text", required: true, placeholder: "Ej: Juzgado Primero de Distrito en Sonora; o nombre del órgano" },
      { id: "acto_reclamado", label: "Norma general, acto u omisión reclamado (Art. 108 IV)", type: "textarea", required: true, placeholder: "Describa con precisión el acto que impugna" },
      { id: "hechos_antecedentes", label: "Hechos que constituyan los antecedentes del acto reclamado (Art. 108 V)", type: "textarea", required: true, placeholder: "Antecedentes y hechos que fundamentan los conceptos de violación" },
      { id: "normas_violadas", label: "Preceptos constitucionales o legales violados", type: "textarea", required: true, placeholder: "Ej: Art. 14, 16, 17 CPEUM; artículos de la ley aplicable" },
      { id: "fundamentos", label: "Conceptos de violación (Art. 108 VIII)", type: "textarea", required: true, placeholder: "Argumentación jurídica de por qué se violaron los preceptos" },
      { id: "pretensiones", label: "Pretensiones (qué se solicita al Juez de Distrito)", type: "textarea", required: true, placeholder: "Ej: Que se conceda el amparo; que se anule el acto" },
      { id: "juzgado", label: "Juzgado de Distrito ante el que se presenta la demanda", type: "text", required: false, placeholder: "Ej: Juzgado Primero de Distrito en el Estado de Sonora" },
    ],
  },
  {
    id: "demanda-amparo-directo",
    name: "Demanda de Amparo Directo",
    description: "Contra sentencias definitivas o laudos y resoluciones que pongan fin al juicio. Se presenta ante la autoridad responsable.",
    price: BASE_PRICE,
    category: "Ley de Amparo",
    icon: "📜",
    parte1Label: "Quejoso",
    parte2Label: "Tercero interesado",
    fields: [
      { id: "nombre_quejoso", label: "Nombre completo del quejoso (agravado / parte actora)", type: "text", required: true, capitalizeWords: true, placeholder: "Ej: Juan Pérez López" },
      { id: "domicilio_quejoso", label: "Domicilio particular del quejoso (Art. 175 Ley de Amparo)", type: "textarea", required: true, placeholder: "Calle, número, colonia, CP, ciudad, estado" },
      { id: "nombre_tercero_interesado", label: "Nombre del tercero interesado (contraparte en el juicio de origen)", type: "text", required: false, placeholder: "Si no lo conoce: No los conozco" },
      { id: "domicilio_tercero_interesado", label: "Domicilio del tercero interesado", type: "textarea", required: false },
      { id: "autoridad_responsable", label: "Autoridad responsable (tribunal que emitió la sentencia o laudo)", type: "text", required: true, placeholder: "Ej: Juzgado Segundo de Primera Instancia en lo Civil de Hermosillo" },
      { id: "resolucion_impugnada", label: "Resolución o sentencia impugnada (acto reclamado)", type: "textarea", required: true, placeholder: "Describa la sentencia o laudo que impugna" },
      { id: "fecha_notificacion", label: "Fecha de notificación del acto reclamado (Art. 175)", type: "date", required: true, placeholder: "Fecha en que se notificó la resolución o tuvo conocimiento" },
      { id: "normas_violadas", label: "Preceptos constitucionales violados", type: "textarea", required: true, placeholder: "Derechos humanos y garantías cuya violación se reclama" },
      { id: "fundamentos", label: "Conceptos de violación", type: "textarea", required: true, placeholder: "Argumentación de por qué la sentencia viola los preceptos" },
      { id: "pretensiones", label: "Pretensiones (qué se solicita al Tribunal Colegiado)", type: "textarea", required: true, placeholder: "Qué se solicita al Tribunal Colegiado" },
      { id: "tribunal_circuito", label: "Tribunal Colegiado de Circuito ante el que se presenta el recurso", type: "text", required: false, placeholder: "Ej: Tribunal Colegiado del Cuarto Circuito" },
    ],
  },
  {
    id: "promocion-incidente-suspension",
    name: "Promoción de Incidente de Suspensión",
    description: "Solicitud para que se suspenda el acto reclamado mientras se resuelve el juicio de amparo.",
    price: BASE_PRICE,
    category: "Ley de Amparo",
    icon: "⏸️",
    parte1Label: "Quejoso",
    parte2Label: "Tercero interesado",
    fields: [
      { id: "nombre_quejoso", label: "Nombre completo del quejoso (parte que solicita la suspensión)", type: "text", required: true, capitalizeWords: true, placeholder: "Ej: Juan Pérez López" },
      { id: "domicilio_quejoso", label: "Domicilio particular del quejoso", type: "textarea", required: true, placeholder: "Calle, número, colonia, CP, ciudad, estado" },
      { id: "numero_expediente_amparo", label: "Número de expediente del juicio de amparo", type: "text", required: false, placeholder: "Ej: 123/2025" },
      { id: "juzgado_distrito", label: "Juzgado de Distrito que conoce del juicio de amparo", type: "text", required: true, placeholder: "Ej: Juzgado Primero de Distrito en Sonora" },
      { id: "autoridad_responsable", label: "Autoridad responsable del acto reclamado (quien emitió el acto)", type: "text", required: true },
      { id: "acto_suspender", label: "Acto cuya suspensión se solicita (Art. 125 y ss. Ley de Amparo)", type: "textarea", required: true, placeholder: "Describa con precisión el acto que debe suspenderse" },
      { id: "fundamentos_suspension", label: "Fundamentos para la suspensión (apariencia del buen derecho, interés suspensional)", type: "textarea", required: true, placeholder: "Argumentos por los que debe concederse la suspensión" },
      { id: "garantia", label: "Garantía que ofrece el quejoso (si el juez la exige)", type: "textarea", required: false, placeholder: "Monto o bien que ofrece en garantía para cubrir daños y perjuicios; o: No aplica" },
    ],
  },
  {
    id: "contestacion-demanda-amparo",
    name: "Contestación de Demanda de Amparo",
    description: "Escrito de contestación presentado por la autoridad responsable ante el Juez de Distrito.",
    price: BASE_PRICE,
    category: "Ley de Amparo",
    icon: "📋",
    parte1Label: "Autoridad responsable",
    parte2Label: "Quejoso",
    fields: [
      { id: "autoridad_responsable", label: "Nombre de la autoridad responsable que contesta (demandada en el amparo)", type: "text", required: true, placeholder: "Ej: Juzgado Primero de Distrito en Sonora" },
      { id: "domicilio_autoridad", label: "Domicilio de la autoridad para oír y recibir notificaciones", type: "textarea", required: false, placeholder: "Oficinas o dirección de la autoridad" },
      { id: "nombre_quejoso", label: "Nombre completo del quejoso (parte actora en el juicio de amparo)", type: "text", required: true, capitalizeWords: true },
      { id: "numero_expediente", label: "Número de expediente del juicio de amparo", type: "text", required: true, placeholder: "Ej: 123/2025" },
      { id: "acto_reclamado_resumen", label: "Breve reseña del acto reclamado (qué impugna el quejoso)", type: "textarea", required: false, placeholder: "Resumen del acto que dio origen a la demanda" },
      { id: "argumentos", label: "Argumentos y defensa de la autoridad (contestación al fondo)", type: "textarea", required: true, placeholder: "Fundamentos por los que la autoridad considera infundada la demanda" },
      { id: "pruebas", label: "Pruebas que ofrece la autoridad responsable", type: "textarea", required: false, placeholder: "Documentos, testigos, etc.; o: No ofrece pruebas" },
    ],
  },
  {
    id: "escrito-alegatos",
    name: "Escrito de Alegatos",
    description: "Alegatos de las partes en el juicio de amparo para fundamentar sus posiciones.",
    price: BASE_PRICE,
    category: "Ley de Amparo",
    icon: "✍️",
    parte1Label: "Quejoso",
    parte2Label: "Tercero interesado",
    fields: [
      { id: "nombre_parte", label: "Nombre completo de la parte que presenta los alegatos", type: "text", required: true, capitalizeWords: true, placeholder: "Ej: Juan Pérez López" },
      { id: "calidad", label: "Calidad procesal en que actúa", type: "select", required: true, options: ["Quejoso", "Tercero interesado", "Autoridad responsable"], placeholder: "Seleccione" },
      { id: "numero_expediente", label: "Número de expediente del juicio de amparo", type: "text", required: true, placeholder: "Ej: 123/2025" },
      { id: "juzgado_tribunal", label: "Juzgado de Distrito o Tribunal Colegiado que conoce del juicio", type: "text", required: false, placeholder: "Ej: Juzgado Primero de Distrito en Sonora" },
      { id: "alegatos", label: "Alegatos y argumentos de la parte", type: "textarea", required: true, placeholder: "Fundamentación: hechos, preceptos violados, conceptos de violación, pretensiones" },
    ],
  },
  {
    id: "recurso-revision",
    name: "Recurso de Revisión",
    description: "Contra resoluciones del Juez de Distrito en amparo indirecto. Se presenta ante el Tribunal Colegiado de Circuito.",
    price: BASE_PRICE,
    category: "Ley de Amparo",
    icon: "🔄",
    parte1Label: "Recurrente",
    parte2Label: "Otros interesados",
    fields: [
      { id: "nombre_recurrente", label: "Nombre completo del recurrente (quien impugna la sentencia del Juez de Distrito)", type: "text", required: true, capitalizeWords: true, placeholder: "Ej: Juan Pérez López" },
      { id: "domicilio_recurrente", label: "Domicilio del recurrente para oír y recibir notificaciones", type: "textarea", required: true, placeholder: "Calle, número, colonia, CP, ciudad, estado" },
      { id: "numero_expediente", label: "Número de expediente del juicio de amparo", type: "text", required: true, placeholder: "Ej: 123/2025" },
      { id: "sentencia_revisar", label: "Sentencia o resolución del Juez de Distrito que se impugna (Art. 83 Ley de Amparo)", type: "textarea", required: true, placeholder: "Describa la resolución que impugna" },
      { id: "fecha_resolucion", label: "Fecha en que se dictó la resolución impugnada", type: "date", required: false, placeholder: "Fecha de la resolución" },
      { id: "juzgado_origen", label: "Juzgado de Distrito de origen (que dictó la resolución impugnada)", type: "text", required: true, placeholder: "Ej: Juzgado Primero de Distrito en el Estado de Sonora" },
      { id: "tribunal_circuito", label: "Tribunal Colegiado de Circuito ante el que se presenta el recurso", type: "text", required: true, placeholder: "Ej: Tribunal Colegiado del Cuarto Circuito" },
      { id: "agravios", label: "Agravios y fundamentos del recurso de revisión", type: "textarea", required: true, placeholder: "Motivos por los que la resolución es incorrecta; preceptos violados; argumentación jurídica" },
    ],
  },
];

export function getDocumentById(id: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((doc) => doc.id === id);
}

/** Extrae "Ciudad, Estado" del domicilio cuando termina en ese formato (ej: "...Hermosillo, Sonora"). */
export function extractCiudadEstadoFromDomicilio(domicilio: string): string {
  if (!domicilio?.trim()) return "";
  const parts = domicilio.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  return "";
}

/** Tipo mínimo del perfil para prellenado. */
export interface ProfilePrefill {
  role?: "cliente" | "abogado";
  nombreCompleto?: string;
  domicilio?: string;
  direccionDespacho?: string;
  /** Ciudad para pie del documento (ej: Hermosillo, Sonora). */
  ciudadPie?: string;
}

/** Aplica prellenado desde perfil a initialData. Modifica initialData in-place. */
export function applyPrefillFromProfile(
  initialData: Record<string, string>,
  doc: LegalDocument,
  profile: ProfilePrefill | null | undefined,
  todayDate: string
): void {
  if (!profile) return;
  const nombre = profile.nombreCompleto?.trim() ?? "";
  const dom = (profile.domicilio ?? profile.direccionDespacho ?? "").trim();
  const ciudad = (profile.ciudadPie?.trim() || extractCiudadEstadoFromDomicilio(dom));

  // Campos comunes: fecha y ciudad del pie
  if (todayDate && "fecha_pie" in initialData) initialData["fecha_pie"] = todayDate;
  if (ciudad && "ciudad_pie" in initialData) initialData["ciudad_pie"] = ciudad;

  // Domicilio para notificaciones (parte1): siempre que tengamos domicilio
  if (dom && "domicilio_notificaciones_1" in initialData) initialData["domicilio_notificaciones_1"] = dom;

  if (profile.role === "cliente") {
    // Cliente como quejoso/recurrente/parte
    if (nombre && "nombre_quejoso" in initialData) initialData["nombre_quejoso"] = nombre;
    if (nombre && "nombre_recurrente" in initialData) initialData["nombre_recurrente"] = nombre;
    if (nombre && "nombre_parte" in initialData) initialData["nombre_parte"] = nombre;
    if (dom && "domicilio_quejoso" in initialData) initialData["domicilio_quejoso"] = dom;
    if (dom && "domicilio_recurrente" in initialData) initialData["domicilio_recurrente"] = dom;
    // Quien promueve: por su propio derecho
    if ("quien_promueve" in initialData) initialData["quien_promueve"] = "El quejoso por su propio derecho";
  } else if (profile.role === "abogado") {
    // Abogado: domicilio despacho para autoridad (Contestación)
    if (dom && "domicilio_autoridad" in initialData) initialData["domicilio_autoridad"] = dom;
    // Quien promueve: representante legal
    if (nombre && "quien_promueve" in initialData) initialData["quien_promueve"] = `${nombre}, su representante legal`;
  }
}

export function getDocumentsByCategory(category: string): LegalDocument[] {
  return LEGAL_DOCUMENTS.filter((doc) => doc.category === category);
}

export function getCategories(): string[] {
  return Array.from(new Set(LEGAL_DOCUMENTS.map((doc) => doc.category)));
}
