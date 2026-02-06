"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-screen flex items-start sm:items-center justify-center pt-32 sm:pt-28 md:pt-24 pb-2 sm:pb-4">
      <div className="relative z-10 max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 text-center w-full min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 xs:mb-4 md:mb-6 leading-tight">
            <span className="block text-foreground hover-title mb-2">{t("home_hero_title1")}</span>
            {" "}
            <span className="block gradient-text hover-title">{t("home_hero_title2")}</span>
          </h1>

          <p className="text-sm xs:text-base sm:text-xl md:text-2xl text-muted mb-6 xs:mb-8 md:mb-12 max-w-3xl mx-auto px-2 xs:px-4">
            {t("home_hero_subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 xs:gap-3 sm:gap-4 justify-center items-center mb-8 xs:mb-12 md:mb-16 px-2 xs:px-4">
            <Link
              href="/como-funciona"
              className="hover-button w-full sm:w-auto px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-3.5 bg-white hover:bg-white/95 border border-border dark:border-transparent rounded-lg text-sm xs:text-base sm:text-lg font-semibold text-center text-blue-600 hover:text-blue-700 shadow-sm"
            >
              {t("home_how_it_works")}
            </Link>
            <Link
              href="/documentos"
              className="hover-button btn-primary w-full sm:w-auto px-4 xs:px-6 sm:px-8 py-2 xs:py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm xs:text-base sm:text-lg font-semibold border-2 border-transparent text-center text-white"
            >
              {t("home_see_documents")}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 xs:gap-8 sm:gap-10 md:gap-12 max-w-4xl mx-auto px-2 xs:px-4 mt-20 xs:mt-24 sm:mt-20 md:mt-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-5 text-foreground/50 group-hover:text-blue-500/80 transition-colors duration-300">
                <Zap className="w-7 h-7 stroke-[1.5]" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-foreground tracking-tight mb-2">{t("home_fast")}</h3>
              <p className="text-sm text-muted/90 leading-relaxed max-w-[220px]">{t("home_fast_desc")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center text-center sm:border-x border-black/30 dark:border-white/30 sm:px-8 md:px-12"
            >
              <div className="mb-5 text-foreground/50 group-hover:text-blue-500/80 transition-colors duration-300">
                <Shield className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-foreground tracking-tight mb-2">{t("home_secure")}</h3>
              <p className="text-sm text-muted/90 leading-relaxed max-w-[220px]">{t("home_secure_desc")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-5 text-foreground/50 group-hover:text-blue-500/80 transition-colors duration-300">
                <Sparkles className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-foreground tracking-tight mb-2">{t("home_smart")}</h3>
              <p className="text-sm text-muted/90 leading-relaxed max-w-[220px]">{t("home_smart_desc")}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
