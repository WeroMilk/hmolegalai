import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDidiUser } from "@/lib/didi";

function serializeDoc(d: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
      out[k] = (v as { toDate: () => Date }).toDate().toISOString();
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
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }
  if (!isDidiUser(decoded.email ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  try {
    const snap = await adminDb.collection("contactos").orderBy("createdAt", "desc").limit(200).get();
    const contactos = snap.docs.map((doc) => ({
      id: doc.id,
      ...serializeDoc(doc.data() as Record<string, unknown>),
    }));
    return NextResponse.json({ contactos });
  } catch (e) {
    console.error("Admin contactos error:", e);
    return NextResponse.json({ error: "Error al listar mensajes" }, { status: 500 });
  }
}
