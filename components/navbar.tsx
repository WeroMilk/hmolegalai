"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/lib/theme-context";
import { useI18n } from "@/lib/i18n-context";
import { isDidiUser } from "@/lib/didi";
import { LogOut, Menu, X, Sun, Moon, ShoppingCart } from "lucide-react";
import { useState, useRef } from "react";

const LOGO_CLICKS_NEEDED = 3;
const LOGO_CLICK_RESET_MS = 500;

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleThemeWithEffect } = useTheme();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const logoClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (user) return;
    e.preventDefault();
    const next = logoClickCount + 1;
    if (logoClickTimeoutRef.current) clearTimeout(logoClickTimeoutRef.current);
    if (next >= LOGO_CLICKS_NEEDED) {
      setLogoClickCount(0);
      router.push("/auth");
      return;
    }
    setLogoClickCount(next);
    logoClickTimeoutRef.current = setTimeout(() => {
      setLogoClickCount(0);
      router.push("/");
    }, LOGO_CLICK_RESET_MS);
  };

  const logoClassName = "flex items-center space-x-1.5 xs:space-x-2 cursor-pointer transition-transform duration-200 ease-out hover:scale-105 origin-left shrink-0";

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect border-b border-border navbar-no-frame">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 xs:h-16 sm:h-16 gap-2 min-w-0 py-2 sm:py-0">
          {user ? (
            <Link href="/" className={logoClassName}>
              <Image src="/logo.png" alt="VitalHealth" width={36} height={36} className="flex-shrink-0 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10" />
              <div className="text-lg xs:text-xl sm:text-2xl font-bold gradient-text shrink-0">VitalHealth</div>
            </Link>
          ) : (
            <Link href="/" onClick={handleLogoClick} className={logoClassName} aria-label="VitalHealth">
              <Image src="/logo.png" alt="VitalHealth" width={36} height={36} className="flex-shrink-0 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10" />
              <div className="text-lg xs:text-xl sm:text-2xl font-bold gradient-text shrink-0">VitalHealth</div>
            </Link>
          )}

          <div className="hidden sm:flex items-center shrink-0 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3">
              <Link href="/" className="i18n-nav-link navbar-link-hover shrink-0 px-1.5 py-2 text-sm font-medium text-muted transition-colors" title={t("nav_home")}>
                {t("nav_home")}
              </Link>
              <Link href="/consulta" className="i18n-nav-link navbar-link-hover shrink-0 px-1.5 py-2 text-sm font-medium text-muted transition-colors whitespace-nowrap">
                {t("nav_consulta")}
              </Link>
              <Link href="/tienda" className="i18n-nav-link navbar-link-hover shrink-0 px-1.5 py-2 text-sm font-medium text-muted transition-colors">
                {t("nav_tienda")}
              </Link>
              <Link href="/contacto" className="i18n-nav-link navbar-link-hover shrink-0 px-1.5 py-2 text-sm font-medium text-muted transition-colors">
                {t("nav_contacto")}
              </Link>
              {user && isDidiUser(user.email) && (
                <>
                  <Link href="/didi" className="i18n-nav-link navbar-link-hover shrink-0 px-1.5 py-2 text-sm font-semibold text-muted transition-colors">
                    {t("nav_didi")}
                  </Link>
                  <Link href="/admin" className="i18n-nav-link navbar-link-hover shrink-0 px-1.5 py-2 text-sm font-medium text-muted transition-colors">
                    {t("nav_admin")}
                  </Link>
                </>
              )}
              {user && (
                <span className="shrink-0 max-w-[8rem] truncate px-1.5 py-2 text-sm text-muted lg:max-w-[10rem]" title={user.email ?? undefined}>
                  {user.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 pl-3 ml-4 border-l border-border shrink-0">
              <Link
                href="/tienda/carrito"
                className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-card transition-colors"
                aria-label="Carrito"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-teal-500 text-white text-xs font-bold">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={logout}
                    dir="ltr"
                    className="inline-flex flex-nowrap items-center gap-2 shrink-0 min-w-[5.5rem] py-2 px-3 text-red-500 hover:text-red-400 transition-colors border border-transparent rounded-md text-sm font-medium [&_svg]:shrink-0 [&_svg]:align-middle"
                  >
                    <LogOut className="w-4 h-4" aria-hidden />
                    <span className="whitespace-nowrap">{t("nav_sign_out")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleThemeWithEffect(e.clientX, e.clientY)}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-card transition-colors"
                    aria-label={theme === "dark" ? t("nav_aria_light") : t("nav_aria_dark")}
                  >
                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => toggleThemeWithEffect(e.clientX, e.clientY)}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-card transition-colors"
                  aria-label={theme === "dark" ? t("nav_aria_light") : t("nav_aria_dark")}
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/tienda/carrito"
              className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-card transition-colors"
              aria-label="Carrito"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-teal-500 text-white text-xs font-bold">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={(e) => toggleThemeWithEffect(e.clientX, e.clientY)}
              className="flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-card transition-colors"
              aria-label={theme === "dark" ? t("nav_aria_light") : t("nav_aria_dark")}
            >
              {theme === "dark" ? <Sun className="w-6 h-6 sm:w-5 sm:h-5" /> : <Moon className="w-6 h-6 sm:w-5 sm:h-5" />}
            </button>
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-foreground rounded-lg hover:bg-card transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? t("nav_aria_close_menu") : t("nav_aria_open_menu")}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden py-4 space-y-1 border-t border-border">
            <Link href="/" className="navbar-link-hover block py-3 px-4 min-h-[44px] flex items-center text-muted hover:bg-card/50 rounded-lg active:bg-card transition-colors" onClick={() => setMobileMenuOpen(false)}>
              {t("nav_home")}
            </Link>
            <Link href="/consulta" className="navbar-link-hover block py-3 px-4 min-h-[44px] flex items-center text-muted hover:bg-card/50 rounded-lg active:bg-card transition-colors" onClick={() => setMobileMenuOpen(false)}>
              {t("nav_consulta")}
            </Link>
            <Link href="/tienda" className="navbar-link-hover block py-3 px-4 min-h-[44px] flex items-center text-muted hover:bg-card/50 rounded-lg active:bg-card transition-colors" onClick={() => setMobileMenuOpen(false)}>
              {t("nav_tienda")}
            </Link>
            <Link href="/contacto" className="navbar-link-hover block py-3 px-4 min-h-[44px] flex items-center text-muted hover:bg-card/50 rounded-lg active:bg-card transition-colors" onClick={() => setMobileMenuOpen(false)}>
              {t("nav_contacto")}
            </Link>
            <Link href="/tienda/carrito" className="navbar-link-hover block py-3 px-4 min-h-[44px] flex items-center text-muted hover:bg-card/50 rounded-lg active:bg-card transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Carrito {totalItems > 0 ? `(${totalItems})` : ""}
            </Link>
            {user && isDidiUser(user.email) && (
              <>
                <Link href="/didi" className="navbar-link-hover block py-3 px-4 min-h-[44px] flex items-center text-muted hover:bg-card/50 rounded-lg active:bg-card transition-colors font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  {t("nav_didi")}
                </Link>
                <Link href="/admin" className="navbar-link-hover block py-3 px-4 min-h-[44px] flex items-center text-muted hover:bg-card/50 rounded-lg active:bg-card transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  {t("nav_admin")}
                </Link>
              </>
            )}
            {user && (
              <div className="py-3 px-4 text-sm text-muted truncate" title={user.email ?? undefined}>
                {user.email}
              </div>
            )}
            {user ? (
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
            ) : null}
          </div>
        )}
      </div>
    </nav>
  );
}
