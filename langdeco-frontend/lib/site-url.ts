// Falta definir el dominio real de producción — hasta entonces, sitemap/robots/OG
// usan este fallback. Configurar NEXT_PUBLIC_SITE_URL cuando haya un dominio elegido.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
