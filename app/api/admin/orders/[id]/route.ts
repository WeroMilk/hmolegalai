import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDidiUser } from "@/lib/didi";

export async function PATCH(
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
    const body = await request.json();
    const { status, numeroGuia } = body;
    if (status !== undefined && status !== "enviada" && status !== "paid" && status !== "pending") {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }
    if (!adminDb) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const update: Record<string, unknown> = {};
    if (status !== undefined) {
      update.status = status;
      if (status === "enviada") update.enviadaAt = new Date();
    }
    if (numeroGuia !== undefined) {
      update.numeroGuia = typeof numeroGuia === "string" ? numeroGuia.trim().slice(0, 200) : "";
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }
    await adminDb.collection("orders").doc(id).set(update, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin order update error:", e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

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
    await adminDb.collection("orders").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin order delete error:", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
