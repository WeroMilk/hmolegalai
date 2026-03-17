"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="max-w-xl mx-auto px-4 pt-28 pb-16 text-center">
      <div className="glass-effect p-8 rounded-xl border border-teal-500/40">
        <h1 className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-4">¡Pago realizado!</h1>
        <p className="text-muted mb-6">
          Gracias por tu compra. Recibirás la confirmación por correo y te contactaremos si hace falta algún dato para el envío.
        </p>
        {sessionId && (
          <p className="text-xs text-muted mb-6">ID de sesión: {sessionId}</p>
        )}
        <Link
          href="/tienda"
          className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
        >
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
