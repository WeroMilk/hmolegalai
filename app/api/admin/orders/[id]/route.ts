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
    if (
      status !== undefined &&
      status !== "pendiente" &&
      status !== "enviado" &&
      status !== "por llegar" &&
      status !== "finalizado" &&
      status !== "enviada" &&
      status !== "paid" &&
      status !== "pending"
    ) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }
    if (!adminDb) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const update: Record<string, unknown> = {};
    if (status !== undefined) {
      update.status = status === "paid" || status === "pending" || status === "enviada" ? "pendiente" : status;
      if (status === "enviado" || status === "enviada") update.enviadaAt = new Date();
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
    const orderRef = adminDb.collection("orders").doc(id);
    const orderSnap = await orderRef.get();
    const currentStatus = (orderSnap.data()?.status as string | undefined) ?? "";
    const normalizedStatus = currentStatus === "paid" || currentStatus === "pending" || currentStatus === "enviada" ? "pendiente" : currentStatus;
    if (normalizedStatus !== "finalizado") {
      return NextResponse.json({ error: "Solo puedes eliminar órdenes finalizadas" }, { status: 400 });
    }
    await orderRef.delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin order delete error:", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
