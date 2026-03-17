import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

// Inicializar Firebase Admin si no está inicializado
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (privateKey && process.env.FIREBASE_CLIENT_EMAIL && projectId) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
        privateKey: privateKey,
      }),
    });
    adminAuth = getAuth(app);
    adminDb = getFirestore(app);
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
