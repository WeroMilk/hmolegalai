import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/auth-server";

const DESTINO_EMAIL = "lnhdianagallardo@gmail.com";
const MAX_NAME = 200;
const MAX_MESSAGE = 5000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nombre = typeof body.nombreCompleto === "string" ? body.nombreCompleto.trim().slice(0, MAX_NAME) : "";
    const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, MAX_MESSAGE) : "";

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }
    if (!mensaje) {
      return NextResponse.json({ error: "El mensaje es obligatorio." }, { status: 400 });
    }

    // 1. Guardar en Firestore (siempre que esté configurado). Los mensajes son anónimos y van a la misma persona.
    if (adminDb) {
      await adminDb.collection("contactos").add({
        nombre,
        mensaje,
        createdAt: new Date(),
      });
    }

    // 2. Opcional: enviar copia por correo a lnhdianagallardo@gmail.com (no falla si Resend no está)
    if (process.env.RESEND_API_KEY?.trim()) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "VitalHealth <onboarding@resend.dev>",
            to: [DESTINO_EMAIL],
            subject: `Contacto web: ${nombre}`,
            text: `Nombre: ${nombre}\n\nMensaje:\n${mensaje}`,
          }),
        });
        if (!res.ok) console.error("Resend contact:", res.status, await res.text());
      } catch (e) {
        console.error("Resend contact error:", e);
      }
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Base de datos no configurada. Revisa Firebase en .env.local." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Error al enviar. Intenta de nuevo." }, { status: 500 });
  }
}
