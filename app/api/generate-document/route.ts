import { NextRequest, NextResponse } from "next/server";
import { generateLegalDocument, generateFallbackDocument } from "@/lib/openai";
import { getDocumentById } from "@/lib/documents";
import { FieldValue } from "firebase-admin/firestore";
import { verifyIdToken, adminDb } from "@/lib/auth-server";
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const isDemoSuperuser = token === "demo-superuser";
    let user: { uid: string };

    if (isDemoSuperuser) {
      user = { uid: "demo-superuser" };
    } else {
      const decoded = await verifyIdToken(token);
      user = { uid: decoded.uid };
    }

    const { documentId, documentType, userInputs, sessionId, saveToAccount, abogadoId } = await request.json();

    const doc = getDocumentById(documentId);
    const parte1Label = doc?.parte1Label;
    const parte2Label = doc?.parte2Label;

    let documentContent: string;
    try {
      documentContent = await generateLegalDocument({
        documentType,
        userInputs,
        parte1Label,
        parte2Label,
      });
    } catch (openaiError) {
      // Superusuario sin OpenAI configurado: devolver documento de ejemplo
      if (isDemoSuperuser) {
        documentContent = generateFallbackDocument({
          documentType,
          userInputs,
          parte1Label,
          parte2Label,
        });
      } else {
        throw openaiError;
      }
    }

    // Quitar bloques de código markdown (```plaintext, ```) si la IA los incluyó en header/footer
    documentContent = documentContent
      .replace(/^\s*```(?:plaintext|text)?\s*\r?\n?/i, "")
      .replace(/\r?\n?\s*```\s*$/m, "")
      .replace(/^\s*```\s*\r?\n?/m, "")
      .trim();

    // Guardar en Firestore: todos los documentos pasan por abogado (status pending_abogado)
    if (adminDb) {
      try {
        // Si no hay abogadoId seleccionado, asignar automáticamente a abogado@avatar.com
        let finalAbogadoId = typeof abogadoId === "string" && abogadoId.trim() ? abogadoId.trim() : null;
        if (!finalAbogadoId) {
          finalAbogadoId = await getDefaultAbogadoId();
        }
        
        await adminDb.collection("documents").add({
          userId: user.uid,
          documentId,
          documentType,
          content: documentContent,
          userInputs,
          sessionId,
          saveToAccount: saveToAccount === true,
          abogadoId: finalAbogadoId,
          createdAt: FieldValue.serverTimestamp(),
          status: "pending_abogado",
        });
      } catch (dbErr) {
        console.warn("Firestore save skipped:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      content: documentContent,
    });
  } catch (error: any) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar el documento" },
      { status: 500 }
    );
  }
}
