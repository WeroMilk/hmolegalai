export interface LegalDocument {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
  fields: DocumentField[];
}

export interface DocumentField {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select" | "person_list";
  required: boolean;
  placeholder?: string;
  options?: string[];
  /** Solo para person_list: etiqueta del nombre (ej. "Heredero", "Testigo") */
  personLabel?: string;
  /** true si el campo es monto/precio (usa $ y formato 10,000.00) */
  money?: boolean;
}

/** Campos comunes en todos los contratos: ciudad para el pie del documento y domicilios para notificaciones. */
export const COMMON_FIELDS: DocumentField[] = [
  {
    id: "ciudad_pie",
    label: "Ciudad (para el pie del documento)",
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
    label: "Domicilio para oír y recibir notificaciones (Parte 1)",
    type: "textarea",
    required: false,
    placeholder: "Calle, número, colonia, CP, ciudad, estado",
  },
  {
    id: "domicilio_notificaciones_2",
    label: "Domicilio para oír y recibir notificaciones (Parte 2)",
    type: "textarea",
    required: false,
    placeholder: "Calle, número, colonia, CP, ciudad, estado",
  },
];

/** Devuelve los campos del documento más los comunes (ciudad, fecha pie, domicilios). */
export function getFieldsForForm(doc: LegalDocument): DocumentField[] {
  return [...doc.fields, ...COMMON_FIELDS];
}

/** Precio estándar por documento (solo descarga). */
export const BASE_PRICE = 59;
/** Precio para guardar el documento de por vida en la cuenta y verlo en "Mis documentos". */
export const SAVE_FOREVER_PRICE = 99;

