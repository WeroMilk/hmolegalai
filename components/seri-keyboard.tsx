"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/** Alfabeto Seri (cmiique iitom) - caracteres usados en la lengua */
const SERI_ROWS = [
  ["a", "c", "e", "f", "h", "i", "j", "k", "l"],
  ["m", "n", "o", "ö", "p", "q", "r", "s", "t"],
  ["x", "y", "z", "ä", "á", "é", "í", "ó", "ú"],
  [" ", ".", ",", "?", "!", "'", "-"],
];

/** Sonido al pulsar tecla (Web Audio API) */
function playKeySound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    /* silenciar si no hay AudioContext */
  }
}

interface SeriKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputId?: string;
}

export function SeriKeyboard({
  value,
  onChange,
  onBlur,
  placeholder = "Escribe en cmiique iitom...",
  disabled = false,
  className = "",
  inputId = "seri-input",
}: SeriKeyboardProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = useCallback(
    (char: string) => {
      if (disabled) return;
      playKeySound();
      const textarea = inputRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? value.length;
        const end = textarea.selectionEnd ?? value.length;
        const next = value.slice(0, start) + char + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          const pos = start + char.length;
          textarea.focus();
          textarea.setSelectionRange(pos, pos);
        });
      } else {
        onChange(value + char);
      }
    },
    [value, onChange, disabled]
  );

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    playKeySound();
    const textarea = inputRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? value.length;
      if (start === end && start > 0) {
        const next = value.slice(0, start - 1) + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start - 1, start - 1);
        });
      } else if (start !== end) {
        const next = value.slice(0, start) + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start);
        });
      }
    } else if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }, [value, onChange, disabled]);

  const handleClear = useCallback(() => {
    if (disabled) return;
    playKeySound();
    onChange("");
    inputRef.current?.focus();
  }, [onChange, disabled]);

  return (
    <div className={`seri-keyboard font-sans ${className}`}>
      <textarea
        ref={inputRef}
        id={inputId}
        name={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        inputMode="none"
        autoComplete="off"
        className="w-full min-h-[100px] px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 text-foreground placeholder:text-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-[17px] cursor-text shadow-sm"
        style={{ caretColor: "var(--foreground)", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}
        aria-label="Escribe en idioma comca'ac (cmiique iitom)"
      />
      <div className="mt-4 p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/50 shadow-sm">
        {SERI_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mb-2 last:mb-0">
            {row.map((char) => (
              <motion.button
                key={char}
                type="button"
                onClick={() => handleKeyPress(char)}
                disabled={disabled}
                whileTap={{ scale: 0.96 }}
                className="min-w-[44px] min-h-[48px] sm:min-w-[52px] sm:min-h-[52px] flex items-center justify-center rounded-[12px] bg-white dark:bg-gray-700/80 text-foreground font-medium text-[17px] border border-gray-200 dark:border-gray-600 shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-gray-50 dark:hover:bg-gray-600/80 active:scale-95 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2"
              >
                {char === " " ? "␣" : char}
              </motion.button>
            ))}
            {rowIdx === SERI_ROWS.length - 1 && (
              <>
                <motion.button
                  type="button"
                  onClick={handleBackspace}
                  disabled={disabled}
                  whileTap={{ scale: 0.96 }}
                  className="min-w-[44px] min-h-[48px] sm:min-w-[52px] sm:min-h-[52px] flex items-center justify-center rounded-[12px] bg-white dark:bg-gray-700/80 text-foreground border border-gray-200 dark:border-gray-600 shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-gray-50 dark:hover:bg-gray-600/80 active:scale-95 transition-all duration-150 text-lg"
                >
                  ⌫
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleClear}
                  disabled={disabled}
                  whileTap={{ scale: 0.96 }}
                  className="min-w-[44px] min-h-[48px] sm:min-w-[52px] sm:min-h-[52px] flex items-center justify-center rounded-[12px] bg-white dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-gray-50 dark:hover:bg-gray-600/80 active:scale-95 transition-all duration-150 text-sm font-medium"
                >
                  Limpiar
                </motion.button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
