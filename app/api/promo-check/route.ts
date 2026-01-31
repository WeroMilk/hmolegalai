import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { FieldValue } from "firebase-admin/firestore";

const PROMO_MAX_USERS = 10;
const PROMO_FREE_DOCS = 5;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ hasPromo: false, freeDocsRemaining: 0 });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await verifyIdToken(token);
    const userId = decoded.uid;
    if (!adminDb) {
      return NextResponse.json({ hasPromo: false, freeDocsRemaining: 0 });
    }
    const promoRef = adminDb.collection("promo_allocations").doc(userId);
    const stateRef = adminDb.collection("promo_state").doc("count");
    const existing = await promoRef.get();
    if (existing.exists) {
      const data = existing.data();
      const remaining = (data?.freeDocsRemaining ?? 0) as number;
      return NextResponse.json({
        hasPromo: remaining > 0,
        freeDocsRemaining: remaining,
      });
    }
    const result = await adminDb.runTransaction(async (tx) => {
      const stateSnap = await tx.get(stateRef);
      const currentCount = (stateSnap.data()?.count ?? 0) as number;
      if (currentCount >= PROMO_MAX_USERS) {
        return { hasPromo: false, freeDocsRemaining: 0 };
      }
      const promoSnap = await tx.get(promoRef);
      if (promoSnap.exists) {
        const d = promoSnap.data();
        return { hasPromo: true, freeDocsRemaining: (d?.freeDocsRemaining ?? 0) as number };
      }
      tx.set(promoRef, {
        userId,
        freeDocsRemaining: PROMO_FREE_DOCS,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(stateRef, { count: currentCount + 1 }, { merge: true });
      return { hasPromo: true, freeDocsRemaining: PROMO_FREE_DOCS };
    });
    return NextResponse.json({
      hasPromo: result.hasPromo,
      freeDocsRemaining: result.freeDocsRemaining,
    });
  } catch {
    return NextResponse.json({ hasPromo: false, freeDocsRemaining: 0 });
  }
}
