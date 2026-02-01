"use client";

import { Navbar } from "@/components/navbar";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface LegalDocLayoutProps {
  title: string;
  children: React.ReactNode;
  /** Contenido opcional destacado (ej. aviso importante) que va justo debajo del título */
  highlight?: React.ReactNode;
}

export function LegalDocLayout({ title, children, highlight }: LegalDocLayoutProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen text-foreground relative overflow-hidden">
      <Navbar />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="glass-effect rounded-2xl border border-blue-500/40 shadow-xl shadow-[0_0_60px_-12px_rgba(59,130,246,0.06)] dark:shadow-[0_0_60px_-12px_rgba(59,130,246,0.12)] p-6 sm:p-8 md:p-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8 text-sm group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
            <span>{t("nav_home")}</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">
            {title}
          </h1>
          <div className="h-px w-16 bg-gradient-to-r from-blue-500/60 to-transparent rounded-full mb-8" />

          {highlight && (
            <div className="mb-8 rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 p-5 text-foreground/90 text-sm leading-relaxed">
              {highlight}
            </div>
          )}

          <div className="space-y-10 text-foreground/90 text-sm sm:text-base leading-relaxed">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** Bloque de sección para documentos legales: número + título + contenido */
export function LegalSection({
  number,
  title,
  children,
}: {
  number?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative pl-0">
      <div className="flex gap-4 sm:gap-6">
        {number != null && (
          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-foreground/5 dark:bg-foreground/10 border border-border/50 flex items-center justify-center text-xs font-medium text-muted">
            {number}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground mb-3 tracking-tight">
            {title}
          </h2>
          <div className="text-muted [&_strong]:text-foreground">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
