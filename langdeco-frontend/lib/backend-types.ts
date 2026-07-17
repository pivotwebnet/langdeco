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
export type BudgetStatus = 'Open' | 'Converted' | 'Expired' | 'Cancelled'

export interface BackendCustomer {
  name: string
  contact: string | null
  taxId: string | null
  address: string | null
}

export interface BackendSaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface BackendSale {
  id: number
  number: number
  clientId: number | null
  customer: BackendCustomer
  clientType: ClientType
  status: SaleStatus
  paymentMethod: PaymentMethod
  subtotal: number
  discountPercent: number
  discountAmount: number
  taxRatePercent: number
  taxAmount: number
  total: number
  createdAt: string
  items: BackendSaleItem[]
}

export interface BackendBudgetItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface BackendBudget {
  id: number
  number: number
  clientId: number | null
  customer: BackendCustomer
  clientType: ClientType
  status: BudgetStatus
  validUntil: string | null
  subtotal: number
  discountPercent: number
  discountAmount: number
  taxRatePercent: number
  taxAmount: number
  total: number
  createdAt: string
  items: BackendBudgetItem[]
}

export type IvaCondition = 'ResponsableInscripto' | 'Monotributo' | 'Exento' | 'ConsumidorFinal' | 'NoCategorizado'
export type DefaultReceiptType = 'FacturaA' | 'FacturaB' | 'FacturaC' | 'Recibo' | 'Presupuesto'

export interface BackendContactPerson {
  name: string
  role: string | null
  cell: string | null
  phone: string | null
  email: string | null
}

export interface BackendCustomField {
  label: string
  value: string
}

interface BackendPartyBase {
  id: number
  companyOrFullName: string
  firstName: string | null
  lastName: string | null
  cell: string | null
  phone: string | null
  email: string | null
  webPage: string | null
  address: string | null
  province: string | null
  postalCode: string | null
  locality: string | null
  note: string | null
  initialBalance: number
  billingCompanyOrFullName: string
  taxId: string | null
  ivaCondition: IvaCondition
  defaultReceiptType: DefaultReceiptType
  billingPhone: string | null
  billingCell: string | null
  fiscalAddress: string | null
  fiscalLocality: string | null
  fiscalProvince: string | null
  fiscalPostalCode: string | null
  active: boolean
  contactPersons: BackendContactPerson[]
  customFields: BackendCustomField[]
}

export interface BackendClient extends BackendPartyBase {
  nicknameML: string | null
  salesCategory: string | null
  salesDiscountPercent: number
  noteForClient: string | null
}

export interface BackendSupplier extends BackendPartyBase {
  purchasesCategory: string | null
  purchasesDiscountPercent: number
  noteInternal: string | null
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
