import { notFound } from 'next/navigation'
import { getProductById, getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import { ProductoDetalle } from './ProductoDetalle'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const backendProduct = await getProductById(id)
  if (!backendProduct) notFound()

  const sameCategory = await getProducts({ category: backendProduct.categoryId })
  const related = sameCategory
    .filter(p => p.id !== backendProduct.id)
    .slice(0, 4)
    .map(toProduct)

  return <ProductoDetalle product={toProduct(backendProduct)} related={related} />
}
