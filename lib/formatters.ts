import { getFieldsForForm, type LegalDocument } from "./documents";

/** Formatea peso: 57 → 57.000, 55500 (gramos) → 55.500. Enteros sin punto. */
export function formatPesoDisplay(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num >= 1000) return (num / 1000).toFixed(3);
    return num.toFixed(3);
  }
  return trimmed;
}

/** Valor numérico del peso para la API: "55.500" → 55.5, "55500" (gramos) → 55.5 */
export function parsePesoForApi(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num >= 1000) return (num / 1000).toFixed(3);
  }
  const n = parseFloat(trimmed.replace(",", "."));
  return Number.isNaN(n) ? trimmed : n.toString();
}

/** Primera letra de cada palabra en mayúscula (para nombres). El usuario puede editarlo después. */
export function toTitleCase(s: string): string {
  if (!s || typeof s !== "string") return "";
  return s
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.length === 0 ? "" : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

/** Formato teléfono: (662) 215-3000 */
export function formatTelefono(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    const area = digits.slice(-10, -7);
    const rest = digits.slice(-7);
    return `(${area}) ${rest.slice(0, 3)}-${rest.slice(3)}`;
  }
  if (digits.length >= 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw.trim();
}

/** Formato dirección: Av. Reforma 150, Col. Centro, Hermosillo, Sonora */
export function formatDireccion(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const formatted = parts.map((p) => {
    if (/^col\.?\s*/i.test(p)) return "Col. " + toTitleCase(p.replace(/^col\.?\s*/i, ""));
    if (/^av\.?\s*/i.test(p) || /^avenida\s*/i.test(p)) return "Av. " + toTitleCase(p.replace(/^(av\.?|avenida)\s*/i, ""));
    if (/^calle\s*/i.test(p)) return "Calle " + toTitleCase(p.replace(/^calle\s*/i, ""));
    return toTitleCase(p);
  });
  return formatted.join(", ");
}

/** Formato precio: MXN $1990.00 */
export function formatPriceMXN(amount: number): string {
  return `MXN $${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export type PersonEntry = { nombre: string; parentesco: string };

export function parsePersonList(value: string): PersonEntry[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [{ nombre: "", parentesco: "" }];
  } catch {
    return [{ nombre: "", parentesco: "" }];
  }
}

export function serializePersonList(list: PersonEntry[]): string {
  return JSON.stringify(list);
}

/** Formato legible para la IA: "Nombre (Parentesco); Nombre (Parentesco)" */
export function formatPersonListForApi(value: string): string {
  const list = parsePersonList(value).filter((p) => p.nombre.trim());
  return list.map((p) => `${p.nombre.trim()}${p.parentesco ? ` (${p.parentesco})` : ""}`).join("; ") || "";
}

export function parseMoneyValue(s: string): number | null {
  const cleaned = s.replace(/[^\d.]/g, "").replace(/(\.\d*)\..*$/, "$1");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Solo permite dígitos y un punto; no fuerza decimales. Para poder escribir 1500 sin autocompletar. */
export function sanitizeMoneyInput(s: string): string {
  const cleaned = s.replace(/[^\d.]/g, "");
  const oneDot = cleaned.includes(".")
    ? cleaned.replace(/(\.\d*)\..*$/, "$1")
    : cleaned;
  return oneDot;
}

/** Valor crudo para mostrar en input de dinero: solo dígitos y un punto (sin comas). */
export function rawMoneyDisplay(raw: string): string {
  return sanitizeMoneyInput(raw || "");
}

const MONEY_FORMAT_ESMX = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Mientras se escribe: comas de miles, 0–2 decimales (no fuerza .00). Así "1"→"1", "10000"→"10,000", "10000.5"→"10,000.5". */
const MONEY_FORMAT_LIVE = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formato con 2 decimales (para mostrar después de blur o en resúmenes). */
export function formatMoneyDisplay(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const n = parseMoneyValue(raw);
  if (n === null || isNaN(n)) return raw;
  return MONEY_FORMAT_ESMX.format(n);
}

/** Formato en vivo en el input: comas, sin forzar .00, para poder escribir 1 → 10 → 100 → 10000 sin saltar a centavos. */
export function formatMoneyDisplayLive(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const n = parseMoneyValue(raw);
  if (n === null || isNaN(n)) return raw;
  return MONEY_FORMAT_LIVE.format(n);
}

/** Valor a mostrar en el input de dinero: mientras escribes sin .XX usa live (sin .00); si ya tiene 2 decimales usa formato con .00. */
export function formatMoneyInputValue(raw: string): string {
  if (!raw || !raw.trim()) return "";
  if (/\.\d{2}$/.test(raw.trim())) return formatMoneyDisplay(raw);
  return formatMoneyDisplayLive(raw);
}

/** Al salir del campo (blur): si hay número sin decimales, normaliza a "XXXX.00". Vacío se deja vacío. */
export function normalizeMoneyOnBlur(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const n = parseMoneyValue(raw);
  if (n === null || isNaN(n)) return raw;
  return n.toFixed(2);
}

/** Convierte el JSON de domicilio (selector) a string para la API. */
function domicilioJsonToDisplayString(raw: string): string {
  if (!raw?.trim() || !raw.trim().startsWith("{")) return raw;
  try {
    const o = JSON.parse(raw) as Record<string, string>;
    const parts: string[] = [];
    if (o.calle?.trim()) {
      let calle = o.calle.trim();
      if (o.numeroExterior?.trim()) calle += ` ${o.numeroExterior.trim()}`;
      if (o.numeroInterior?.trim()) calle += `, Int. ${o.numeroInterior.trim()}`;
      parts.push(calle);
    }
    if (o.colonia?.trim()) parts.push(`Col. ${o.colonia.trim()}`);
    if (o.cp?.trim()) parts.push(`CP ${o.cp.trim()}`);
    if (o.municipio?.trim()) parts.push(o.municipio.trim());
    if (o.estado?.trim()) parts.push(o.estado.trim());
    return parts.join(", ");
  } catch {
    return raw;
  }
}

export function buildUserInputsForApi(
  formData: Record<string, string>,
  document: LegalDocument
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of getFieldsForForm(document)) {
    const raw = formData[field.id] ?? "";
    if (field.type === "person_list") {
      out[field.id] = formatPersonListForApi(raw);
    } else if (field.money && raw) {
      const n = parseMoneyValue(raw);
      out[field.id] = n !== null ? n.toFixed(2) : raw;
    } else if (
      (field.id === "domicilio_notificaciones_1" || field.id === "domicilio_notificaciones_2") &&
      raw.trim().startsWith("{")
    ) {
      out[field.id] = domicilioJsonToDisplayString(raw);
    } else {
      out[field.id] = raw;
    }
  }
  return out;
}
