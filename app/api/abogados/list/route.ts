import { NextResponse } from "next/server";
import { adminDb } from "@/lib/auth-server";

/** Lista de abogados aprobados para que los clientes elijan quién revisará su documento. Público. */
export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ abogados: [] });
    }

    const snapshot = await adminDb
      .collection("users")
      .where("role", "==", "abogado")
      .where("approved", "==", true)
      .get();

    const abogados = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        nombreCompleto: data.nombreCompleto || "",
        nombreDespacho: data.nombreDespacho || "",
        email: data.email || "",
      };
    });

    return NextResponse.json({ abogados });
  } catch (e) {
    console.error("Error listing abogados:", e);
    return NextResponse.json({ abogados: [] });
  }
}
