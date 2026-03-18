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
        metadata?: Record<string, string | undefined>;
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
          let itemsOrder: unknown[] = [];
          try {
            if (meta.items) itemsOrder = JSON.parse(meta.items) as unknown[];
          } catch {
            // ignore
          }
          await adminDb.collection("orders").doc(session.id).set({
            stripeSessionId: session.id,
            status: "paid",
            paidAt: new Date(),
            shippingAddress: shippingAddress ?? null,
            userId: meta.userId && meta.userId.length > 0 ? meta.userId : null,
            items: itemsOrder,
            createdAt: new Date(),
          });
        }
        const planDieta = meta.planDieta && ["semanal", "quincenal", "mensual", "prueba"].includes(meta.planDieta) ? meta.planDieta : null;
        let consultaIdToUse: string | null = meta.consultaId ?? null;
        if (meta.type === "consulta" && meta.cNombre && !consultaIdToUse) {
          const edadN = parseInt(String(meta.cEdad ?? "0"), 10) || 0;
          let habitos: { alimentacion: string[]; ejercicio: string[]; sueno: string[]; estres: string[] } = {
            alimentacion: [],
            ejercicio: [],
            sueno: [],
            estres: [],
          };
          try {
            if (meta.cHab) {
              const parsed = JSON.parse(meta.cHab) as Record<string, unknown>;
              habitos = {
                alimentacion: Array.isArray(parsed.alimentacion) ? parsed.alimentacion.map(String) : [],
                ejercicio: Array.isArray(parsed.ejercicio) ? parsed.ejercicio.map(String) : [],
                sueno: Array.isArray(parsed.sueno) ? parsed.sueno.map(String) : [],
                estres: Array.isArray(parsed.estres) ? parsed.estres.map(String) : [],
              };
            }
          } catch {
            // ignore invalid JSON
          }
          const importanciaNum = Math.min(10, Math.max(0, parseInt(String(meta.cImportancia ?? "0"), 10) || 0));
          const estaturaN = parseInt(String(meta.cEstatura ?? "0"), 10) || 0;
          const pesoVal = (meta.cPeso ?? "").trim();
          const consultaDoc = {
            nombre: meta.cNombre ?? "",
            edad: Number.isNaN(edadN) || edadN < 1 || edadN > 120 ? 0 : edadN,
            estatura: estaturaN >= 100 && estaturaN <= 250 ? estaturaN : 0,
            peso: pesoVal || null,
            telefono: meta.cTel ?? "",
            email: meta.cEmail ?? "",
            objetivoPrincipal: meta.cObj || null,
            metaPeso: meta.cMetaPeso || null,
            tipoDieta: meta.cTipoDieta || null,
            condicionesMedicas: meta.cCond || null,
            habitos,
            importanciaSuplementos: importanciaNum,
            createdAt: new Date(),
            paidAt: new Date(),
            stripeSessionId: session.id,
            planDieta: planDieta ?? "semanal",
          };
          const ref = await adminDb.collection("consultas").add(consultaDoc);
          consultaIdToUse = ref.id;
        } else if (meta.consultaId) {
          await adminDb.collection("consultas").doc(meta.consultaId).set(
            { paidAt: new Date(), stripeSessionId: session.id, planDieta: planDieta ?? "semanal" },
            { merge: true }
          );
          consultaIdToUse = meta.consultaId;
        }
        if (consultaIdToUse && meta.type === "consulta") {
          const nutritionistEmail = process.env.NUTRITIONIST_EMAIL?.trim() || "didi@dietas.com";
          if (process.env.RESEND_API_KEY?.trim()) {
            try {
              const consultaSnap = await adminDb.collection("consultas").doc(consultaIdToUse).get();
              const c = consultaSnap.data() as Record<string, unknown> | undefined;
              const planLabel = planDieta === "prueba" ? "Prueba ($10)" : planDieta === "mensual" ? "Mensual ($999)" : planDieta === "quincenal" ? "Quincenal ($599)" : "Semanal ($399)";
              const habitos = (c?.habitos as Record<string, string[]>) ?? {};
              const text = [
                `Plan de alimentación PAGADO — ${planLabel}`,
                "",
                `Nombre: ${c?.nombre ?? "-"}`,
                `Edad: ${c?.edad ?? "-"}`,
                c?.estatura ? `Estatura: ${c.estatura} cm` : "",
                c?.peso ? `Peso: ${c.peso} kg` : "",
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
                `ID consulta: ${consultaIdToUse}`,
                `Revisa tu panel en /admin`,
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
