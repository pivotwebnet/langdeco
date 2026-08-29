import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone (server mínimo + solo los node_modules que realmente
  // usa) — sin esto, la imagen Docker tendría que copiar node_modules entero.
  output: 'standalone',
  // sharp ya viene en la lista de paquetes externos por defecto de Next, pero se
  // deja explícito como documentación: en dev con Turbopack en Windows, cargar el
  // .node nativo de sharp por el importer dinámico de Turbopack falla con
  // ERR_DLOPEN_FAILED (bug conocido) aunque esté marcado como external — por eso
  // "dev" en package.json corre con --webpack en vez del Turbopack por defecto.
  // El build de producción (next build + node server.js) no pasa por ese camino
  // y no se ve afectado.
  serverExternalPackages: ['sharp'],
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
