'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendBudget, BackendClient, BackendProduct, BackendSale, BudgetStatus, ClientType, PagedResult, PaymentMethod } from '@/lib/backend-types'
import { ReceiptView } from '@/components/admin/ReceiptView'
import { useEscapeKey } from '@/lib/useEscapeKey'
import { useAdminToast } from '@/components/admin/AdminToast'
import { adminApi as api } from '@/lib/admin/api'
import { Field } from '@/components/admin/Field'
import { ProductPicker } from '@/components/admin/ProductPicker'
import { formatPrice } from '@/lib/data'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { TableSkeletonRows } from '@/components/admin/TableSkeleton'

/** Precio unitario según el tipo de cliente — mayorista si el producto tiene precio mayorista cargado, si no cae a minorista. */
function resolvePrice(product: BackendProduct | undefined, clientType: ClientType): number {
  if (!product) return 0
  if (clientType === 'Wholesale' && product.wholesalePrice != null) return product.wholesalePrice
  return product.price
}

const STATUS_LABEL: Record<BudgetStatus, string> = { Open: 'Abierto', Converted: 'Convertido en venta', Expired: 'Vencido', Cancelled: 'Cancelado' }
const STATUS_BADGE: Record<BudgetStatus, string> = { Open: 'warn', Converted: 'ok', Expired: 'neutral', Cancelled: 'danger' }
const CLIENT_TYPE_LABEL: Record<ClientType, string> = { Retail: 'Minorista', Wholesale: 'Mayorista' }
const PAGE_SIZE = 50

