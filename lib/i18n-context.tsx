"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type Locale, type TranslationKey, t as translate } from "./translations";

const LANG_STORAGE = "avatar_lang";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LANG_STORAGE) as Locale | null;
    if (stored === "es" || stored === "en" || stored === "seri") setLocaleState(stored);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    document.documentElement.lang = locale;
    localStorage.setItem(LANG_STORAGE, locale);
  }, [locale, mounted]);

  const setLocale = (l: Locale) => setLocaleState(l);
  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (ctx === undefined) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
