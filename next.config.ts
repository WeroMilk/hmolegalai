import type { NextConfig } from "next";

// CSP: aplicada aquí para que Next.js la envíe en todas las respuestas (incl. deploy).
// Incluye 'unsafe-eval' porque Stripe, Firebase y el runtime de Next/React pueden usarlo.
const cspValue =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com; " +
  "script-src-elem 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com; " +
  "script-src-attr 'self' 'unsafe-inline'; " +
  "worker-src 'self' 'unsafe-eval' blob:; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "img-src 'self' data: https: blob:; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "connect-src 'self' https://api.stripe.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com wss://*.firebaseio.com; " +
  "frame-src 'self' https://js.stripe.com https://*.firebaseapp.com https://*.google.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // En producción: quitar todo console.* para que DevTools no muestre notificaciones
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: cspValue }],
      },
    ];
  },
  // Mitiga ChunkLoadError (timeout al cargar chunks en dev)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Revisar cambios cada 1s (útil en Windows)
      };
    }
    return config;
  },
};

export default nextConfig;
