import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth-server";

/** Inicializa Stripe solo en runtime (dynamic import) para no fallar el build cuando faltan env vars. */
async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key === "") return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    const isDemoSuperuser = token === "demo-superuser";
    let userId: string | undefined;

    if (token) {
      if (isDemoSuperuser) {
        userId = "demo-superuser";
      } else {
        try {
          const decoded = await verifyIdToken(token);
          userId = decoded.uid;
        } catch {
          return NextResponse.json(
            { error: "Debes iniciar sesión para realizar el pago." },
            { status: 401 }
          );
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para realizar el pago." },
        { status: 401 }
      );
    }

    const stripe = await getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe no configurado. Configura STRIPE_SECRET_KEY en Vercel." },
        { status: 500 }
      );
    }
    const { documentId, price, saveToAccount } = await request.json();

    if (!documentId || typeof price !== "number" || price < 1) {
      return NextResponse.json(
        { error: "documentId y price requeridos (price en centavos)" },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "";
    const successBase = `${origin}/documentos/${documentId}/success?session_id={CHECKOUT_SESSION_ID}`;
    const successUrl = saveToAccount ? `${successBase}&save=1` : successBase;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `Documento Legal: ${documentId}`,
              description: saveToAccount
                ? "Generación de documento legal con IA + guardado permanente en Mi cuenta"
                : "Generación de documento legal con IA",
            },
            unit_amount: price, // cliente envía centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: `${origin}/documentos/${documentId}`,
      metadata: {
        documentId,
        saveToAccount: saveToAccount ? "1" : "0",
        userId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
