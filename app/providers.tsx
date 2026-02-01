"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { I18nProvider } from "@/lib/i18n-context";
import { ScrollToTop } from "@/components/scroll-to-top";
import { DidiThemeEffect } from "@/components/didi-theme-effect";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <ScrollToTop />
          <DidiThemeEffect />
          {children}
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
