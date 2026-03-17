import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDidiUser } from "@/lib/didi";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const decoded = await verifyIdToken(token);
    const email = (decoded as { email?: string }).email ?? "";
    if (!isDidiUser(email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (!adminDb) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const snap = await adminDb.collection("consultas").orderBy("createdAt", "desc").limit(200).get();
    const consultas = snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() ?? null }));
    return NextResponse.json({ consultas });
  } catch (e) {
    console.error("Admin consultas error:", e);
    return NextResponse.json({ error: "Error al listar consultas" }, { status: 500 });
  }
}
