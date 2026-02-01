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
    <div className="min-h-screen text-foreground">
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
                    className="glass-effect hover-box p-4 xs:p-6 sm:p-8 rounded-xl border border-blue-500/40 group min-h-[220px] xs:min-h-[280px] flex flex-col"
                  >
                    <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 text-3xl">
                      {doc.icon}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <h3 className="hover-title text-xl md:text-2xl font-bold leading-tight text-foreground">{name}</h3>
                      <span className="text-xl md:text-2xl font-bold text-blue-500">
                        ${doc.price} <span className="text-sm text-muted font-normal">MXN</span>
                      </span>
                    </div>
                    <p className="text-muted text-base md:text-lg mb-4 flex-grow">{desc}</p>
                    <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-500/20 hover-box mb-4">
                      <h4 className="hover-title font-semibold text-blue-500 mb-2">💡 {t("catalog_potential_usage")}</h4>
                      <p className="text-muted text-sm md:text-base">{potential}</p>
                    </div>
                    <Link
                      href={`/documentos/${doc.id}`}
                      className="hover-button inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/50 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 w-fit"
                    >
                      {t("catalog_generate")}
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
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
