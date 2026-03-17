"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { PRODUCT_FAMILIES, getProductsByFamily } from "@/lib/products";
import { motion } from "framer-motion";
import { Truck, ChevronRight, Package } from "lucide-react";

export default function TiendaPage() {
  return (
    <div className="min-h-screen text-foreground bg-[#fafafa] dark:bg-background">
      <Navbar />

      <div className="bg-teal-600 text-white text-center py-2 text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <Truck className="w-4 h-4" aria-hidden />
          Envíos a toda la República Mexicana
        </span>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-gradient-to-r from-teal-500/15 to-emerald-500/15 border border-teal-500/20 p-8 sm:p-10 mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Tienda VitalHealth
          </h1>
          <p className="text-muted max-w-xl">
            Suplementos recomendados por tu nutrióloga. Elige una familia para ver sus productos.
          </p>
        </motion.section>

        <h2 className="text-lg font-semibold text-foreground mb-4">Familias de productos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRODUCT_FAMILIES.map((fam, index) => {
            const count = getProductsByFamily(fam.id).length;
            if (count === 0) return null;
            return (
              <motion.div
                key={fam.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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
      </main>
    </div>
  );
}
