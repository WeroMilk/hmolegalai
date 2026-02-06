"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";
import {
  User,
  Landmark,
  FileCheck,
  BookOpen,
  ClipboardList,
  Lightbulb,
  Target,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Scale,
  Building2,
  Building,
  HelpCircle,
  Gavel,
  FileText,
  XCircle,
  FileQuestion,
  Equal,
  Shield,
  Heart,
  TreePine,
  Briefcase,
  FileEdit,
  AlertTriangle,
  Home,
  Receipt,
  Mic,
  MessageSquare,
  FileX,
  ListOrdered,
  Ban,
  UserX,
  AlertOctagon,
  MoreHorizontal,
  RotateCcw,
  CheckCircle,
  Pause,
  Copy,
  type LucideIcon,
} from "lucide-react";
import { AMPARO_STEPS, type AmparoStep, type AmparoOption, type AmparoQuestionnaireData } from "@/lib/seri-amparo-steps";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { playSeriPhrase } from "@/lib/seri-audio";

const ICON_MAP: Record<string, LucideIcon> = {
  User,
  Landmark,
  FileCheck,
  BookOpen,
  ClipboardList,
  Lightbulb,
  Target,
  MapPin,
  Scale,
  Building2,
  Building,
  HelpCircle,
  Gavel,
  FileText,
  XCircle,
  FileQuestion,
  Equal,
  Shield,
  Heart,
  TreePine,
  Briefcase,
  FileEdit,
  AlertTriangle,
  Home,
  Receipt,
  Mic,
  MessageSquare,
  FileX,
  ListOrdered,
  Ban,
  UserX,
  AlertOctagon,
  MoreHorizontal,
  RotateCcw,
  CheckCircle,
  Pause,
  Copy,
};

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? FileText;
}

const initialData: AmparoQuestionnaireData = {
  quejoso: { nombre: "", domicilio: "" },
  autoridad: { opcionIds: [], texto: "" },
  acto: { opcionIds: [], numeroExpediente: "", fecha: "" },
  preceptos: { opcionIds: [], otros: "" },
  hechos: { opcionIds: [], relatoSeri: "" },
  conceptos: { opcionIds: [], otros: "" },
  pretensiones: { opcionIds: [], otros: "" },
  domicilio: { direccion: "", mismoQueQuejoso: false },
};

interface SeriAmparoQuestionnaireProps {
  disabled?: boolean;
  onSubmit: (data: AmparoQuestionnaireData) => void;
}

