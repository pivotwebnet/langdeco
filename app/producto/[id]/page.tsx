import { PIEZAS_MAYORES, PEQUENOS_TESOROS } from '@/lib/data'
import { notFound } from 'next/navigation'
import { ProductoDetalle } from './ProductoDetalle'

export async function generateStaticParams() {
  return [...PIEZAS_MAYORES, ...PEQUENOS_TESOROS].map(p => ({ id: p.id }))
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const all = [...PIEZAS_MAYORES, ...PEQUENOS_TESOROS]
  const product = all.find(p => p.id === id)
  if (!product) notFound()

  const related = all
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4)

  return <ProductoDetalle product={product} related={related} />
}
