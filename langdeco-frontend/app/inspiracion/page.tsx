import type { Metadata } from 'next'
import { getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import { getSiteContent } from '@/lib/site-content'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Inspiracion } from '@/components/sections/Inspiracion'
import { ScrollAnimator } from '@/components/ui/ScrollAnimator'

export const metadata: Metadata = {
  title: 'Inspiración — LasLangDeco',
  description: 'Casas reales compuestas con piezas de LasLangDeco.',
}

export default async function InspiracionPage() {
  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()])

  return (
    <>
      <ScrollAnimator />
      <Header />
      <Inspiracion items={siteContent.inspiracion} products={products.map(toProduct)} />
      <Footer />
    </>
  )
}
