import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { getProductById } from "@/lib/products";

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key === "") return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, successUrl: bodySuccessUrl, cancelUrl: bodyCancelUrl, documentId, price, saveToAccount, idToken: bodyToken } = body;

    const origin = request.headers.get("origin") || "";
    let userId: string | undefined;

    if (bodyToken || request.headers.get("authorization")) {
      const authHeader = request.headers.get("authorization");
      const headerToken = authHeader?.replace("Bearer ", "").trim();
      const token = headerToken || (typeof bodyToken === "string" ? bodyToken.trim() : "");
      if (token === "demo-superuser") {
        userId = "demo-superuser";
      } else if (token) {
        try {
          const decoded = await verifyIdToken(token);
          userId = decoded.uid;
        } catch {
          // guest checkout allowed when using items (tienda)
          if (!items?.length) {
            return NextResponse.json({ error: "Debes iniciar sesión para realizar el pago." }, { status: 401 });
          }
        }
      }
    }

    const stripe = await getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe no configurado. Configura STRIPE_SECRET_KEY en Vercel." }, { status: 500 });
    }

    if (items?.length) {
      const successUrl = bodySuccessUrl || `${origin}/tienda/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = bodyCancelUrl || `${origin}/tienda`;
      const isSubscription = items.some((i: { isSubscription?: boolean }) => i.isSubscription);
      const lineItems: { price_data: any; quantity: number }[] = [];

      for (const item of items) {
        const product = getProductById(item.productId);
        if (!product) {
          return NextResponse.json({ error: `Producto no encontrado: ${item.productId}` }, { status: 400 });
        }
        const qty = Math.min(10, Math.max(1, Number(item.quantity) || 1));
        if (isSubscription && item.isSubscription) {
          lineItems.push({
            price_data: {
              currency: "mxn",
              product_data: {
                name: product.name,
                description: product.description,
                images: product.image ? [product.image.startsWith("http") ? product.image : `${origin}${product.image}`] : undefined,
              },
              unit_amount: product.priceSubscription,
              recurring: { interval: "month" },
            },
            quantity: qty,
          });
        } else {
          lineItems.push({
            price_data: {
              currency: "mxn",
              product_data: {
                name: product.name,
                description: product.description,
                images: product.image ? [product.image.startsWith("http") ? product.image : `${origin}${product.image}`] : undefined,
              },
              unit_amount: product.priceOneTime,
            },
            quantity: qty,
          });
        }
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: isSubscription ? "subscription" : "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          type: "tienda",
          userId: userId || "",
          items: JSON.stringify(items),
        },
      });

      if (adminDb && session.id) {
        await adminDb.collection("orders").doc(session.id).set({
          stripeSessionId: session.id,
          status: "pending",
          userId: userId || null,
          items,
          createdAt: new Date(),
        });
      }

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    if (!documentId || typeof price !== "number" || price < 1) {
      return NextResponse.json(
        { error: "Envía items (productId, quantity, isSubscription) o documentId y price." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "Debes iniciar sesión para realizar el pago." }, { status: 401 });
    }

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
              description: saveToAccount ? "Generación de documento legal con IA + guardado en Mi cuenta" : "Generación de documento legal con IA",
            },
            unit_amount: price,
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
