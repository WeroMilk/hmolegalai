import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;

  const trimmed = raw.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
  const withNewlines = trimmed.replace(/\\n/g, "\n");
  if (withNewlines.includes("BEGIN PRIVATE KEY")) return withNewlines;

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    if (decoded.includes("BEGIN PRIVATE KEY")) return decoded;
  } catch {
    // ignore invalid base64 and return undefined below
  }

  return undefined;
}

// Inicializar Firebase Admin si no está inicializado
if (!getApps().length) {
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (privateKey && process.env.FIREBASE_CLIENT_EMAIL && projectId) {
    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
          privateKey: privateKey,
        }),
      });
      adminAuth = getAuth(app);
      adminDb = getFirestore(app);
    } catch (error) {
      console.error("Firebase Admin initialization failed. Check FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY format.", error);
    }
  } else {
    console.error("Firebase Admin missing configuration. Check NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");
  }
} else {
  app = getApps()[0] as App;
  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
}

export { adminDb };

export async function verifyIdToken(token: string) {
  try {
    if (!adminAuth) {
      throw new Error("Firebase Admin no está configurado");
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new Error("Token inválido");
  }
}
