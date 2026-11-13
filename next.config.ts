import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // cacheComponents desactivado temporalmente para evitar datos desactualizados
  // en rutas dinámicas (turnos, pedidos, stock). Reevaluar al definir estrategia
  // de revalidación.
  // cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
