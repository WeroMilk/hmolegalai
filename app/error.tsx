"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useI18n } from "@/lib/i18n-context";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="pt-24 xs:pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto glass-effect rounded-2xl border border-border p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("error_title")}</h1>
          <p className="text-muted mb-6">{t("error_body")}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-xl bg-foreground text-background font-semibold px-5 py-3 transition-colors hover:opacity-90"
            >
              {t("error_retry")}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 transition-colors"
            >
              {t("error_go_home")}
            </Link>
          </div>
          {error?.digest && (
            <p className="text-[12px] text-muted mt-5">
              {t("error_code")}: {error.digest}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

