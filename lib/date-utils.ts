/**
 * Utilidades para fechas en formato dd/mm/aaaa.
 * Reglas: año 4 dígitos, mes 1-12, día según mes (febrero bisiesto, abril/junio/sept/nov 30 días, etc.).
 */

export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  if (year % 4 === 0) return true;
  return false;
}

/** Mes 1-12. Devuelve número de días del mes (28/29 para febrero según bisiesto). */
export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 31;
  const days: Record<number, number> = {
    1: 31, 2: isLeapYear(year) ? 29 : 28, 3: 31, 4: 30, 5: 31, 6: 30,
    7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
  };
  return days[month] ?? 31;
}

export function isValidDate(day: number, month: number, year: number): boolean {
  if (month < 1 || month > 12) return false;
  if (year < 1 || year > 9999) return false;
  const maxDay = getDaysInMonth(year, month);
  return day >= 1 && day <= maxDay;
}

/** Parsea "dd/mm/yyyy" o "d/m/yyyy" a números. Devuelve null si incompleto o inválido. */
export function parseDDMMYYYY(value: string): { day: number; month: number; year: number } | null {
  const cleaned = value.replace(/\s/g, "").replace(/\//g, "/");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
  if (month < 1 || month > 12) return null;
  if (year < 1 || year > 9999) return null;
  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  return { day, month, year };
}

/** Formatea día/mes/año a "dd/mm/yyyy" (con ceros). */
export function formatDDMMYYYY(day: number, month: number, year: number): string {
  const d = String(day).padStart(2, "0");
  const m = String(month).padStart(2, "0");
  const y = String(year).padStart(4, "0");
  return `${d}/${m}/${y}`;
}

/** Fecha de hoy en formato dd/mm/yyyy. */
export function getTodayDDMMYYYY(): string {
  const now = new Date();
  return formatDDMMYYYY(now.getDate(), now.getMonth() + 1, now.getFullYear());
}
