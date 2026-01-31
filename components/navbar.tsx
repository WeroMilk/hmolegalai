"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useI18n } from "@/lib/i18n-context";
import { User, LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleThemeWithEffect } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect border-b border-border navbar-no-frame">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 xs:h-16">
          <Link
            href="/"
            className="flex items-center space-x-1.5 xs:space-x-2 cursor-pointer transition-transform duration-200 ease-out hover:scale-105 origin-left min-w-0"
          >
            <div className="text-lg xs:text-xl sm:text-2xl font-bold gradient-text">AVATAR</div>
            <span className="text-xs xs:text-sm text-blue-500 font-medium hidden xs:inline">{t("nav_legal_ai")}</span>
          </Link>

          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <Link
              href="/"
              className="i18n-nav-link min-w-[4.5rem] text-center text-muted hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-transparent"
            >
              {t("nav_home")}
            </Link>
            <Link
              href="/documentos"
              className="i18n-nav-link min-w-[7.5rem] text-center text-muted hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-transparent"
            >
              {t("nav_documents")}
            </Link>
            {user ? (
              <>
                <Link
                  href="/mis-documentos"
                  className="i18n-nav-link min-w-[8.5rem] text-center text-muted hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-transparent"
                >
                  {t("nav_my_documents")}
                </Link>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2 text-muted min-w-0 max-w-[11rem] truncate py-2">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm hidden lg:inline truncate">{user.email}</span>
                    <span className="text-sm lg:hidden min-w-[4rem] text-center">{t("nav_user")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    dir="ltr"
                    className="inline-flex flex-nowrap items-center gap-2 shrink-0 min-w-[5.5rem] py-2 px-3 text-red-500 hover:text-red-400 transition-colors border border-transparent rounded-md text-sm font-medium [&_svg]:shrink-0 [&_svg]:align-middle"
                  >
                    <LogOut className="w-4 h-4" aria-hidden />
                    <span className="whitespace-nowrap">{t("nav_sign_out")}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 w-[8rem] flex-shrink-0 justify-end">
                  <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-background/80 border border-border w-[4.5rem]">
                    <button
                      type="button"
                      onClick={() => setLocale("es")}
                      className={`flex-1 min-w-0 py-1 rounded text-sm font-medium transition-colors ${locale === "es" ? "bg-blue-600 text-white" : "text-muted hover:text-foreground"}`}
                      aria-label={t("nav_aria_spanish")}
                    >
                      ES
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocale("en")}
                      className={`flex-1 min-w-0 py-1 rounded text-sm font-medium transition-colors ${locale === "en" ? "bg-blue-600 text-white" : "text-muted hover:text-foreground"}`}
                      aria-label={t("nav_aria_english")}
                    >
                      EN
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleThemeWithEffect(e.clientX, e.clientY)}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-card transition-colors"
                    aria-label={theme === "dark" ? t("nav_aria_light") : t("nav_aria_dark")}
                  >
                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="hover-button btn-primary i18n-nav-link min-w-[9.5rem] text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg glow-border text-white font-medium border-2 border-transparent"
                >
                  {t("nav_sign_in")}
                </Link>
                <div className="flex items-center gap-2 w-[8rem] flex-shrink-0 justify-end">
                  <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-background/80 border border-border w-[4.5rem]">
                    <button
                      type="button"
                      onClick={() => setLocale("es")}
                      className={`flex-1 min-w-0 py-1 rounded text-sm font-medium transition-colors ${locale === "es" ? "bg-blue-600 text-white" : "text-muted hover:text-foreground"}`}
                      aria-label={t("nav_aria_spanish")}
                    >
                      ES
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocale("en")}
                      className={`flex-1 min-w-0 py-1 rounded text-sm font-medium transition-colors ${locale === "en" ? "bg-blue-600 text-white" : "text-muted hover:text-foreground"}`}
                      aria-label={t("nav_aria_english")}
                    >
                      EN
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleThemeWithEffect(e.clientX, e.clientY)}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-card transition-colors"
                    aria-label={theme === "dark" ? t("nav_aria_light") : t("nav_aria_dark")}
                  >
                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center gap-0.5 p-0.5 rounded bg-background/80 border border-border">
              <button
                type="button"
                onClick={() => setLocale("es")}
                className={`px-2 py-1 rounded text-xs font-medium ${locale === "es" ? "bg-blue-600 text-white" : "text-muted"}`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`px-2 py-1 rounded text-xs font-medium ${locale === "en" ? "bg-blue-600 text-white" : "text-muted"}`}
              >
                EN
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => toggleThemeWithEffect(e.clientX, e.clientY)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg border border-border text-foreground"
              aria-label={theme === "dark" ? t("nav_aria_light") : t("nav_aria_dark")}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-foreground rounded-lg hover:bg-card transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-border">
            <Link
              href="/"
              className="block py-3 px-4 min-h-[44px] flex items-center text-muted hover:text-foreground hover:bg-card/50 rounded-lg active:bg-card transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav_home")}
            </Link>
            <Link
              href="/documentos"
              className="block py-3 px-4 min-h-[44px] flex items-center text-muted hover:text-foreground hover:bg-card/50 rounded-lg active:bg-card transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav_documents")}
            </Link>
            {user ? (
              <>
                <Link
                  href="/mis-documentos"
                  className="block py-3 px-4 min-h-[44px] flex items-center text-muted hover:text-foreground hover:bg-card/50 rounded-lg active:bg-card transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav_my_documents")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-3 px-4 min-h-[44px] flex items-center text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg active:bg-red-500/20 transition-colors"
                >
                  {t("nav_sign_out")}
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="hover-button btn-primary block px-4 py-3 min-h-[48px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-lg text-center text-white font-medium mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav_sign_in")}
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
