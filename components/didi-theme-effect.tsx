"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Añade/quita clase didi-theme en body cuando la ruta es /didi para que todo lo azul se vuelva morado. */
export function DidiThemeEffect() {
  const pathname = usePathname();
  const isDidi = pathname?.startsWith("/didi") ?? false;

  useEffect(() => {
    if (isDidi) document.body.classList.add("didi-theme");
    else document.body.classList.remove("didi-theme");
    return () => document.body.classList.remove("didi-theme");
  }, [isDidi]);

  return null;
}