export default function PresupuestosAdmin() {
  const toast = useAdminToast()
  const [budgets, setBudgets] = useState<BackendBudget[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [receiptBudget, setReceiptBudget] = useState<BackendBudget | null>(null)
  const [receiptSale, setReceiptSale] = useState<BackendSale | null>(null)
  const [convertingBudget, setConvertingBudget] = useState<BackendBudget | null>(null)

  const statusQs = statusFilter !== 'all' ? `&status=${statusFilter}` : ''

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api<PagedResult<BackendBudget>>(`/budgets?page=1&pageSize=${PAGE_SIZE}${statusQs}`)
      setBudgets(result.items)
      setTotal(result.total)
      setPage(1)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [statusQs])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const result = await api<PagedResult<BackendBudget>>(`/budgets?page=${nextPage}&pageSize=${PAGE_SIZE}${statusQs}`)
      setBudgets((prev) => [...prev, ...result.items])
      setPage(nextPage)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { load() }, [load])
  useEffect(() => { api<BackendProduct[]>('/products').then(setProducts).catch(() => {}) }, [])

  const [confirmCancel, setConfirmCancel] = useState<BackendBudget | null>(null)

  const changeStatus = async (id: number, status: BudgetStatus) => {
    setError(null)
    setConfirmCancel(null)
    try {
      await api(`/budgets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      toast.success(`Presupuesto marcado como ${STATUS_LABEL[status].toLowerCase()}.`)
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Presupuestos</h1>
          <p className="adm-eyebrow">{budgets.length} de {total} presupuestos</p>
        </div>
        <button className="adm-btn" onClick={() => setShowForm(true)}>+ Nuevo presupuesto</button>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <div className="adm-toolbar">
        {(['all', 'Open', 'Converted', 'Expired', 'Cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`adm-btn sm ${statusFilter === s ? '' : 'ghost'}`}
          >
            {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="adm-card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Vencimiento</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <TableSkeletonRows columns={7} />
            )}
            {!loading && budgets.map((b) => (
              <tr key={b.id}>
                <td className="mono">#{b.number}</td>
                <td>
                  <div className="adm-table-name">{b.customer.name}</div>
                  <div className="adm-table-sub">{CLIENT_TYPE_LABEL[b.clientType]}</div>
                </td>
                <td>{b.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}</td>
                <td className="mono">{b.validUntil ? new Date(b.validUntil).toLocaleDateString('es-AR') : '-'}</td>
                <td className="mono">{formatPrice(b.total)}</td>
                <td><span className={`adm-badge ${STATUS_BADGE[b.status]}`}>{STATUS_LABEL[b.status]}</span></td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-link-btn" onClick={() => setReceiptBudget(b)}>Ver comprobante</button>
                    {b.status === 'Open' && (
                      <>
                        <button className="adm-link-btn success" onClick={() => setConvertingBudget(b)}>Convertir en venta</button>
                        <button className="adm-link-btn danger" onClick={() => setConfirmCancel(b)}>Cancelar</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && budgets.length === 0 && <div className="adm-empty">Sin presupuestos.</div>}
      </div>

      {!loading && budgets.length < total && (
        <div className="adm-load-more">
          <button className="adm-btn sm ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : `Cargar más (${budgets.length}/${total})`}
          </button>
        </div>
      )}

      {showForm && (
        <NewBudgetModal
          onClose={() => setShowForm(false)}
          onCreated={(budget) => { setShowForm(false); load(); setReceiptBudget(budget) }}
        />
      )}

      {receiptBudget && (
        <ReceiptView
          kind="budget"
          record={receiptBudget}
          products={products}
          onClose={() => setReceiptBudget(null)}
          onUpdated={(updated) => { setReceiptBudget(updated as BackendBudget); load() }}
        />
      )}

      {receiptSale && (
        <ReceiptView
          kind="sale"
          record={receiptSale}
          products={products}
          onClose={() => setReceiptSale(null)}
          onUpdated={(updated) => setReceiptSale(updated as BackendSale)}
        />
      )}

      {convertingBudget && (
        <ConvertBudgetModal
          budget={convertingBudget}
          onClose={() => setConvertingBudget(null)}
          onConverted={(sale) => { setConvertingBudget(null); load(); setReceiptSale(sale) }}
        />
      )}

      {confirmCancel && (
        <ConfirmDialog
          title="Cancelar presupuesto"
          message={`¿Cancelar el presupuesto #${confirmCancel.number}?`}
          confirmLabel="Cancelar presupuesto"
          danger
          onConfirm={() => changeStatus(confirmCancel.id, 'Cancelled')}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
    </div>
  )
}

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { Transfer: 'Transferencia', Cash: 'Efectivo', Other: 'Otro' }

function ConvertBudgetModal({ budget, onClose, onConverted }: { budget: BackendBudget; onClose: () => void; onConverted: (sale: BackendSale) => void }) {
  const toast = useAdminToast()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEscapeKey(onClose)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const sale = await api<BackendSale>(`/budgets/${budget.id}/convert`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod }),
      })
      toast.success(`Presupuesto convertido en venta #${sale.number}.`)
      onConverted(sale)
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="adm-modal-backdrop">
      <form onSubmit={onSubmit} className="adm-modal">
        <h2 className="adm-modal-title">Convertir presupuesto #{budget.number} en venta</h2>

        {error && <div className="adm-alert error">{error}</div>}

        <Field label="Medio de pago">
          <select className="adm-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} style={{ width: '100%' }}>
            {(['Transfer', 'Cash', 'Other'] as const).map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>)}
          </select>
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="adm-btn" type="submit" disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Convirtiendo...' : 'Confirmar y descontar stock'}
          </button>
          <button className="adm-btn ghost" type="button" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}

