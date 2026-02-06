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
          <Image src="/logo.png" alt="Avatar Legal AI" width={32} height={32} className="w-8 h-8" />
          <span className="footer-brand font-semibold text-foreground mr-8">Avatar Legal AI</span>
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm mb-4">
        <Link
          href="/terminos"
          className="text-muted hover:text-blue-500 transition-colors cursor-pointer py-2 min-h-[44px] inline-flex items-center"
        >
          {t("footer_terms")}
        </Link>
        <Link
          href="/privacidad"
          className="text-muted hover:text-blue-500 transition-colors cursor-pointer py-2 min-h-[44px] inline-flex items-center"
        >
          {t("footer_privacy")}
        </Link>
        <Link
          href="/aviso-legal"
          className="text-muted hover:text-blue-500 transition-colors cursor-pointer py-2 min-h-[44px] inline-flex items-center"
        >
          {t("footer_disclaimer")}
        </Link>
      </div>
      <p className="text-center text-muted text-sm">
        {t("footer_location")}
      </p>
      <p className="text-center text-muted text-sm mt-1">
        <Link href="/" className="footer-brand text-blue-500 hover:text-blue-600 transition-colors">
          © {year} Avatar Legal AI
        </Link>
        {t("footer_copyright_suffix")}
      </p>
    </footer>
  );
}
