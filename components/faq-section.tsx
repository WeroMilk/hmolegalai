"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";
import { HelpCircle } from "lucide-react";

const FAQ_KEYS = [
  { q: "faq_1_q", a: "faq_1_a" },
  { q: "faq_2_q", a: "faq_2_a" },
  { q: "faq_3_q", a: "faq_3_a" },
  { q: "faq_4_q", a: "faq_4_a" },
] as const;

export function FAQSection() {
  const { t } = useI18n();

  return (
    <section id="preguntas-frecuentes" className="pt-6 xs:pt-8 md:pt-16 pb-12 xs:pb-16 px-3 xs:px-4 sm:px-6 lg:px-8 overflow-visible">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.25 }}
          className="text-center mb-8 xs:mb-10"
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-3 xs:mb-4 leading-tight text-foreground">
            <span className="gradient-text hover-title">{t("faq_section_title")}</span>
          </h2>
          <p className="text-sm xs:text-base text-muted">
            {t("faq_section_subtitle")}
          </p>
        </motion.div>

        <ul className="space-y-4">
          {FAQ_KEYS.map((item, index) => (
            <motion.li
              key={item.q}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="rounded-xl border border-teal-500/30 bg-card/60 backdrop-blur-sm p-4 xs:p-5 hover:border-teal-500/50 transition-colors"
            >
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm xs:text-base mb-1.5">
                    {t(item.q)}
                  </p>
                  <p className="text-muted text-sm xs:text-base leading-relaxed">
                    {t(item.a)}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
