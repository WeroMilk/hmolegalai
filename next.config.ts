import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // En producción: quitar todo console.* para que DevTools no muestre notificaciones
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // CSP se define en vercel.json para que Vercel la aplique en el edge (evita bloqueo de eval en deploy)
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
