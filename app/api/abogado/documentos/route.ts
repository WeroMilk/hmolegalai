import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDemoAbogado } from "@/lib/demo-users";

/** API para que el abogado obtenga sus documentos (server-side, evita permisos Firestore) */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await verifyIdToken(token);
    const uid = decoded.uid;
    const email = (decoded as { email?: string }).email ?? "";

    if (!adminDb) return NextResponse.json({ error: "DB no configurada" }, { status: 503 });

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const isAbogado = userData?.role === "abogado" && userData?.approved === true;
    const isDemo = isDemoAbogado(email);
    if (!isAbogado && !isDemo) {
      return NextResponse.json({ error: "Solo abogados aprobados" }, { status: 403 });
    }

    const pendingSnap = await adminDb
      .collection("documents")
      .where("abogadoId", "==", uid)
      .where("status", "==", "pending_abogado")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const approvedSnap = await adminDb
      .collection("documents")
      .where("abogadoId", "==", uid)
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const toDoc = (d: { id: string; data: () => Record<string, unknown> | undefined }) => {
      const data = d.data() ?? {};
      const createdAt = data.createdAt as { toMillis?: () => number } | undefined;
      const ms = typeof createdAt?.toMillis === "function" ? createdAt.toMillis() : null;
      return {
        id: d.id,
        ...data,
        createdAtMs: ms,
      };
    };

    const pending = pendingSnap.docs.map(toDoc);
    const approved = approvedSnap.docs.map(toDoc);

    return NextResponse.json({ pending, approved });
  } catch (e) {
    console.error("Error fetching abogado documentos:", e);
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
