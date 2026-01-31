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

**Enlaces rápidos:** [Firebase Console](https://console.firebase.google.com/) | [Vercel Dashboard](https://vercel.com/dashboard)

1. **[Firebase Console](https://console.firebase.google.com/)** → tu proyecto → **Configuración** (engranaje) → **General**
2. En «Tus apps», crea o selecciona una **app web** y copia las credenciales
3. **Firebase** → **Authentication** → **Sign-in method** → habilita **Google**
4. **[Vercel](https://vercel.com/dashboard)** → tu proyecto → **Settings** → **Environment Variables** → añade:

   - `NEXT_PUBLIC_FIREBASE_ENABLED` = `true`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

5. **Firebase** → **Authentication** → **Settings** → **Dominios autorizados** → añade:
   - `hmolegalai.vercel.app`
   - `avatarlegalai.com.mx`
   - `www.avatarlegalai.com.mx`
6. **Redeploy** en Vercel para aplicar los cambios.

**Referencia** — Valores sugeridos para las variables (Production y Preview):

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

---

## 4. Checklist producción (avatarlegalai.com.mx)

| Problema | Solución |
|----------|----------|
| «Stripe no configurado» | Añade `STRIPE_SECRET_KEY` y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` en Vercel → Settings → Environment Variables |
| Firebase `auth/unauthorized-domain` | Firebase Console → Authentication → Settings → Dominios autorizados → añade `avatarlegalai.com.mx` y `www.avatarlegalai.com.mx` |
| Correos de verificación no llegan | Revisa [FIREBASE_VERIFICACION.md](./FIREBASE_VERIFICACION.md). Añade tu dominio en Dominios autorizados y `NEXT_PUBLIC_APP_URL` en Vercel. |

---

## 5. Otras variables (Stripe, OpenAI)

- **Stripe** (obligatorio para pagos): En Vercel → Settings → Environment Variables añade:
  - `STRIPE_SECRET_KEY` = tu clave secreta (sk_test_... o sk_live_...)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = tu clave pública (pk_test_... o pk_live_...)
  - Sin estas variables aparecerá «Stripe no configurado. Configura STRIPE_SECRET_KEY en Vercel»
- **OpenAI**: `OPENAI_API_KEY`
- **Firebase Admin** (verificación de tokens en servidor): `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
