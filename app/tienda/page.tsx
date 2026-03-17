"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { PRODUCT_FAMILIES, getProductsByFamily } from "@/lib/products";
import { motion } from "framer-motion";
import { Truck, Package, ChevronRight } from "lucide-react";

/** Solo las 4 familias con imagen para la portada principal. */
const FAMILIAS_PORTADA: (typeof PRODUCT_FAMILIES)[0]["id"][] = ["awaken", "detox", "nutrir", "restaurar"];

export default function TiendaPage() {
  const familiasPortada = PRODUCT_FAMILIES.filter((f) => FAMILIAS_PORTADA.includes(f.id));
  const otrasFamilias = PRODUCT_FAMILIES.filter((f) => f.id !== "plan" && !FAMILIAS_PORTADA.includes(f.id));

  return (
    <div className="min-h-screen text-foreground bg-[#fafafa] dark:bg-background">
      <Navbar />

      <div className="bg-teal-600 text-white text-center py-2 text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <Truck className="w-4 h-4" aria-hidden />
          Envíos a toda la República Mexicana
        </span>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-gradient-to-r from-teal-500/15 to-emerald-500/15 border border-teal-500/20 p-8 sm:p-10 mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Tienda VitalHealth
          </h1>
          <p className="text-muted max-w-xl">
            Suplementos recomendados por tu nutrióloga. Elige una familia para ver sus productos.
          </p>
        </motion.section>

        {/* Familias: 1 col móvil, 2 cols tablet, 4 en horizontal en desktop */}
        <section className="mb-12">
          <h2 className="sr-only">Familias de productos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-4">
            {familiasPortada.map((fam, index) => {
              const count = getProductsByFamily(fam.id).length;
              if (count === 0) return null;
              return (
                <motion.article
                  key={fam.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="rounded-2xl bg-white dark:bg-card border border-gray-200 dark:border-border shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col text-center"
                >
                  <Link href={`/tienda/familia/${fam.id}`} className="group flex flex-col flex-1 p-5 sm:p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/15 to-emerald-500/15 text-teal-600 dark:text-teal-400">
                        <Package className="w-10 h-10 sm:w-12 sm:h-12" />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl text-foreground">
                      {fam.name}
                    </h3>
                    <p className="text-sm text-muted mt-2 line-clamp-4 flex-1">
                      {fam.description ?? `${count} producto${count !== 1 ? "s" : ""}`}
                    </p>
                    <span className="mt-5 inline-flex items-center justify-center w-full py-3 px-5 rounded-xl text-white font-semibold bg-gradient-to-b from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm">
                      Comprar ahora
                    </span>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* Otras familias (Vital Health, etc.) sin imagen */}
        {otrasFamilias.some((f) => getProductsByFamily(f.id).length > 0) && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Más categorías</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {otrasFamilias.map((fam, index) => {
                const count = getProductsByFamily(fam.id).length;
                if (count === 0) return null;
                return (
                  <motion.div
                    key={fam.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  >
                    <Link
                      href={`/tienda/familia/${fam.id}`}
                      className="group flex items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-card border border-border shadow-sm hover:shadow-md hover:border-teal-500/40 transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                            {fam.name}
                          </h3>
                          <p className="text-sm text-muted">{count} producto{count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted group-hover:text-teal-500 shrink-0 transition-colors" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
