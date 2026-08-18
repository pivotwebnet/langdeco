import type { Metadata } from 'next'
import { getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Productos } from '@/components/sections/Productos'
import { ScrollAnimator } from '@/components/ui/ScrollAnimator'

export const metadata: Metadata = {
  title: 'Catálogo — LasLangDeco',
  description: 'Piezas Mayores y Pequeños Tesoros: el catálogo completo de LasLangDeco.',
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>
}) {
  const [products, { cat, q }] = await Promise.all([getProducts(), searchParams])
  const initialCategory = cat === 'mayor' || cat === 'tesoro' ? cat : undefined

  return (
    <>
      <ScrollAnimator />
      <Header />
      <main className="pd-page">
        <PageHeader label="Catálogo" />
        <Productos products={products.map(toProduct)} initialCategory={initialCategory} initialQuery={q} />
      </main>
      <Footer />
    </>
  )
}
