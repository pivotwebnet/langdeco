export interface ProductSpec {
  label: string
  value: string
}

export interface Product {
  id: string
  name: string
  material: string
  roomTags?: string[]
  price: string
  priceNum: number
  cardPriceNum?: number
  originalPriceNum?: number
  stock?: number
  installments?: number
  category: string
  note?: string
  imageUrl?: string
  extraImages?: string[]
  cutoutImageUrl?: string
  specs?: ProductSpec[]
}

export interface NosotrosHito {
  year: string
  label: string
  imageUrl?: string
}

export interface NosotrosPilar {
  title: string
  desc: string
}

export interface NosotrosTeamMember {
  name: string
  role: string
  photo: string
}

export interface NosotrosContent {
  title: string
  titleEmphasis: string
  subtitle: string
  intro: string
  photos: string[]
  hitos: [NosotrosHito, NosotrosHito, NosotrosHito, NosotrosHito]
  pilares: [NosotrosPilar, NosotrosPilar, NosotrosPilar]
  team: NosotrosTeamMember[]
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

export interface CartItem extends Product {
  qty: number
}
