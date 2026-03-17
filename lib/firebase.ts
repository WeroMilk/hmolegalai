import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  // No incluir measurementId si no coincide con el proyecto (evita warning de Analytics)
  measurementId: undefined as string | undefined,
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
let analytics: unknown = undefined;

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
      // Usar solo campos necesarios, sin measurementId, para evitar 400 en installations y warning de Analytics
      const configForInit = {
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      };
      app = getApps().length === 0 ? initializeApp(configForInit) : getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      // No inicializar Analytics para evitar warning de measurement ID no coincidente
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
