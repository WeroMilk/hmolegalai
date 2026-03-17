"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { PRODUCTS, PRODUCT_FAMILIES, getProductsByFamily } from "@/lib/products";
import { motion } from "framer-motion";

function formatPrice(centavos: number): string {
  return `$ ${(centavos / 100).toLocaleString("es-MX")}`;
}

export default function TiendaPage() {
  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-20">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Suplementos VitalHealth
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            Productos recomendados por tu nutrióloga. Compra única o suscripción con 10% de descuento.
          </p>
          <p className="text-sm font-medium text-teal-600 dark:text-teal-400 mt-2 flex items-center justify-center gap-1.5">
            <span aria-hidden>🚚</span> Envíos nacionales a toda la República Mexicana
          </p>
        </motion.header>

        {/* Familias */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-16"
        >
          {PRODUCT_FAMILIES.map((fam, i) => {
            const count = getProductsByFamily(fam.id).length;
            return (
              <motion.div
                key={fam.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="glass-effect hover-box rounded-2xl p-5 border border-teal-500/30"
              >
                <h2 className="font-semibold text-lg text-foreground">{fam.name}</h2>
                <p className="text-sm text-muted mt-0.5">{count} productos</p>
                <Link
                  href={`#familia-${fam.id}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-teal-600 dark:text-teal-400 font-medium text-sm hover:underline"
                >
                  Comprar ahora
                  <span aria-hidden>→</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.section>

        {/* Productos por familia */}
        {PRODUCT_FAMILIES.map((fam, famIndex) => {
          const products = getProductsByFamily(fam.id);
          if (products.length === 0) return null;
          return (
            <motion.section
              key={fam.id}
              id={`familia-${fam.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + famIndex * 0.05 }}
              className="mb-16 scroll-mt-24"
            >
              <h2 className="text-xl font-semibold mb-1">{fam.name}</h2>
              <p className="text-sm text-muted mb-6">{products.length} productos</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                  >
                    <Link
                      href={`/tienda/${product.slug}`}
                      className="group block glass-effect p-5 rounded-2xl border border-teal-500/30 hover:border-teal-500/60 transition-all duration-300"
                    >
                      <div className="aspect-square relative rounded-xl overflow-hidden bg-teal-500/5 mb-4">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">Vital Health</p>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {product.name}
                      </h3>
                      {product.nameEn && product.nameEn !== product.name && (
                        <p className="text-sm text-muted">{product.nameEn}</p>
                      )}
                      <p className="text-teal-600 dark:text-teal-400 font-semibold mt-2">
                        {formatPrice(product.priceOneTime)}
                      </p>
                      <span className="inline-block mt-2 text-xs bg-teal-500/15 text-teal-700 dark:text-teal-300 px-2 py-1 rounded-full">
                        Ver el producto
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href={`#familia-${PRODUCT_FAMILIES[(famIndex + 1) % PRODUCT_FAMILIES.length]?.id ?? ""}`}
                  className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Siguiente familia →
                </Link>
              </div>
            </motion.section>
          );
        })}
      </main>
    </div>
  );
}
