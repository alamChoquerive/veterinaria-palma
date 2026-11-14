import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // cacheComponents desactivado temporalmente para evitar datos desactualizados
  // en rutas dinámicas (turnos, pedidos, stock). Reevaluar al definir estrategia
  // de revalidación.
  // NOTA: partialPrefetching exige cacheComponents en Next 16 (dev y build
  // fallan en la validación de config si falta), así que no se puede activar
  // por separado.
  // cacheComponents: true,
  // partialPrefetching: true,
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
