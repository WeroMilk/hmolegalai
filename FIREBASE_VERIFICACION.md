# Configuración de verificación de correo (Firebase)

## Si los correos de verificación no llegan

### 1. Dominios autorizados (obligatorio)

En **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**:

- Añade tu dominio de producción: `tudominio.vercel.app` o tu dominio personalizado
- Añade `localhost` para desarrollo local

Sin esto, Firebase puede bloquear el envío o el enlace no funcionará.

### 2. Carpeta de spam

Los correos de Firebase suelen ir a **spam** la primera vez. Revisa la carpeta de spam y marca como "No es spam".

### 3. Variable de entorno para el enlace

Añade en Vercel → Environment Variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://tudominio.vercel.app` | URL donde redirigir tras verificar (sin barra final) |

Así el enlace del correo redirigirá correctamente a tu app tras la verificación.

### 4. Plantillas de email (opcional)

En **Firebase Console** → **Authentication** → **Templates** puedes personalizar el asunto y el texto del correo de verificación (p. ej. en español).

### 5. Proveedores de email restrictivos

Algunos proveedores (empresas, universidades) bloquean correos de Firebase. Prueba con Gmail, Outlook u otro correo personal.

---

## Cómo funciona la verificación

- Firebase envía un **enlace** (no un código de 6 dígitos)
- El usuario debe **hacer clic en el enlace** del correo
- Tras hacer clic, la cuenta queda verificada y puede iniciar sesión
- Si no llega el correo: botón "Reenviar correo" en la pantalla de verificación

---

## Inicio con Google

El inicio de sesión con **Google** no requiere verificación de correo: las cuentas de Google ya están verificadas.
