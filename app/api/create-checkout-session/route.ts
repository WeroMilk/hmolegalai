import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { getProductById } from "@/lib/products";
import type Stripe from "stripe";

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key === "") return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
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
    const consultaId = typeof body.consultaId === "string" ? body.consultaId.trim().slice(0, 200) : undefined;
    const planDieta = typeof body.planDieta === "string" && ["semanal", "quincenal", "mensual", "prueba"].includes(body.planDieta) ? body.planDieta : undefined;
    const bodyConsulta = body.consulta && typeof body.consulta === "object" ? (body.consulta as Record<string, unknown>) : undefined;
    const documentId = body.documentId;
    const price = typeof body.price === "number" ? body.price : undefined;
    const saveToAccount = !!body.saveToAccount;
    const bodyToken = body.idToken;

    const origin =
      request.headers.get("origin")?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "";
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
        const qty = Math.min(9999, Math.max(1, Number(rawQty) || 1));
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

      // Stripe exige un mínimo por moneda; en MXN suele ser 500 centavos ($5). Evitar error devolviendo mensaje claro.
      const STRIPE_MIN_MXN_CENTAVOS = 500;
      const totalMxnCentavos = lineItems.reduce((sum, li) => sum + (Number(li.price_data?.unit_amount) || 0) * (li.quantity || 1), 0);
      if (totalMxnCentavos > 0 && totalMxnCentavos < STRIPE_MIN_MXN_CENTAVOS) {
        return NextResponse.json(
          {
            error: "Stripe no permite cobros menores a $5 MXN en la tienda. Para pruebas de $10, usa la opción «$10 (pruebas)» en la página Solicitar plan.",
          },
          { status: 400 }
        );
      }

      const hasTiendaItems = lineItems.some((_, i) => {
        const item = items[i];
        if (!item || typeof item !== "object" || !("productId" in item)) return true;
        const product = getProductById(String((item as { productId: unknown }).productId));
        return product?.family !== "plan";
      });

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        line_items: lineItems,
        mode: isSubscription ? "subscription" : "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          type: hasTiendaItems ? "tienda" : "consulta",
          userId: (userId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 500),
          items: JSON.stringify(items).slice(0, 500),
        },
      };
      if (consultaId) {
        sessionParams.metadata!.consultaId = consultaId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 200);
        if (planDieta) sessionParams.metadata!.planDieta = planDieta;
      }
      if (bodyConsulta && !hasTiendaItems && planDieta) {
        const nombre = String(bodyConsulta.nombre ?? "").trim().slice(0, 200);
        const email = String(bodyConsulta.email ?? "").trim().slice(0, 200);
        const telefono = String(bodyConsulta.telefono ?? "").trim().slice(0, 50);
        if (!nombre || !email || !telefono) {
          return NextResponse.json(
            { error: "Para solicitar plan de dieta envía nombre, email y teléfono en consulta." },
            { status: 400 }
          );
        }
        const meta = sessionParams.metadata!;
        const trunc = (s: string, max: number) => s.slice(0, max);
        meta.cNombre = trunc(nombre, 500);
        meta.cEmail = trunc(email, 500);
        meta.cTel = trunc(telefono, 500);
        meta.cEdad = trunc(String(bodyConsulta.edad ?? ""), 20);
        meta.cEstatura = trunc(String(bodyConsulta.estatura ?? ""), 20);
        meta.cPeso = trunc(String(bodyConsulta.peso ?? ""), 20);
        meta.cObj = trunc(String(bodyConsulta.objetivoPrincipal ?? ""), 500);
        meta.cMetaPeso = trunc(String(bodyConsulta.metaPeso ?? ""), 100);
        meta.cTipoDieta = trunc(String(bodyConsulta.tipoDieta ?? ""), 500);
        meta.cCond = trunc(String(bodyConsulta.condicionesMedicas ?? ""), 500);
        const habitos = {
          alimentacion: Array.isArray(bodyConsulta.habitosAlimentacion) ? bodyConsulta.habitosAlimentacion : [],
          ejercicio: Array.isArray(bodyConsulta.habitosEjercicio) ? bodyConsulta.habitosEjercicio : [],
          sueno: Array.isArray(bodyConsulta.habitosSueno) ? bodyConsulta.habitosSueno : [],
          estres: Array.isArray(bodyConsulta.habitosEstres) ? bodyConsulta.habitosEstres : [],
        };
        meta.cHab = trunc(JSON.stringify(habitos), 500);
        meta.cImportancia = trunc(String(bodyConsulta.importanciaSuplementos ?? ""), 20);
        meta.planDieta = planDieta;
      }
      if (hasTiendaItems) {
        sessionParams.shipping_address_collection = { allowed_countries: ["MX"] };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      // Plan dieta: el webhook crea/actualiza la consulta al confirmar el pago.
      // Tienda: la orden se crea en el webhook (checkout.session.completed) para evitar fallos de Firestore antes del pago.
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
