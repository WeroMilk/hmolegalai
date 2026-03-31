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

function toMillis(value: unknown): number {
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? 0 : t;
  }
  if (value instanceof Date) return value.getTime();
  return 0;
}

type ConsultaRow = {
  id: string;
  createdAt?: unknown;
} & Record<string, unknown>;

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
    const snap = await adminDb.collection("consultas").limit(300).get();
    const consultas: ConsultaRow[] = snap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      const serialized = serializeDocData(d);
      return { id: doc.id, ...serialized } as ConsultaRow;
    }).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0, 200);
    return NextResponse.json({ consultas });
  } catch (e) {
    console.error("Admin consultas error:", e);
    const reason = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: `Error al listar consultas: ${reason}` }, { status: 500 });
  }
}
