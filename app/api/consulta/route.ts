import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/auth-server";

const OBJETIVOS = ["pérdida de peso", "tonificación", "energía", "piel/antienvejecimiento", "salud articular"];
const MAX_TEXT = 2000;
const MAX_CONDICIONES = 5000;

function sanitize(str: string, maxLen: number): string {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

/** Firestore no acepta undefined; este helper deja solo valores serializables. */
function firestoreSafe<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T;
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      (out as Record<string, unknown>)[k] = firestoreSafe(v as Record<string, unknown>);
    } else {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      edad,
      telefono,
      email,
      objetivoPrincipal,
      metaPeso,
      tipoDieta,
      condicionesMedicas,
      habitosAlimentacion,
      habitosEjercicio,
      habitosSueno,
      habitosEstres,
      importanciaSuplementos,
      fotosUrls,
    } = body;

    const nombreS = sanitize(nombre, 200);
    const emailS = sanitize(email, 200);
    const telefonoS = sanitize(telefono, 50);
    const condicionesS = sanitize(condicionesMedicas ?? "", MAX_CONDICIONES);

    if (!nombreS) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }
    if (!emailS || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailS)) {
      return NextResponse.json({ error: "El email es obligatorio y debe ser válido." }, { status: 400 });
    }
    if (!telefonoS) {
      return NextResponse.json({ error: "El teléfono es obligatorio." }, { status: 400 });
    }
    const edadN = typeof edad === "number" ? edad : parseInt(String(edad ?? "0"), 10);
    if (Number.isNaN(edadN) || edadN < 1 || edadN > 120) {
      return NextResponse.json({ error: "La edad debe ser un número entre 1 y 120." }, { status: 400 });
    }
    const objetivoS = typeof objetivoPrincipal === "string" ? objetivoPrincipal.trim().slice(0, 200) : "";
    if (!objetivoS) {
      return NextResponse.json({ error: "Selecciona un objetivo principal." }, { status: 400 });
    }
    const importancia =
      typeof importanciaSuplementos === "number"
        ? importanciaSuplementos
        : parseInt(String(importanciaSuplementos ?? "0"), 10);
    const importanciaNum = Number.isNaN(importancia) ? 0 : Math.min(10, Math.max(0, importancia));

    const consulta: Record<string, unknown> = {
      nombre: nombreS,
      edad: edadN,
      telefono: telefonoS,
      email: emailS,
      objetivoPrincipal: objetivoS,
      metaPeso: typeof metaPeso === "string" && metaPeso.trim() ? metaPeso.trim().slice(0, 100) : null,
      tipoDieta: typeof tipoDieta === "string" && tipoDieta.trim() ? tipoDieta.trim().slice(0, 100) : null,
      condicionesMedicas: condicionesS || null,
      habitos: {
        alimentacion: Array.isArray(habitosAlimentacion) ? habitosAlimentacion.slice(0, 20) : [],
        ejercicio: Array.isArray(habitosEjercicio) ? habitosEjercicio.slice(0, 20) : [],
        sueno: Array.isArray(habitosSueno) ? habitosSueno.slice(0, 20) : [],
        estres: Array.isArray(habitosEstres) ? habitosEstres.slice(0, 20) : [],
      },
      importanciaSuplementos: importanciaNum,
      fotosUrls: Array.isArray(fotosUrls) ? fotosUrls.slice(0, 5) : [],
      createdAt: new Date(),
    };

    if (!adminDb) {
      return NextResponse.json(
        { error: "Base de datos no configurada. Revisa las variables de entorno de Firebase (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, NEXT_PUBLIC_FIREBASE_PROJECT_ID)." },
        { status: 503 }
      );
    }

    const doc = firestoreSafe(consulta);
    const ref = await adminDb.collection("consultas").add(doc);

    // Notificación por email al admin (didi@dietas.com). También ve las consultas en /admin.
    const nutritionistEmail = process.env.NUTRITIONIST_EMAIL?.trim() || "didi@dietas.com";
    if (process.env.RESEND_API_KEY?.trim()) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "VitalHealth <onboarding@resend.dev>",
            to: [nutritionistEmail],
            subject: `Nueva consulta: ${nombreS}`,
            text: [
              `Nombre: ${nombreS}`,
              `Edad: ${edadN}`,
              `Teléfono: ${telefonoS}`,
              `Email: ${emailS}`,
              `Objetivo: ${objetivoPrincipal}`,
              consulta.metaPeso ? `Meta peso: ${consulta.metaPeso}` : "",
              consulta.tipoDieta ? `Tipo dieta: ${consulta.tipoDieta}` : "",
              condicionesS ? `Condiciones médicas: ${condicionesS}` : "",
              `Importancia suplementos (1-10): ${importanciaNum}`,
              `ID: ${ref.id}`,
            ]
              .filter(Boolean)
              .join("\n"),
          }),
        });
        if (!res.ok) {
          console.error("Resend email failed:", await res.text());
        }
      } catch (e) {
        console.error("Error sending notification email:", e);
      }
    }

    return NextResponse.json({ id: ref.id, ok: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error saving consulta:", err.message, err.stack);
    const msg = err.message;
    const isFirebase = /firebase|permission|unavailable|deadline|not found|invalid|credential/i.test(msg);
    return NextResponse.json(
      {
        error: isFirebase
          ? "Error al conectar con Firestore. Revisa .env.local (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, NEXT_PUBLIC_FIREBASE_PROJECT_ID) y que la cuenta de servicio tenga permisos en Firestore."
          : "Error al guardar la consulta. Intenta de nuevo. (Revisa la consola del servidor para más detalle.)",
      },
      { status: 500 }
    );
  }
}
