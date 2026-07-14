import { getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const [allProducts, featuredProducts] = await Promise.all([
    getProducts(),
    getProducts({ featured: true }),
  ])

  return (
    <HomeClient
      products={allProducts.map(toProduct)}
      featured={featuredProducts.map(toProduct)}
    />
  )
}
