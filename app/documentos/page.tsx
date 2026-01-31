"use client";

import { DocumentCatalog } from "@/components/document-catalog";
import { Navbar } from "@/components/navbar";
import { LEGAL_DOCUMENTS } from "@/lib/documents";
import { DOC_NAME_DESC_KEYS, DOC_POTENTIAL_KEYS } from "@/lib/translations";
import { useI18n } from "@/lib/i18n-context";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DocumentosPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-28 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center mb-4 md:mb-6"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight text-foreground">
              <span className="gradient-text hover-title">{t("catalog_title")}</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted max-w-3xl mx-auto mt-2">
              {t("catalog_subtitle")}
            </p>
            <div className="mt-8 mx-auto max-w-3xl p-4 rounded-lg border-2 border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-200 dark:bg-amber-500/15 dark:border-amber-400/50">
              <p className="text-sm md:text-base font-medium leading-relaxed">
                {t("legal_catalog_warning")}
              </p>
            </div>
          </motion.div>

          <DocumentCatalog reduceTopPadding />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.25 }}
            className="mt-24 md:mt-32"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center leading-tight pb-2 text-foreground">
              <span className="gradient-text hover-title">{t("catalog_details_title")}</span>
            </h2>

            <div className="space-y-8 md:space-y-12">
              {LEGAL_DOCUMENTS.map((doc, index) => {
                const nameDesc = DOC_NAME_DESC_KEYS[doc.id];
                const name = nameDesc ? t(nameDesc.name) : doc.name;
                const desc = nameDesc ? t(nameDesc.desc) : doc.description;
                const potentialKey = DOC_POTENTIAL_KEYS[doc.id];
                const potential = potentialKey ? t(potentialKey) : t("catalog_legal_valid");
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                    className="glass-effect hover-box p-6 md:p-8 rounded-xl border border-blue-500/40 group"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      <div className="text-5xl md:text-6xl flex-shrink-0 origin-left transition-transform duration-300 ease-out group-hover:scale-125 group-hover:translate-x-1">{doc.icon}</div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                          <h3 className="hover-title text-2xl md:text-3xl font-bold leading-tight text-foreground">{name}</h3>
                          <span className="text-2xl md:text-3xl font-bold text-blue-500">
                            ${doc.price} <span className="text-sm text-muted font-normal">MXN</span>
                          </span>
                        </div>
                        <p className="text-muted text-lg mb-4">{desc}</p>
                        <div className="mt-6 p-4 bg-blue-600/10 rounded-lg border border-blue-500/20 hover-box">
                          <h4 className="hover-title glow-white font-semibold text-blue-500 mb-2">💡 {t("catalog_potential_usage")}</h4>
                          <p className="text-muted text-sm md:text-base">{potential}</p>
                        </div>
                        <Link
                          href={`/documentos/${doc.id}`}
                          className="hover-button inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg border border-blue-500/50 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                        >
                          {t("catalog_generate")}
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
