"use client";

import { motion } from "framer-motion";
import { FileText, CreditCard, Download, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

const FEATURE_KEYS = [
  { title: "feat_choose", desc: "feat_choose_desc" },
  { title: "feat_pay", desc: "feat_pay_desc" },
  { title: "feat_form", desc: "feat_form_desc" },
  { title: "feat_download", desc: "feat_download_desc" },
] as const;

const ICONS = [FileText, CreditCard, CheckCircle, Download];

export function Features() {
  const { t } = useI18n();

  return (
    <section id="como-funciona" className="pt-16 xs:pt-24 pb-8 xs:pb-10 px-3 xs:px-4 sm:px-6 lg:px-8 overflow-visible">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.25 }}
          className="text-center mb-10 xs:mb-16 pb-4"
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-4 xs:mb-6 leading-tight text-foreground">
            <span className="gradient-text hover-title">{t("home_how_section_title")}</span>
          </h2>
          <p className="text-sm xs:text-base sm:text-xl text-muted max-w-2xl mx-auto mt-2">
            {t("home_how_section_subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 md:gap-8">
          {FEATURE_KEYS.map((feat, index) => {
            const Icon = ICONS[index];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="glass-effect hover-box p-4 xs:p-6 sm:p-8 rounded-xl border border-blue-500/40 group min-h-[220px] xs:min-h-[280px] flex flex-col"
              >
                <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0">
                  <Icon className="w-8 h-8 text-blue-500 transition-transform duration-300 group-hover:scale-125" />
                </div>
                <h3 className="hover-title text-base xs:text-lg sm:text-xl font-semibold mb-2 xs:mb-3 leading-tight text-foreground">{t(feat.title)}</h3>
                <p className="text-muted flex-grow leading-relaxed">{t(feat.desc)}</p>
                <div className="mt-4 text-blue-500 font-semibold flex-shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
