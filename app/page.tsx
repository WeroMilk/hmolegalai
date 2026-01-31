"use client";

import { Hero } from "@/components/hero";
import { DocumentCatalog } from "@/components/document-catalog";
import { Features } from "@/components/features";
import { AboutSection } from "@/components/about-section";
import { Navbar } from "@/components/navbar";
import { useI18n } from "@/lib/i18n-context";

export default function Home() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen text-foreground w-full min-w-0 max-w-full">
      <Navbar />

      <div>
        <Hero />
        <Features />
        <AboutSection />
        <div className="text-center px-4 sm:px-6 lg:px-8 pb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight">
            <span className="gradient-text hover-title">{t("home_docs_section_title")}</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto">
            {t("home_docs_section_subtitle")}
          </p>
        </div>
        <DocumentCatalog compactTop />
      </div>
    </main>
  );
}
