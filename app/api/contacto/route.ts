import { NextRequest, NextResponse } from "next/server";

const CONTACT_EMAIL = "lnhdianagallardo@gmail.com";
const MAX_NAME = 200;
const MAX_MESSAGE = 5000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nombreCompleto = typeof body.nombreCompleto === "string" ? body.nombreCompleto.trim().slice(0, MAX_NAME) : "";
    const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, MAX_MESSAGE) : "";

    if (!nombreCompleto) {
      return NextResponse.json({ error: "El nombre completo es obligatorio." }, { status: 400 });
    }
    if (!mensaje) {
      return NextResponse.json({ error: "El mensaje es obligatorio." }, { status: 400 });
    }

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
            to: [CONTACT_EMAIL],
            subject: `Contacto web: ${nombreCompleto}`,
            text: `Nombre: ${nombreCompleto}\n\nMensaje:\n${mensaje}`,
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error("Resend contact email failed:", res.status, errText);
          let userMessage = "No se pudo enviar el correo. Intenta de nuevo más tarde.";
          try {
            const errJson = JSON.parse(errText);
            if (errJson?.message && typeof errJson.message === "string") {
              if (errJson.message.includes("domain") || errJson.message.includes("from")) {
                userMessage = "Configuración de correo en revisión. Escribe directamente a lnhdianagallardo@gmail.com.";
              }
            }
          } catch {
            // keep default userMessage
          }
          return NextResponse.json(
            { error: userMessage },
            { status: 502 }
          );
        }
      } catch (e) {
        console.error("Error sending contact email:", e);
        return NextResponse.json(
          { error: "Error al enviar el mensaje. Intenta de nuevo." },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "El envío de correo no está configurado. Contacta al administrador." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud." }, { status: 500 });
  }
}
