"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";
import {
  User,
  AlertCircle,
  AlertTriangle,
  HeartCrack,
  Shield,
  Scale,
  ShieldCheck,
  Users,
  FileText,
  PenTool,
  Edit3,
  FileSignature,
  Briefcase,
  HandHelping,
  FilePlus,
  Gavel,
  BookOpen,
  CheckCircle,
  Check,
  MessageCircle,
  Eye,
  FileCheck,
  Delete,
  Eraser,
  ChevronDown,
  ChevronUp,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import {
  SERI_PHRASES,
  SERI_CATEGORIES,
  type SeriPhrase,
  type SeriPhraseCategory,
} from "@/lib/seri-phrases";
import { playSeriPhrase } from "@/lib/seri-audio";

const MAX_PROMPT_LENGTH = 500;

const ICON_MAP: Record<string, LucideIcon> = {
  User,
  AlertCircle,
  AlertTriangle,
  HeartCrack,
  Shield,
  Scale,
  ShieldCheck,
  Users,
  FileText,
  PenTool,
  Edit3,
  FileSignature,
  Briefcase,
  HandHelping,
  FilePlus,
  Gavel,
  BookOpen,
  CheckCircle,
  Check,
  MessageCircle,
  Eye,
  FileCheck,
};

function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? FileText;
}

interface SeriPhraseKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputId?: string;
}

export function SeriPhraseKeyboard({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  className = "",
  inputId = "seri-prompt",
}: SeriPhraseKeyboardProps) {
  const { t } = useI18n();
  const [expandedCategory, setExpandedCategory] = useState<SeriPhraseCategory | null>("situacion");
  const [spanishPreview, setSpanishPreview] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const text = value.trim();
    if (!text) {
      setSpanishPreview("");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null;
      try {
        const res = await fetch("/api/seri-translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptSeri: text }),
        });
        if (res.ok) {
          const { spanish } = await res.json();
          setSpanishPreview(spanish || "");
        } else {
          setSpanishPreview("");
        }
      } catch {
        setSpanishPreview("");
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const phrasesByCategory = useMemo(() => {
    const map = new Map<SeriPhraseCategory, SeriPhrase[]>();
    for (const p of SERI_PHRASES) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return map;
  }, []);

  const handlePhraseTap = useCallback(
    (phrase: SeriPhrase) => {
      if (disabled) return;
      const trimmed = value.trim();
      const separator = trimmed ? " " : "";
      const newText = trimmed + separator + phrase.seri;
      if (newText.length <= MAX_PROMPT_LENGTH) {
        onChange(newText);
        playSeriPhrase({ id: phrase.id, seri: phrase.seri });
      }
    },
    [value, onChange, disabled]
  );

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    if (value.length > 0) {
      const words = value.trimEnd().split(/\s+/);
      if (words.length > 1) {
        words.pop();
        onChange(words.join(" "));
      } else {
        onChange("");
      }
    }
  }, [value, onChange, disabled]);

  const handleClear = useCallback(() => {
    if (disabled) return;
    onChange("");
  }, [onChange, disabled]);

  const canAddMore = value.length < MAX_PROMPT_LENGTH;

  return (
    <div className={`seri-phrase-keyboard font-sans ${className}`}>
      <div
        className="w-full min-h-[100px] px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 text-foreground placeholder:text-gray-400 resize-y focus-within:ring-2 focus-within:ring-blue-400/30 focus-within:border-blue-400 text-[17px] shadow-sm"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}
      >
        <textarea
          id={inputId}
          name={inputId}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
          onBlur={onBlur}
          placeholder={placeholder ?? t("seri_placeholder")}
          disabled={disabled}
          maxLength={MAX_PROMPT_LENGTH}
          className="w-full min-h-[80px] bg-transparent border-0 resize-none focus:outline-none focus:ring-0 cursor-text"
          style={{ caretColor: "var(--foreground)" }}
          aria-label={t("seri_kb_aria")}
          rows={3}
        />
        <div className="flex justify-between items-center text-xs text-muted mt-1">
          <span>{value.length} / {MAX_PROMPT_LENGTH}</span>
          <span className="flex items-center gap-1 text-blue-500">
            <Volume2 className="w-3.5 h-3.5" />
            {t("seri_kb_tap_listen")}
          </span>
        </div>
        {spanishPreview && (
          <p className="mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-600/60 text-[11px] sm:text-xs text-muted italic">
            {spanishPreview}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {SERI_CATEGORIES.map((cat) => {
          const phrases = phrasesByCategory.get(cat.id) ?? [];
          const isExpanded = expandedCategory === cat.id;

          return (
            <div
              key={cat.id}
              className="rounded-2xl bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/50 shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors"
                aria-expanded={isExpanded}
              >
                <span>{t(cat.labelKey)}</span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted" />
                )}
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 flex flex-wrap gap-2">
                  {phrases.map((phrase) => {
                    const IconComp = getIconComponent(phrase.icon);
                    const canAdd = canAddMore && phrase.seri.length + value.length + 1 <= MAX_PROMPT_LENGTH;

                    return (
                      <motion.button
                        key={phrase.id}
                        type="button"
                        onClick={() => handlePhraseTap(phrase)}
                        disabled={disabled || !canAdd}
                        whileTap={{ scale: 0.96 }}
                        title={`${t(phrase.labelKey)} — ${phrase.seri}`}
                        className="flex flex-col items-center justify-center min-w-[72px] min-h-[72px] sm:min-w-[80px] sm:min-h-[80px] rounded-xl bg-white dark:bg-gray-700/80 text-foreground border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IconComp className="w-7 h-7 sm:w-8 sm:h-8 mb-1 text-blue-600 dark:text-blue-400" />
                        <span className="text-[11px] sm:text-xs text-center leading-tight line-clamp-2 px-1">
                          {t(phrase.labelKey)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <motion.button
          type="button"
          onClick={handleBackspace}
          disabled={disabled || value.length === 0}
          whileTap={{ scale: 0.96 }}
          className="min-w-[44px] min-h-[48px] sm:min-w-[52px] sm:min-h-[52px] flex items-center justify-center rounded-xl bg-white dark:bg-gray-700/80 text-foreground border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600/80 transition-all disabled:opacity-50"
          title={t("seri_kb_backspace")}
        >
          <Delete className="w-5 h-5" />
        </motion.button>
        <motion.button
          type="button"
          onClick={handleClear}
          disabled={disabled || value.length === 0}
          whileTap={{ scale: 0.96 }}
          className="min-w-[44px] min-h-[48px] sm:min-w-[52px] sm:min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600/80 transition-all disabled:opacity-50 text-sm font-medium px-3"
          title={t("seri_kb_clear_all")}
        >
          <Eraser className="w-4 h-4" />
          {t("seri_kb_clear")}
        </motion.button>
      </div>
    </div>
  );
}
