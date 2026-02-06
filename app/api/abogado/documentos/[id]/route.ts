import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDemoAbogado } from "@/lib/demo-users";

/** Obtener un documento concreto para el abogado (server-side) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    const docSnap = await adminDb.collection("documents").doc(id).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }
    const data = docSnap.data() ?? {};
    if (data.abogadoId !== uid) {
      return NextResponse.json({ error: "No tienes acceso a este documento" }, { status: 403 });
    }

    return NextResponse.json({
      content: data.content ?? "",
      documentType: data.documentType ?? "",
      status: data.status ?? "",
      userId: data.userId ?? "",
      source: data.source,
    });
  } catch (e) {
    console.error("Error fetching documento:", e);
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
