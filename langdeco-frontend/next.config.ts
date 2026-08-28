import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone (server mínimo + solo los node_modules que realmente
  // usa) — sin esto, la imagen Docker tendría que copiar node_modules entero.
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  images: {
    // Las fotos de producto aceptan URL libre además de subir archivo, así que su dominio no
    // se puede fijar de antemano: esas imágenes se renderizan con next/image `unoptimized` en
    // vez de pasar por este allowlist. Acá solo va el dominio que sí usamos nosotros de forma
    // fija (imágenes de stock por defecto del Hero y de "Inspiración" antes de subir una propia).
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
