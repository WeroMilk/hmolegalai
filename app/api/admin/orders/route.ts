import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDidiUser } from "@/lib/didi";

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key === "") return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

/** Convierte Timestamps de Firestore a ISO string para que JSON.stringify no falle */
function serializeDocData(d: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
      out[k] = (v as { toDate: () => Date }).toDate().toISOString();
    } else if (v && typeof v === "object" && !Array.isArray(v) && v.constructor?.name === "Timestamp") {
      out[k] = (v as { toDate: () => Date }).toDate?.()?.toISOString?.() ?? null;
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function syncOrdersFromStripe() {
  if (!adminDb) return;
  const stripe = await getStripe();
  if (!stripe) return;

  const sessions = await stripe.checkout.sessions.list({ limit: 100 });
  const syncJobs: Promise<unknown>[] = [];

  for (const session of sessions.data) {
    const isTiendaOrder = session.metadata?.type === "tienda";
    const isPaid = session.payment_status === "paid";
    if (!isTiendaOrder || !isPaid || !session.id) continue;

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
      if (session.metadata?.items) itemsOrder = JSON.parse(session.metadata.items) as unknown[];
    } catch {
      // ignore invalid JSON
    }

    const paidAt = session.created ? new Date(session.created * 1000) : new Date();

    syncJobs.push(
      adminDb.collection("orders").doc(session.id).set(
        {
          stripeSessionId: session.id,
          status: "pendiente",
          paidAt,
          shippingAddress,
          userId: session.metadata?.userId && session.metadata.userId.length > 0 ? session.metadata.userId : null,
          items: itemsOrder,
          createdAt: paidAt,
        },
        { merge: true }
      )
    );
  }

  await Promise.all(syncJobs);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let decoded: { email?: string };
  try {
    decoded = await verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Sesión inválida o expirada" }, { status: 401 });
  }

  const email = decoded.email ?? "";
  if (!isDidiUser(email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  try {
    await syncOrdersFromStripe();
    const snap = await adminDb.collection("orders").orderBy("createdAt", "desc").limit(200).get();
    const orders = snap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      const serialized = serializeDocData(d);
      return {
        id: doc.id,
        ...serialized,
        createdAt: serialized.createdAt ?? null,
        paidAt: serialized.paidAt ?? null,
      };
    });
    return NextResponse.json({ orders });
  } catch (e) {
    console.error("Admin orders error:", e);
    return NextResponse.json({ error: "Error al listar órdenes" }, { status: 500 });
  }
}