export const PARENTESCO_OPTIONS = [
  "Hijo/a",
  "Hija",
  "Padre",
  "Madre",
  "Cónyuge",
  "Hermano/a",
  "Hermana",
  "Abuelo/a",
  "Tío/a",
  "Primo/a",
  "Familiar",
  "Amigo/a",
  "Conocido",
  "Testigo",
  "Otro",
] as const;

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: "contrato-arrendamiento",
    name: "Contrato de Arrendamiento",
    description: "Contrato para arrendar una propiedad residencial o comercial",
    price: BASE_PRICE,
    category: "Contratos",
    icon: "🏠",
    fields: [
      { id: "arrendador", label: "Nombre del Arrendador", type: "text", required: true },
      { id: "arrendatario", label: "Nombre del Arrendatario", type: "text", required: true },
      { id: "direccion", label: "Dirección de la Propiedad", type: "textarea", required: true },
      { id: "monto", label: "Monto Mensual de Renta", type: "number", required: true, money: true },
      { id: "duracion", label: "Duración del Contrato (meses)", type: "number", required: true },
      { id: "fecha-inicio", label: "Fecha de Inicio", type: "date", required: true },
    ],
  },
  {
    id: "contrato-prestacion-servicios",
    name: "Contrato de Prestación de Servicios",
    description: "Contrato para la prestación de servicios profesionales",
    price: BASE_PRICE,
    category: "Contratos",
    icon: "💼",
    fields: [
      { id: "contratante", label: "Nombre del Contratante", type: "text", required: true },
      { id: "prestador", label: "Nombre del Prestador de Servicios", type: "text", required: true },
      { id: "servicio", label: "Descripción del Servicio", type: "textarea", required: true },
      { id: "monto", label: "Monto del Contrato", type: "number", required: true, money: true },
      { id: "fecha-inicio", label: "Fecha de Inicio", type: "date", required: true },
      { id: "fecha-fin", label: "Fecha de Finalización", type: "date", required: false },
    ],
  },
  {
    id: "contrato-compraventa",
    name: "Contrato de Compraventa (Bienes Muebles)",
    description: "Contrato para la compraventa de bienes muebles únicamente. No aplica para inmuebles (terrenos, casas); para esos se requiere notaría.",
    price: BASE_PRICE,
    category: "Contratos",
    icon: "🏢",
    fields: [
      { id: "vendedor", label: "Nombre del Vendedor", type: "text", required: true },
      { id: "comprador", label: "Nombre del Comprador", type: "text", required: true },
      { id: "bien", label: "Descripción del Bien", type: "textarea", required: true },
      { id: "precio", label: "Precio de Venta", type: "number", required: true, money: true },
      { id: "fecha", label: "Fecha del Contrato", type: "date", required: true },
    ],
  },
  {
    id: "carta-poder-simple",
    name: "Carta Poder Simple",
    description: "Carta poder para trámites específicos",
    price: BASE_PRICE,
    category: "Poderes",
    icon: "📋",
    fields: [
      { id: "otorgante", label: "Nombre del Otorgante", type: "text", required: true },
      { id: "apoderado", label: "Nombre del Apoderado", type: "text", required: true },
      { id: "tramite", label: "Trámite a Realizar", type: "textarea", required: true },
      { id: "fecha", label: "Fecha", type: "date", required: true },
    ],
  },
  {
    id: "contrato-trabajo",
    name: "Contrato de Trabajo",
    description: "Contrato laboral entre empleador y trabajador",
    price: BASE_PRICE,
    category: "Laboral",
    icon: "👔",
    fields: [
      { id: "empleador", label: "Nombre del Empleador", type: "text", required: true },
      { id: "trabajador", label: "Nombre del Trabajador", type: "text", required: true },
      { id: "puesto", label: "Puesto de Trabajo", type: "text", required: true },
      { id: "salario", label: "Salario Mensual", type: "number", required: true, money: true },
      { id: "fecha-inicio", label: "Fecha de Inicio", type: "date", required: true },
    ],
  },
  {
    id: "convenio-confidencialidad",
    name: "Convenio de Confidencialidad",
    description: "Acuerdo para proteger información confidencial",
    price: BASE_PRICE,
    category: "Contratos",
    icon: "🔒",
    fields: [
      { id: "parte1", label: "Nombre de la Primera Parte", type: "text", required: true },
      { id: "parte2", label: "Nombre de la Segunda Parte", type: "text", required: true },
      { id: "informacion", label: "Información Confidencial", type: "textarea", required: true },
      { id: "duracion", label: "Duración del Convenio (meses)", type: "number", required: true },
    ],
  },
  {
    id: "acuerdo-confidencialidad-nda",
    name: "Acuerdo de Confidencialidad (NDA)",
    description: "Acuerdo de no divulgación para proteger información sensible en negocios",
    price: BASE_PRICE,
    category: "Contratos",
    icon: "📜",
    fields: [
      { id: "parte_reveladora", label: "Nombre de la Parte Reveladora", type: "text", required: true },
      { id: "parte_receptora", label: "Nombre de la Parte Receptora", type: "text", required: true },
      { id: "objeto_confidencial", label: "Objeto o Información Confidencial", type: "textarea", required: true },
      { id: "duracion", label: "Duración del Acuerdo (meses)", type: "number", required: true },
      { id: "fecha", label: "Fecha del Acuerdo", type: "date", required: true },
    ],
  },
  {
    id: "contrato-donacion",
    name: "Contrato de Donación entre Particulares (Bienes Muebles)",
    description: "Donación de bienes muebles únicamente entre particulares. No aplica para inmuebles; para donación de inmuebles se requiere notaría.",
    price: BASE_PRICE,
    category: "Contratos",
    icon: "🎁",
    fields: [
      { id: "donante", label: "Nombre del Donante", type: "text", required: true },
      { id: "donatario", label: "Nombre del Donatario", type: "text", required: true },
      { id: "bien", label: "Descripción del Bien Donado", type: "textarea", required: true },
      { id: "valor_estimado", label: "Valor Estimado (opcional)", type: "number", required: false, money: true },
      { id: "fecha", label: "Fecha de la Donación", type: "date", required: true },
    ],
  },
  {
    id: "convenio-colaboracion-socios",
    name: "Convenio de Colaboración o Socios",
    description: "Acuerdo entre socios o colaboradores para un proyecto o negocio",
    price: BASE_PRICE,
    category: "Contratos",
    icon: "🤝",
    fields: [
      { id: "socio1", label: "Nombre del Primer Socio/Colaborador", type: "text", required: true },
      { id: "socio2", label: "Nombre del Segundo Socio/Colaborador", type: "text", required: true },
      { id: "objeto_social", label: "Objeto del Convenio o Actividad", type: "textarea", required: true },
      { id: "aportaciones", label: "Aportaciones de Cada Parte", type: "textarea", required: true },
      { id: "duracion", label: "Duración (meses)", type: "number", required: true },
      { id: "fecha_inicio", label: "Fecha de Inicio", type: "date", required: true },
    ],
  },
  {
    id: "carta-terminacion-arrendamiento-servicios",
    name: "Carta de Terminación de Contrato",
    description: "Terminación de contrato de arrendamiento o de prestación de servicios",
    price: BASE_PRICE,
    category: "Contratos",
    icon: "📤",
    fields: [
      { id: "quien_termina", label: "Nombre de Quien Da por Terminado", type: "text", required: true },
      { id: "otra_parte", label: "Nombre de la Otra Parte", type: "text", required: true },
      { id: "tipo_contrato", label: "Tipo de Contrato (Arrendamiento / Prestación de Servicios)", type: "text", required: true },
      { id: "referencia", label: "Dirección del Inmueble o Descripción del Servicio", type: "textarea", required: true },
      { id: "fecha_terminacion", label: "Fecha de Terminación", type: "date", required: true },
      { id: "motivo", label: "Motivo (opcional)", type: "textarea", required: false },
    ],
  },
  {
    id: "contrato-comodato",
    name: "Contrato de Comodato",
    description: "Préstamo de uso (sin ánimo de lucro) de un bien mueble",
    price: BASE_PRICE,
    category: "Contratos",
    icon: "📦",
    fields: [
      { id: "comodante", label: "Nombre del Comodante (quien presta)", type: "text", required: true },
      { id: "comodatario", label: "Nombre del Comodatario (quien recibe)", type: "text", required: true },
      { id: "bien", label: "Descripción del Bien Prestado", type: "textarea", required: true },
      { id: "duracion", label: "Duración (meses o descripción)", type: "text", required: true },
      { id: "fecha_inicio", label: "Fecha de Inicio", type: "date", required: true },
    ],
  },
  {
    id: "formato-demanda-mercantil",
    name: "Formato Básico de Demanda Mercantil",
    description: "Formato base para presentar demanda ante tribunales mercantiles en México",
    price: BASE_PRICE,
    category: "Otros",
    icon: "⚖️",
    fields: [
      { id: "actor", label: "Nombre del Actor (demandante)", type: "text", required: true },
      { id: "demandado", label: "Nombre del Demandado", type: "text", required: true },
      { id: "hechos", label: "Hechos y Fundamentos", type: "textarea", required: true },
      { id: "pretensiones", label: "Pretensiones (qué se pide)", type: "textarea", required: true },
      { id: "valor_controversia", label: "Valor de la Controversia (MXN)", type: "number", required: true, money: true },
      { id: "juzgado", label: "Juzgado o Tribunal (opcional)", type: "text", required: false },
    ],
  },
];

export function getDocumentById(id: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((doc) => doc.id === id);
}

export function getDocumentsByCategory(category: string): LegalDocument[] {
  return LEGAL_DOCUMENTS.filter((doc) => doc.category === category);
}

export function getCategories(): string[] {
  return Array.from(new Set(LEGAL_DOCUMENTS.map((doc) => doc.category)));
}
