"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, ShoppingCart } from "lucide-react";

function formatPrice(centavos: number): string {
  return `$${(centavos / 100).toLocaleString("es-MX")} MXN`;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const product = getProductBySlug(slug);
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const handleBuy = async () => {
    if (!product) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: 1, isSubscription: false }],
          successUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/tienda/success`,
          cancelUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/tienda/${slug}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al crear la sesión de pago");
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No se recibió URL de pago");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar");
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen text-foreground">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 pt-28 pb-16 text-center">
          <p className="text-muted">Producto no encontrado.</p>
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 mt-4 text-sm text-muted hover:text-teal-600 px-3 py-2 rounded-full border border-border hover:border-teal-500/30 hover:bg-teal-500/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la tienda
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-0 text-foreground">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-10">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-teal-600 mb-6 px-3 py-2 rounded-full border border-border hover:border-teal-500/30 hover:bg-teal-500/5 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la tienda
        </Link>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-effect p-6 sm:p-8 rounded-xl border border-teal-500/40"
        >
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="aspect-square relative w-full sm:w-64 h-64 sm:flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 256px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-xs bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded mb-2">
                Recomendado por Nutrióloga Titulada
              </span>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-muted mt-2">{product.description}</p>
              <div className="mt-4">
                <p className="font-semibold text-lg">{formatPrice(product.priceOneTime)}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    addItem({ productId: product.id, quantity: 1, isSubscription: false });
                    setAdded(true);
                    setTimeout(() => setAdded(false), 2000);
                  }}
                  variant="outline"
                  className="border-teal-500 text-teal-600 hover:bg-teal-500/10"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {added ? "Añadido al carrito" : "Añadir al carrito"}
                </Button>
                <Button
                  onClick={handleBuy}
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {loading ? "Procesando..." : `Comprar por ${formatPrice(product.priceOneTime)}`}
                </Button>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-3">{error}</p>
              )}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <h2 className="font-semibold text-lg mb-2">Por qué lo recomiendo</h2>
            <p className="text-muted">{product.whyRecommend}</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
