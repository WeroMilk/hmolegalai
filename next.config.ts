import type { NextConfig } from "next";

// CSP: producción SIN 'unsafe-eval' (más seguro). Desarrollo lo permite solo si hace falta.
const cspBase =
  "default-src 'self'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "img-src 'self' data: https: blob:; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "media-src 'self' blob:; " +
  "connect-src 'self' https://api.stripe.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com wss://*.firebaseio.com; " +
  "frame-src 'self' https://js.stripe.com https://*.firebaseapp.com https://*.google.com; " +
  "script-src-attr 'self' 'unsafe-inline'; ";

const scriptSrcProd =
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com; " +
  "script-src-elem 'self' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com; " +
  "worker-src 'self' blob:; ";

const scriptSrcDev =
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com; " +
  "script-src-elem 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com; " +
  "worker-src 'self' 'unsafe-eval' blob:; ";

const isDev = process.env.NODE_ENV === "development";
const cspValue = cspBase + (isDev ? scriptSrcDev : scriptSrcProd);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/logo.png", permanent: true },
      { source: "/icon-192.png", destination: "/logo.png", permanent: true },
      { source: "/icon-512.png", destination: "/logo.png", permanent: true },
    ];
  },
  images: {
    remotePatterns: [],
  },
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
  webpack: (config, { dev, isServer }) => {
    // Evitar eval en source maps: Next/Webpack en dev suele usar eval-source-map.
    // Usar source-map sin eval para que la CSP no bloquee y no haga falta 'unsafe-eval' en prod.
    if (dev) {
      config.devtool = "cheap-module-source-map";
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
      };
    }
    // Producción: no tocar devtool; Next no usa eval en el bundle de producción.
    config.resolve = config.resolve || {};
    config.resolve.alias = { ...config.resolve.alias };
    return config;
  },
};

export default nextConfig;
