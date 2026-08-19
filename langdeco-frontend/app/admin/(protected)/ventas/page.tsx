'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendClient, BackendProduct, BackendSale, ClientType, PagedResult, PaymentMethod, SaleStatus } from '@/lib/backend-types'
import { ReceiptView } from '@/components/admin/ReceiptView'
import { useEscapeKey } from '@/lib/useEscapeKey'
import { useAdminToast } from '@/components/admin/AdminToast'
import { adminApi as api } from '@/lib/admin/api'
import { Field } from '@/components/admin/Field'

/** Precio unitario según el tipo de cliente — mayorista si el producto tiene precio mayorista cargado, si no cae a minorista. */
function resolvePrice(product: BackendProduct | undefined, clientType: ClientType): number {
  if (!product) return 0
  if (clientType === 'Wholesale' && product.wholesalePrice != null) return product.wholesalePrice
  return product.price
}

const STATUS_LABEL: Record<SaleStatus, string> = { Pending: 'Pendiente', Paid: 'Pagada', Cancelled: 'Cancelada' }
const STATUS_BADGE: Record<SaleStatus, string> = { Pending: 'warn', Paid: 'ok', Cancelled: 'neutral' }
const CLIENT_TYPE_LABEL: Record<ClientType, string> = { Retail: 'Minorista', Wholesale: 'Mayorista' }
const PAGE_SIZE = 50

