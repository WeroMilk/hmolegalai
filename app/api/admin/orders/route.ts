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

function toMillis(value: unknown): number {
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? 0 : t;
  }
  if (value instanceof Date) return value.getTime();
  return 0;
}

async function syncOrdersFromStripe() {
  if (!adminDb) return;
  const stripe = await getStripe();
  if (!stripe) return { attempted: false, reason: "Stripe no configurado", synced: 0 };

  const sessions = await stripe.checkout.sessions.list({ limit: 100 });
  const syncJobs: Promise<unknown>[] = [];
  let paidSessions = 0;
  let tiendaCandidates = 0;
  let synced = 0;
  let mode: "test" | "live" | "mixed" | "unknown" = "unknown";
  let sawTest = false;
  let sawLive = false;

  for (const session of sessions.data) {
    if (session.livemode) sawLive = true;
    else sawTest = true;
    if (session.payment_status === "paid") paidSessions += 1;
    const metadataType = session.metadata?.type ?? "";
    const isConsulta = metadataType === "consulta" || !!session.metadata?.planDieta || !!session.metadata?.cNombre;
    const isDocumento = !!session.metadata?.documentId;
    const isTiendaOrder = metadataType === "tienda" || (!isConsulta && !isDocumento);
    const isPaid = session.payment_status === "paid";
    if (!isTiendaOrder || !isPaid || !session.id) continue;
    tiendaCandidates += 1;

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
    synced += 1;
  }

  await Promise.all(syncJobs);
  mode = sawLive && sawTest ? "mixed" : sawLive ? "live" : sawTest ? "test" : "unknown";
  return { attempted: true, reason: null, synced, paidSessions, tiendaCandidates, mode };
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
    let syncDebug: Record<string, unknown> = { attempted: false };
    try {
      syncDebug = (await syncOrdersFromStripe()) as Record<string, unknown>;
    } catch (syncError) {
      console.error("Admin orders sync error:", syncError);
      syncDebug = {
        attempted: true,
        synced: 0,
        error: syncError instanceof Error ? syncError.message : "Error desconocido al sincronizar Stripe",
      };
    }
    const snap = await adminDb.collection("orders").limit(300).get();
    const orders = snap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      const serialized = serializeDocData(d);
      return {
        id: doc.id,
        ...serialized,
        createdAt: serialized.createdAt ?? null,
        paidAt: serialized.paidAt ?? null,
      };
    }).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0, 200);
    return NextResponse.json({ orders, debug: { sync: syncDebug } });
  } catch (e) {
    console.error("Admin orders error:", e);
    const reason = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: `Error al listar órdenes: ${reason}` }, { status: 500 });
  }
}
