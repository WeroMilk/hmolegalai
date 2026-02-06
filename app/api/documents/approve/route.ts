import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyIdToken, adminDb } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await verifyIdToken(token);
    const uid = decoded.uid;

    if (!adminDb) return NextResponse.json({ error: "DB no configurada" }, { status: 503 });

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (userData?.role !== "abogado" || userData?.approved !== true) {
      return NextResponse.json({ error: "Solo abogados aprobados pueden aprobar documentos" }, { status: 403 });
    }

    const body = await request.json();
    const { documentId, content, stampUrl, signatureUrl } = body;
    if (!documentId) return NextResponse.json({ error: "documentId requerido" }, { status: 400 });

    const docRef = adminDb.collection("documents").doc(documentId);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    const data = doc.data();
    if (data?.status !== "pending_abogado") {
      return NextResponse.json({ error: "El documento no está pendiente de aprobación" }, { status: 400 });
    }
    const assignedTo = data?.abogadoId;
    if (assignedTo && assignedTo !== uid) {
      return NextResponse.json({ error: "Este documento está asignado a otro abogado" }, { status: 403 });
    }

    const update: Record<string, unknown> = {
      status: "approved",
      abogadoId: uid,
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (content != null) update.content = String(content);
    if (stampUrl != null) update.stampUrl = String(stampUrl);
    if (signatureUrl != null) update.signatureUrl = String(signatureUrl);

    await docRef.update(update);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error approving document:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al aprobar" },
      { status: 500 }
    );
  }
}
