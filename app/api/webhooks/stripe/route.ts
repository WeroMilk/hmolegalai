import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/auth-server";

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key === "") return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: "Webhook secret or signature missing" }, { status: 400 });
    }
    const stripe = await getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    let event: { type: string; data?: { object?: unknown } };
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret) as { type: string; data?: { object?: unknown } };
    } catch (err: any) {
      console.error("Stripe webhook signature verification failed:", err?.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    if (event.type === "checkout.session.completed" && event.data?.object) {
      const session = event.data.object as {
        id?: string;
        metadata?: { type?: string; consultaId?: string; planDieta?: string };
        customer_details?: { address?: { city?: string; country?: string; line1?: string; line2?: string; postal_code?: string; state?: string }; name?: string };
        shipping_details?: { address?: { city?: string; country?: string; line1?: string; line2?: string; postal_code?: string; state?: string }; name?: string };
      };
      const meta = session.metadata ?? {};
      if (adminDb && session.id) {
        if (meta.type === "tienda") {
          const shipping = session.shipping_details?.address || session.customer_details?.address;
          const shippingName = session.shipping_details?.name || session.customer_details?.name;
          const shippingAddress = shipping
            ? {
                line1: shipping.line1 ?? "",
                line2: shipping.line2 ?? "",
                city: shipping.city ?? "",
                state: shipping.state ?? "",
                postal_code: shipping.postal_code ?? "",
                country: shipping.country ?? "",
                name: shippingName ?? "",
              }
            : null;
          await adminDb.collection("orders").doc(session.id).set(
            { status: "paid", paidAt: new Date(), shippingAddress: shippingAddress ?? null },
            { merge: true }
          );
        }
        if (meta.consultaId) {
          const planDieta = meta.planDieta && ["semanal", "quincenal", "mensual"].includes(meta.planDieta) ? meta.planDieta : null;
          await adminDb.collection("consultas").doc(meta.consultaId).set(
            { paidAt: new Date(), stripeSessionId: session.id, planDieta: planDieta ?? "semanal" },
            { merge: true }
          );
          // Notificar al admin (didi@dietas.com) cuando el plan esté pagado
          const nutritionistEmail = process.env.NUTRITIONIST_EMAIL?.trim() || "didi@dietas.com";
          if (process.env.RESEND_API_KEY?.trim()) {
            try {
              const consultaSnap = await adminDb.collection("consultas").doc(meta.consultaId).get();
              const c = consultaSnap.data() as Record<string, unknown> | undefined;
              const planLabel = planDieta === "mensual" ? "Mensual ($999)" : planDieta === "quincenal" ? "Quincenal ($599)" : "Semanal ($399)";
              const habitos = (c?.habitos as Record<string, string[]>) ?? {};
              const text = [
                `Plan de alimentación PAGADO — ${planLabel}`,
                "",
                `Nombre: ${c?.nombre ?? "-"}`,
                `Edad: ${c?.edad ?? "-"}`,
                `Teléfono: ${c?.telefono ?? "-"}`,
                `Email: ${c?.email ?? "-"}`,
                `Objetivo: ${c?.objetivoPrincipal ?? "-"}`,
                c?.metaPeso ? `Meta peso: ${c.metaPeso}` : "",
                c?.tipoDieta ? `Tipo dieta: ${c.tipoDieta}` : "",
                c?.condicionesMedicas ? `Condiciones médicas: ${c.condicionesMedicas}` : "",
                `Importancia suplementos (1-10): ${c?.importanciaSuplementos ?? "-"}`,
                Array.isArray(habitos.alimentacion) && habitos.alimentacion.length ? `Alimentación: ${habitos.alimentacion.join(", ")}` : "",
                Array.isArray(habitos.ejercicio) && habitos.ejercicio.length ? `Ejercicio: ${habitos.ejercicio.join(", ")}` : "",
                Array.isArray(habitos.sueno) && habitos.sueno.length ? `Sueño: ${habitos.sueno.join(", ")}` : "",
                Array.isArray(habitos.estres) && habitos.estres.length ? `Estrés: ${habitos.estres.join(", ")}` : "",
                "",
                `ID consulta: ${meta.consultaId}`,
                `Dashboard: revisa la sección "Solicitudes de plan" en /admin`,
              ]
                .filter(Boolean)
                .join("\n");
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                  from: "VitalHealth <onboarding@resend.dev>",
                  to: [nutritionistEmail],
                  subject: `Plan pagado: ${c?.nombre ?? "Cliente"} — ${planLabel}`,
                  text,
                }),
              });
            } catch (e) {
              console.error("Error sending plan-paid email to admin:", e);
            }
          }
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
