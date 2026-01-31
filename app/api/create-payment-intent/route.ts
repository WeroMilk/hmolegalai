import { NextRequest, NextResponse } from "next/server";

/** Inicializa Stripe solo en runtime (dynamic import) para no fallar el build cuando faltan env vars. */
async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key === "") return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe no configurado. Configura STRIPE_SECRET_KEY en Vercel." },
        { status: 500 }
      );
    }
    const { documentId, amount, saveToAccount } = await request.json();

    if (!documentId || typeof amount !== "number" || amount < 1) {
      return NextResponse.json(
        { error: "documentId y amount requeridos (amount en centavos)" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // centavos (ej: 5900 = $59 MXN)
      currency: "mxn",
      automatic_payment_methods: { enabled: true },
      metadata: {
        documentId,
        saveToAccount: saveToAccount ? "1" : "0",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear intención de pago" },
      { status: 500 }
    );
  }
}
