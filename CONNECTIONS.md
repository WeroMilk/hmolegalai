# Verificación de conexiones: Firebase, Stripe y OpenAI

## Resumen

| Servicio   | Uso en el proyecto | Variables de entorno |
|-----------|--------------------|----------------------|
| **Firebase** | Auth (login Google), Firestore (consultas, órdenes) | Ver abajo |
| **Stripe**   | Checkout tienda y plan dieta, webhooks para marcar órdenes pagadas | `STRIPE_*` |
| **OpenAI**   | DIDI: generación y edición de planes nutricionales (GPT-4o) | `OPENAI_API_KEY` |

---

## 1. Firebase

### Cliente (navegador)
- **Archivos:** `lib/firebase.ts`, `lib/auth-context.tsx`, páginas de login/admin.
- **Variables (todas con prefijo `NEXT_PUBLIC_`):**
  - `NEXT_PUBLIC_FIREBASE_ENABLED=true`
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

### Servidor (Admin SDK)
- **Archivos:** `lib/auth-server.ts`, `app/api/consulta/route.ts`, `app/api/create-checkout-session/route.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/admin/*`.
- **Variables (secretas, solo servidor):**
  - `FIREBASE_CLIENT_EMAIL` (del JSON de cuenta de servicio)
  - `FIREBASE_PRIVATE_KEY` (del JSON; en Vercel puede ir con `\n` literales)
  - Se usa `NEXT_PUBLIC_FIREBASE_PROJECT_ID` para el mismo proyecto (no es secreto).

### Cómo comprobar
- Login con Google en `/auth`: si Firebase está bien configurado, inicia sesión y redirige a admin.
- Enviar una consulta desde “Solicitar plan”: debe guardarse en Firestore en la colección `consultas`.
- Admin: listar consultas y órdenes usa Firestore; si falta configuración Admin, las APIs devuelven 503.

---

## 2. Stripe

### Variables
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (cliente, para cargar Stripe.js)
- `STRIPE_SECRET_KEY` (servidor, crear sesiones de checkout)
- `STRIPE_WEBHOOK_SECRET` (servidor, firmar eventos `checkout.session.completed`)

### Flujos
- **Tienda / carrito:** `POST /api/create-checkout-session` con `items` → redirección a Stripe Checkout → éxito en `/tienda/success`. La orden se crea en Firestore al crear la sesión y se actualiza a `paid` + dirección de envío cuando Stripe envía el webhook.
- **Plan dieta (consulta):** mismo endpoint con `items: [{ productId: "plan-dieta-personalizado", quantity: 1 }]` y URLs de éxito/cancelación a `/consulta/success` y `/consulta`.

### Webhook
- URL en Stripe Dashboard: `https://tu-dominio.com/api/webhooks/stripe`
- Evento: `checkout.session.completed`. Solo se procesan sesiones con `metadata.type === "tienda"` (se actualiza la orden en Firestore con `status: paid` y `shippingAddress`).

### Cómo comprobar
- Hacer una compra de prueba en la tienda: debe redirigir a Stripe, pagar y volver a `/tienda/success`.
- En Stripe Dashboard → Webhooks, revisar que los eventos lleguen y respondan 200.
- En Admin, la orden debe aparecer como “Pagada” y con dirección de envío si se recogió.

### Opcional: URL base para redirects
- Si en algún contexto no se envía el header `Origin`, el backend usa `NEXT_PUBLIC_APP_URL` como fallback para construir `success_url` y `cancel_url`. Configura `NEXT_PUBLIC_APP_URL=https://tu-dominio.com` en producción.

---

## 3. OpenAI (ChatGPT API)

### Uso
- **DIDI – generar plan:** `POST /api/didi-generate` (requiere login de nutrióloga). Llama a `openai.chat.completions.create` con modelo `gpt-4o`.
- **DIDI – editar plan:** `POST /api/didi-edit` (mismo modelo).

### Variable
- `OPENAI_API_KEY`: clave de API de OpenAI (prefijo `sk-...`).

### Cómo comprobar
- Entrar como admin/nutrióloga, ir a DIDI, generar un plan: si la clave es válida, se devuelve el plan en Markdown. Si falta o es inválida, la API responde con error indicando revisar `OPENAI_API_KEY`.

---

## Checklist rápido

- [ ] Firebase: login Google funciona y en Firestore aparecen consultas y órdenes.
- [ ] Stripe: checkout de tienda y de plan dieta redirigen bien y el webhook actualiza órdenes a “Pagada” con dirección.
- [ ] OpenAI: en DIDI se puede generar y editar un plan sin error de API.
