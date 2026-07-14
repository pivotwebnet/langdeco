export interface BackendCategory {
  id: string
  name: string
  active: boolean
}

export interface BackendProductSpec {
  label: string
  value: string
}

export interface BackendProduct {
  id: string
  name: string
  categoryId: string
  categoryName: string
  tag: string | null
  material: string
  origin: string | null
  price: number
  originalPrice: number | null
  stock: number
  note: string | null
  aspect: string | null
  active: boolean
  featured: boolean
  specs: BackendProductSpec[]
  images: string[]
}

export type ClientType = 'Retail' | 'Wholesale'
export type SaleStatus = 'Pending' | 'Paid' | 'Cancelled'
export type PaymentMethod = 'Transfer' | 'Cash' | 'Other'

export interface BackendSaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface BackendSale {
  id: number
  clientName: string
  clientContact: string | null
  clientType: ClientType
  status: SaleStatus
  paymentMethod: PaymentMethod
  total: number
  createdAt: string
  items: BackendSaleItem[]
}

export interface ProductRanking {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
}

export interface LowStockProduct {
  productId: string
  productName: string
  stock: number
}

export interface SalesSummary {
  revenue: number
  averageTicket: number
  salesCount: number
  retailRevenue: number
  wholesaleRevenue: number
  ranking: ProductRanking[]
  lowStock: LowStockProduct[]
}
