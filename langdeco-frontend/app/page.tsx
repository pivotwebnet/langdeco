import { getProducts, getCategories } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import { getSiteContent } from '@/lib/site-content'
import { Visita } from '@/components/sections/Visita'
import { Explorar } from '@/components/sections/Explorar'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const [allProducts, featuredProducts, siteContent, categories] = await Promise.all([
    getProducts(),
    getProducts({ featured: true }),
    getSiteContent(),
    getCategories(),
  ])

  return (
    <HomeClient
      products={allProducts.map(toProduct)}
      featured={featuredProducts.map(toProduct)}
      siteContent={siteContent}
      categories={categories}
      visita={<Visita />}
      explorar={<Explorar />}
    />
  )
}
