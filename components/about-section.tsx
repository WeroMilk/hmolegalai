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
          className="text-center mb-0"
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-4 xs:mb-6 leading-tight text-foreground">
            <span className="gradient-text hover-title">{t("about_title")}</span>
          </h2>
          <p className="text-sm xs:text-base sm:text-xl text-muted max-w-2xl mx-auto mt-2 mb-0">
            {t("about_subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <p className="text-foreground/90 text-base md:text-lg leading-relaxed text-center max-w-2xl mx-auto mt-1">
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

          <div className="grid sm:grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:gap-8 pt-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.25, delay: 0 }}
              className="glass-effect hover-box p-4 xs:p-6 sm:p-8 rounded-xl border border-blue-500/40 group min-h-[220px] xs:min-h-[280px] flex flex-col"
            >
              <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0">
                <Shield className="w-8 h-8 text-blue-500 transition-transform duration-300 group-hover:scale-125" />
              </div>
              <h3 className="hover-title text-base xs:text-lg sm:text-xl font-semibold mb-2 xs:mb-3 leading-tight text-foreground">{t("about_trust_title")}</h3>
              <p className="text-muted flex-grow leading-relaxed">{t("about_trust_short")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.25, delay: 0.03 }}
              className="glass-effect hover-box p-4 xs:p-6 sm:p-8 rounded-xl border border-blue-500/40 group min-h-[220px] xs:min-h-[280px] flex flex-col"
            >
              <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0">
                <CreditCard className="w-8 h-8 text-blue-500 transition-transform duration-300 group-hover:scale-125" />
              </div>
              <h3 className="hover-title text-base xs:text-lg sm:text-xl font-semibold mb-2 xs:mb-3 leading-tight text-foreground">{t("about_payment_title")}</h3>
              <p className="text-muted flex-grow leading-relaxed">{t("about_payment_short")}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