export default function VentasAdmin() {
  const toast = useAdminToast()
  const [sales, setSales] = useState<BackendSale[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [receiptSale, setReceiptSale] = useState<BackendSale | null>(null)

  const statusQs = statusFilter !== 'all' ? `&status=${statusFilter}` : ''

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api<PagedResult<BackendSale>>(`/sales?page=1&pageSize=${PAGE_SIZE}${statusQs}`)
      setSales(result.items)
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
      const result = await api<PagedResult<BackendSale>>(`/sales?page=${nextPage}&pageSize=${PAGE_SIZE}${statusQs}`)
      setSales((prev) => [...prev, ...result.items])
      setPage(nextPage)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { load() }, [load])
  useEffect(() => { api<BackendProduct[]>('/products').then(setProducts).catch(() => {}) }, [])

  const changeStatus = async (id: number, status: SaleStatus) => {
    setError(null)
    try {
      await api(`/sales/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      toast.success(`Venta marcada como ${STATUS_LABEL[status].toLowerCase()}.`)
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
          <h1 className="adm-title">Ventas</h1>
          <p className="adm-eyebrow">{sales.length} de {total} ventas</p>
        </div>
        <button className="adm-btn" onClick={() => setShowForm(true)}>+ Nueva venta manual</button>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <div className="adm-toolbar">
        {(['all', 'Pending', 'Paid', 'Cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`adm-btn sm ${statusFilter === s ? '' : 'ghost'}`}
          >
            {s === 'all' ? 'Todas' : STATUS_LABEL[s]}
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
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7}><div className="adm-loading">Cargando…</div></td></tr>
            )}
            {!loading && sales.map((s) => (
              <tr key={s.id}>
                <td className="mono">#{s.number}</td>
                <td>
                  <div className="adm-table-name">{s.customer.name}</div>
                  <div className="adm-table-sub">{CLIENT_TYPE_LABEL[s.clientType]} · {s.paymentMethod}</div>
                </td>
                <td>{s.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}</td>
                <td className="mono">{new Date(s.createdAt).toLocaleString('es-AR')}</td>
                <td className="mono">$ {s.total.toLocaleString('de-DE')}</td>
                <td><span className={`adm-badge ${STATUS_BADGE[s.status]}`}>{STATUS_LABEL[s.status]}</span></td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-link-btn" onClick={() => setReceiptSale(s)}>Ver comprobante</button>
                    {s.status === 'Pending' && (
                      <>
                        <button className="adm-link-btn success" onClick={() => changeStatus(s.id, 'Paid')}>Marcar pagada</button>
                        <button className="adm-link-btn danger" onClick={() => changeStatus(s.id, 'Cancelled')}>Cancelar</button>
                      </>
                    )}
                    {s.status === 'Paid' && (
                      <button className="adm-link-btn danger" onClick={() => changeStatus(s.id, 'Cancelled')}>Cancelar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sales.length === 0 && <div className="adm-empty">Sin ventas.</div>}
      </div>

      {!loading && sales.length < total && (
        <div className="adm-load-more">
          <button className="adm-btn sm ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : `Cargar más (${sales.length}/${total})`}
          </button>
        </div>
      )}

      {showForm && (
        <NewSaleModal
          onClose={() => setShowForm(false)}
          onCreated={(sale) => { setShowForm(false); load(); setReceiptSale(sale) }}
        />
      )}

      {receiptSale && (
        <ReceiptView
          kind="sale"
          record={receiptSale}
          products={products}
          onClose={() => setReceiptSale(null)}
          onUpdated={(updated) => { setReceiptSale(updated as BackendSale); load() }}
        />
      )}
    </div>
  )
}

function NewSaleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (sale: BackendSale) => void }) {
  const toast = useAdminToast()
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [clients, setClients] = useState<BackendClient[]>([])
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientTaxId, setClientTaxId] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientType, setClientType] = useState<ClientType>('Retail')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer')
  const [status, setStatus] = useState<'Pending' | 'Paid'>('Pending')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [taxRatePercent, setTaxRatePercent] = useState(0)
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([])
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

  const addItem = () => { if (products.length > 0) setItems([...items, { productId: products[0].id, quantity: 1 }]) }
  const updateItem = (i: number, patch: Partial<{ productId: string; quantity: number }>) => {
    const next = [...items]
    next[i] = { ...next[i], ...patch }
    setItems(next)
  }
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const estimatedTotal = items.reduce((sum, it) => {
    const product = products.find((p) => p.id === it.productId)
    return sum + resolvePrice(product, clientType) * it.quantity
  }, 0)

  // Si el cliente es mayorista, cualquier producto sin precio mayorista cargado
  // se cobraría a precio minorista sin avisar — lo marcamos antes de guardar.
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
      const sale = await api<BackendSale>('/sales', {
        method: 'POST',
        body: JSON.stringify({
          clientId: selectedClientId || null,
          customer: { name: clientName, contact: clientContact || null, taxId: clientTaxId || null, address: clientAddress || null },
          clientType, paymentMethod, status, discountPercent, taxRatePercent,
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity, priceType: clientType })),
        }),
      })
      toast.success(`Venta #${sale.number} registrada.`)
      onCreated(sale)
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
        <h2 className="adm-modal-title">Nueva venta manual</h2>

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
          <Field label="Medio de pago">
            <select className="adm-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} style={{ width: '100%' }}>
              <option value="Transfer">Transferencia</option>
              <option value="Cash">Efectivo</option>
              <option value="Other">Otro</option>
            </select>
          </Field>
          <Field label="Estado inicial">
            <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value as 'Pending' | 'Paid')} style={{ width: '100%' }}>
              <option value="Pending">Pendiente</option>
              <option value="Paid">Pagada</option>
            </select>
          </Field>
          <Field label="Bonificación %">
            <input className="adm-input" type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} style={{ width: '100%' }} />
          </Field>
          <Field label="Alícuota IVA % (0 = exento)">
            <input className="adm-input" type="number" min={0} max={100} value={taxRatePercent} onChange={(e) => setTaxRatePercent(Number(e.target.value))} style={{ width: '100%' }} />
          </Field>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Productos</span>
            <button type="button" className="adm-btn ghost sm" onClick={addItem} disabled={products.length === 0}>+ Agregar</button>
          </div>
          {items.map((it, i) => {
            const product = products.find((p) => p.id === it.productId)
            const noWholesale = clientType === 'Wholesale' && !!product && product.wholesalePrice == null
            return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <select className="adm-select" value={it.productId} onChange={(e) => updateItem(i, { productId: e.target.value })} style={{ flex: 1 }}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                </select>
                <input className="adm-input" type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} style={{ width: 70 }} />
                <span className="mono" style={{ fontSize: 11, width: 90, textAlign: 'right', color: noWholesale ? 'var(--adm-danger)' : undefined }}>
                  {product ? `$ ${(resolvePrice(product, clientType) * it.quantity).toLocaleString('de-DE')}` : ''}
                </span>
                <button type="button" className="adm-btn ghost sm" onClick={() => removeItem(i)}>✕</button>
              </div>
            )
          })}
          {missingWholesale.length > 0 && (
            <div className="adm-alert error" style={{ marginTop: 8, marginBottom: 0 }}>
              Sin precio mayorista cargado: {missingWholesale.map((p) => p.name).join(', ')}. No vas a poder guardar la venta hasta cargarles precio mayorista en Productos, o cambiar el tipo de cliente a minorista.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--adm-border)' }}>
          <span className="mono">Total estimado</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 500 }}>$ {estimatedTotal.toLocaleString('de-DE')}</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="adm-btn" type="submit" disabled={saving || missingWholesale.length > 0} style={{ flex: 1 }}>
            {saving ? 'Guardando...' : 'Registrar venta'}
          </button>
          <button className="adm-btn ghost" type="button" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}

