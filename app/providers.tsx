"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { I18nProvider } from "@/lib/i18n-context";
import { FlagProvider } from "@/lib/flag-context";
import { ScrollToTop } from "@/components/scroll-to-top";
import { DidiThemeEffect } from "@/components/didi-theme-effect";
import { WelcomePreview } from "@/components/welcome-preview";
import { ProfileGuard } from "@/components/profile-guard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <FlagProvider>
          <AuthProvider>
            <ProfileGuard>
              <ScrollToTop />
              <DidiThemeEffect />
              <WelcomePreview />
              {children}
            </ProfileGuard>
          </AuthProvider>
        </FlagProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
