"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Añade clase didi-theme en body para /didi y /consulta (verde menta unificado). */
export function DidiThemeEffect() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/didi") || pathname?.startsWith("/consulta")) {
      document.body.classList.add("didi-theme");
    } else {
      document.body.classList.remove("didi-theme");
    }
    return () => document.body.classList.remove("didi-theme");
  }, [pathname]);

  return null;
}
