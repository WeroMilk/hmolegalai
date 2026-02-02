"use client";

import { useState, useRef, useEffect } from "react";

interface DidiSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
          onClick={() => handleSelect("")}
          className="px-4 py-3 cursor-pointer text-muted hover:!bg-white hover:!text-purple-600 dark:hover:!bg-white dark:hover:!text-purple-600 active:bg-purple-50 dark:active:bg-purple-500/20"
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
        <>
          {/* Desktop: dropdown */}
          <ul
            className="absolute z-50 w-full mt-1 py-1 bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg max-h-60 overflow-auto hidden sm:block"
            role="listbox"
          >
            {listContent}
          </ul>
          {/* Mobile: full-screen popup */}
          <div className="fixed inset-0 z-[100] sm:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-2xl bg-white dark:bg-gray-900 shadow-xl animate-slide-up">
              <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border bg-white dark:bg-gray-900">
                <span className="text-sm font-medium text-muted">Seleccionar opción</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 -m-2 text-muted hover:text-foreground rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ul className="py-2 pb-6 [&>li]:py-4 [&>li]:text-base" role="listbox">
                {listContent}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
