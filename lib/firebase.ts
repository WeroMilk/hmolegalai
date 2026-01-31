import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** Placeholders que indican que Firebase no está configurado */
const FIREBASE_PLACEHOLDERS = [
  "",
  "your_api_key",
  "your_auth_domain",
  "your_project_id",
  "your_storage_bucket",
  "your_sender_id",
  "your_app_id",
];

function isPlaceholder(value: string | undefined): boolean {
  if (!value || typeof value !== "string") return true;
  const v = value.trim().toLowerCase();
  return FIREBASE_PLACEHOLDERS.some((p) => v === p || v.startsWith("your_"));
}

/**
 * Firebase web API keys válidas suelen ser ~39 caracteres y empezar por "AIza".
 * Si la key no cumple esto, no inicializar para evitar
 * "API key not valid" / "Installations: Create Installation request failed".
 */
function looksLikeValidFirebaseApiKey(apiKey: string | undefined): boolean {
  if (!apiKey || typeof apiKey !== "string") return false;
  const k = apiKey.trim();
  return k.length >= 35 && k.startsWith("AIza");
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | undefined;

// Solo inicializar Firebase si está explícitamente habilitado y la API key es válida.
// Sin esto, cualquier key inválida o placeholder dispara "auth/api-key-not-valid".
const FIREBASE_ENABLED = process.env.NEXT_PUBLIC_FIREBASE_ENABLED === "true";

if (typeof window !== "undefined") {
  try {
    const apiKey = firebaseConfig.apiKey;
    const projectId = firebaseConfig.projectId;
    const appId = firebaseConfig.appId;
    const noPlaceholders =
      !isPlaceholder(apiKey) &&
      !isPlaceholder(projectId) &&
      !isPlaceholder(appId);
    const validApiKeyFormat = looksLikeValidFirebaseApiKey(apiKey);

    if (FIREBASE_ENABLED && noPlaceholders && validApiKeyFormat) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      if (firebaseConfig.measurementId?.trim()) {
        analytics = getAnalytics(app);
      }
    }
  } catch (error) {
    console.warn("Firebase initialization error:", error);
  }
}

/** Indica si Firebase está configurado y listo para usar (útil en la página de auth). */
export function isFirebaseConfigured(): boolean {
  return typeof auth !== "undefined" && auth != null;
}

export { auth, db, storage, analytics };
export default app;
