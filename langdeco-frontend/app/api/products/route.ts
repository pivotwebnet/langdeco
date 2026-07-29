import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/api'
import { toProduct } from '@/lib/product-mapper'

// Espejo público de GET /api/products del backend (catálogo activo, sin clave admin),
// pensado para que componentes cliente (el buscador del header) puedan traer el
// catálogo sin conocer la URL interna del backend .NET.
export async function GET() {
  const products = await getProducts()
  return NextResponse.json(products.map(toProduct))
}
