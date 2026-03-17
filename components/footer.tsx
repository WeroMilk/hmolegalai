"use client";

import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 py-8 px-4 border-t border-border bg-background">
      <div className="flex justify-center mb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors">
          <Image src="/logo.png" alt="VitalHealth" width={32} height={32} className="w-8 h-8" />
          <span className="footer-brand font-semibold text-foreground mr-8">VitalHealth</span>
        </Link>
      </div>
      <p className="text-center text-muted text-sm">
        {t("footer_location")}
      </p>
      <p className="text-center text-sm font-medium text-teal-600 dark:text-teal-400 mt-1">
        {t("footer_shipping")}
      </p>
      <p className="text-center text-muted text-sm mt-1">
        <Link href="/" className="footer-brand text-teal-500 hover:text-teal-600 transition-colors">
          {t("footer_copyright").replace("{{year}}", String(year))}
        </Link>
        {t("footer_copyright_suffix")}
      </p>
    </footer>
  );
}
