"use client";

import { useI18n } from "@/lib/i18n-context";
import { motion } from "framer-motion";
import { Mail, Shield, CreditCard } from "lucide-react";

export function AboutSection() {
  const { t } = useI18n();

  return (
    <section id="quienes-somos" className="relative z-10 pt-10 xs:pt-12 md:pt-16 pb-16 xs:pb-20 md:pb-28 px-3 xs:px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.25 }}
          className="text-center mb-10 xs:mb-16 pb-4"
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-4 xs:mb-6 leading-tight text-foreground">
            <span className="gradient-text hover-title">{t("about_title")}</span>
          </h2>
          <p className="text-sm xs:text-base sm:text-xl text-muted max-w-2xl mx-auto mt-2">
            {t("about_subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <p className="text-foreground/90 text-base md:text-lg leading-relaxed text-center max-w-2xl mx-auto">
            {t("about_who")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-4">
            <a
              href={`mailto:${t("about_contact_email")}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-500 hover:text-blue-400 font-medium text-sm transition-all duration-200"
            >
              <Mail className="w-4 h-4" />
              {t("about_contact_email")}
            </a>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 pt-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl border backdrop-blur-sm bg-blue-500/10 border-blue-500/30 dark:bg-white dark:border-white/30 dark:text-gray-900"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center dark:bg-blue-500/20">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm">{t("about_trust_title")}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-800">{t("about_trust_short")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl border backdrop-blur-sm bg-blue-500/10 border-blue-500/30 dark:bg-white dark:border-white/30 dark:text-gray-900"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center dark:bg-blue-500/20">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm">{t("about_payment_title")}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-800">{t("about_payment_short")}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
