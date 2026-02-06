"use client";

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { translations, type TranslationKey } from "@/lib/translations";
import { LEGAL_DOCUMENTS } from "@/lib/documents";
import { DOC_NAME_DESC_KEYS } from "@/lib/translations";
import { playSeriPhrase } from "@/lib/seri-audio";
import type { LegalDocument } from "@/lib/documents";

export interface SeriWizardData {
  selectedDoc: LegalDocument | null;
  nombre: string;
  domicilio: string;
  telefonoCorreo: string;
  resumen: string;
}

const INIT_DATA: SeriWizardData = {
  selectedDoc: null,
  nombre: "",
  domicilio: "",
  telefonoCorreo: "",
  resumen: "",
};

const STEPS = [
  { id: "doc", field: null as keyof SeriWizardData | null, emojis: "📄 📋 ⚖️ 📜 📑 🏛️" },
  { id: "nombre", field: "nombre" as const, emojis: "👤 👨 👩 🪪", labelKey: "amparo_q_quejoso_nombre" as TranslationKey, placeholderKey: "amparo_q_quejoso_nombre_ph" as TranslationKey },
  { id: "domicilio", field: "domicilio" as const, emojis: "🏠 📍 🗺️ 📬", labelKey: "amparo_q_quejoso_domicilio" as TranslationKey, placeholderKey: "amparo_q_quejoso_domicilio_ph" as TranslationKey },
  { id: "telefonoCorreo", field: "telefonoCorreo" as const, emojis: "📞 📱 ✉️ 📧", labelKey: "amparo_q_quejoso_telefono_correo" as TranslationKey, placeholderKey: "amparo_q_quejoso_telefono_correo_ph" as TranslationKey },
  { id: "resumen", field: "resumen" as const, emojis: "👤 👥 🔫 ⚰️ 💀 🤕   💰 💵 💸 🏃 📦 🦹   💳 📄 🎭   👊 🤜 ⚖️", labelKey: "seri_resumen_label" as TranslationKey, placeholderKey: "seri_resumen_placeholder" as TranslationKey, maxChars: 500 },
];

function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const rec = new SpeechRecognitionAPI();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "es-MX";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[e.results.length - 1];
      if (t.isFinal && t.length > 0) onResult(t[0].transcript.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [onResult]);

  return { startListening, listening };
}

interface SeriWizardFlowProps {
  data: SeriWizardData;
  onChange: (data: SeriWizardData) => void;
  disabled?: boolean;
  onGenerate?: () => void;
}

