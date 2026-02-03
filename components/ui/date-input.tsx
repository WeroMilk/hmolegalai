"use client";

import { useState, useCallback } from "react";
import { clsx } from "clsx";
import {
  getDaysInMonth,
  isValidDate,
  parseDDMMYYYY,
  formatDDMMYYYY,
} from "@/lib/date-utils";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

/** Solo dígitos; máximo 8 (dd + mm + aaaa). */
const onlyDigits = (s: string) => s.replace(/\D/g, "").slice(0, 8);

/** Convierte "ddmmYYYY" a "dd/mm/yyyy" para mostrar. */
function toDisplayFormat(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Restringe día: 1-31 si mes/año incompletos; si completos, máximo según mes (y bisiesto). */
function clampDay(
  dayStr: string,
  monthStr: string,
  yearStr: string
): string {
  const day = parseInt(dayStr, 10);
  if (dayStr.length < 2) return dayStr;
  if (monthStr.length < 2 || yearStr.length < 4) {
    if (day > 31) return "31";
    if (day < 1) return "01";
    return dayStr.padStart(2, "0");
  }
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  if (month < 1 || month > 12 || year < 1 || year > 9999) return dayStr;
  const maxDay = getDaysInMonth(year, month);
  if (day > maxDay) return String(maxDay).padStart(2, "0");
  if (day < 1) return "01";
  return dayStr.padStart(2, "0");
}

/** Restringe mes a 01-12. */
function clampMonth(monthStr: string): string {
  if (monthStr.length < 2) return monthStr;
  const m = parseInt(monthStr, 10);
  if (m <= 0) return "01";
  if (m > 12) return "12";
  return monthStr.padStart(2, "0");
}

/** Valor mostrado: solo dígitos formateados como dd/mm/aaaa (por si el padre guarda con barras). */
function displayValue(val: string): string {
  const digits = onlyDigits(val);
  return toDisplayFormat(digits);
}

export function DateInput({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  required = false,
  className,
  id,
  "aria-label": ariaLabel,
}: DateInputProps) {
  const [touched, setTouched] = useState(false);
  const display = displayValue(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digits = onlyDigits(raw);
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      const y = digits.slice(4, 8);
      const clampedD = clampDay(d, m, y);
      const clampedM = clampMonth(m);
      const newDigits = clampedD + (clampedM.length ? clampedM : m) + y;
      const limited = newDigits.slice(0, 8);
      const formatted = toDisplayFormat(limited);
      onChange(formatted);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    const digits = onlyDigits(display);
    if (digits.length !== 8) return;
    const d = parseInt(digits.slice(0, 2), 10);
    const m = parseInt(digits.slice(2, 4), 10);
    const y = parseInt(digits.slice(4, 8), 10);
    if (m < 1 || m > 12 || y < 1 || y > 9999) return;
    const maxDay = getDaysInMonth(y, m);
    const day = d > maxDay ? maxDay : d < 1 ? 1 : d;
    const normalized = formatDDMMYYYY(day, m, y);
    onChange(normalized);
  }, [display, onChange]);

  const parsed = parseDDMMYYYY(display);
  const isValid =
    !display.trim() ||
    (parsed !== null && isValidDate(parsed.day, parsed.month, parsed.year));
  const showError = touched && display.trim() !== "" && !isValid;

  return (
    <input
      type="text"
      id={id}
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={() => setTouched(false)}
      placeholder={placeholder}
      required={required}
      aria-label={ariaLabel}
      aria-invalid={showError}
      maxLength={10}
      className={clsx(
        "w-full px-4 py-3 bg-card border rounded-lg cursor-text",
        "dark:bg-gray-800/90 dark:text-gray-100 dark:placeholder:text-gray-400",
        "text-foreground placeholder:text-muted",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
        "transition-all",
        "border-border focus:border-blue-500/50",
        "dark:border-gray-600/50",
        showError && "border-red-500/60 focus:border-red-500/50",
        className
      )}
    />
  );
}
