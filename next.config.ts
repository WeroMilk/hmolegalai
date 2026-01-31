import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
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
