"use client";

import { motion } from "framer-motion";
import { LEGAL_DOCUMENTS } from "@/lib/documents";
import { useI18n } from "@/lib/i18n-context";
import { DOC_NAME_DESC_KEYS } from "@/lib/translations";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function DocumentCatalog({ compactTop, reduceTopPadding }: { compactTop?: boolean; reduceTopPadding?: boolean }) {
  const { t } = useI18n();
  const paddingClass = compactTop ? "pt-12 pb-24" : reduceTopPadding ? "pt-6 pb-24" : "py-24";

  return (
    <section className={`px-3 xs:px-4 sm:px-6 lg:px-8 overflow-visible w-full min-w-0 ${paddingClass}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {LEGAL_DOCUMENTS.map((document, index) => {
            const keys = DOC_NAME_DESC_KEYS[document.id];
            const name = keys ? t(keys.name) : document.name;
            const description = keys ? t(keys.desc) : document.description;
            return (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
              >
                <Link href={`/documentos/${document.id}`} className="block h-full">
                  <div className="glass-effect hover-box p-4 xs:p-6 sm:p-8 rounded-xl border border-blue-500/40 group h-full flex flex-col min-h-[220px] xs:min-h-[280px]">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 text-3xl">
                      {document.icon}
                    </div>
                    <h3 className="hover-title text-base xs:text-lg sm:text-xl font-semibold mb-2 xs:mb-3 leading-tight text-foreground">
                      {name}
                    </h3>
                    <p className="text-muted flex-grow leading-relaxed">
                      {description}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border flex-shrink-0">
                      <span className="text-xl font-bold text-blue-500">
                        ${document.price}
                        <span className="text-sm text-muted font-normal"> MXN</span>
                      </span>
                      <ArrowRight className="w-5 h-5 text-muted group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
