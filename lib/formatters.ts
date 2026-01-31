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

const MONEY_FORMAT_ESMX = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formato para mostrar en inputs de dinero: 15,000.00 (vacío → ""). Respeta comas y centavos. */
export function formatMoneyDisplay(raw: string): string {
  if (!raw || !raw.trim()) return "";
  const n = parseMoneyValue(raw);
  if (n === null || isNaN(n)) return raw;
  return MONEY_FORMAT_ESMX.format(n);
}

/** Igual que formatMoneyDisplay; para uso en vivo en inputs. */
export function formatMoneyDisplayLive(raw: string): string {
  return formatMoneyDisplay(raw);
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
