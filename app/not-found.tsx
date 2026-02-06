"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useI18n } from "@/lib/i18n-context";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="pt-24 xs:pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto glass-effect rounded-2xl border border-border p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("notfound_title")}</h1>
          <p className="text-muted mb-6">{t("notfound_body")}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 transition-colors"
          >
            {t("notfound_back_home")}
          </Link>
        </div>
      </main>
    </div>
  );
}

