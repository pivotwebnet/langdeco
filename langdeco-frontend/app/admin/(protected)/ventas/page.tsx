'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendProduct, BackendSale, ClientType, PaymentMethod, SaleStatus } from '@/lib/backend-types'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/backend${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

const STATUS_LABEL: Record<SaleStatus, string> = { Pending: 'Pendiente', Paid: 'Pagada', Cancelled: 'Cancelada' }
const STATUS_COLOR: Record<SaleStatus, { bg: string; color: string }> = {
  Pending: { bg: '#FEF3C7', color: '#92400E' },
  Paid: { bg: '#D1FAE5', color: '#065F46' },
  Cancelled: { bg: '#F3F4F6', color: '#6B7280' },
}
const CLIENT_TYPE_LABEL: Record<ClientType, string> = { Retail: 'Minorista', Wholesale: 'Mayorista' }

export default function VentasAdmin() {
  const [sales, setSales] = useState<BackendSale[]>([])
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      setSales(await api<BackendSale[]>(`/sales${qs}`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const changeStatus = async (id: number, status: SaleStatus) => {
    setError(null)
    try {
      await api(`/sales/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 32, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
            Ventas
          </h1>
          <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: 6 }}>
            {sales.length} ventas
          </p>
        </div>
        <button className="btn" style={{ fontSize: 11 }} onClick={() => setShowForm(true)}>+ Nueva venta manual</button>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'Pending', 'Paid', 'Cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '8px 14px', border: '1px solid var(--ink)', cursor: 'pointer',
              background: statusFilter === s ? 'var(--ink)' : 'white',
              color: statusFilter === s ? 'var(--bg)' : 'var(--ink)',
              fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}
          >
            {s === 'all' ? 'Todas' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px 120px 160px', padding: '12px 24px', borderBottom: '1px solid var(--line)', background: '#F8F7F4' }}>
          {['Cliente', 'Productos', 'Fecha', 'Total', 'Estado', ''].map((h) => (
            <span key={h} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>{h}</span>
          ))}
        </div>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mute)' }}>Cargando...</div>}
        {!loading && sales.map((s, i) => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px 120px 160px', padding: '14px 24px', borderBottom: i < sales.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500 }}>{s.clientName}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{CLIENT_TYPE_LABEL[s.clientType]} · {s.paymentMethod}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              {s.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{new Date(s.createdAt).toLocaleString('es-AR')}</div>
            <div className="mono" style={{ fontSize: 11 }}>$ {s.total.toLocaleString('de-DE')}</div>
            <div>
              <span style={{ ...STATUS_COLOR[s.status], padding: '4px 10px', borderRadius: 999, fontSize: 9, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {STATUS_LABEL[s.status]}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {s.status === 'Pending' && (
                <>
                  <button onClick={() => changeStatus(s.id, 'Paid')} style={linkBtn}>Marcar pagada</button>
                  <button onClick={() => changeStatus(s.id, 'Cancelled')} style={{ ...linkBtn, color: '#991B1B' }}>Cancelar</button>
                </>
              )}
              {s.status === 'Paid' && (
                <button onClick={() => changeStatus(s.id, 'Cancelled')} style={{ ...linkBtn, color: '#991B1B' }}>Cancelar</button>
              )}
            </div>
          </div>
        ))}
        {!loading && sales.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'var(--font-edit)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 18 }}>
            Sin ventas.
          </div>
        )}
      </div>

      {showForm && <NewSaleModal onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function NewSaleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientType, setClientType] = useState<ClientType>('Retail')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer')
  const [status, setStatus] = useState<'Pending' | 'Paid'>('Pending')
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<BackendProduct[]>('/products').then(setProducts).catch((e) => setError((e as Error).message))
  }, [])

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
      await api('/sales', {
        method: 'POST',
        body: JSON.stringify({
          clientName, clientContact: clientContact || null, clientType, paymentMethod, status,
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        }),
      })
      onCreated()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 20 }}>
      <form onSubmit={onSubmit} style={{ background: 'white', width: 560, maxHeight: '90vh', overflowY: 'auto', padding: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 20px' }}>Nueva venta manual</h2>

        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Cliente"><input value={clientName} onChange={(e) => setClientName(e.target.value)} required style={inputStyle} /></Field>
          <Field label="Contacto (tel/email, opcional)"><input value={clientContact} onChange={(e) => setClientContact(e.target.value)} style={inputStyle} /></Field>
          <Field label="Tipo de cliente">
            <select value={clientType} onChange={(e) => setClientType(e.target.value as ClientType)} style={inputStyle}>
              <option value="Retail">Minorista</option>
              <option value="Wholesale">Mayorista</option>
            </select>
          </Field>
          <Field label="Medio de pago">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} style={inputStyle}>
              <option value="Transfer">Transferencia</option>
              <option value="Cash">Efectivo</option>
              <option value="Other">Otro</option>
            </select>
          </Field>
          <Field label="Estado inicial">
            <select value={status} onChange={(e) => setStatus(e.target.value as 'Pending' | 'Paid')} style={inputStyle}>
              <option value="Pending">Pendiente</option>
              <option value="Paid">Pagada</option>
            </select>
          </Field>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Productos</span>
            <button type="button" onClick={addItem} style={smallBtnStyle}>+ Agregar</button>
          </div>
          {items.map((it, i) => {
            const product = products.find((p) => p.id === it.productId)
            return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <select value={it.productId} onChange={(e) => updateItem(i, { productId: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                </select>
                <input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} style={{ ...inputStyle, width: 70 }} />
                <span className="mono" style={{ fontSize: 11, width: 90, textAlign: 'right' }}>
                  {product ? `$ ${(product.price * it.quantity).toLocaleString('de-DE')}` : ''}
                </span>
                <button type="button" onClick={() => removeItem(i)} style={smallBtnStyle}>✕</button>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          <span className="mono">Total estimado</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 500 }}>$ {estimatedTotal.toLocaleString('de-DE')}</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn" type="submit" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? 'Guardando...' : 'Registrar venta'}
          </button>
          <button className="btn ghost" type="button" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-mute)', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--line)', fontSize: 13, fontFamily: 'var(--font-ui)', width: '100%' }
const smallBtnStyle: React.CSSProperties = { padding: '4px 10px', border: '1px solid var(--line)', background: 'white', cursor: 'pointer', fontSize: 11 }
const linkBtn: React.CSSProperties = {
  background: 'none', border: 0, cursor: 'pointer', fontFamily: 'ui-monospace, monospace',
  fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', padding: 0,
}
