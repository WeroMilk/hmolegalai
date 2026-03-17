"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { PRODUCT_FAMILIES, getProductsByFamily } from "@/lib/products";
import { motion } from "framer-motion";
import { Truck, ChevronRight, Package } from "lucide-react";

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

        {/* Grid 2x2 de familias con imagen */}
        <section className="mb-12">
          <h2 className="sr-only">Familias de productos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {familiasPortada.map((fam, index) => {
              const count = getProductsByFamily(fam.id).length;
              if (count === 0) return null;
              const hasImage = !!fam.image;
              return (
                <motion.div
                  key={fam.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                >
                  <Link
                    href={`/tienda/familia/${fam.id}`}
                    className="group block rounded-2xl overflow-hidden bg-white dark:bg-card border border-border shadow-sm hover:shadow-xl hover:border-teal-500/40 transition-all duration-300"
                  >
                    <div className="relative aspect-[4/3] sm:aspect-[5/3] bg-gray-100 dark:bg-white/5 overflow-hidden">
                      {hasImage ? (
                        <Image
                          src={fam.image!}
                          alt={fam.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 50vw"
                          priority={index < 2}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-emerald-500/20">
                          <Package className="w-16 h-16 text-teal-500/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                        <h3 className="font-bold text-lg sm:text-xl text-white drop-shadow-md">
                          {fam.name}
                        </h3>
                        <p className="text-sm text-white/90 mt-0.5">
                          {count} producto{count !== 1 ? "s" : ""}
                        </p>
                        <span className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-teal-200 group-hover:text-white transition-colors">
                          Ver productos
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
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
