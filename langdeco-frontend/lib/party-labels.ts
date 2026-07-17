import type { DefaultReceiptType, IvaCondition } from './backend-types'

export const IVA_CONDITION_LABEL: Record<IvaCondition, string> = {
  ResponsableInscripto: 'Responsable Inscripto',
  Monotributo: 'Monotributo',
  Exento: 'Exento',
  ConsumidorFinal: 'Consumidor Final',
  NoCategorizado: 'No Categorizado',
}

export const RECEIPT_TYPE_LABEL: Record<DefaultReceiptType, string> = {
  FacturaA: 'Factura A',
  FacturaB: 'Factura B',
  FacturaC: 'Factura C',
  Recibo: 'Recibo',
  Presupuesto: 'Presupuesto',
}
