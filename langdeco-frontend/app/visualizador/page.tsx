import type { Metadata } from 'next'
import { getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'
import { VisualizadorClient } from './VisualizadorClient'

export const metadata: Metadata = {
  title: 'Visualizador de espacios — LasLongDeco',
  description: 'Subí una foto de tu espacio y probá los muebles del catálogo antes de comprar.',
}

export default async function VisualizadorPage() {
  const products = await getProducts()

  return <VisualizadorClient products={products.map(toProduct)} />
}
