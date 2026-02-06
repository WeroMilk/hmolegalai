import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDemoAbogado } from "@/lib/demo-users";

/** GET: listar citas del abogado */
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

    const snapshot = await adminDb
      .collection("abogado_citas")
      .where("abogadoId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const citas = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        fecha: data.fecha,
        hora: data.hora,
        cliente: data.cliente,
        asunto: data.asunto,
        notas: data.notas,
        createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
      };
    });

    return NextResponse.json({ citas });
  } catch (e) {
    console.error("Error fetching citas:", e);
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

/** POST: crear cita */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { fecha, hora, cliente, asunto, notas } = body;
    if (!fecha || !hora || typeof cliente !== "string" || !cliente.trim()) {
      return NextResponse.json({ error: "fecha, hora y cliente son requeridos" }, { status: 400 });
    }

    const ref = await adminDb.collection("abogado_citas").add({
      abogadoId: uid,
      fecha: String(fecha).trim(),
      hora: String(hora).trim(),
      cliente: String(cliente).trim(),
      asunto: typeof asunto === "string" ? asunto.trim() : "",
      notas: typeof notas === "string" ? notas.trim() : "",
      createdAt: FieldValue.serverTimestamp(),
    });

    const doc = await ref.get();
    const data = doc.data();
    const cita = {
      id: doc.id,
      fecha: data?.fecha,
      hora: data?.hora,
      cliente: data?.cliente,
      asunto: data?.asunto,
      notas: data?.notas,
      createdAt: Date.now(),
    };

    return NextResponse.json({ cita });
  } catch (e) {
    console.error("Error creating cita:", e);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
