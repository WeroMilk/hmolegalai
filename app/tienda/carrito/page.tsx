"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { getProductById, PLAN_DIETA_IDS } from "@/lib/products";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";

function formatPrice(centavos: number): string {
  return `$${(centavos / 100).toLocaleString("es-MX")} MXN`;
}

export default function CarritoPage() {
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, totalItems, totalPriceCentavos } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setError("");
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = user ? await user.getIdToken().catch(() => null) : null;
      if (token) headers.Authorization = `Bearer ${token}`;
      const planItem = items.find((i) => i.consultaId && (i.productId === PLAN_DIETA_IDS.semanal || i.productId === PLAN_DIETA_IDS.quincenal || i.productId === PLAN_DIETA_IDS.mensual));
      const consultaId = planItem?.consultaId;
      const planDieta = planItem
        ? (planItem.productId === PLAN_DIETA_IDS.semanal ? "semanal" : planItem.productId === PLAN_DIETA_IDS.quincenal ? "quincenal" : "mensual")
        : undefined;
      const body: Record<string, unknown> = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          isSubscription: i.isSubscription ?? false,
        })),
        successUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/tienda/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/tienda/carrito`,
      };
      if (consultaId) {
        body.consultaId = consultaId;
        if (planDieta) body.planDieta = planDieta;
      }
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen text-foreground bg-[#fafafa] dark:bg-background">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 pt-28 pb-16 text-center">
          <div className="rounded-2xl border border-border bg-white dark:bg-card p-10">
            <ShoppingCart className="w-16 h-16 text-muted mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Tu carrito está vacío</h1>
            <p className="text-muted mb-6">
              Añade productos desde la tienda o envía tu solicitud de plan de alimentación para continuar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/tienda">
                <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700">Ver tienda</Button>
              </Link>
              <Link href="/consulta">
                <Button variant="outline" className="w-full sm:w-auto">Solicitar plan</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground bg-[#fafafa] dark:bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-teal-600 mb-6 px-3 py-2 rounded-full border border-border hover:border-teal-500/30 hover:bg-teal-500/5 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Seguir comprando
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-teal-500" />
          Carrito ({totalItems} {totalItems === 1 ? "producto" : "productos"})
        </h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;
            const price = item.isSubscription ? product.priceSubscription : product.priceOneTime;
            const subtotal = price * item.quantity;
            return (
              <motion.div
                key={`${item.productId}-${item.isSubscription ?? false}`}
                layout
                className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-card border border-border shadow-sm"
              >
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white dark:bg-card border border-gray-200/50 dark:border-border flex-shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-0.5"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-foreground truncate">{product.name}</h2>
                  <p className="text-sm text-muted mt-0.5">
                    {formatPrice(price)} {item.isSubscription && "/ mes"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center rounded-lg border border-border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.isSubscription)}
                        className="p-2 hover:bg-muted transition-colors"
                        aria-label="Menos"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.isSubscription)}
                        className="p-2 hover:bg-muted transition-colors"
                        aria-label="Más"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.isSubscription)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      aria-label="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-teal-600 dark:text-teal-400">{formatPrice(subtotal)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-white dark:bg-card border border-border p-6 shadow-sm">
          <div className="flex justify-between items-center text-lg mb-4">
            <span className="text-muted">Total</span>
            <span className="font-bold text-foreground">{formatPrice(totalPriceCentavos)}</span>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 py-6 text-base font-semibold"
          >
            {loading ? "Procesando..." : "Procesar pago y enviar solicitud"}
          </Button>
          <p className="text-xs text-muted mt-3 text-center">
            Serás redirigido a un pago seguro. El admin recibirá tu solicitud una vez confirmado el pago.
          </p>
        </div>
      </main>
    </div>
  );
}
