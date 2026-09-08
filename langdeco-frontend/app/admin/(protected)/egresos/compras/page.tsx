'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendCompra, BackendProduct, BackendSupplier, CompraStatus, PagedResult, PaymentMethod } from '@/lib/backend-types'
import { useEscapeKey } from '@/lib/useEscapeKey'
import { useAdminToast } from '@/components/admin/AdminToast'
import { adminApi as api } from '@/lib/admin/api'
import { Field } from '@/components/admin/Field'
import { ProductPicker } from '@/components/admin/ProductPicker'
import { PriceInput } from '@/components/admin/PriceInput'
import { formatPrice } from '@/lib/data'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { TableSkeletonRows } from '@/components/admin/TableSkeleton'

const STATUS_LABEL: Record<CompraStatus, string> = { Pending: 'Pendiente', Received: 'Recibida', Cancelled: 'Cancelada' }
const STATUS_BADGE: Record<CompraStatus, string> = { Pending: 'warn', Received: 'ok', Cancelled: 'neutral' }
const PAGE_SIZE = 50

export default function ComprasAdmin() {
  const toast = useAdminToast()
  const [compras, setCompras] = useState<BackendCompra[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<CompraStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [detailCompra, setDetailCompra] = useState<BackendCompra | null>(null)

  const statusQs = statusFilter !== 'all' ? `&status=${statusFilter}` : ''

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api<PagedResult<BackendCompra>>(`/compras?page=1&pageSize=${PAGE_SIZE}${statusQs}`)
      setCompras(result.items)
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
      const result = await api<PagedResult<BackendCompra>>(`/compras?page=${nextPage}&pageSize=${PAGE_SIZE}${statusQs}`)
      setCompras((prev) => [...prev, ...result.items])
      setPage(nextPage)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { load() }, [load])

  const [confirmCancel, setConfirmCancel] = useState<BackendCompra | null>(null)

  const changeStatus = async (id: number, status: CompraStatus) => {
    setError(null)
    setConfirmCancel(null)
    try {
      const updated = await api<BackendCompra>(`/compras/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      toast.success(`Compra marcada como ${STATUS_LABEL[status].toLowerCase()}.`)
      await load()
      setDetailCompra((d) => (d && d.id === id ? updated : d))
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
          <h1 className="adm-title">Compras</h1>
          <p className="adm-eyebrow">{compras.length} de {total} compras</p>
        </div>
        <button className="adm-btn" onClick={() => setShowForm(true)}>+ Nueva compra</button>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <div className="adm-toolbar">
        {(['all', 'Pending', 'Received', 'Cancelled'] as const).map((s) => (
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
              <th>Proveedor</th>
              <th>Productos</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <TableSkeletonRows columns={7} />
            )}
            {!loading && compras.map((c) => (
              <tr key={c.id}>
                <td className="mono">#{c.number}</td>
                <td>
                  <div className="adm-table-name">{c.supplierName}</div>
                  <div className="adm-table-sub">{c.paymentMethod}</div>
                </td>
                <td>{c.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}</td>
                <td className="mono">{new Date(c.createdAt).toLocaleString('es-AR')}</td>
                <td className="mono">{formatPrice(c.total)}</td>
                <td><span className={`adm-badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-link-btn" onClick={() => setDetailCompra(c)}>Ver detalle</button>
                    {c.status === 'Pending' && (
                      <>
                        <button className="adm-link-btn success" onClick={() => changeStatus(c.id, 'Received')}>Marcar recibida</button>
                        <button className="adm-link-btn danger" onClick={() => setConfirmCancel(c)}>Cancelar</button>
                      </>
                    )}
                    {c.status === 'Received' && (
                      <button className="adm-link-btn danger" onClick={() => setConfirmCancel(c)}>Cancelar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && compras.length === 0 && <div className="adm-empty">Sin compras.</div>}
      </div>

      {!loading && compras.length < total && (
        <div className="adm-load-more">
          <button className="adm-btn sm ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : `Cargar más (${compras.length}/${total})`}
          </button>
        </div>
      )}

      {showForm && (
        <NewCompraModal
          onClose={() => setShowForm(false)}
          onCreated={(compra) => { setShowForm(false); load(); setDetailCompra(compra) }}
        />
      )}

      {detailCompra && (
        <CompraDetailModal compra={detailCompra} onClose={() => setDetailCompra(null)} />
      )}

      {confirmCancel && (
        <ConfirmDialog
          title="Cancelar compra"
          message={`¿Cancelar la compra #${confirmCancel.number}? ${confirmCancel.status === 'Received' ? 'Se revierte el stock que había ingresado.' : ''}`}
          confirmLabel="Cancelar compra"
          danger
          onConfirm={() => changeStatus(confirmCancel.id, 'Cancelled')}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
    </div>
  )
}

function NewCompraModal({ onClose, onCreated }: { onClose: () => void; onCreated: (compra: BackendCompra) => void }) {
  const toast = useAdminToast()
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [suppliers, setSuppliers] = useState<BackendSupplier[]>([])
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer')
  const [status, setStatus] = useState<'Pending' | 'Received'>('Pending')
  const [discountKind, setDiscountKind] = useState<'Percent' | 'Fixed'>('Percent')
  const [discountIsSurcharge, setDiscountIsSurcharge] = useState(false)
  const [discountValue, setDiscountValue] = useState(0)
  const [taxRatePercent, setTaxRatePercent] = useState(0)
  const [note, setNote] = useState('')

  // discountPercent/discountFixedAmount negativos representan un recargo (ver DocumentTotalsCalculator en el backend).
  const discountPercent = discountKind === 'Percent' ? (discountIsSurcharge ? -discountValue : discountValue) : 0
  const discountFixedAmount = discountKind === 'Fixed' ? (discountIsSurcharge ? -discountValue : discountValue) : 0
  const [items, setItems] = useState<{ productId: string; quantity: number; unitCost: string }[]>([])
  // -1 = agregando una línea nueva; un índice ≥0 = reemplazando el producto de esa línea.
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEscapeKey(onClose)

  useEffect(() => {
    api<BackendProduct[]>('/products').then(setProducts).catch((e) => setError((e as Error).message))
    api<BackendSupplier[]>('/suppliers').then(setSuppliers).catch(() => {})
  }, [])

  const updateItem = (i: number, patch: Partial<{ productId: string; quantity: number; unitCost: string }>) => {
    const next = [...items]
    next[i] = { ...next[i], ...patch }
    setItems(next)
  }
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const onPickProduct = (p: BackendProduct) => {
    if (pickerForIndex === -1) setItems([...items, { productId: p.id, quantity: 1, unitCost: p.costPrice ? String(p.costPrice) : '' }])
    else if (pickerForIndex !== null) updateItem(pickerForIndex, { productId: p.id })
    setPickerForIndex(null)
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.unitCost) || 0) * it.quantity, 0)
  // Mismo cálculo que DocumentTotalsCalculator.Compute en el backend.
  const discountAmount = discountKind === 'Fixed' ? discountFixedAmount : Math.round(subtotal * discountPercent) / 100
  const netAmount = subtotal - discountAmount
  const taxAmount = Math.round(netAmount * taxRatePercent) / 100
  const estimatedTotal = netAmount + taxAmount

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!supplierId) {
      setError('Elegí un proveedor')
      return
    }
    if (items.length === 0) {
      setError('Agregá al menos un producto')
      return
    }
    if (items.some((it) => !it.unitCost || Number(it.unitCost) <= 0)) {
      setError('Cargá un costo unitario mayor a cero para cada línea')
      return
    }

    setSaving(true)
    try {
      const compra = await api<BackendCompra>('/compras', {
        method: 'POST',
        body: JSON.stringify({
          supplierId, paymentMethod, status, note: note || null,
          discountType: discountKind, discountPercent, discountFixedAmount, taxRatePercent,
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity, unitCost: Number(it.unitCost) })),
        }),
      })
      toast.success(`Compra #${compra.number} registrada.`)
      onCreated(compra)
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
        <h2 className="adm-modal-title">Nueva compra</h2>

        {error && <div className="adm-alert error">{error}</div>}

        <div className="adm-grid-2" style={{ marginTop: 12 }}>
          <Field label="Proveedor">
            <select className="adm-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')} required style={{ width: '100%' }}>
              <option value="">— Elegir proveedor —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.companyOrFullName}</option>)}
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
            <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value as 'Pending' | 'Received')} style={{ width: '100%' }}>
              <option value="Pending">Pendiente</option>
              <option value="Received">Recibida</option>
            </select>
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
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Nota (opcional)">
              <input className="adm-input" value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%' }} />
            </Field>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Productos</span>
            <button type="button" className="adm-btn ghost sm" onClick={() => setPickerForIndex(-1)} disabled={products.length === 0}>+ Agregar</button>
          </div>
          {items.map((it, i) => {
            const product = products.find((p) => p.id === it.productId)
            return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.name || 'Sin producto'}</div>
                  {product && <div className="adm-table-sub">Stock actual: {product.stock}</div>}
                </div>
                <button type="button" className="adm-btn ghost sm" onClick={() => setPickerForIndex(i)}>Buscar</button>
                <input className="adm-input" type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} style={{ width: 60 }} />
                <PriceInput value={it.unitCost} onChange={(v) => updateItem(i, { unitCost: v })} placeholder="Costo" style={{ width: 90 }} />
                <button type="button" className="adm-btn ghost sm" onClick={() => removeItem(i)}>✕</button>
              </div>
            )
          })}
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
          <button className="adm-btn" type="submit" disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Guardando...' : 'Registrar compra'}
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

