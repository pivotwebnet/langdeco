export type HeroVariant = 'editorial' | 'cinematic' | 'showroom'
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
  price: string
  priceNum: number
  aspect?: string
  category: 'mayor' | 'tesoro'
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

export interface Inquiry {
  id: string
  clientName: string
  email: string
  message: string
  productIds: string[]
  createdAt: string
  status: 'pending' | 'replied' | 'closed'
}
