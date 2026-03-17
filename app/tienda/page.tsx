"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { PRODUCTS, PRODUCT_FAMILIES, getProductsByFamily } from "@/lib/products";
import { motion } from "framer-motion";
import { ShoppingBag, Truck } from "lucide-react";

function formatPrice(centavos: number): string {
  return `$ ${(centavos / 100).toLocaleString("es-MX")}`;
}

export default function TiendaPage() {
  return (
    <div className="min-h-screen text-foreground bg-[#fafafa] dark:bg-background">
      <Navbar />

      {/* Barra superior tipo ecommerce */}
      <div className="bg-teal-600 text-white text-center py-2 text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <Truck className="w-4 h-4" aria-hidden />
          Envíos a toda la República Mexicana
        </span>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        {/* Hero tienda */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-gradient-to-r from-teal-500/15 to-emerald-500/15 border border-teal-500/20 p-8 sm:p-12 mb-10"
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
            Tienda VitalHealth
          </h1>
          <p className="text-muted max-w-xl mb-6">
            Suplementos recomendados por tu nutrióloga. Pago 100% seguro con Stripe.
          </p>
          <div className="flex flex-wrap gap-3">
            {PRODUCT_FAMILIES.map((fam) => {
              const count = getProductsByFamily(fam.id).length;
              return (
                <Link
                  key={fam.id}
                  href={`#familia-${fam.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-card border border-teal-500/30 text-sm font-medium text-foreground hover:border-teal-500 hover:shadow-md transition-all"
                >
                  {fam.name}
                  <span className="text-muted">({count})</span>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* Grid de productos por familia - estilo ecommerce */}
        {PRODUCT_FAMILIES.map((fam, famIndex) => {
          const products = getProductsByFamily(fam.id);
          if (products.length === 0) return null;
          return (
            <motion.section
              key={fam.id}
              id={`familia-${fam.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: famIndex * 0.05 }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="text-xl font-bold text-foreground mb-1">{fam.name}</h2>
              <p className="text-sm text-muted mb-6">{products.length} productos</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, i) => (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group bg-white dark:bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
                  >
                    <Link href={`/tienda/${product.slug}`} className="block">
                      <div className="aspect-square relative bg-gray-100 dark:bg-white/5 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-muted uppercase tracking-wider mb-1">Vital Health</p>
                        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-2">
                          {formatPrice(product.priceOneTime)}
                        </p>
                        <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-teal-600 dark:text-teal-400">
                          <ShoppingBag className="w-4 h-4" />
                          Ver producto
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          );
        })}
      </main>
    </div>
  );
}
