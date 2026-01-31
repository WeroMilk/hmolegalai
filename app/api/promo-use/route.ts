import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await verifyIdToken(token);
    const userId = decoded.uid;
    if (!adminDb) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 500 });
    }
    const promoRef = adminDb.collection("promo_allocations").doc(userId);
    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(promoRef);
      if (!snap.exists) {
        return { ok: false, remaining: 0 };
      }
      const data = snap.data();
      const current = (data?.freeDocsRemaining ?? 0) as number;
      if (current <= 0) {
        return { ok: false, remaining: 0 };
      }
      tx.update(promoRef, {
        freeDocsRemaining: FieldValue.increment(-1),
        lastUsedAt: FieldValue.serverTimestamp(),
      });
      return { ok: true, remaining: current - 1 };
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "No tienes documentos gratis disponibles" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, remaining: result.remaining });
  } catch (error: any) {
    console.error("Promo use error:", error);
    return NextResponse.json(
      { error: error.message || "Error al usar documento gratis" },
      { status: 500 }
    );
  }
}
