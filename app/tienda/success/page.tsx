"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useCart } from "@/lib/cart-context";

function runConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;
  const colors = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"];
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const confettiRun = useRef(false);
  const { clearCart } = useCart();

  useEffect(() => {
    if (confettiRun.current) return;
    confettiRun.current = true;
    runConfetti();
  }, []);

  useEffect(() => {
    if (sessionId) clearCart();
  }, [sessionId, clearCart]);

  return (
    <main className="max-w-xl mx-auto px-4 pt-28 pb-16 text-center">
      <div className="glass-effect p-8 rounded-2xl border border-teal-500/40 shadow-lg shadow-teal-500/10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-4">
          Pago generado con éxito
        </h1>
        <p className="text-muted mb-4 leading-relaxed">
          En menos de 24 horas recibirás notificación por WhatsApp con los detalles de tu pedido.
        </p>
        <p className="text-muted mb-6 text-sm leading-relaxed">
          Si estás en Hermosillo, te indicaremos en cuánto tiempo te llega. Si estás fuera, te solicitaremos tu ubicación y dirección para enviarte la guía de envío.
        </p>
        {sessionId && (
          <p className="text-xs text-muted mb-6">ID de sesión: {sessionId}</p>
        )}
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border border-teal-500/40 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la tienda
        </Link>
      </div>
    </main>
  );
}

export default function TiendaSuccessPage() {
  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <Suspense fallback={<div className="pt-28 text-center">Cargando...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
