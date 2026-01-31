import type { LegalDocument } from "./documents";

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

export function buildUserInputsForApi(
  formData: Record<string, string>,
  document: LegalDocument
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of document.fields) {
    const raw = formData[field.id] ?? "";
    if (field.type === "person_list") {
      out[field.id] = formatPersonListForApi(raw);
    } else if (field.money && raw) {
      const n = parseMoneyValue(raw);
      out[field.id] = n !== null ? n.toFixed(2) : raw;
    } else {
      out[field.id] = raw;
    }
  }
  return out;
}
