# VitaHealth — Nutrición y Suplementos

Sitio web para nutrióloga: planes de alimentación personalizados (formulario de consulta + DIDI con OpenAI) y tienda de suplementos VitaHealth (Stripe). Next.js 15, Firebase, Stripe.

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

Conecta el repositorio a Vercel y configura las variables de entorno. Para el webhook de Stripe, usa la URL `https://tu-dominio.com/api/webhooks/stripe` y el signing secret en `STRIPE_WEBHOOK_SECRET`.
