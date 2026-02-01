"use client";

import React, { createContext, useContext, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const THEME_STORAGE = "avatar_theme";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** Toggle con efecto visual futurista (revelado radial desde el clic) */
  toggleThemeWithEffect: (clientX: number, clientY: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_BG = { dark: "#0a0a0a", light: "#f8fafc" } as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [transition, setTransition] = useState<{
    active: boolean;
    fromTheme: Theme;
  }>({ active: false, fromTheme: "light" });

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    root.classList.add("theme-transition");
    const stored = localStorage.getItem(THEME_STORAGE) as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    if (mounted) localStorage.setItem(THEME_STORAGE, theme);
  }, [theme, mounted]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  const toggleThemeWithEffect = useCallback((_clientX?: number, _clientY?: number) => {
    const fromTheme = theme;
    setTransition({ active: true, fromTheme });
    requestAnimationFrame(() => {
      setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    });
  }, [theme]);

  const endTransition = useCallback(() => {
    setTransition((t) => ({ ...t, active: false }));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, toggleThemeWithEffect }}>
      {children}
      <AnimatePresence>
        {transition.active && (
          <motion.div
            className="fixed inset-0 left-0 right-0 top-0 pointer-events-none z-[99999] h-screen w-full"
            initial={{ y: 0 }}
            animate={{ y: "100%" }}
            transition={{
              duration: 0.28,
              ease: [0.32, 0.72, 0, 1],
            }}
            onAnimationComplete={endTransition}
            style={{
              background: THEME_BG[transition.fromTheme],
            }}
            aria-hidden
          />
        )}
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
