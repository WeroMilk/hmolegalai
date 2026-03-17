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
      const session = event.data.object as { id?: string; metadata?: { type?: string } };
      if (session.metadata?.type === "tienda" && adminDb && session.id) {
        await adminDb.collection("orders").doc(session.id).set(
          { status: "paid", paidAt: new Date() },
          { merge: true }
        );
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
