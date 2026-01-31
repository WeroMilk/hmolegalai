# Despliegue en Vercel

## 1. Build y despliegue automático

- **Framework Preset**: Next.js
- **Root Directory**: vacío (o `.`)
- Si el build falla: **Deployments** → tres puntos del último deployment → **Redeploy** → marcar **Clear Build Cache**

## 2. Variables de entorno

No son necesarias para que el **build** pase (Stripe y Firebase se inicializan solo en runtime).

Para que la app funcione en producción, configura en **Settings → Environment Variables** las que uses.

---

## 3. Configurar Firebase + Google Sign-In

Para habilitar **inicio de sesión con Google** en producción:

### Paso 1: Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. **Configuración** (engranaje) → **General**
4. En «Tus apps», crea una **app web** si no tienes
5. Copia las credenciales: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`

### Paso 2: Habilitar Google Sign-In en Firebase

1. **Authentication** → **Sign-in method**
2. Haz clic en **Google** → **Activar** → Guardar

### Paso 3: Dominios autorizados

1. **Authentication** → **Settings** (pestaña) → **Authorized domains**
2. Añade tu dominio de Vercel, por ejemplo: `hmolegalai.vercel.app` (y también `tu-proyecto.vercel.app` si usas el preview)

### Paso 4: Variables en Vercel

En **Vercel** → tu proyecto → **Settings** → **Environment Variables**, añade:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `NEXT_PUBLIC_FIREBASE_ENABLED` | `true` | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (tu apiKey, empieza por AIza...) | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `tu-proyecto.firebaseapp.com` | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | (tu projectId) | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `tu-proyecto.appspot.com` | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (tu senderId numérico) | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (tu appId) | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | (opcional, para Analytics) | Production, Preview |

### Paso 5: Redeploy

Después de añadir las variables, haz **Redeploy** en Vercel para que se apliquen.

---

## 4. Otras variables (Stripe, OpenAI)

- **Stripe**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **OpenAI**: `OPENAI_API_KEY`
- **Firebase Admin** (verificación de tokens en servidor): `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