export function SeriAmparoQuestionnaire({ disabled = false, onSubmit }: SeriAmparoQuestionnaireProps) {
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<AmparoQuestionnaireData>(initialData);

  const step = AMPARO_STEPS[stepIndex];
  const totalSteps = AMPARO_STEPS.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  const toggleOption = useCallback(
    (optionId: string) => {
      if (disabled) return;
      const stepData = data[step.id as keyof AmparoQuestionnaireData];
      if (!stepData || typeof stepData !== "object" || !("opcionIds" in stepData)) return;

      const opcionIds = [...(stepData.opcionIds || [])];
      const idx = opcionIds.indexOf(optionId);
      if (step.multiSelect) {
        if (idx >= 0) opcionIds.splice(idx, 1);
        else opcionIds.push(optionId);
      } else {
        opcionIds.length = 0;
        if (idx < 0) opcionIds.push(optionId);
      }

      setData((prev) => ({
        ...prev,
        [step.id]: { ...stepData, opcionIds },
      }));
    },
    [data, step.id, step.multiSelect, disabled]
  );

  const setTextField = useCallback(
    (fieldKey: string, value: string) => {
      const stepData = data[step.id as keyof AmparoQuestionnaireData];
      if (!stepData || typeof stepData !== "object") return;

      setData((prev) => ({
        ...prev,
        [step.id]: { ...stepData, [fieldKey]: value },
      }));
    },
    [data, step.id]
  );

  const handleDomicilioMismo = useCallback(() => {
    setData((prev) => ({
      ...prev,
      domicilio: {
        direccion: prev.quejoso.domicilio,
        mismoQueQuejoso: true,
      },
    }));
  }, []);

  const canProceed = (): boolean => {
    const stepData = data[step.id as keyof AmparoQuestionnaireData];
    if (!stepData) return false;

    if (step.id === "quejoso") {
      const q = stepData as AmparoQuestionnaireData["quejoso"];
      return !!(q.nombre?.trim() && q.domicilio?.trim());
    }
    if (step.id === "autoridad") {
      const a = stepData as AmparoQuestionnaireData["autoridad"];
      return a.opcionIds?.length > 0;
    }
    if (step.id === "acto") {
      const a = stepData as AmparoQuestionnaireData["acto"];
      return a.opcionIds?.length > 0;
    }
    if (step.id === "preceptos" || step.id === "hechos" || step.id === "conceptos" || step.id === "pretensiones") {
      const s = stepData as { opcionIds?: string[] };
      return (s.opcionIds?.length ?? 0) > 0;
    }
    if (step.id === "domicilio") {
      const d = stepData as AmparoQuestionnaireData["domicilio"];
      return !!(d.direccion?.trim() || d.mismoQueQuejoso);
    }
    return true;
  };

  const handleNext = () => {
    if (isLast) {
      const finalData = { ...data };
      if (finalData.domicilio.mismoQueQuejoso) {
        finalData.domicilio.direccion = finalData.quejoso.domicilio;
      }
      onSubmit(finalData);
    } else {
      setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
    }
  };

  const handlePrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const stepData = data[step.id as keyof AmparoQuestionnaireData] as Record<string, unknown> | undefined;
  const opcionIds = (stepData?.opcionIds as string[]) ?? [];

  return (
    <div className="seri-amparo-questionnaire space-y-3 flex flex-col min-h-0">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted flex-shrink-0">
        <span>{t("amparo_q_step", { n: stepIndex + 1, total: totalSteps })}</span>
        <div className="flex gap-0.5">
          {AMPARO_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-4 sm:w-5 rounded-full transition-colors ${
                i === stepIndex ? "bg-blue-600" : i < stepIndex ? "bg-blue-400/60" : "bg-gray-200 dark:bg-gray-700"
              }`}
              aria-hidden
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-2 flex-1 min-h-0"
        >
          {/* Step header */}
          <div className="flex items-start gap-2 flex-shrink-0">
            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center">
              {(() => {
                const Icon = getIcon(step.icon);
                return <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />;
              })()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground leading-tight">{t(step.titleKey)}</h3>
              <p className="text-[11px] text-muted leading-tight">{t(step.descKey)}</p>
            </div>
          </div>

          {/* Text inputs */}
          {step.textInputs?.map((ti) => (
            <div key={ti.fieldKey} className="space-y-1">
              <label htmlFor={`seri-amparo-${step.id}-${ti.fieldKey}`} className="block text-xs font-medium text-foreground">{t(ti.labelKey)}</label>
              <Input
                id={`seri-amparo-${step.id}-${ti.fieldKey}`}
                name={ti.fieldKey}
                autoComplete="off"
                value={String(stepData?.[ti.fieldKey] ?? "")}
                onChange={(e) => setTextField(ti.fieldKey, e.target.value)}
                placeholder={t(ti.placeholderKey)}
                disabled={disabled}
                className="text-sm h-9"
              />
            </div>
          ))}

          {/* Domicilio: "mismo" option */}
          {step.id === "domicilio" && (
            <button
              type="button"
              onClick={handleDomicilioMismo}
              className={`flex items-center gap-2 w-full p-2.5 rounded-lg border-2 transition-all ${
                (stepData?.mismoQueQuejoso as boolean)
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
              }`}
            >
              <Copy className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-left">{t("amparo_opt_domicilio_mismo")}</span>
            </button>
          )}

          {/* Icon options */}
          {step.options.length > 0 && (
            <>
              <p className="text-[10px] text-muted">{t("amparo_q_select")}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {step.options
                  .filter((o) => step.id !== "domicilio" || o.id !== "dom-mismo")
                  .map((opt: AmparoOption) => {
                    const IconComp = getIcon(opt.icon);
                    const selected = opcionIds.includes(opt.id);
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          toggleOption(opt.id);
                          playSeriPhrase({ id: opt.id, seri: opt.valueSeri });
                        }}
                        disabled={disabled}
                        whileTap={{ scale: 0.96 }}
                        title={`${t(opt.labelKey)} — ${opt.valueSeri}`}
                        className={`flex flex-col items-center justify-center min-w-[64px] min-h-[64px] sm:min-w-[72px] sm:min-h-[72px] rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-1 ${
                          selected
                            ? "border-blue-500 bg-blue-500/15 shadow-md"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                        }`}
                      >
                        <IconComp
                          className={`w-5 h-5 sm:w-6 sm:h-6 mb-0.5 ${
                            selected ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-[9px] sm:text-[10px] text-center leading-tight line-clamp-2 px-0.5 ${
                            selected ? "text-blue-700 dark:text-blue-300 font-medium" : "text-muted"
                          }`}
                        >
                          {t(opt.labelKey)}
                        </span>
                      </motion.button>
                    );
                  })}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between gap-2 pt-2 border-t border-border flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={isFirst || disabled}
          className="min-w-[80px] h-8 text-xs"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t("amparo_q_prev")}
        </Button>
        <Button
          size="sm"
          onClick={handleNext}
          disabled={!canProceed() || disabled}
          className="min-w-[110px] h-8 text-xs bg-blue-600 hover:bg-blue-700"
        >
          {isLast ? t("seri_btn_generate") : t("amparo_q_next")}
          {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
