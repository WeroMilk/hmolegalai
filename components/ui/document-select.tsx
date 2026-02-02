"use client";

import { useState, useRef, useEffect } from "react";

interface DocumentSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export function DocumentSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  disabled,
  "aria-label": ariaLabel,
  className = "",
}: DocumentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const selected = options.find((o) => o.value === value);
  const displayValue = selected ? selected.label : placeholder;

  const handleSelect = (v: string) => {
    onChange(v);
    setIsOpen(false);
  };

  const triggerClass =
    "w-full px-4 py-3 bg-card border border-border rounded-xl text-left text-foreground " +
    "dark:bg-gray-800/90 dark:border-gray-600/50 dark:text-gray-100 " +
    "focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 " +
    "transition-colors flex items-center justify-between gap-2 " +
    (disabled ? "opacity-60 cursor-not-allowed " : "cursor-pointer ");

  const optionBase =
    "px-4 py-3 cursor-pointer text-foreground hover:bg-blue-500/10 dark:hover:bg-blue-500/15 " +
    "active:bg-blue-500/15 dark:active:bg-blue-500/20 transition-colors";

  const listContent = (
    <>
      {placeholder && (
        <li
          role="option"
          onClick={() => handleSelect("")}
          className={`${optionBase} text-muted`}
        >
          {placeholder}
        </li>
      )}
      {options.map((opt) => (
        <li
          key={opt.value}
          role="option"
          aria-selected={value === opt.value}
          onClick={() => handleSelect(opt.value)}
          className={`${optionBase} ${value === opt.value ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium" : ""}`}
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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={triggerClass}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={!value ? "text-muted" : ""}>{displayValue}</span>
        <svg
          className={`w-5 h-5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Desktop: dropdown bajo el trigger */}
          <ul
            className="absolute z-50 w-full mt-1.5 py-1 bg-card dark:bg-gray-800 border border-border rounded-xl shadow-xl max-h-60 overflow-auto hidden sm:block"
            role="listbox"
          >
            {listContent}
          </ul>
          {/* Mobile: popup centrado */}
          <div className="fixed inset-0 z-[100] sm:hidden" role="dialog" aria-modal="true" aria-label="Seleccionar opción">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 max-h-[70vh] flex flex-col rounded-2xl bg-card dark:bg-gray-800 border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="text-sm font-medium text-foreground">{placeholder}</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 -m-2 text-muted hover:text-foreground rounded-lg transition-colors"
                  aria-label="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ul className="py-1 overflow-auto overscroll-contain [&>li]:py-3.5 [&>li]:text-base" role="listbox">
                {listContent}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
