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

export interface NosotrosHito {
  year: string
  label: string
}

export interface NosotrosPilar {
  title: string
  desc: string
}

export interface NosotrosContent {
  title: string
  titleEmphasis: string
  intro: string
  photos: { showroom: string; taller: string; detalle: string }
  hitos: [NosotrosHito, NosotrosHito, NosotrosHito, NosotrosHito]
  pilares: [NosotrosPilar, NosotrosPilar, NosotrosPilar]
}

export interface LegalContent {
  envios: {
    zonas: string
    costosPlazos: string
    plazoDevolucionDias: string
    plazoDanioHoras: string
  }
  terminos: {
    razonSocial: string
  }
  faq: {
    zonasCobertura: string
    plazoEntrega: string
    garantia: string
  }
  privacidad: {
    terceros: string
    cookies: string
  }
}

export interface LookbookHotspot {
  x: number        // % desde la izquierda (0-100)
  y: number        // % desde arriba (0-100)
  productId: string
}

export interface LookbookEntry {
  id: string
  n: string
  name: string
  place: string
  desc: string
  pieces: string[]
  imageUrl?: string
  isPatio?: boolean
  hotspots?: LookbookHotspot[]
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
