import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isSuperUser } from "@/lib/superuser";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await verifyIdToken(token);
    const email = (decoded as { email?: string }).email;
    if (!isSuperUser(email)) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    if (!adminDb) return NextResponse.json({ error: "DB no configurada" }, { status: 503 });

    const snapshot = await adminDb
      .collection("users")
      .where("role", "==", "abogado")
      .get();

    const abogados = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toMillis?.(),
    }));

    return NextResponse.json({ abogados });
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await verifyIdToken(token);
    const email = (decoded as { email?: string }).email;
    if (!isSuperUser(email)) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, approved } = body;
    if (!userId || typeof approved !== "boolean") {
      return NextResponse.json({ error: "userId y approved requeridos" }, { status: 400 });
    }

    if (!adminDb) return NextResponse.json({ error: "DB no configurada" }, { status: 503 });

    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists || userDoc.data()?.role !== "abogado") {
      return NextResponse.json({ error: "Usuario no encontrado o no es abogado" }, { status: 404 });
    }

    await userRef.update({
      approved,
      approvedAt: approved ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error updating abogado:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
