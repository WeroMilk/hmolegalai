"use client";

import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const instagramUrl = "#";
  const tiktokUrl = "#";

  return (
    <footer className="relative z-10 py-8 px-4 border-t border-border bg-background">
      <div className="flex justify-center mb-3 ml-5">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors">
          <Image src="/logo.png" alt="VitalHealth" width={32} height={32} className="w-8 h-8" />
          <span className="footer-brand font-semibold text-foreground mr-8">VitalHealth</span>
        </Link>
      </div>
      <div className="flex justify-center gap-4 mb-4">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full text-muted hover:text-teal-500 hover:bg-teal-500/10 transition-colors"
          aria-label="Instagram"
        >
          <Instagram className="w-6 h-6" />
        </a>
        <a
          href={tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full text-muted hover:text-teal-500 hover:bg-teal-500/10 transition-colors"
          aria-label="TikTok"
        >
          <TikTokIcon className="w-6 h-6" />
        </a>
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
