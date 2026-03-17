"use client";

import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import { I18nProvider } from "@/lib/i18n-context";
import { FlagProvider } from "@/lib/flag-context";
import { ScrollToTop } from "@/components/scroll-to-top";
import { DidiThemeEffect } from "@/components/didi-theme-effect";
import { ProfileGuard } from "@/components/profile-guard";
import { SuppressConsoleErrors } from "@/lib/suppress-console-errors";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <FlagProvider>
          <AuthProvider>
            <CartProvider>
            <SuppressConsoleErrors />
            <ProfileGuard>
              <ScrollToTop />
              <DidiThemeEffect />
              {children}
            </ProfileGuard>
            </CartProvider>
          </AuthProvider>
        </FlagProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
