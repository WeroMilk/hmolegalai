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
                <Link href={`/documentos/${document.id}`}>
                  <div className="glass-effect hover-box p-5 sm:p-6 rounded-xl border border-blue-500/40 group h-full flex flex-col min-h-[200px]">
                    <div className="text-4xl mb-4 origin-left transition-transform duration-300 ease-out group-hover:scale-125 group-hover:translate-x-1">{document.icon}</div>
                    <h3 className="hover-title glow-white text-xl font-semibold mb-2 group-hover:text-blue-500 text-foreground">
                      {name}
                    </h3>
                    <p className="text-muted mb-4 flex-grow">
                      {description}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-2xl font-bold text-blue-500">
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
