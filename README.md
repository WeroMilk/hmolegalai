# VitalHealth | Didi Gallardo — Nutrición y Suplementos

Sitio web para nutrióloga: planes de alimentación personalizados (formulario de consulta + DIDI con OpenAI) y tienda de suplementos VitalHealth (Stripe). Next.js 15, Firebase, Stripe.

## Stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **Firebase** (Auth, Firestore)
- **Stripe** (Checkout: compra única y suscripción)
- **OpenAI** (generación de planes nutricionales)
- **Tailwind CSS**, **Framer Motion**

## Instalación

```bash
npm install
```

## Configuración

1. Copia `.env.example` a `.env.local`.
2. Completa las variables con tus valores (sin commitear `.env.local` ni claves reales al repositorio).

Variables principales:

- **Firebase:** `NEXT_PUBLIC_FIREBASE_*` y `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` (Admin).
- **Stripe:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, y opcionalmente `STRIPE_WEBHOOK_SECRET` para el webhook.
- **OpenAI:** `OPENAI_API_KEY` (para DIDI).
- **Opcional:** `NUTRITIONIST_EMAIL`, `RESEND_API_KEY` (notificación por email al recibir consulta); `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_WHATSAPP_MESSAGE` (botón flotante WhatsApp).

3. Ejecuta:

```bash
npm run dev
```

## Seguridad

- **No subas** `.env`, `.env.local` ni archivos con claves reales a GitHub.
- En Vercel (o tu hosting), configura las variables de entorno en el panel del proyecto.
- El `.env.example` contiene solo placeholders; úsalo como referencia, no con datos sensibles.
- Firestore y APIs de admin están protegidos por verificación de token (nutrióloga DIDI).

## Rutas principales

- `/` — Landing
- `/consulta` — Formulario de solicitud de plan (público)
- `/tienda` — Catálogo de suplementos
- `/tienda/[slug]` — Ficha de producto y checkout
- `/didi` — Herramienta interna de la nutrióloga (generar planes con OpenAI)
- `/admin` — Panel para ver consultas y órdenes (solo nutrióloga)
- `/auth` — Inicio de sesión

## Deploy (Vercel)

1. **Conectar el repo** a Vercel y desplegar (Build Command: `npm run build`, Output: Next.js).

2. **Variables de entorno** en el proyecto de Vercel (Settings → Environment Variables):

   | Variable | Uso |
   |----------|-----|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
   | `FIREBASE_CLIENT_EMAIL` | Service account (Admin SDK) |
   | `FIREBASE_PRIVATE_KEY` | Service account (Admin SDK) |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Checkout (cliente) |
   | `STRIPE_SECRET_KEY` | Stripe Checkout y webhook |
   | `STRIPE_WEBHOOK_SECRET` | Firma del webhook (ver abajo) |
   | `OPENAI_API_KEY` | DIDI: generación de planes con ChatGPT |
   | `NEXT_PUBLIC_APP_URL` | URL pública del sitio (ej. `https://tu-dominio.com`) |
   | `NUTRITIONIST_EMAIL` | (Opcional) Email para notificación de nuevas consultas |
   | `RESEND_API_KEY` | (Opcional) Resend para enviar esos emails |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | (Opcional) Número para botón WhatsApp |
   | `NEXT_PUBLIC_WHATSAPP_MESSAGE` | (Opcional) Mensaje por defecto |

3. **Webhook de Stripe**
   - En Stripe Dashboard → Developers → Webhooks, añade endpoint: `https://tu-dominio.com/api/webhooks/stripe`.
   - Evento: `checkout.session.completed`.
   - Copia el **Signing secret** y configúralo como `STRIPE_WEBHOOK_SECRET` en Vercel.

4. **Checklist antes de producción**
   - [ ] Todas las variables anteriores configuradas en Vercel.
   - [ ] Webhook de Stripe apuntando a la URL de producción (no local).
   - [ ] En Firebase, añadir el dominio de Vercel en Auth (dominios autorizados) si aplica.
   - [ ] Probar: solicitud de plan (consulta) → pago Stripe → consulta aparece en Admin con "Pagado" y plan (Semanal/Quincenal/Mensual).
   - [ ] Probar: compra en tienda → pago → orden en Admin con dirección de envío → "Marcar como enviada".
   - [ ] Probar: DIDI (generar plan) con usuario nutrióloga; revisar que no falte `OPENAI_API_KEY`.
