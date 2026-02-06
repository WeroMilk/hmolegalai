"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type FlagChoice = "seri" | "mx" | "us" | null;

const FLAG_STORAGE = "avatar_flag_choice";

interface FlagContextType {
  flag: FlagChoice;
  setFlag: (choice: FlagChoice) => void;
  hasChosen: boolean;
}

const FlagContext = createContext<FlagContextType | undefined>(undefined);

export function FlagProvider({ children }: { children: React.ReactNode }) {
  const [flag, setFlagState] = useState<FlagChoice>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(FLAG_STORAGE) as FlagChoice | null;
    if (stored === "seri" || stored === "mx" || stored === "us") {
      setFlagState(stored);
    }
  }, []);

  const setFlag = (choice: FlagChoice) => {
    setFlagState(choice);
    if (choice && typeof window !== "undefined") {
      localStorage.setItem(FLAG_STORAGE, choice);
    }
  };

  const hasChosen = mounted && flag !== null;

  return (
    <FlagContext.Provider value={{ flag, setFlag, hasChosen }}>
      {children}
    </FlagContext.Provider>
  );
}

export function useFlag() {
  const ctx = useContext(FlagContext);
  if (ctx === undefined) throw new Error("useFlag must be used within FlagProvider");
  return ctx;
}
