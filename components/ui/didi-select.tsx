"use client";

import { useState, useRef, useEffect } from "react";

interface DidiSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

const optionClassName =
  "px-4 py-3 cursor-pointer text-foreground dark:text-white hover:!bg-white hover:!text-purple-600 dark:hover:!bg-white dark:hover:!text-purple-600 active:bg-purple-50 dark:active:bg-purple-500/20";

export function DidiSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona",
  required,
  className = "",
  id,
  "aria-label": ariaLabel,
}: DidiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  const displayValue = selected ? selected.label : placeholder;

  const handleSelect = (v: string) => {
    onChange(v);
    setIsOpen(false);
  };

  const listContent = (
    <>
      {placeholder && (
        <li
          role="option"
          aria-selected={!value}
          onClick={() => handleSelect("")}
          className="px-4 py-3 cursor-pointer text-muted hover:!bg-white hover:!text-purple-600 dark:hover:!bg-white dark:hover:!text-purple-600 active:bg-purple-50 dark:active:bg-purple-500/20"
        >
          Seleccionar
        </li>
      )}
      {options.map((opt) => (
        <li
          key={opt.value}
          role="option"
          aria-selected={value === opt.value}
          onClick={() => handleSelect(opt.value)}
          className={`${optionClassName} ${value === opt.value ? "font-semibold text-purple-600" : ""}`}
        >
          {opt.label}
        </li>
      ))}
    </>
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-card dark:bg-transparent border border-border rounded-lg text-left text-foreground dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 flex items-center justify-between"
      >
        <span className={!value ? "text-muted" : ""}>{displayValue}</span>
        <svg
          className={`w-5 h-5 text-purple-500 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul
          className="absolute z-50 w-full mt-1 py-1 bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {listContent}
        </ul>
      )}
    </div>
  );
}
