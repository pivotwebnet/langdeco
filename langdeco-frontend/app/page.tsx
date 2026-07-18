import { getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import { getSiteContent } from '@/lib/site-content'
import HomeClient from './HomeClient'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const [allProducts, featuredProducts, siteContent, { cat }] = await Promise.all([
    getProducts(),
    getProducts({ featured: true }),
    getSiteContent(),
    searchParams,
  ])

  const initialCategory = cat === 'mayor' || cat === 'tesoro' ? cat : undefined

  return (
    <HomeClient
      products={allProducts.map(toProduct)}
      featured={featuredProducts.map(toProduct)}
      initialCategory={initialCategory}
      siteContent={siteContent}
    />
  )
}
