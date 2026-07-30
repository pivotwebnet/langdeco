export type Palette = 'bone' | 'cream' | 'stone'
export type AnimIntensity = 'off' | 'subtle' | 'bold'

export interface ProductSpec {
  label: string
  value: string
}

export interface Product {
  id: string
  name: string
  tag?: string
  material: string
  origin?: string
  roomTags?: string[]
  price: string
  priceNum: number
  originalPriceNum?: number
  stock?: number
  aspect?: string
  category: string
  note?: string
  imageUrl?: string
  extraImages?: string[]
  specs?: ProductSpec[]
}

export interface LookbookEntry {
  id: string
  n: string
  name: string
  place: string
  desc: string
  pieces: string[]
  imageUrl?: string
}

export interface SeleccionItem extends Product {
  note: string
  aspect: string
}

export interface CartItem extends Product {
  qty: number
}

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'editor'
}
