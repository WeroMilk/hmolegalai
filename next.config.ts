import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // CSP: permitir eval para que Next.js y dependencias no fallen en producción (avatarlegalai.com.mx)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com",
              "script-src-elem 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com data:",
              "connect-src 'self' https://api.stripe.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com wss://*.firebaseio.com",
              "frame-src 'self' https://js.stripe.com https://*.firebaseapp.com https://*.google.com",
            ].join("; "),
          },
        ],
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
