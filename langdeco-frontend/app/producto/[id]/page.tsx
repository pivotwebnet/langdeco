import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductById, getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import { SITE_URL } from '@/lib/site-url'
import { ProductoDetalle } from './ProductoDetalle'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const backendProduct = await getProductById(id).catch(() => null)
  if (!backendProduct) return {}

  const product = toProduct(backendProduct)
  const title = `${product.name} — LasLangDeco`
  const description = product.note || `${product.name} · ${product.material} · ${product.price}`
  const images = product.imageUrl ? [{ url: product.imageUrl }] : undefined

  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/producto/${product.id}`, type: 'website', images },
    twitter: { card: 'summary_large_image', title, description, images: product.imageUrl ? [product.imageUrl] : undefined },
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const backendProduct = await getProductById(id)
  if (!backendProduct) notFound()

  const sameCategory = await getProducts({ category: backendProduct.categoryId })
  const related = sameCategory
    .filter(p => p.id !== backendProduct.id)
    .slice(0, 4)
    .map(toProduct)

  const product = toProduct(backendProduct)

  // JSON-LD (schema.org Product) para que buscadores puedan mostrar precio/disponibilidad
  // en resultados enriquecidos. Se escapa "<" para que no se pueda cerrar el <script> a mano.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.note || undefined,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    material: product.material || undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/producto/${product.id}`,
      priceCurrency: 'ARS',
      price: product.priceNum,
      availability: product.stock === undefined || product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* key={product.id}: sin esto, navegar de un producto a otro (ej. desde "También te
          puede gustar") reutiliza la misma instancia del componente vía client-side routing —
          imgIdx/qty/etc. quedaban pegados del producto anterior en vez de resetear. */}
      <ProductoDetalle key={product.id} product={product} related={related} />
    </>
  )
}
