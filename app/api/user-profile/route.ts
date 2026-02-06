import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { DIDI_EMAIL } from "@/lib/didi";
import { SUPERUSER_EMAIL } from "@/lib/superuser";
import { DEMO_ABOGADO_EMAIL } from "@/lib/demo-users";
import { toTitleCase, formatTelefono, formatDireccion } from "@/lib/formatters";

/** Perfil de admin (Hermosillo, Sonora) - usado solo para datos de perfil */
const ADMIN_ABOGADO_PROFILE = {
  role: "abogado" as const,
  approved: true,
  nombreCompleto: "Lic. Roberto Mendoza García",
  nombreDespacho: "Bufete Jurídico Mendoza & Asociados",
  direccionDespacho: "Blvd. Luis Encinas 222, Col. Centro, Hermosillo, Sonora, CP 83000",
  telefonoDespacho: "(662) 212-4500",
};

/** Perfil de abogado demo - ve solicitudes en su dashboard */
const DEMO_ABOGADO_PROFILE = {
  role: "abogado" as const,
  approved: true,
  nombreCompleto: "Lic. María González López",
  nombreDespacho: "Despacho Legal González",
  direccionDespacho: "Av. Reforma 150, Col. Centro, Hermosillo, Sonora",
  telefonoDespacho: "(662) 215-3000",
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await verifyIdToken(token);
    const uid = decoded.uid;

    if (!adminDb) return NextResponse.json({ error: "DB no configurada" }, { status: 503 });
    const email = (decoded as { email?: string }).email ?? "";
    const doc = await adminDb.collection("users").doc(uid).get();
    const data = doc.data();
    // admin@avatar.com: retornar perfil abogado (Firebase tiene prioridad sobre defaults)
    if (email === SUPERUSER_EMAIL) {
      const merged = {
        uid,
        email,
        ...ADMIN_ABOGADO_PROFILE,
        ...(data ?? {}),
        approved: true,
        role: "abogado",
        nombreCompleto: (data?.nombreCompleto as string) ?? ADMIN_ABOGADO_PROFILE.nombreCompleto,
        nombreDespacho: (data?.nombreDespacho as string) ?? ADMIN_ABOGADO_PROFILE.nombreDespacho,
        direccionDespacho: (data?.direccionDespacho as string) ?? ADMIN_ABOGADO_PROFILE.direccionDespacho,
        telefonoDespacho: (data?.telefonoDespacho as string) ?? ADMIN_ABOGADO_PROFILE.telefonoDespacho,
      };
      if (!data?.role) {
        await adminDb.collection("users").doc(uid).set(merged, { merge: true });
      }
      return NextResponse.json({ profile: merged });
    }
    if (email === DEMO_ABOGADO_EMAIL) {
      const merged = {
        uid,
        email,
        ...DEMO_ABOGADO_PROFILE,
        ...(data ?? {}),
        approved: true,
        role: "abogado",
        nombreCompleto: (data?.nombreCompleto as string) ?? DEMO_ABOGADO_PROFILE.nombreCompleto,
        nombreDespacho: (data?.nombreDespacho as string) ?? DEMO_ABOGADO_PROFILE.nombreDespacho,
        direccionDespacho: (data?.direccionDespacho as string) ?? DEMO_ABOGADO_PROFILE.direccionDespacho,
        telefonoDespacho: (data?.telefonoDespacho as string) ?? DEMO_ABOGADO_PROFILE.telefonoDespacho,
      };
      if (!data?.role) {
        await adminDb.collection("users").doc(uid).set(merged, { merge: true });
      }
      return NextResponse.json({ profile: merged });
    }
    if (!data) return NextResponse.json({ profile: null });
    return NextResponse.json({ profile: { uid: doc.id, ...data } });
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await verifyIdToken(token);
    const uid = decoded.uid;
    const email = (decoded as { email?: string }).email ?? "";

    const body = await request.json();
    const { role, nombreCompleto, domicilio, ciudadPie, nombreDespacho, direccionDespacho, telefonoDespacho } = body;

    if (!adminDb) return NextResponse.json({ error: "DB no configurada" }, { status: 503 });

    const userRef = adminDb.collection("users").doc(uid);
    const existing = await userRef.get();
    const existingData = existing.data();

    // DIDI: siempre cliente (para ver la app como clientes)
    if (email.toLowerCase().trim() === DIDI_EMAIL) {
      const profile: Record<string, unknown> = {
        uid,
        email,
        role: "cliente",
        createdAt: existingData?.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      await userRef.set(profile, { merge: true });
      return NextResponse.json({ success: true, profile });
    }

    // Abogado demo: siempre aprobado; usa body si viene, sino defaults
    if (email === DEMO_ABOGADO_EMAIL) {
      const profile: Record<string, unknown> = {
        uid,
        email,
        role: "abogado",
        approved: true,
        nombreCompleto: (typeof nombreCompleto === "string" && nombreCompleto.trim()) ? nombreCompleto.trim() : (existingData?.nombreCompleto ?? DEMO_ABOGADO_PROFILE.nombreCompleto),
        nombreDespacho: (typeof nombreDespacho === "string") ? nombreDespacho.trim() : (existingData?.nombreDespacho ?? DEMO_ABOGADO_PROFILE.nombreDespacho),
        direccionDespacho: (typeof direccionDespacho === "string") ? direccionDespacho.trim() : (existingData?.direccionDespacho ?? DEMO_ABOGADO_PROFILE.direccionDespacho),
        telefonoDespacho: (typeof telefonoDespacho === "string") ? telefonoDespacho.trim() : (existingData?.telefonoDespacho ?? DEMO_ABOGADO_PROFILE.telefonoDespacho),
        createdAt: existingData?.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      await userRef.set(profile, { merge: true });
      return NextResponse.json({ success: true, profile });
    }

    // Admin: siempre abogado aprobado; usa body si viene, sino Firebase, sino defaults
    if (email === SUPERUSER_EMAIL) {
      const profile: Record<string, unknown> = {
        uid,
        email,
        role: "abogado",
        approved: true,
        nombreCompleto: (typeof nombreCompleto === "string" && nombreCompleto.trim()) ? nombreCompleto.trim() : (existingData?.nombreCompleto ?? ADMIN_ABOGADO_PROFILE.nombreCompleto),
        nombreDespacho: (typeof nombreDespacho === "string") ? nombreDespacho.trim() : (existingData?.nombreDespacho ?? ADMIN_ABOGADO_PROFILE.nombreDespacho),
        direccionDespacho: (typeof direccionDespacho === "string") ? direccionDespacho.trim() : (existingData?.direccionDespacho ?? ADMIN_ABOGADO_PROFILE.direccionDespacho),
        telefonoDespacho: (typeof telefonoDespacho === "string") ? telefonoDespacho.trim() : (existingData?.telefonoDespacho ?? ADMIN_ABOGADO_PROFILE.telefonoDespacho),
        createdAt: existingData?.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      await userRef.set(profile, { merge: true });
      return NextResponse.json({ success: true, profile });
    }

    if (existing.exists && existingData?.role) {
      return NextResponse.json(
        { error: "El rol no puede cambiarse una vez registrado" },
        { status: 400 }
      );
    }

    const profile: Record<string, unknown> = {
      uid,
      email,
      role: role === "abogado" ? "abogado" : "cliente",
      createdAt: existingData?.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (role === "abogado") {
      profile.approved = false;
      if (nombreCompleto) profile.nombreCompleto = String(nombreCompleto).trim();
      if (nombreDespacho) profile.nombreDespacho = String(nombreDespacho).trim();
      if (direccionDespacho) profile.direccionDespacho = String(direccionDespacho).trim();
      if (telefonoDespacho) profile.telefonoDespacho = String(telefonoDespacho).trim();
    } else if (role === "cliente") {
      if (nombreCompleto) profile.nombreCompleto = String(nombreCompleto).trim();
      if (domicilio) profile.domicilio = String(domicilio).trim();
      if (ciudadPie) profile.ciudadPie = String(ciudadPie).trim();
    }

    await userRef.set(profile, { merge: true });
    return NextResponse.json({ success: true, profile });
  } catch (e) {
    console.error("Error saving profile:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al guardar" },
      { status: 500 }
    );
  }
}

/** PATCH: actualizar datos del abogado (perfil, despacho). Admin, demo abogado y abogados aprobados. */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await verifyIdToken(token);
    const uid = decoded.uid;
    const email = (decoded as { email?: string }).email ?? "";

    if (!adminDb) return NextResponse.json({ error: "DB no configurada" }, { status: 503 });

    const userRef = adminDb.collection("users").doc(uid);
    const existing = await userRef.get();
    const existingData = existing.data();
    const role = existingData?.role as string | undefined;
    const approved = existingData?.approved as boolean | undefined;

    const isAdmin = email === SUPERUSER_EMAIL;
    const isDemoAbogado = email === DEMO_ABOGADO_EMAIL;
    const isAbogadoAprobado = role === "abogado" && approved === true;

    if (!isAdmin && !isDemoAbogado && !isAbogadoAprobado) {
      return NextResponse.json({ error: "Solo abogados aprobados pueden actualizar su perfil" }, { status: 403 });
    }

    const body = await request.json();
    const { nombreCompleto, nombreDespacho, direccionDespacho, telefonoDespacho } = body;

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (typeof nombreCompleto === "string" && nombreCompleto.trim()) {
      updates.nombreCompleto = toTitleCase(nombreCompleto.trim());
    }
    if (typeof nombreDespacho === "string" && nombreDespacho.trim()) {
      updates.nombreDespacho = toTitleCase(nombreDespacho.trim());
    }
    if (typeof direccionDespacho === "string" && direccionDespacho.trim()) {
      updates.direccionDespacho = formatDireccion(direccionDespacho.trim());
    }
    if (typeof telefonoDespacho === "string" && telefonoDespacho.trim()) {
      updates.telefonoDespacho = formatTelefono(telefonoDespacho.trim());
    }

    await userRef.set(updates, { merge: true });
    const updatedData = (await userRef.get()).data() ?? {};
    const profile = {
      uid,
      email: (existingData?.email ?? email) as string,
      role: (existingData?.role ?? "abogado") as string,
      approved: existingData?.approved ?? true,
      nombreCompleto: (updates.nombreCompleto ?? updatedData.nombreCompleto ?? existingData?.nombreCompleto) as string,
      nombreDespacho: (updates.nombreDespacho ?? updatedData.nombreDespacho ?? existingData?.nombreDespacho) as string,
      direccionDespacho: (updates.direccionDespacho ?? updatedData.direccionDespacho ?? existingData?.direccionDespacho) as string,
      telefonoDespacho: (updates.telefonoDespacho ?? updatedData.telefonoDespacho ?? existingData?.telefonoDespacho) as string,
    };
    return NextResponse.json({ success: true, profile });
  } catch (e) {
    console.error("Error updating profile:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al actualizar" },
      { status: 500 }
    );
  }
}
