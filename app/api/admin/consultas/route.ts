import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
import { isDidiUser } from "@/lib/didi";

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key === "") return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

/** Convierte Timestamps de Firestore a ISO string para que JSON.stringify no falle */
function serializeDocData(d: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
      out[k] = (v as { toDate: () => Date }).toDate().toISOString();
    } else if (v && typeof v === "object" && !Array.isArray(v) && v.constructor?.name === "Timestamp") {
      out[k] = (v as { toDate: () => Date }).toDate?.()?.toISOString?.() ?? null;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function toMillis(value: unknown): number {
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? 0 : t;
  }
  if (value instanceof Date) return value.getTime();
  return 0;
}

type ConsultaRow = {
  id: string;
  createdAt?: unknown;
} & Record<string, unknown>;

function parsePlanDieta(value?: string): "semanal" | "quincenal" | "mensual" | null {
  if (value === "semanal" || value === "quincenal" || value === "mensual") return value;
  return null;
}

async function syncConsultasFromStripe() {
  if (!adminDb) return;
  const stripe = await getStripe();
  if (!stripe) return;

  const sessions = await stripe.checkout.sessions.list({ limit: 100 });
  const jobs: Promise<unknown>[] = [];

  for (const session of sessions.data) {
    const meta = session.metadata ?? {};
    const isPaid = session.payment_status === "paid";
    const isConsulta = meta.type === "consulta";
    if (!isPaid || !isConsulta || !session.id) continue;

    const planDieta = parsePlanDieta(meta.planDieta);
    const paidAt = session.created ? new Date(session.created * 1000) : new Date();

    if (meta.consultaId) {
      jobs.push(
        adminDb.collection("consultas").doc(meta.consultaId).set(
          {
            paidAt,
            stripeSessionId: session.id,
            ...(planDieta ? { planDieta } : {}),
          },
          { merge: true }
        )
      );
      continue;
    }

    // Fallback robusto: crea/actualiza una consulta usando metadata de checkout
    // cuando el webhook no la llegó a crear.
    const querySnap = await adminDb
      .collection("consultas")
      .where("stripeSessionId", "==", session.id)
      .limit(1)
      .get();

    if (!querySnap.empty) {
      jobs.push(
        querySnap.docs[0].ref.set(
          {
            paidAt,
            ...(planDieta ? { planDieta } : {}),
          },
          { merge: true }
        )
      );
      continue;
    }

    if (!meta.cNombre) continue;

    let habitos: { alimentacion: string[]; ejercicio: string[]; sueno: string[]; estres: string[] } = {
      alimentacion: [],
      ejercicio: [],
      sueno: [],
      estres: [],
    };
    try {
      if (meta.cHab) {
        const parsed = JSON.parse(meta.cHab) as Record<string, unknown>;
        habitos = {
          alimentacion: Array.isArray(parsed.alimentacion) ? parsed.alimentacion.map(String) : [],
          ejercicio: Array.isArray(parsed.ejercicio) ? parsed.ejercicio.map(String) : [],
          sueno: Array.isArray(parsed.sueno) ? parsed.sueno.map(String) : [],
          estres: Array.isArray(parsed.estres) ? parsed.estres.map(String) : [],
        };
      }
    } catch {
      // ignore invalid JSON in metadata
    }

    const edadN = parseInt(String(meta.cEdad ?? "0"), 10) || 0;
    const estaturaN = parseInt(String(meta.cEstatura ?? "0"), 10) || 0;
    const importanciaNum = Math.min(10, Math.max(0, parseInt(String(meta.cImportancia ?? "0"), 10) || 0));
    const pesoVal = (meta.cPeso ?? "").trim();

    jobs.push(
      adminDb.collection("consultas").doc(session.id).set(
        {
          nombre: meta.cNombre ?? "",
          edad: Number.isNaN(edadN) || edadN < 1 || edadN > 120 ? 0 : edadN,
          estatura: estaturaN >= 100 && estaturaN <= 250 ? estaturaN : 0,
          peso: pesoVal || null,
          telefono: meta.cTel ?? "",
          email: meta.cEmail ?? "",
          objetivoPrincipal: meta.cObj || null,
          metaPeso: meta.cMetaPeso || null,
          tipoDieta: meta.cTipoDieta || null,
          condicionesMedicas: meta.cCond || null,
          habitos,
          importanciaSuplementos: importanciaNum,
          createdAt: paidAt,
          paidAt,
          stripeSessionId: session.id,
          ...(planDieta ? { planDieta } : {}),
        },
        { merge: true }
      )
    );
  }

  await Promise.all(jobs);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let decoded: { email?: string };
  try {
    decoded = await verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Sesión inválida o expirada" }, { status: 401 });
  }

  const email = decoded.email ?? "";
  if (!isDidiUser(email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  try {
    await syncConsultasFromStripe();
    const snap = await adminDb.collection("consultas").limit(300).get();
    const consultas: ConsultaRow[] = snap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      const serialized = serializeDocData(d);
      return { id: doc.id, ...serialized } as ConsultaRow;
    }).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0, 200);
    return NextResponse.json({ consultas });
  } catch (e) {
    console.error("Admin consultas error:", e);
    const reason = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: `Error al listar consultas: ${reason}` }, { status: 500 });
  }
}
