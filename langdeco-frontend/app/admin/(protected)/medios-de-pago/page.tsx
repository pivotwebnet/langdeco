'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendPaymentMethodOption } from '@/lib/backend-types'
import { useAdminToast } from '@/components/admin/AdminToast'
import { adminApi as api } from '@/lib/admin/api'
import { TableSkeletonRows } from '@/components/admin/TableSkeleton'

export default function MediosDePagoAdmin() {
  const toast = useAdminToast()
  const [options, setOptions] = useState<BackendPaymentMethodOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOptions(await api<BackendPaymentMethodOption[]>('/payment-method-options?includeInactive=true'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await api('/payment-method-options', { method: 'POST', body: JSON.stringify({ name: newName, active: true }) })
      setNewName('')
      toast.success('Medio de pago creado.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (o: BackendPaymentMethodOption) => { setEditingId(o.id); setEditingName(o.name) }

  const onSaveEdit = async () => {
    if (!editingId) return
    setError(null)
    setSaving(true)
    try {
      const current = options.find((o) => o.id === editingId)
      await api(`/payment-method-options/${editingId}`, {
        method: 'PUT', body: JSON.stringify({ name: editingName, active: current?.active ?? true }),
      })
      setEditingId(null)
      toast.success('Medio de pago actualizado.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const onToggleActive = async (o: BackendPaymentMethodOption) => {
    setError(null)
    try {
      await api(`/payment-method-options/${o.id}/${o.active ? 'deactivate' : 'activate'}`, { method: 'POST' })
      toast.success(o.active ? 'Medio de pago desactivado.' : 'Medio de pago reactivado.')
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
          <h1 className="adm-title">Medios de pago</h1>
          <p className="adm-eyebrow">{options.length} medios de pago — se usan en la Cobranza de ventas</p>
        </div>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <form onSubmit={onCreate} className="adm-toolbar">
        <input className="adm-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre (ej. Banco Macro)" required style={{ flex: 1, maxWidth: 320 }} />
        <button className="adm-btn" type="submit" disabled={saving}>{saving ? 'Guardando…' : '+ Añadir medio de pago'}</button>
      </form>

      <div className="adm-card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <TableSkeletonRows columns={3} />
            )}
            {!loading && options.map((o) => (
              <tr key={o.id} className={o.active ? '' : 'inactive'}>
                <td>
                  {editingId === o.id ? (
                    <input className="adm-input" value={editingName} onChange={(e) => setEditingName(e.target.value)} style={{ width: '100%' }} />
                  ) : (
                    <span className="adm-table-name">{o.name}</span>
                  )}
                </td>
                <td><span className={`adm-badge ${o.active ? 'ok' : 'danger'}`}>{o.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div className="adm-table-actions">
                    {editingId === o.id ? (
                      <>
                        <button className="adm-link-btn" onClick={onSaveEdit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
                        <button className="adm-link-btn" onClick={() => setEditingId(null)} disabled={saving}>Cancelar</button>
                      </>
                    ) : (
                      <button className="adm-link-btn" onClick={() => startEdit(o)}>Editar</button>
                    )}
                    <button className={`adm-link-btn ${o.active ? 'danger' : 'success'}`} onClick={() => onToggleActive(o)}>
                      {o.active ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && options.length === 0 && <div className="adm-empty">Sin medios de pago.</div>}
      </div>
    </div>
  )
}
