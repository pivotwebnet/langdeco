import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // Las fotos de producto las escribe la administradora como URL libre (sin upload propio
    // todavía — ver Pendiente en DOCUMENTACION.md), así que su dominio no se puede fijar de
    // antemano: esas imágenes se renderizan con next/image `unoptimized` en vez de pasar por
    // este allowlist. Acá solo va el dominio que sí usamos nosotros de forma fija (imágenes
    // de stock por defecto del Hero y de "Inspiración" antes de que se suba una foto propia).
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/inspiracion', destination: '/#inspiracion', permanent: true },
      { source: '/visualizador', destination: '/#visualizador', permanent: true },
    ];
  },
};

export default nextConfig;
