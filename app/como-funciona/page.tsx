"use client";

import { Navbar } from "@/components/navbar";
import { useI18n } from "@/lib/i18n-context";
import { motion } from "framer-motion";
import { FileText, CreditCard, CheckCircle, Download, ArrowRight } from "lucide-react";
import Link from "next/link";

const STEP_KEYS = [
  { title: "como_step1_title" as const, desc: "como_step1_desc" as const, details: "como_step1_details" as const },
  { title: "como_step2_title" as const, desc: "como_step2_desc" as const, details: "como_step2_details" as const },
  { title: "como_step3_title" as const, desc: "como_step3_desc" as const, details: "como_step3_details" as const },
  { title: "como_step4_title" as const, desc: "como_step4_desc" as const, details: "como_step4_details" as const },
];

const ICONS = [FileText, CreditCard, CheckCircle, Download];
const NUMBERS = ["01", "02", "03", "04"];
const EMOJIS = ["📋", "💳", "✍️", "📄"];

export default function ComoFuncionaPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 md:mb-16 px-4 pb-4"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-6 leading-tight text-foreground">
              <span className="gradient-text hover-title">{t("como_title")}</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted max-w-3xl mx-auto mt-2">
              {t("como_subtitle")}
            </p>
          </motion.div>

          <div className="space-y-12 md:space-y-16">
            {STEP_KEYS.map((step, index) => {
              const Icon = ICONS[index];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`flex flex-col ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  } items-center gap-8 md:gap-12`}
                >
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <div className="relative mx-auto sm:mx-0">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-blue-600/20 rounded-full flex items-center justify-center border-2 border-blue-500/50 transition-all duration-300 hover:scale-110 hover:rotate-6 group-hover:bg-blue-600/30">
                        <Icon className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-blue-500 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
                      </div>
                      <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 text-4xl sm:text-6xl md:text-7xl">
                        {EMOJIS[index]}
                      </div>
                      <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">
                        {NUMBERS[index]}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 glass-effect hover-box p-4 sm:p-6 md:p-8 rounded-xl border border-blue-500/40 w-full group">
                    <h2 className="hover-title text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 leading-tight text-foreground">{t(step.title)}</h2>
                    <p className="text-base sm:text-lg text-blue-500 mb-3 sm:mb-4 leading-relaxed">{t(step.desc)}</p>
                    <p className="text-muted text-sm sm:text-base md:text-lg leading-relaxed">
                      {t(step.details)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 flex flex-col items-center justify-center w-full"
          >
            <div className="glass-effect hover-box p-6 sm:p-8 md:p-12 rounded-xl border border-blue-500/40 max-w-3xl w-full text-center">
              <h2 className="hover-title text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight text-foreground">
                {t("como_ready_title")}
              </h2>
              <p className="text-muted mb-6 sm:mb-8 text-base sm:text-lg">
                {t("como_ready_subtitle")}
              </p>
              <Link
                href="/documentos"
                className="hover-button btn-primary inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-base sm:text-lg font-semibold glow-border w-full sm:w-auto justify-center text-white"
              >
                {t("como_see_documents")}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
