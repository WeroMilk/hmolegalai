# Cómo hacer que «Solicitar dieta» funcione en producción

Para que los clientes puedan llenar el formulario, pagar con Stripe y que a **didi@dietas.com** le llegue toda la info en el dashboard, hay que configurar **Firebase** y **Stripe** en el entorno donde está desplegada la app (p. ej. Vercel).

---

## 1. Firebase (obligatorio)

Sin Firebase no se guarda la solicitud y el formulario responde con error. El dashboard de didi@dietas.com lee todo desde Firestore.

### 1.1 Variables en Vercel (o tu hosting)

En el proyecto → **Settings** → **Environment Variables** añade:

| Variable | Dónde sacarla | Importante |
|----------|----------------|------------|
| `FIREBASE_PRIVATE_KEY` | Firebase Console → Tu proyecto → ⚙️ Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada. En el JSON, el campo `private_key` (incluye las comillas y `\n` tal cual, o pega el contenido y en Vercel usa el valor que te da el JSON). | En Vercel suele ir bien pegando el valor entre comillas con `\n` literal para los saltos de línea. |
| `FIREBASE_CLIENT_EMAIL` | El mismo JSON: campo `client_email`. | Ej: `tu-proyecto@tu-proyecto.iam.gserviceaccount.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | El mismo JSON: campo `project_id`, o en Firebase Console en la configuración del proyecto. | Debe ser el **mismo proyecto** donde quieres ver los datos. |

Asigna las variables al **entorno de Producción** (y si quieres, también a Preview).

### 1.2 Firestore

- En Firebase Console → **Firestore Database** → crear base de datos si no existe.
- La app usa la colección **`consultas`**. No hace falta crearla a mano; se crea al guardar el primer documento.
- La **cuenta de servicio** (la del JSON que usas en `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`) debe poder escribir en Firestore. Por defecto, con esa clave el Admin SDK tiene permisos. Si usas reglas restrictivas, asegura que esa cuenta tenga acceso (o usa reglas que permitan al servidor escribir en `consultas`).

### 1.3 Redeploy

Después de añadir o cambiar variables, haz un **nuevo deploy** (redeploy desde Vercel) para que el servidor use las nuevas env.

---

## 2. Stripe (obligatorio para pagar)

### 2.1 Variables en Vercel

| Variable | Dónde |
|----------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Publishable key |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key |

### 2.2 Webhook (para marcar «Pagado» y que aparezca en el dashboard)

Si no configuras el webhook, el cliente puede pagar pero la solicitud no se marcará como «Pagada» en el dashboard.

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**.
2. **URL del endpoint:**  
   `https://tu-dominio-real.vercel.app/api/webhooks/stripe`  
   (sustituye por la URL de producción de tu app).
3. Eventos: selecciona **`checkout.session.completed`**.
4. Crear el endpoint y copiar el **Signing secret** (empieza por `whsec_...`).
5. En Vercel, añade la variable:
   - `STRIPE_WEBHOOK_SECRET` = ese Signing secret.

Vuelve a desplegar si añadiste la variable después del último deploy.

---

## 3. Opcional: correo a didi@dietas.com al pagar

Si quieres que cuando alguien pague un plan le llegue un correo a didi@dietas.com con el resumen del formulario:

- Configura **Resend** y en Vercel añade `RESEND_API_KEY`.
- Opcional: `NUTRITIONIST_EMAIL=didi@dietas.com` (si no está, se usa didi@dietas.com por defecto).

---

## 4. Cómo probar que todo funciona

1. Entra en tu sitio en **producción** (la URL de Vercel).
2. Ve a **Solicitar plan** y rellena el formulario (elige plan Semanal, Quincenal, Mensual o la opción de prueba $10).
3. Pulsa **Pagar y enviar solicitud**.
4. Si Firebase está bien configurado, no debería salir error y te redirigirá a Stripe. Si sale error de “Base de datos no configurada” o “Firebase”, revisa el paso 1.
5. Completa el pago en Stripe (puedes usar la tarjeta de prueba `4242 4242 4242 4242`).
6. Inicia sesión en el sitio con **didi@dietas.com** (solo ese usuario puede ver el dashboard).
7. Entra en **Admin** (o la ruta donde tengas el panel). En **Solicitudes de plan (consultas)** debe aparecer la solicitud con todo lo que rellenó el cliente (nombre, edad, teléfono, email, objetivo, tipo de dieta, condiciones, hábitos, importancia suplementos, plan elegido) y, tras el webhook, con estado **Pagado**.

---

## Resumen rápido

- **Firebase** → sin esto, el formulario no guarda y no hay nada en el dashboard.
- **Stripe (clave pública + secreta)** → sin esto, no se puede pagar.
- **Webhook de Stripe** apuntando a tu URL de producción y **STRIPE_WEBHOOK_SECRET** en Vercel → sin esto, las solicitudes no se marcan como «Pagadas» aunque el pago se haya cobrado.
- **Sesión en el sitio con didi@dietas.com** → solo así se ve el panel con las solicitudes.

Si algo falla, el mensaje de error del formulario (o el campo `detail` en la respuesta) indica si es problema de Firebase, Stripe o del webhook.
