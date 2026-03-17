"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

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