export function SeriWizardFlow({ data, onChange, disabled, onGenerate }: SeriWizardFlowProps) {
  const { t, locale } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const isSeri = locale === "seri";

  const getSeriText = useCallback((labelKey: TranslationKey) => {
    return (translations.seri[labelKey] ?? translations.es[labelKey]) as string;
  }, []);

  const getSpanishLabel = useCallback((labelKey: TranslationKey) => {
    return (translations.es[labelKey] ?? "") as string;
  }, []);

  const { startListening, listening } = useVoiceInput((text) => {
    const step = STEPS[stepIndex];
    if (step?.field && step.field in data) {
      const current = String((data as unknown as Record<string, string>)[step.field] ?? "");
      onChange({ ...data, [step.field]: current ? `${current} ${text}` : text });
    }
  });

  const currentStep = STEPS[stepIndex];
  const isDocStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;
  const fieldVal = currentStep?.field ? String((data as unknown as Record<string, string>)[currentStep.field] ?? "") : "";
  const canGoNext = isDocStep ? !!data.selectedDoc : isLastStep ? true : !!fieldVal.trim();
  const canGoBack = stepIndex > 0;

  const handleFieldChange = useCallback(
    (value: string) => {
      if (!currentStep?.field) return;
      const trimmed = currentStep.maxChars ? value.slice(0, currentStep.maxChars) : value;
      onChange({ ...data, [currentStep.field!]: trimmed });
    },
    [data, onChange, currentStep]
  );

  const handleNext = useCallback(() => {
    if (isLastStep && onGenerate) {
      onGenerate();
    } else if (canGoNext && stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }, [isLastStep, onGenerate, canGoNext, stepIndex]);

  const handleBack = useCallback(() => {
    if (canGoBack) setStepIndex((i) => i - 1);
  }, [canGoBack]);

  const handleDocTap = useCallback(
    (doc: LegalDocument) => {
      if (disabled) return;
      const keys = DOC_NAME_DESC_KEYS[doc.id];
      const seriName = keys && isSeri ? getSeriText(keys.name) : doc.name;
      playSeriPhrase({ id: doc.id, seri: seriName });
      if (data.selectedDoc?.id === doc.id) {
        onChange({ ...data, selectedDoc: null });
      } else {
        onChange({ ...data, selectedDoc: doc });
      }
    },
    [disabled, data, onChange, isSeri, getSeriText]
  );

  const fieldValue = currentStep?.field ? (data as unknown as Record<string, string>)[currentStep.field] ?? "" : "";

  return (
    <div className="flex flex-col">
      <AnimatePresence mode="wait">
        {isDocStep ? (
          <motion.div
            key="doc"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-2 sm:space-y-3 md:space-y-4"
          >
            <div className="mb-2 sm:mb-3 md:mb-4 flex flex-col gap-1 sm:gap-1.5 md:gap-2">
              <p className="text-xl sm:text-2xl md:text-2xl lg:text-3xl mb-0.5 sm:mb-1" role="img" aria-hidden>{currentStep?.emojis}</p>
              <p className="text-sm sm:text-base md:text-base lg:text-lg font-semibold text-foreground">{getSeriText("seri_question_what_doc" as TranslationKey)}</p>
              <p className="text-xs sm:text-xs md:text-xs lg:text-sm text-gray-500 dark:text-gray-400">{getSpanishLabel("seri_question_what_doc" as TranslationKey)}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4">
              {LEGAL_DOCUMENTS.map((doc) => {
                const keys = DOC_NAME_DESC_KEYS[doc.id];
                const name = keys ? t(keys.name) : doc.name;
                const desc = keys ? t(keys.desc) : doc.description;
                const isSelected = data.selectedDoc?.id === doc.id;
                // En español, usar menos líneas para evitar que se encimen, pero permitir expansión natural
                const descLineClamp = locale === "es" ? "line-clamp-2" : "line-clamp-2 sm:line-clamp-2 md:line-clamp-3 lg:line-clamp-4";
                return (
                  <motion.button
                    key={doc.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDocTap(doc)}
                    whileTap={{ scale: 0.98 }}
                    className={`text-left px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4 rounded-xl border-2 transition-colors flex flex-col gap-1.5 sm:gap-2 ${
                      isSelected ? "border-green-500/60 bg-green-500/20" : "border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20"
                    }`}
                  >
                    <span className="text-lg sm:text-xl md:text-xl lg:text-2xl flex-shrink-0">{doc.icon}</span>
                    <span className="text-xs sm:text-sm md:text-sm lg:text-base font-medium break-words leading-tight">{name}</span>
                    <span className={`text-[10px] sm:text-xs md:text-xs lg:text-sm text-muted ${descLineClamp} break-words leading-relaxed`}>{desc}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={currentStep?.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col flex-shrink-0"
          >
            <div className="rounded-xl border-2 border-blue-500/40 bg-background/50 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl" role="img" aria-hidden>{currentStep?.emojis}</span>
                <div>
                  <span className="text-base font-medium text-foreground block">
                    {currentStep?.labelKey && (isSeri ? getSeriText(currentStep.labelKey) : t(currentStep.labelKey))}
                  </span>
                  <span className="text-xs text-muted">{currentStep?.labelKey && getSpanishLabel(currentStep.labelKey)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {currentStep?.maxChars ? (
                  <textarea
                    value={fieldValue}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    placeholder={t(currentStep.placeholderKey)}
                    disabled={disabled}
                    maxLength={currentStep.maxChars}
                    rows={3}
                    className="flex-1 min-w-0 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    placeholder={currentStep?.placeholderKey ? t(currentStep.placeholderKey) : ""}
                    disabled={disabled}
                    className="flex-1 min-w-0 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                <button
                  type="button"
                  onClick={startListening}
                  disabled={disabled || listening}
                  aria-label={t("seri_voice_input")}
                  className="shrink-0 rounded-lg border border-border bg-muted/50 p-2.5 text-muted hover:bg-muted hover:text-foreground disabled:opacity-50 h-[42px]"
                >
                  <Mic className={`w-5 h-5 ${listening ? "text-red-500 animate-pulse" : ""}`} />
                </button>
              </div>
              {currentStep?.maxChars && (
                <span className="text-xs text-muted">{fieldValue.length}/{currentStep.maxChars}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex items-center justify-between gap-3 lg:gap-4 mt-6 sm:mt-7 md:mt-8 lg:mt-10 pt-3 sm:pt-3.5 md:pt-4 lg:pt-5 border-t border-border`}>
        <button
          type="button"
          onClick={handleBack}
          disabled={!canGoBack || disabled}
          className="flex items-center gap-2 px-4 py-2.5 lg:px-5 lg:py-3 rounded-lg border border-border text-muted hover:text-foreground hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>{t("amparo_q_prev")}</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext || disabled}
          className="flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base font-medium"
        >
          {isLastStep ? (
            <>
              <span>{t("seri_btn_generate")}</span>
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              <span>{t("amparo_q_next")}</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export { INIT_DATA };
