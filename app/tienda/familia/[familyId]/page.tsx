"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { PRODUCT_FAMILIES, getProductsByFamily } from "@/lib/products";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowLeft, ShoppingCart } from "lucide-react";

function formatPrice(centavos: number): string {
  return `$ ${(centavos / 100).toLocaleString("es-MX")}`;
}

export default function FamiliaPage() {
  const params = useParams();
  const familyId = typeof params.familyId === "string" ? params.familyId : "";
  const family = PRODUCT_FAMILIES.find((f) => f.id === familyId);
  const products = family ? getProductsByFamily(family.id) : [];
  const { addItem } = useCart();

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

  const familyWithImage = PRODUCT_FAMILIES.find((f) => f.id === family.id);

  return (
    <div className="min-h-screen text-foreground bg-[#fafafa] dark:bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="sticky top-14 sm:top-16 z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 pt-2 pb-3 mb-4 bg-[#fafafa] dark:bg-background border-b border-gray-200/50 dark:border-border">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground bg-white dark:bg-card border border-border hover:border-teal-500 hover:bg-teal-500/5 hover:text-teal-600 dark:hover:text-teal-400 mb-6 px-4 py-2.5 rounded-full shadow-sm transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la tienda
          </Link>
        </div>

        {familyWithImage?.image ? (
          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] min-h-[180px] max-h-[280px] mb-8 bg-gray-100 dark:bg-white/5">
            <Image
              src={familyWithImage.image}
              alt={family.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1280px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">{family.name}</h1>
              <p className="text-white/90 mt-1 max-w-2xl">
                {family.description ?? `${products.length} productos`}
              </p>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{family.name}</h1>
            <p className="text-muted mb-8">{family.description ?? `${products.length} productos`}</p>
          </>
        )}

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
                </div>
              </Link>
              <div className="px-4 pb-4 flex gap-2">
                <Link
                  href={`/tienda/${product.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Ver producto
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    addItem({ productId: product.id, quantity: 1, isSubscription: false });
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Añadir al carrito
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
