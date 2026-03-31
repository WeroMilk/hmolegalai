"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative flex items-start sm:items-center justify-center pt-24 sm:pt-24 md:pt-20 pb-8 sm:pb-4">
      <div className="relative z-10 max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 text-center w-full min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="text-[1.95rem] xs:text-[2.35rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-2 xs:mb-3 md:mb-6 leading-[1.08]">
            <span className="block text-foreground hover-title mb-1">{t("home_hero_title1")}</span>
            <span className="block text-teal-600 dark:text-teal-400 hover-title">{t("home_hero_title1_name")}</span>
            {t("home_hero_title2") ? (
              <span className="block gradient-text hover-title mt-2">{t("home_hero_title2")}</span>
            ) : null}
          </h1>

          <p className="text-sm xs:text-base sm:text-xl md:text-2xl text-muted mb-4 xs:mb-6 md:mb-12 max-w-3xl mx-auto px-2 xs:px-4">
            {t("home_hero_subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 xs:gap-3 sm:gap-4 justify-center items-center mb-5 xs:mb-7 md:mb-16 px-2 xs:px-4">
            <Link
              href="/consulta"
              className="hover-button btn-primary w-full sm:w-auto px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-3.5 min-h-[44px] xs:min-h-[48px] sm:min-h-[52px] bg-teal-600 hover:bg-teal-700 rounded-lg text-sm xs:text-base sm:text-lg font-semibold text-center text-white border-2 border-transparent flex items-center justify-center"
            >
              {t("nav_consulta")}
            </Link>
            <Link
              href="/tienda"
              className="hover-button w-full sm:w-auto px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-3.5 bg-white hover:bg-white/95 border border-border dark:border-transparent rounded-lg text-sm xs:text-base sm:text-lg font-semibold text-center text-teal-600 hover:text-teal-700 shadow-sm flex items-center justify-center min-h-[44px] xs:min-h-[48px] sm:min-h-[52px]"
            >
              {t("home_see_documents")}
            </Link>
          </div>

          <p className="text-sm font-medium text-teal-600 dark:text-teal-400 mb-3 xs:mb-4 sm:mb-8">
            {t("home_shipping")}
          </p>

          <div className="grid grid-cols-3 gap-2 xs:gap-3 sm:gap-10 md:gap-12 max-w-4xl mx-auto px-1 xs:px-2 sm:px-4 mt-4 xs:mt-5 mb-3 xs:mb-6 sm:mt-12 sm:mb-0 md:mt-10 md:mb-0">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-2 sm:mb-5 text-foreground/50 group-hover:text-teal-500/80 transition-colors duration-300">
                <Zap className="w-5 h-5 sm:w-7 sm:h-7 stroke-[1.5]" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-foreground tracking-tight mb-1 sm:mb-2">{t("home_fast")}</h3>
              <p className="text-xs sm:text-sm text-muted/90 leading-tight sm:leading-relaxed max-w-[220px]">{t("home_fast_desc")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center text-center border-x border-black/30 dark:border-white/30 px-2 sm:px-8 md:px-12"
            >
              <div className="mb-2 sm:mb-5 text-foreground/50 group-hover:text-teal-500/80 transition-colors duration-300">
                <Shield className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-foreground tracking-tight mb-1 sm:mb-2">{t("home_secure")}</h3>
              <p className="text-xs sm:text-sm text-muted/90 leading-tight sm:leading-relaxed max-w-[220px]">{t("home_secure_desc")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-2 sm:mb-5 text-foreground/50 group-hover:text-teal-500/80 transition-colors duration-300">
                <Sparkles className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-foreground tracking-tight mb-1 sm:mb-2">{t("home_smart")}</h3>
              <p className="text-xs sm:text-sm text-muted/90 leading-tight sm:leading-relaxed max-w-[220px]">{t("home_smart_desc")}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
