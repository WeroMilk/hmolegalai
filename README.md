# Avatar Legal AI - Generador de Documentos Legales con IA

Plataforma moderna y futurista para generar documentos legales utilizando inteligencia artificial.

> Repo: [WeroMilk/AvatarLegalAI](https://github.com/WeroMilk/AvatarLegalAI) · Última actualización: fix Vercel build + Node engine.

## 🚀 Tecnologías

- **Next.js 15** - Framework React con App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Type safety
- **Firebase** - Backend (Firestore, Auth, Storage)
- **OpenAI** - Generación de documentos con IA
- **Stripe** - Sistema de pagos
- **Tailwind CSS** - Estilos modernos
- **Framer Motion** - Animaciones fluidas

## 📦 Instalación

```bash
npm install
```

## 🔧 Configuración

1. Crea un archivo `.env.local` con las siguientes variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_key
STRIPE_SECRET_KEY=tu_stripe_secret
OPENAI_API_KEY=tu_openai_key
```

2. Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

## 📤 Subir a GitHub

Repositorio: **[WeroMilk/AvatarLegalAI](https://github.com/WeroMilk/AvatarLegalAI)**

En la carpeta del proyecto, ejecuta en PowerShell:

```powershell
.\push-to-github.ps1
```

(Requiere [Git](https://git-scm.com/download/win) instalado. Si no usas SSH con GitHub, edita `push-to-github.ps1` y cambia `$repoUrl` por `$httpsUrl`.)

O manualmente:

```bash
git init
git add .
git commit -m "Initial commit: Avatar Legal AI"
git remote add origin git@github.com:WeroMilk/AvatarLegalAI.git
git branch -M main
git push -u origin main
```

## 🚢 Deploy

El proyecto está configurado para deploy automático en Vercel conectado a GitHub.
