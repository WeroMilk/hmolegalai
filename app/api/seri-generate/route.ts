import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/auth-server";
import { buildSpanishPromptFromAmparoData } from "@/lib/seri-amparo-steps";
import { DEMO_ABOGADO_EMAIL } from "@/lib/demo-users";

/** Busca el UID del abogado con email abogado@avatar.com */
async function getDefaultAbogadoId(): Promise<string | null> {
  if (!adminDb) return null;
  try {
    const snapshot = await adminDb
      .collection("users")
      .where("email", "==", DEMO_ABOGADO_EMAIL)
      .where("role", "==", "abogado")
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    return null;
  } catch {
    return null;
  }
}

const NOTA_AMPARO = `DOCUMENTO DE AMPARO: El presente documento ha sido generado como borrador para juicio de amparo conforme a la Ley de Amparo, Reglamentaria de los Artículos 103 y 107 de la Constitución Política de los Estados Unidos Mexicanos. Requiere revisión, firma y sello de un abogado autorizado antes de su presentación ante la autoridad competente. No constituye asesoría legal ni garantía de resultado.`;

/** Datos del quejoso enviados desde el prellenado Seri (voz o recuadro). */
interface QuejosoDataBody {
  nombre?: string;
  domicilio?: string;
  telefonoCorreo?: string;
}

function buildPromptWithQuejoso(spanishPrompt: string, quejoso: QuejosoDataBody): string {
  const nombre = (quejoso.nombre ?? "").trim() || "(no indicado)";
  const domicilio = (quejoso.domicilio ?? "").trim() || "(no indicado)";
  const telefonoCorreo = (quejoso.telefonoCorreo ?? "").trim() || "(no indicado)";
  return `IDENTIFICACIÓN DEL QUEJOSO (usar exactamente estos datos en el documento):
- Nombre completo: ${nombre}
- Domicilio: ${domicilio}
- Teléfono y correo electrónico: ${telefonoCorreo}

RESUMEN / MOTIVO DE LA DEMANDA (traducido del usuario en lengua seri):
${spanishPrompt}`;
}

export async function POST(request: NextRequest) {
  try {
    const { spanishPrompt, documentType, documentId, amparoData, quejosoData, resumenSpanish, abogadoId } = await request.json();

    let finalPrompt: string;
    if (amparoData && typeof amparoData === "object") {
      finalPrompt = buildSpanishPromptFromAmparoData(amparoData);
    } else if (quejosoData && typeof quejosoData === "object") {
      const situacion = (resumenSpanish && typeof resumenSpanish === "string" && resumenSpanish.trim()) ? resumenSpanish.trim() : (spanishPrompt && typeof spanishPrompt === "string") ? spanishPrompt : "(El usuario proporcionó sus datos. Genera el documento con la estructura formal adecuada según el tipo de documento solicitado.)";
      finalPrompt = buildPromptWithQuejoso(situacion, quejosoData as QuejosoDataBody);
    } else if (spanishPrompt && typeof spanishPrompt === "string") {
      finalPrompt = spanishPrompt;
    } else {
      return NextResponse.json({ error: "spanishPrompt, quejosoData o amparoData requerido" }, { status: 400 });
    }

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key || key.length < 10) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: key });

    const tipoDoc = (documentType && typeof documentType === "string") ? documentType : "Demanda de Amparo Indirecto";
    const docId = (documentId && typeof documentId === "string") ? documentId : "demanda-amparo-indirecto";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Eres un abogado experto en la Ley de Amparo mexicana. Generas documentos legales de amparo con validez jurídica en México.

INSTRUCCIONES OBLIGATORIAS:
1. Al inicio del documento incluye esta NOTA:
"${NOTA_AMPARO}"

2. El documento debe ajustarse a la Ley de Amparo vigente (arts. 103 y 107 constitucionales, Ley de Amparo).
3. Incluye: nombre del quejoso, autoridad responsable, acto reclamado, preceptos violados, fundamentos, pretensiones.
4. Usa estructura formal reconocida por los tribunales mexicanos.
5. El usuario proporciona su situación en lenguaje natural (traducido del Seri). Interpreta su intención legal y genera el documento adecuado.
6. Si se proporcionan datos del quejoso (nombre, domicilio, teléfono y correo), DEBES usarlos literalmente en el documento. NO uses placeholders como [Nombre del Quejoso] ni [Dirección del Quejoso]; escribe los datos tal cual se indican.
7. Responde ÚNICAMENTE con el contenido del documento legal, sin comentarios. NO uses bloques de código markdown.`,
        },
        {
          role: "user",
          content: `Genera un documento de tipo "${tipoDoc}" a partir de la siguiente información:

${finalPrompt}

Crea un documento legal completo, formal y con validez jurídica en México.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 4000,
    });

    let content = completion.choices[0]?.message?.content?.trim() || "";
    content = content
      .replace(/^\s*```(?:plaintext|text)?\s*\r?\n?/i, "")
      .replace(/\r?\n?\s*```\s*$/m, "")
      .trim();

    if (!content) {
      return NextResponse.json({ error: "No se generó contenido" }, { status: 500 });
    }

    // Guardar en Firestore con status pending_abogado para flujo Seri
    // Si no hay abogadoId seleccionado, asignar automáticamente a abogado@avatar.com
    let finalAbogadoId = typeof abogadoId === "string" && abogadoId.trim() ? abogadoId.trim() : null;
    if (!finalAbogadoId) {
      finalAbogadoId = await getDefaultAbogadoId();
    }
    
    const docRef = adminDb
      ? await adminDb.collection("documents").add({
          userId: "seri-anon",
          documentId: docId,
          documentType: tipoDoc,
          content,
          userInputs: { seriPrompt: finalPrompt, source: "seri", amparoData: amparoData ?? null, quejosoData: quejosoData ?? null, resumenSpanish: resumenSpanish ?? null },
          sessionId: `seri-${Date.now()}`,
          abogadoId: finalAbogadoId,
          status: "pending_abogado",
          source: "seri",
          createdAt: FieldValue.serverTimestamp(),
        })
      : null;

    return NextResponse.json({
      success: true,
      content,
      documentId: docRef?.id || null,
    });
  } catch (error: unknown) {
    console.error("Error generating Seri document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar documento" },
      { status: 500 }
    );
  }
}
