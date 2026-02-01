import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // Para que Google y otros crawlers que piden /favicon.ico obtengan nuestro logo
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/logo.png" }];
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
