import type { BackendProduct } from './backend-types'
import type { Product } from './types'
import { formatPrice } from './data'

export function toProduct(bp: BackendProduct): Product {
  return {
    id: bp.id,
    name: bp.name,
    tag: bp.tag ?? undefined,
    material: bp.material,
    origin: bp.origin ?? undefined,
    price: formatPrice(bp.price),
    priceNum: bp.price,
    aspect: bp.aspect ?? undefined,
    category: bp.categoryId,
    note: bp.note ?? undefined,
    imageUrl: bp.images[0],
    extraImages: bp.images.slice(1),
    specs: bp.specs,
  }
}
