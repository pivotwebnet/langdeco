'use client'

import { useState } from 'react'
import type { BackendBudget, BackendProduct, BackendSale, BackendCustomer } from '@/lib/backend-types'
import { useEscapeKey } from '@/lib/useEscapeKey'

type ReceiptKind = 'sale' | 'budget'
type ReceiptRecord = BackendSale | BackendBudget

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/backend${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

function formatMoney(value: number) {
  return `$ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR')
}

interface ReceiptViewProps {
  kind: ReceiptKind
  record: ReceiptRecord
  products: BackendProduct[]
  onClose: () => void
  onUpdated: (record: ReceiptRecord) => void
}

export function ReceiptView({ kind, record, products, onClose, onUpdated }: ReceiptViewProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const basePath = kind === 'sale' ? '/sales' : '/budgets'
  const title = kind === 'sale' ? 'VENTA' : 'PRESUPUESTO'
  const validUntil = kind === 'budget' ? (record as BackendBudget).validUntil : null
  const isEditable = kind === 'sale' ? record.status === 'Pending' : record.status === 'Open'

  const [customer, setCustomer] = useState<BackendCustomer>(record.customer)
  const [discountPercent, setDiscountPercent] = useState(record.discountPercent)
  const [taxRatePercent, setTaxRatePercent] = useState(record.taxRatePercent)
  const [validUntilInput, setValidUntilInput] = useState(validUntil ? validUntil.slice(0, 10) : '')
  const [items, setItems] = useState(record.items.map((it) => ({ productId: it.productId, quantity: it.quantity })))

  const pdfUrl = `/api/admin/backend${basePath}/${record.id}/pdf`

  const previewSubtotal = items.reduce((sum, it) => {
    const product = products.find((p) => p.id === it.productId)
    return sum + (product?.price || 0) * it.quantity
  }, 0)
  const previewDiscount = Math.round(previewSubtotal * discountPercent) / 100
  const previewNet = previewSubtotal - previewDiscount
  const previewTax = Math.round(previewNet * taxRatePercent) / 100
  const previewTotal = previewNet + previewTax

  const addItem = () => setItems([...items, { productId: products[0]?.id || '', quantity: 1 }])
  const updateItem = (i: number, patch: Partial<{ productId: string; quantity: number }>) => {
    const next = [...items]
    next[i] = { ...next[i], ...patch }
    setItems(next)
  }
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const save = async () => {
    setError(null)
    if (!customer.name.trim()) { setError('El nombre del cliente es obligatorio'); return }
    if (items.length === 0) { setError('Agregá al menos un producto'); return }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        customer: { name: customer.name, contact: customer.contact || null, taxId: customer.taxId || null, address: customer.address || null },
        discountPercent, taxRatePercent,
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
      }
      if (kind === 'budget') body.validUntil = validUntilInput ? new Date(validUntilInput).toISOString() : null

      const updated = await api<ReceiptRecord>(`${basePath}/${record.id}`, { method: 'PUT', body: JSON.stringify(body) })
      onUpdated(updated)
      setEditing(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setCustomer(record.customer)
    setItems(record.items.map((it) => ({ productId: it.productId, quantity: it.quantity })))
    setDiscountPercent(record.discountPercent)
    setTaxRatePercent(record.taxRatePercent)
  }

  useEscapeKey(() => (editing ? cancelEdit() : onClose()))

  const handleImprimir = () => {
    const win = window.open(pdfUrl, '_blank')
    if (win) {
      win.addEventListener('load', () => win.print())
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'white', width: 780, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{title} {record.number}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {!editing ? (
              <>
                <button style={actionBtn} onClick={handleImprimir}>Imprimir</button>
                <a style={{ ...actionBtn, textDecoration: 'none', display: 'inline-block' }} href={pdfUrl} download={`${kind === 'sale' ? 'venta' : 'presupuesto'}-${record.number}.pdf`}>Exportar</a>
                {isEditable && <button style={actionBtn} onClick={() => setEditing(true)}>Editar</button>}
                <button style={{ ...actionBtn, borderColor: '#991B1B', color: '#991B1B' }} onClick={onClose}>Cerrar</button>
              </>
            ) : (
              <>
                <button style={{ ...actionBtn, background: 'var(--ink)', color: 'var(--bg)' }} onClick={save} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button style={actionBtn} onClick={cancelEdit}>Cancelar</button>
              </>
            )}
          </div>
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 28px', fontSize: 13 }}>{error}</div>}

        {/* Document */}
        <div style={{ padding: 32, fontFamily: 'var(--font-ui)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ width: 72, height: 72, border: '1.5px solid #444', display: 'grid', placeItems: 'center', textAlign: 'center', fontSize: 11, fontWeight: 600, padding: 4 }}>
                LaLang Deco
              </div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Tel: -</div>
            </div>
            <div style={{ width: 60, height: 50, border: '1.5px solid black', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700 }}>X</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{title} {record.number}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}><b>Fecha:</b> {formatDate(record.createdAt)}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #ccc', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ flex: 1, fontSize: 12, lineHeight: 1.7 }}>
              {editing ? (
                <>
                  <div><b>Cliente:</b> <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} style={inlineInput} /></div>
                  <div><b>CUIT:</b> <input value={customer.taxId || ''} onChange={(e) => setCustomer({ ...customer, taxId: e.target.value })} style={inlineInput} /></div>
                  <div><b>Domicilio:</b> <input value={customer.address || ''} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} style={inlineInput} /></div>
                  <div><b>Contacto:</b> <input value={customer.contact || ''} onChange={(e) => setCustomer({ ...customer, contact: e.target.value })} style={inlineInput} /></div>
                </>
              ) : (
                <>
                  <div><b>Cliente:</b> {record.customer.name}</div>
                  <div><b>CUIT:</b> {record.customer.taxId || '-'}</div>
                  <div><b>Domicilio:</b> {record.customer.address || '-'}</div>
                </>
              )}
            </div>
            {kind === 'budget' && (
              <div style={{ textAlign: 'right', fontSize: 12 }}>
                <div><b>Fecha Vto. del Presupuesto:</b></div>
                {editing ? (
                  <input type="date" value={validUntilInput} onChange={(e) => setValidUntilInput(e.target.value)} style={inlineInput} />
                ) : (
                  <div>{validUntil ? formatDate(validUntil) : '-'}</div>
                )}
              </div>
            )}
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>CONCEPTOS</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#334155', color: 'white' }}>
                <th style={th}>Código</th>
                <th style={th}>Descripción</th>
                <th style={{ ...th, textAlign: 'right' }}>Cant.</th>
                <th style={{ ...th, textAlign: 'right' }}>Precio Unitario</th>
                <th style={{ ...th, textAlign: 'right' }}>Subtotal</th>
                {editing && <th style={th}></th>}
              </tr>
            </thead>
            <tbody>
              {(editing ? items : record.items).map((it, i) => {
                const product = editing ? products.find((p) => p.id === it.productId) : null
                const name = editing ? (product?.name || '') : record.items[i]?.productName ?? ''
                const unitPrice = editing ? (product?.price || 0) : record.items[i]?.unitPrice ?? 0
                const qty = it.quantity
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={td}>
                      {editing ? (
                        <select value={it.productId} onChange={(e) => updateItem(i, { productId: e.target.value })} style={inlineInput}>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
                        </select>
                      ) : it.productId}
                    </td>
                    <td style={td}>{name}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {editing ? <input type="number" min={1} value={qty} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} style={{ ...inlineInput, width: 60, textAlign: 'right' }} /> : qty}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>{formatMoney(unitPrice)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{formatMoney(unitPrice * qty)}</td>
                    {editing && <td style={td}><button type="button" onClick={() => removeItem(i)} style={smallBtn}>✕</button></td>}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {editing && (
            <button type="button" onClick={addItem} style={{ ...smallBtn, marginTop: 8 }}>+ Agregar producto</button>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <div style={{ width: 300 }}>
              {editing && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, marginBottom: 8 }}>
                  <label style={{ flex: 1 }}>Bonif. % <input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} style={{ ...inlineInput, width: '100%' }} /></label>
                  <label style={{ flex: 1 }}>IVA % <input type="number" min={0} max={100} value={taxRatePercent} onChange={(e) => setTaxRatePercent(Number(e.target.value))} style={{ ...inlineInput, width: '100%' }} /></label>
                </div>
              )}
              <div style={{ background: '#334155', color: 'white', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{(editing ? taxRatePercent : record.taxRatePercent) === 0 ? 'Importe Neto Exento' : 'Importe Neto'}</span>
                <span>{formatMoney(editing ? previewNet : (record.subtotal - record.discountAmount))}</span>
              </div>
              {(editing ? previewDiscount : record.discountAmount) > 0 && (
                <div style={{ background: '#475569', color: 'white', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>Descuento</span>
                  <span>-{formatMoney(editing ? previewDiscount : record.discountAmount)}</span>
                </div>
              )}
              {(editing ? previewTax : record.taxAmount) > 0 && (
                <div style={{ background: '#475569', color: 'white', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>IVA</span>
                  <span>{formatMoney(editing ? previewTax : record.taxAmount)}</span>
                </div>
              )}
              <div style={{ background: '#1e293b', color: 'white', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                <span>Total {title === 'VENTA' ? 'Venta' : 'Presupuesto'}</span>
                <span>{formatMoney(editing ? previewTotal : record.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }
const td: React.CSSProperties = { padding: '8px 10px' }
const actionBtn: React.CSSProperties = { padding: '7px 14px', border: '1px solid var(--ink)', background: 'white', cursor: 'pointer', fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }
const smallBtn: React.CSSProperties = { padding: '4px 10px', border: '1px solid var(--line)', background: 'white', cursor: 'pointer', fontSize: 11 }
const inlineInput: React.CSSProperties = { border: '1px solid var(--line)', padding: '3px 6px', fontSize: 12, fontFamily: 'var(--font-ui)' }
