"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useFlag } from "@/lib/flag-context";
import { useI18n } from "@/lib/i18n-context";
import { motion, AnimatePresence } from "framer-motion";

const FLAG_SIZE = 120;
const FLAG_ASPECT = 4 / 3;

/** Contenedor uniforme para las 3 banderas - mismo tamaño */
function FlagImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center"
      style={{ width: FLAG_SIZE, height: FLAG_SIZE / FLAG_ASPECT }}
    >
      <Image
        src={src}
        alt={alt}
        width={FLAG_SIZE}
        height={FLAG_SIZE / FLAG_ASPECT}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function WelcomePreview() {
  const router = useRouter();
  const pathname = usePathname();
  const { setFlag } = useFlag();
  const { setLocale } = useI18n();
  const [visible, setVisible] = useState(false);

  // Mostrar solo la primera vez en esta sesión del navegador
  useEffect(() => {
    if (pathname === "/") {
      // Verificar si ya se mostró en esta sesión
      const hasShownWelcome = sessionStorage.getItem("welcome-shown");
      if (!hasShownWelcome) {
        setVisible(true);
      }
    } else {
      setVisible(false);
    }
  }, [pathname]);

  const handleSelect = useCallback(
    (choice: "seri" | "mx" | "us") => {
      // Marcar que ya se mostró el welcome en esta sesión
      sessionStorage.setItem("welcome-shown", "true");
      setFlag(choice);
      if (choice === "seri") {
        setLocale("seri");
        router.push("/seri");
      } else if (choice === "mx") {
        setLocale("es");
      } else {
        setLocale("en");
      }
      setVisible(false);
    },
    [setFlag, setLocale, router]
  );

  return (
    <AnimatePresence>
      {visible && pathname === "/" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
        >
          <div className="w-full max-w-lg px-6 sm:px-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl font-semibold text-foreground mb-1 tracking-tight"
            >
              Bienvenido
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-base text-muted mb-10"
            >
              Elige tu idioma / comunidad
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center sm:items-stretch justify-center">
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => handleSelect("mx")}
                className="group flex flex-col items-center gap-3 w-[120px] sm:w-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl p-4 transition-transform active:scale-95"
                aria-label="México - Español"
              >
                <div className="transition-transform duration-200 group-hover:scale-105 flex justify-center">
                  <FlagImage src="/flag-mexico.png" alt="Bandera de México" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  México
                </span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                onClick={() => handleSelect("seri")}
                className="group flex flex-col items-center gap-3 w-[120px] sm:w-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl p-4 transition-transform active:scale-95"
                aria-label="Comunidad comca'ac - Cmiique Iitom"
              >
                <div className="transition-transform duration-200 group-hover:scale-105 flex justify-center">
                  <FlagImage src="/flag-seri.png" alt="Comunidad comca'ac - Nación comca'ac" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-blue-500 transition-colors">
                  {"comca'ac"}
                </span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => handleSelect("us")}
                className="group flex flex-col items-center gap-3 w-[120px] sm:w-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl p-4 transition-transform active:scale-95"
                aria-label="United States - English"
              >
                <div className="transition-transform duration-200 group-hover:scale-105 flex justify-center">
                  <FlagImage src="/flag-usa.png" alt="Bandera de Estados Unidos" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  USA
                </span>
              </motion.button>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-xs text-muted max-w-sm mx-auto"
            >
              Documentos Ley de Amparo con validez jurídica en México
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
