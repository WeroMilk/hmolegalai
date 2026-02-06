"use client";

import { useCallback, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Trash2, Mic } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { translations, type TranslationKey } from "@/lib/translations";
import { playSeriPhrase } from "@/lib/seri-audio";

/** Datos del quejoso para prellenar el documento (voz o recuadro). */
export interface SeriQuejosoData {
  nombre: string;
  domicilio: string;
  telefonoCorreo: string;
}

const INIT_QUEJOSO: SeriQuejosoData = { nombre: "", domicilio: "", telefonoCorreo: "" };

/** Opciones principales para "¿Qué quieres hacer?" en lengua comca'ac. Una sola opción. Sin duplicar "documento". */
const MAIN_OPTIONS: { id: string; labelKey: TranslationKey }[] = [
  { id: "sit-2", labelKey: "seri_phrase_sit_2" }, // Quiero demandar
  { id: "ayu-3", labelKey: "seri_phrase_ayu_3" }, // Quiero un documento
  { id: "sit-3", labelKey: "seri_phrase_sit_3" }, // Tengo un problema
  { id: "jus-1", labelKey: "seri_phrase_jus_1" }, // Justicia
];

const QUEJOSO_FIELDS: { key: keyof SeriQuejosoData; labelKey: TranslationKey; placeholderKey: TranslationKey }[] = [
  { key: "nombre", labelKey: "amparo_q_quejoso_nombre", placeholderKey: "amparo_q_quejoso_nombre_ph" },
  { key: "domicilio", labelKey: "amparo_q_quejoso_domicilio", placeholderKey: "amparo_q_quejoso_domicilio_ph" },
  { key: "telefonoCorreo", labelKey: "amparo_q_quejoso_telefono_correo", placeholderKey: "amparo_q_quejoso_telefono_correo_ph" },
];

interface SeriSimpleChoiceProps {
  value: string[];
  onChange: (phrases: string[]) => void;
  quejosoData: SeriQuejosoData;
  onQuejosoChange: (data: SeriQuejosoData) => void;
  disabled?: boolean;
  onGenerate?: () => void;
}

function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<unknown>(null);

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

/** Un recuadro para un dato del quejoso: etiqueta en comcaac + español, input de texto y botón de voz. */
function QuejosoRecuadro({
  value,
  onChange,
  labelKey,
  placeholderKey,
  getSeriText,
  getSpanishLabel,
  t,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  labelKey: TranslationKey;
  placeholderKey: TranslationKey;
  getSeriText: (k: TranslationKey) => string;
  getSpanishLabel: (k: TranslationKey) => string;
  t: (k: TranslationKey) => string;
  disabled?: boolean;
}) {
  const { startListening, listening } = useVoiceInput((text) => {
    onChange(value ? `${value} ${text}` : text);
  });
  const placeholder = t(placeholderKey);
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <div className="mb-3 flex flex-col gap-1">
        <span className="text-base font-medium text-foreground">{getSeriText(labelKey)}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{getSpanishLabel(labelKey)}</span>
      </div>
      <div className="flex gap-3">
        <input
          id={`seri-simple-${labelKey}`}
          name={labelKey}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={getSpanishLabel(labelKey)}
        />
        <button
          type="button"
          onClick={startListening}
          disabled={disabled || listening}
          aria-label={t("seri_voice_input")}
          className="shrink-0 rounded-lg border border-border bg-muted/50 p-2.5 text-muted hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <Mic className={`w-5 h-5 ${listening ? "text-red-500 animate-pulse" : ""}`} />
        </button>
      </div>
    </div>
  );
}

export function SeriSimpleChoice({
  value,
  onChange,
  quejosoData,
  onQuejosoChange,
  disabled,
  onGenerate,
}: SeriSimpleChoiceProps) {
  const { t } = useI18n();
  const getSeriText = useCallback((labelKey: TranslationKey) => {
    return (translations.seri[labelKey] ?? translations.es[labelKey]) as string;
  }, []);

  const getSpanishLabel = useCallback((labelKey: TranslationKey) => {
    return (translations.es[labelKey] ?? "") as string;
  }, []);

  const handleQuejosoField = useCallback(
    (key: keyof SeriQuejosoData, value: string) => {
      onQuejosoChange({ ...quejosoData, [key]: value });
    },
    [quejosoData, onQuejosoChange]
  );

  const clearSelection = useCallback(() => {
    onChange([]);
    onQuejosoChange(INIT_QUEJOSO);
  }, [onChange, onQuejosoChange]);

  const handleOptionTap = useCallback(
    (optionId: string, labelKey: TranslationKey) => {
      if (disabled) return;
      const seriText = getSeriText(labelKey);
      playSeriPhrase({ id: optionId, seri: seriText });
      // Solo una opción: si ya está elegida, quitar; si no, dejar solo esta
      if (value.length > 0 && value[0] === seriText) {
        onChange([]);
      } else {
        onChange([seriText]);
      }
    },
    [disabled, getSeriText, value, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {MAIN_OPTIONS.map((opt) => {
          const seriLabel = getSeriText(opt.labelKey);
          const isSelected = value.length > 0 && value[0] === seriLabel;
          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => handleOptionTap(opt.id, opt.labelKey)}
              whileTap={{ scale: 0.98 }}
              className={`w-full min-h-[48px] sm:min-h-[52px] px-3 py-2.5 rounded-xl border-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98] flex flex-col items-start justify-center gap-0.5 ${
                isSelected
                  ? "border-green-500/60 bg-green-500/20 text-foreground"
                  : "border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-foreground"
              }`}
              aria-label={`${seriLabel} (${getSpanishLabel(opt.labelKey)})`}
              aria-pressed={isSelected}
            >
              <span className="text-sm font-medium">{seriLabel}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{getSpanishLabel(opt.labelKey)}</span>
            </motion.button>
          );
        })}
      </div>

      {value.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-green-500/40 bg-green-500/10 p-4 sm:p-5"
        >
          <p className="text-sm font-medium text-muted mb-2">{t("seri_box_label")}</p>
          <p className="text-base text-foreground whitespace-pre-wrap mb-6">
            {value.join(" ")}
          </p>

          <div className="space-y-4 sm:space-y-5">
            <p className="text-sm font-medium text-muted">{t("amparo_q_quejoso_title")}</p>
            {QUEJOSO_FIELDS.map((field) => (
              <QuejosoRecuadro
                key={field.key}
                value={quejosoData[field.key]}
                onChange={(v) => handleQuejosoField(field.key, v)}
                labelKey={field.labelKey}
                placeholderKey={field.placeholderKey}
                getSeriText={getSeriText}
                getSpanishLabel={getSpanishLabel}
                t={t}
                disabled={disabled}
              />
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-green-500/20 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearSelection}
              aria-label={t("seri_kb_clear")}
              className="p-2.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-card"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            {onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={disabled}
                className="text-sm px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {t("seri_btn_generate")}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