function NewBudgetModal({ onClose, onCreated }: { onClose: () => void; onCreated: (budget: BackendBudget) => void }) {
  const toast = useAdminToast()
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [clients, setClients] = useState<BackendClient[]>([])
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientTaxId, setClientTaxId] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientType, setClientType] = useState<ClientType>('Retail')
  const [validUntil, setValidUntil] = useState('')
  const [discountKind, setDiscountKind] = useState<'Percent' | 'Fixed'>('Percent')
  const [discountIsSurcharge, setDiscountIsSurcharge] = useState(false)
  const [discountValue, setDiscountValue] = useState(0)
  const [taxRatePercent, setTaxRatePercent] = useState(0)

  // discountPercent/discountFixedAmount negativos representan un recargo en vez de un descuento (ver DocumentTotalsCalculator en el backend).
  const discountPercent = discountKind === 'Percent' ? (discountIsSurcharge ? -discountValue : discountValue) : 0
  const discountFixedAmount = discountKind === 'Fixed' ? (discountIsSurcharge ? -discountValue : discountValue) : 0
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([])
  // -1 = agregando una línea nueva; un índice ≥0 = reemplazando el producto de esa línea.
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEscapeKey(onClose)

  useEffect(() => {
    api<BackendProduct[]>('/products').then(setProducts).catch((e) => setError((e as Error).message))
    api<BackendClient[]>('/clients').then(setClients).catch(() => {})
  }, [])

  const onSelectClient = (value: string) => {
    const id = value ? Number(value) : ''
    setSelectedClientId(id)
    const c = clients.find((cl) => cl.id === id)
    if (c) {
      setClientName(c.companyOrFullName)
      setClientContact(c.email || c.phone || c.cell || '')
      setClientTaxId(c.taxId || '')
      setClientAddress(c.address || '')
    }
  }

  const updateItem = (i: number, patch: Partial<{ productId: string; quantity: number }>) => {
    const next = [...items]
    next[i] = { ...next[i], ...patch }
    setItems(next)
  }
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const onPickProduct = (p: BackendProduct) => {
    if (pickerForIndex === -1) setItems([...items, { productId: p.id, quantity: 1 }])
    else if (pickerForIndex !== null) updateItem(pickerForIndex, { productId: p.id })
    setPickerForIndex(null)
  }

  const subtotal = items.reduce((sum, it) => {
    const product = products.find((p) => p.id === it.productId)
    return sum + resolvePrice(product, clientType) * it.quantity
  }, 0)
  // Mismo cálculo que DocumentTotalsCalculator.Compute en el backend.
  const discountAmount = discountKind === 'Fixed' ? discountFixedAmount : Math.round(subtotal * discountPercent) / 100
  const netAmount = subtotal - discountAmount
  const taxAmount = Math.round(netAmount * taxRatePercent) / 100
  const estimatedTotal = netAmount + taxAmount

  const missingWholesale = clientType === 'Wholesale'
    ? items
        .map((it) => products.find((p) => p.id === it.productId))
        .filter((p): p is BackendProduct => !!p && p.wholesalePrice == null)
    : []

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError('Agregá al menos un producto')
      return
    }

    setSaving(true)
    try {
      const budget = await api<BackendBudget>('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          clientId: selectedClientId || null,
          customer: { name: clientName, contact: clientContact || null, taxId: clientTaxId || null, address: clientAddress || null },
          clientType,
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          discountType: discountKind, discountPercent, discountFixedAmount, taxRatePercent,
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity, priceType: clientType })),
        }),
      })
      toast.success(`Presupuesto #${budget.number} creado.`)
      onCreated(budget)
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="adm-modal-backdrop">
      <form onSubmit={onSubmit} className="adm-modal">
        <h2 className="adm-modal-title">Nuevo presupuesto</h2>

        {error && <div className="adm-alert error">{error}</div>}

        <Field label="Cliente guardado (opcional)">
          <select className="adm-select" value={selectedClientId} onChange={(e) => onSelectClient(e.target.value)} style={{ width: '100%' }}>
            <option value="">— Cliente ocasional —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.companyOrFullName}</option>)}
          </select>
        </Field>

        <div className="adm-grid-2" style={{ marginTop: 12 }}>
          <Field label="Cliente"><input className="adm-input" value={clientName} onChange={(e) => setClientName(e.target.value)} required style={{ width: '100%' }} /></Field>
          <Field label="Contacto (tel/email, opcional)"><input className="adm-input" value={clientContact} onChange={(e) => setClientContact(e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="CUIT (opcional)"><input className="adm-input" value={clientTaxId} onChange={(e) => setClientTaxId(e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Domicilio (opcional)"><input className="adm-input" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Tipo de cliente">
            <select className="adm-select" value={clientType} onChange={(e) => setClientType(e.target.value as ClientType)} style={{ width: '100%' }}>
              <option value="Retail">Minorista</option>
              <option value="Wholesale">Mayorista</option>
            </select>
          </Field>
          <Field label="Válido hasta (opcional)">
            <input className="adm-input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={{ width: '100%' }} />
          </Field>
          <Field label="Ajuste">
            <div style={{ display: 'flex', gap: 6 }}>
              <select className="adm-select" value={discountIsSurcharge ? 'surcharge' : 'discount'} onChange={(e) => setDiscountIsSurcharge(e.target.value === 'surcharge')} style={{ flex: 1 }}>
                <option value="discount">Descuento</option>
                <option value="surcharge">Recargo</option>
              </select>
              <select className="adm-select" value={discountKind} onChange={(e) => setDiscountKind(e.target.value as 'Percent' | 'Fixed')} style={{ flex: 1 }}>
                <option value="Percent">%</option>
                <option value="Fixed">$ fijo</option>
              </select>
            </div>
          </Field>
          <Field label={discountKind === 'Percent' ? 'Valor del ajuste (%)' : 'Valor del ajuste ($)'}>
            <input
              className="adm-input" type="number" min={0} max={discountKind === 'Percent' ? 100 : undefined}
              value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} style={{ width: '100%' }}
            />
          </Field>
          <Field label="Alícuota IVA % (0 = exento)">
            <input className="adm-input" type="number" min={0} max={100} value={taxRatePercent} onChange={(e) => setTaxRatePercent(Number(e.target.value))} style={{ width: '100%' }} />
          </Field>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Productos</span>
            <button type="button" className="adm-btn ghost sm" onClick={() => setPickerForIndex(-1)} disabled={products.length === 0}>+ Agregar</button>
          </div>
          {items.map((it, i) => {
            const product = products.find((p) => p.id === it.productId)
            const noWholesale = clientType === 'Wholesale' && !!product && product.wholesalePrice == null
            return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.name || 'Sin producto'}</div>
                  {product && <div className="adm-table-sub">Stock: {product.stock}</div>}
                </div>
                <button type="button" className="adm-btn ghost sm" onClick={() => setPickerForIndex(i)}>Buscar</button>
                <input className="adm-input" type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} style={{ width: 70 }} />
                <span className="mono" style={{ fontSize: 11, width: 90, textAlign: 'right', color: noWholesale ? 'var(--adm-danger)' : undefined }}>
                  {product ? formatPrice(resolvePrice(product, clientType) * it.quantity) : ''}
                </span>
                <button type="button" className="adm-btn ghost sm" onClick={() => removeItem(i)}>✕</button>
              </div>
            )
          })}
          {missingWholesale.length > 0 && (
            <div className="adm-alert error" style={{ marginTop: 8, marginBottom: 0 }}>
              Sin precio mayorista cargado: {missingWholesale.map((p) => p.name).join(', ')}. No vas a poder guardar el presupuesto hasta cargarles precio mayorista en Productos, o cambiar el tipo de cliente a minorista.
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--adm-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="adm-table-sub">Subtotal</span>
            <span className="adm-table-sub">{formatPrice(subtotal)}</span>
          </div>
          {discountAmount !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="adm-table-sub">{discountAmount > 0 ? 'Descuento' : 'Recargo'}</span>
              <span className="adm-table-sub">{discountAmount > 0 ? '-' : '+'}{formatPrice(Math.abs(discountAmount))}</span>
            </div>
          )}
          {taxAmount !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="adm-table-sub">IVA</span>
              <span className="adm-table-sub">{formatPrice(taxAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="mono">Total estimado</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 500 }}>{formatPrice(estimatedTotal)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="adm-btn" type="submit" disabled={saving || missingWholesale.length > 0} style={{ flex: 1 }}>
            {saving ? 'Guardando...' : 'Crear presupuesto'}
          </button>
          <button className="adm-btn ghost" type="button" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        </div>
      </form>

      {pickerForIndex !== null && (
        <ProductPicker
          products={products}
          title={pickerForIndex === -1 ? 'Agregar producto' : 'Cambiar producto'}
          onSelect={onPickProduct}
          onClose={() => setPickerForIndex(null)}
        />
      )}
    </div>
  )
}

