'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendBudget, BackendClient, BackendProduct, BudgetStatus, ClientType } from '@/lib/backend-types'
import { ReceiptView } from '@/components/admin/ReceiptView'
import { useEscapeKey } from '@/lib/useEscapeKey'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/backend${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

const STATUS_LABEL: Record<BudgetStatus, string> = { Open: 'Abierto', Converted: 'Convertido en venta', Expired: 'Vencido', Cancelled: 'Cancelado' }
const STATUS_BADGE: Record<BudgetStatus, string> = { Open: 'warn', Converted: 'ok', Expired: 'neutral', Cancelled: 'danger' }
const CLIENT_TYPE_LABEL: Record<ClientType, string> = { Retail: 'Minorista', Wholesale: 'Mayorista' }

export default function PresupuestosAdmin() {
  const [budgets, setBudgets] = useState<BackendBudget[]>([])
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [receiptBudget, setReceiptBudget] = useState<BackendBudget | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      setBudgets(await api<BackendBudget[]>(`/budgets${qs}`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { api<BackendProduct[]>('/products').then(setProducts).catch(() => {}) }, [])

  const changeStatus = async (id: number, status: BudgetStatus) => {
    setError(null)
    try {
      await api(`/budgets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Presupuestos</h1>
          <p className="adm-eyebrow">{budgets.length} presupuestos</p>
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
              <tr><td colSpan={7}><div className="adm-loading">Cargando…</div></td></tr>
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
                <td className="mono">$ {b.total.toLocaleString('de-DE')}</td>
                <td><span className={`adm-badge ${STATUS_BADGE[b.status]}`}>{STATUS_LABEL[b.status]}</span></td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-link-btn" onClick={() => setReceiptBudget(b)}>Ver comprobante</button>
                    {b.status === 'Open' && (
                      <>
                        <button className="adm-link-btn success" onClick={() => changeStatus(b.id, 'Converted')}>Convertir en venta</button>
                        <button className="adm-link-btn danger" onClick={() => changeStatus(b.id, 'Cancelled')}>Cancelar</button>
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
    </div>
  )
}

function NewBudgetModal({ onClose, onCreated }: { onClose: () => void; onCreated: (budget: BackendBudget) => void }) {
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [clients, setClients] = useState<BackendClient[]>([])
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientTaxId, setClientTaxId] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientType, setClientType] = useState<ClientType>('Retail')
  const [validUntil, setValidUntil] = useState('')
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

  const addItem = () => setItems([...items, { productId: products[0]?.id || '', quantity: 1 }])
  const updateItem = (i: number, patch: Partial<{ productId: string; quantity: number }>) => {
    const next = [...items]
    next[i] = { ...next[i], ...patch }
    setItems(next)
  }
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const estimatedTotal = items.reduce((sum, it) => {
    const product = products.find((p) => p.id === it.productId)
    return sum + (product?.price || 0) * it.quantity
  }, 0)

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
          discountPercent, taxRatePercent,
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        }),
      })
      onCreated(budget)
    } catch (e) {
      setError((e as Error).message)
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
            <button type="button" className="adm-btn ghost sm" onClick={addItem}>+ Agregar</button>
          </div>
          {items.map((it, i) => {
            const product = products.find((p) => p.id === it.productId)
            return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <select className="adm-select" value={it.productId} onChange={(e) => updateItem(i, { productId: e.target.value })} style={{ flex: 1 }}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                </select>
                <input className="adm-input" type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} style={{ width: 70 }} />
                <span className="mono" style={{ fontSize: 11, width: 90, textAlign: 'right' }}>
                  {product ? `$ ${(product.price * it.quantity).toLocaleString('de-DE')}` : ''}
                </span>
                <button type="button" className="adm-btn ghost sm" onClick={() => removeItem(i)}>✕</button>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--adm-border)' }}>
          <span className="mono">Total estimado</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 500 }}>$ {estimatedTotal.toLocaleString('de-DE')}</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="adm-btn" type="submit" disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Guardando...' : 'Crear presupuesto'}
          </button>
          <button className="adm-btn ghost" type="button" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-field">
      <label className="adm-field-label">{label}</label>
      {children}
    </div>
  )
}