function CompraDetailModal({ compra, onClose }: { compra: BackendCompra; onClose: () => void }) {
  useEscapeKey(onClose)
  const pdfUrl = `/api/admin/backend/compras/${compra.id}/pdf`

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-modal-title">Compra #{compra.number}</h2>
        <p className="adm-table-sub" style={{ marginBottom: 16 }}>
          {compra.supplierName} · {new Date(compra.createdAt).toLocaleString('es-AR')}
        </p>

        <table className="adm-table" style={{ marginBottom: 16 }}>
          <thead>
            <tr><th>Producto</th><th>Cant.</th><th>Costo unit.</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {compra.items.map((it, i) => (
              <tr key={i}>
                <td>{it.productName}</td>
                <td className="mono">{it.quantity}</td>
                <td className="mono">{formatPrice(it.unitCost)}</td>
                <td className="mono">{formatPrice(it.unitCost * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="adm-table-sub">Subtotal</span>
            <span className="adm-table-sub">{formatPrice(compra.subtotal)}</span>
          </div>
          {compra.discountAmount !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="adm-table-sub">{compra.discountAmount > 0 ? 'Descuento' : 'Recargo'}</span>
              <span className="adm-table-sub">{formatPrice(Math.abs(compra.discountAmount))}</span>
            </div>
          )}
          {compra.taxAmount !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="adm-table-sub">IVA</span>
              <span className="adm-table-sub">{formatPrice(compra.taxAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="mono">Total</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 500 }}>{formatPrice(compra.total)}</span>
          </div>
        </div>

        {compra.note && <p className="adm-table-sub" style={{ marginBottom: 16 }}>Nota: {compra.note}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="adm-btn ghost" onClick={() => window.open(pdfUrl, '_blank')} style={{ flex: 1 }}>Imprimir</button>
          <a className="adm-btn ghost" href={pdfUrl} download={`compra-${compra.number}.pdf`} style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>Exportar</a>
          <button className="adm-btn" type="button" onClick={onClose} style={{ flex: 1 }}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
