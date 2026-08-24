import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/api'
import { SITE_URL } from '@/lib/site-url'

const STATIC_ROUTES = [
  '', '/catalogo', '/nosotros', '/contacto', '/guardados',
  '/como-comprar', '/envios-y-devoluciones', '/preguntas-frecuentes',
  '/terminos-y-condiciones', '/politica-de-privacidad',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts().catch(() => [])

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }))

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/producto/${p.id}`,
    lastModified: new Date(),
  }))

  return [...staticEntries, ...productEntries]
}
