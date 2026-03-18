import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/auth-server";

const DESTINO_EMAIL = "lnhdianagallardo@gmail.com";
const MAX_NAME = 200;
const MAX_MESSAGE = 5000;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  const nombre = typeof body.nombreCompleto === "string" ? body.nombreCompleto.trim().slice(0, MAX_NAME) : "";
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, MAX_MESSAGE) : "";

  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  if (!mensaje) {
    return NextResponse.json({ error: "El mensaje es obligatorio." }, { status: 400 });
  }

  let emailSent = false;
  let firestoreSaved = false;

  // 1. Enviar correo a lnhdianagallardo@gmail.com si hay Resend
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
      if (res.ok) emailSent = true;
      else console.error("Resend contact:", res.status, await res.text());
    } catch (e) {
      console.error("Resend contact error:", e);
    }
  }

  // 2. Guardar en Firestore si está configurado (no fallar la petición si Firestore falla)
  if (adminDb) {
    try {
      await adminDb.collection("contactos").add({
        nombre,
        mensaje,
        createdAt: new Date(),
      });
      firestoreSaved = true;
    } catch (e) {
      console.error("Contact Firestore error:", e);
    }
  }

  if (!process.env.RESEND_API_KEY?.trim() && !adminDb) {
    return NextResponse.json(
      { error: "No está configurado el envío de correos (RESEND_API_KEY) ni la base de datos (Firebase). Revisa .env.local." },
      { status: 503 }
    );
  }

  if (!emailSent && !firestoreSaved) {
    return NextResponse.json(
      { error: "No se pudo enviar el correo ni guardar el mensaje. Revisa RESEND_API_KEY o Firebase (consola del servidor)." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
