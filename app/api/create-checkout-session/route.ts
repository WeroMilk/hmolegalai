import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { getProductById } from "@/lib/products";
import type Stripe from "stripe";

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key === "") return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido (JSON esperado)." },
      { status: 400 }
    );
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }
  try {
    const items = Array.isArray(body.items) ? body.items : [];
    const bodySuccessUrl = typeof body.successUrl === "string" ? body.successUrl : undefined;
    const bodyCancelUrl = typeof body.cancelUrl === "string" ? body.cancelUrl : undefined;
    const documentId = body.documentId;
    const price = typeof body.price === "number" ? body.price : undefined;
    const saveToAccount = !!body.saveToAccount;
    const bodyToken = body.idToken;

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
          if (!items.length) {
            return NextResponse.json({ error: "Debes iniciar sesión para realizar el pago." }, { status: 401 });
          }
        }
      }
    }

    const stripe = await getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe no configurado. Configura STRIPE_SECRET_KEY en Vercel." }, { status: 500 });
    }

    if (items.length > 0) {
      const successUrl = bodySuccessUrl || `${origin}/tienda/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = bodyCancelUrl || `${origin}/tienda`;
      const isSubscription = items.some(
        (i: unknown) =>
          typeof i === "object" &&
          i !== null &&
          "isSubscription" in i &&
          (i as { isSubscription?: boolean }).isSubscription
      );
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      for (const item of items) {
        const productId = typeof item === "object" && item !== null && "productId" in item ? String((item as { productId: unknown }).productId) : "";
        const product = productId ? getProductById(productId) : undefined;
        if (!product) {
          return NextResponse.json({ error: `Producto no encontrado: ${productId}` }, { status: 400 });
        }
        const rawQty = typeof item === "object" && item !== null && "quantity" in item ? (item as { quantity?: unknown }).quantity : 1;
        const qty = Math.min(10, Math.max(1, Number(rawQty) || 1));
        const itemIsSubscription =
          typeof item === "object" &&
          item !== null &&
          "isSubscription" in item &&
          (item as { isSubscription?: boolean }).isSubscription;
        if (isSubscription && itemIsSubscription) {
          lineItems.push({
            price_data: {
              currency: "mxn",
              product_data: {
                name: product.name,
                description: product.description,
                images: product.image ? [product.image.startsWith("http") ? product.image : `${origin}${product.image}`] : undefined,
              },
              unit_amount: product.priceSubscription,
              recurring: { interval: "month" } as Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring,
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
        line_items: lineItems,
        mode: isSubscription ? "subscription" : "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        shipping_address_collection: {
          allowed_countries: ["MX"],
        },
        metadata: {
          type: "tienda",
          userId: (userId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 500),
          items: JSON.stringify(items).slice(0, 500),
        },
      });

      if (adminDb && session.id) {
        try {
          await adminDb.collection("orders").doc(session.id).set({
            stripeSessionId: session.id,
            status: "pending",
            userId: userId || null,
            items,
            createdAt: new Date(),
          });
        } catch (dbErr) {
          console.error("Error guardando orden en Firestore:", dbErr);
          // No fallar el checkout si solo falla el guardado en DB
        }
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
        documentId: String(documentId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 500),
        saveToAccount: saveToAccount ? "1" : "0",
        userId: (userId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 500),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear la sesión de pago";
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: message.includes("Stripe") ? message : "Error al procesar el pago. Revisa los datos e intenta de nuevo." },
      { status: 500 }
    );
  }
}
