import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDidiUser } from "@/lib/didi";

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
