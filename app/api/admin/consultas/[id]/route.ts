import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDidiUser } from "@/lib/didi";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const decoded = await verifyIdToken(token);
    const email = (decoded as { email?: string }).email ?? "";
    if (!isDidiUser(email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    if (!adminDb) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    await adminDb.collection("consultas").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin consulta delete error:", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
