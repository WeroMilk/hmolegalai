"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { PRODUCTS } from "@/lib/products";
import { motion } from "framer-motion";

function formatPrice(centavos: number): string {
  return `$${(centavos / 100).toLocaleString("es-MX")} MXN`;
}

export default function TiendaPage() {
  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-28 pb-16">
        <h1 className="text-2xl font-bold mb-2">Suplementos VitaHealth</h1>
        <p className="text-muted text-sm mb-8">
          Productos recomendados por tu nutrióloga. Compra única o suscripción con 10% de descuento.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {PRODUCTS.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/tienda/${product.slug}`}
                className="block glass-effect p-4 rounded-xl border border-teal-500/40 hover:border-teal-500/70 transition-colors"
              >
                <div className="aspect-square relative rounded-lg overflow-hidden bg-muted mb-4">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <h2 className="font-semibold text-lg">{product.name}</h2>
                <p className="text-muted text-sm line-clamp-2 mt-1">{product.description}</p>
                <p className="text-teal-600 dark:text-teal-400 font-medium mt-2">
                  {formatPrice(product.priceOneTime)} · Suscripción {formatPrice(product.priceSubscription)}/mes
                </p>
                <span className="inline-block mt-2 text-xs bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded">
                  Recomendado por Nutrióloga Titulada
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
