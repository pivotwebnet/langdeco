import type { BackendProduct } from './backend-types'
import type { Product } from './types'
import { formatPrice } from './data'

export function toProduct(bp: BackendProduct): Product {
  return {
    id: bp.id,
    name: bp.name,
    material: bp.material,
    roomTags: bp.roomTags,
    price: formatPrice(bp.price),
    priceNum: bp.price,
    cardPriceNum: bp.cardPrice ?? undefined,
    originalPriceNum: bp.originalPrice ?? undefined,
    stock: bp.stock,
    installments: bp.installments ?? undefined,
    category: bp.categoryId,
    note: bp.note ?? undefined,
    imageUrl: bp.images[0],
    extraImages: bp.images.slice(1),
    cutoutImageUrl: bp.cutoutImageUrl ?? undefined,
    specs: bp.specs,
  }
}
