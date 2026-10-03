'use client'

import { useEffect, useState } from 'react'
import type { BackendPaymentMethodOption, BackendSale } from '@/lib/backend-types'
import { useEscapeKey, backdropClose } from '@/lib/useEscapeKey'
import { useAdminToast } from '@/components/admin/AdminToast'
import { adminApi as api } from '@/lib/admin/api'
import { formatPrice } from '@/lib/data'

interface CobranzaModalProps {
  sale: BackendSale
  onClose: () => void
  onUpdated: (sale: BackendSale) => void
}

export function CobranzaModal({ sale, onClose, onUpdated }: CobranzaModalProps) {
  const toast = useAdminToast()
  const [methods, setMethods] = useState<BackendPaymentMethodOption[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<number | ''>('')
  const [amount, setAmount] = useState(String(sale.amountDue))
  const [addingMethod, setAddingMethod] = useState(false)
  const [newMethodName, setNewMethodName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEscapeKey(onClose)

  useEffect(() => {
    api<BackendPaymentMethodOption[]>('/payment-method-options').then(setMethods).catch(() => {})
  }, [])

  const onAddMethod = async () => {
    const name = newMethodName.trim()
    if (!name) return
    try {
      const created = await api<BackendPaymentMethodOption>('/payment-method-options', {
        method: 'POST', body: JSON.stringify({ name, active: true }),
      })
      setMethods((prev) => [...prev, created])
      setSelectedMethodId(created.id)
      setNewMethodName('')
      setAddingMethod(false)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const onAddPayment = async () => {
    setError(null)
    const value = Number(amount)
    if (!selectedMethodId) {
      setError('Elegí un medio de pago')
      return
    }
    if (!value || value <= 0) {
      setError('El monto a cobrar debe ser mayor a cero')
      return
    }
    if (value > sale.amountDue) {
      setError(`El monto supera el saldo pendiente (${formatPrice(sale.amountDue)})`)
      return
    }

    setSaving(true)
    try {
      const updated = await api<BackendSale>(`/sales/${sale.id}/payments`, {
        method: 'POST', body: JSON.stringify({ amount: value, paymentMethodOptionId: selectedMethodId }),
      })
      toast.success(`Cobro de ${formatPrice(value)} registrado.`)
      onUpdated(updated)
      setAmount(String(updated.amountDue))
      setSelectedMethodId('')
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const onDeletePayment = async (paymentId: number) => {
    setDeletingId(paymentId)
    try {
      const updated = await api<BackendSale>(`/sales/${sale.id}/payments/${paymentId}`, { method: 'DELETE' })
      toast.success('Cobro eliminado.')
      onUpdated(updated)
      setAmount(String(updated.amountDue))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="adm-modal-backdrop" {...backdropClose(onClose)} style={{ zIndex: 105 }}>
      <div className="adm-modal" style={{ width: 460, maxWidth: '92vw' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-modal-title">Cobranza — venta #{sale.number}</h2>

        {error && <div className="adm-alert error">{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="adm-table-sub">Total Venta</span>
            <span className="mono" style={{ fontSize: 15 }}>{formatPrice(sale.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="adm-table-sub">A Cobrar</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: sale.amountDue > 0 ? 'var(--adm-danger, #c0392b)' : undefined }}>
              {formatPrice(sale.amountDue)}
            </span>
          </div>
        </div>

        {sale.status === 'Cancelled' && (
          <p className="adm-table-sub" style={{ marginTop: 12 }}>Venta cancelada — no se pueden registrar ni modificar cobros.</p>
        )}

        {sale.amountDue > 0 && sale.status !== 'Cancelled' && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--adm-border)' }}>
            <label className="adm-table-sub" style={{ display: 'block', marginBottom: 6 }}>Monto a cobrar ahora</label>
            <input
              className="adm-input" type="number" min={0} step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', marginBottom: 12 }}
            />

            <label className="adm-table-sub" style={{ display: 'block', marginBottom: 6 }}>Medio de pago</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="adm-btn ghost sm"
                  onClick={() => setSelectedMethodId(m.id)}
                  style={selectedMethodId === m.id ? { background: 'var(--ink)', color: 'var(--adm-bg)' } : undefined}
                >
                  {selectedMethodId === m.id ? '✓ ' : ''}{m.name}
                </button>
              ))}
              {!addingMethod && (
                <button type="button" className="adm-btn ghost sm" onClick={() => setAddingMethod(true)}>+ Agregar</button>
              )}
            </div>

            {addingMethod && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  className="adm-input" autoFocus value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)}
                  placeholder="Nombre del medio de pago" style={{ flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddMethod() } }}
                />
                <button type="button" className="adm-btn ghost sm" onClick={onAddMethod}>Guardar</button>
                <button type="button" className="adm-btn ghost sm" onClick={() => { setAddingMethod(false); setNewMethodName('') }}>✕</button>
              </div>
            )}

            <button className="adm-btn" onClick={onAddPayment} disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Registrando...' : 'Registrar cobro'}
            </button>
          </div>
        )}

        {sale.payments.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--adm-border)' }}>
            <span className="adm-table-sub" style={{ display: 'block', marginBottom: 8 }}>Cobros registrados</span>
            {sale.payments.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>{p.paymentMethodOptionName}</div>
                  <div className="adm-table-sub">{new Date(p.paidAt).toLocaleString('es-AR')}</div>
                </div>
                <span className="mono" style={{ fontSize: 13 }}>{formatPrice(p.amount)}</span>
                {sale.status !== 'Cancelled' && (
                  <button
                    type="button" className="adm-btn ghost sm" disabled={deletingId === p.id}
                    onClick={() => onDeletePayment(p.id)}
                  >
                    {deletingId === p.id ? '...' : '✕'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button className="adm-btn ghost" onClick={onClose} style={{ width: '100%', marginTop: 16 }}>Cerrar</button>
      </div>
    </div>
  )
}
