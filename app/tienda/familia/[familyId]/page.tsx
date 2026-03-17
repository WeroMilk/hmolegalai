"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { PRODUCT_FAMILIES, getProductsByFamily } from "@/lib/products";
import type { Product } from "@/lib/products";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowLeft } from "lucide-react";

function formatPrice(centavos: number): string {
  return `$ ${(centavos / 100).toLocaleString("es-MX")}`;
}

export default function FamiliaPage() {
  const params = useParams();
  const familyId = typeof params.familyId === "string" ? params.familyId : "";
  const family = PRODUCT_FAMILIES.find((f) => f.id === familyId);
  const products = family ? getProductsByFamily(family.id) : [];

  if (!family || products.length === 0) {
    return (
      <div className="min-h-screen text-foreground bg-[#fafafa] dark:bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 pt-28 pb-12">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-teal-600 mb-6 px-3 py-2 rounded-full border border-border hover:border-teal-500/30 hover:bg-teal-500/5 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la tienda
          </Link>
          <p className="text-muted">Familia no encontrada o sin productos.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground bg-[#fafafa] dark:bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-teal-600 mb-6 px-3 py-2 rounded-full border border-border hover:border-teal-500/30 hover:bg-teal-500/5 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la tienda
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{family.name}</h1>
        <p className="text-muted mb-8">{products.length} productos</p>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product: Product, i: number) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group bg-white dark:bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <Link href={`/tienda/${product.slug}`} className="block">
                <div className="aspect-square relative bg-gray-100 dark:bg-white/5 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 1024px) 50vw, 25vw"
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
      </main>
    </div>
  );
}
