'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendGasto, BackendSupplier, GastoCategory, PaymentMethod } from '@/lib/backend-types'
import { useEscapeKey } from '@/lib/useEscapeKey'
import { useAdminToast } from '@/components/admin/AdminToast'
import { adminApi as api } from '@/lib/admin/api'
import { Field } from '@/components/admin/Field'
import { PriceInput } from '@/components/admin/PriceInput'
import { formatPrice } from '@/lib/data'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { TableSkeletonRows } from '@/components/admin/TableSkeleton'

const CATEGORY_LABEL: Record<GastoCategory, string> = {
  Alquiler: 'Alquiler', Servicios: 'Servicios', Sueldos: 'Sueldos', Impuestos: 'Impuestos',
  Mantenimiento: 'Mantenimiento', Insumos: 'Insumos', Otro: 'Otro',
}
const CATEGORIES = Object.keys(CATEGORY_LABEL) as GastoCategory[]

type GastoForm = {
  id: number | null
  date: string
  category: GastoCategory
  description: string
  amount: string
  paymentMethod: PaymentMethod
  supplierId: string
}

const EMPTY_FORM: GastoForm = {
  id: null,
  date: new Date().toISOString().slice(0, 10),
  category: 'Otro',
  description: '',
  amount: '',
  paymentMethod: 'Transfer',
  supplierId: '',
}

export default function GastosAdmin() {
  const toast = useAdminToast()
  const [gastos, setGastos] = useState<BackendGasto[]>([])
  const [suppliers, setSuppliers] = useState<BackendSupplier[]>([])
  const [categoryFilter, setCategoryFilter] = useState<GastoCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<GastoForm | null>(null)
  const [saving, setSaving] = useState(false)

  useEscapeKey(() => setForm(null))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = categoryFilter !== 'all' ? `?category=${categoryFilter}` : ''
      setGastos(await api<BackendGasto[]>(`/gastos${qs}`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { api<BackendSupplier[]>('/suppliers').then(setSuppliers).catch(() => {}) }, [])

  const openCreate = () => setForm({ ...EMPTY_FORM })

  const openEdit = (g: BackendGasto) => setForm({
    id: g.id, date: g.date.slice(0, 10), category: g.category, description: g.description,
    amount: String(g.amount), paymentMethod: g.paymentMethod, supplierId: g.supplierId ? String(g.supplierId) : '',
  })

  const onSave = async () => {
    if (!form) return
    if (!form.description.trim()) {
      setError('La descripción es obligatoria')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('El monto debe ser mayor a cero')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        date: new Date(form.date).toISOString(),
        category: form.category,
        description: form.description.trim(),
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        supplierId: form.supplierId ? Number(form.supplierId) : null,
      }

      if (form.id) {
        await api(`/gastos/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.success('Gasto actualizado.')
      } else {
        await api(`/gastos`, { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Gasto creado.')
      }

      setForm(null)
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const [confirmDelete, setConfirmDelete] = useState<BackendGasto | null>(null)

  const onDelete = async (g: BackendGasto) => {
    setConfirmDelete(null)
    try {
      await api(`/gastos/${g.id}`, { method: 'DELETE' })
      toast.success('Gasto eliminado.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  const total = gastos.reduce((sum, g) => sum + g.amount, 0)

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Gastos</h1>
          <p className="adm-eyebrow">{gastos.length} gastos · {formatPrice(total)}</p>
        </div>
        <button className="adm-btn" onClick={openCreate}>+ Nuevo gasto</button>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <div className="adm-toolbar">
        <button onClick={() => setCategoryFilter('all')} className={`adm-btn sm ${categoryFilter === 'all' ? '' : 'ghost'}`}>Todas</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={`adm-btn sm ${categoryFilter === c ? '' : 'ghost'}`}>
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="adm-card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Proveedor</th>
              <th>Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <TableSkeletonRows columns={7} />
            )}
            {!loading && gastos.map((g) => (
              <tr key={g.id}>
                <td className="mono">#{g.number}</td>
                <td className="mono">{new Date(g.date).toLocaleDateString('es-AR')}</td>
                <td><span className="adm-badge">{CATEGORY_LABEL[g.category]}</span></td>
                <td>{g.description}</td>
                <td>{g.supplierName || <span style={{ color: 'var(--ink-soft)' }}>—</span>}</td>
                <td className="mono">{formatPrice(g.amount)}</td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-link-btn" onClick={() => openEdit(g)}>Editar</button>
                    <button className="adm-link-btn danger" onClick={() => setConfirmDelete(g)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && gastos.length === 0 && <div className="adm-empty">Sin gastos.</div>}
      </div>

      {form && (
        <div className="adm-modal-backdrop">
          <div className="adm-modal">
            <h2 className="adm-modal-title">{form.id ? 'Editar gasto' : 'Nuevo gasto'}</h2>

            <div className="adm-grid-2" style={{ marginTop: 12 }}>
              <Field label="Fecha">
                <input className="adm-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} />
              </Field>
              <Field label="Categoría">
                <select className="adm-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as GastoCategory })} style={{ width: '100%' }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
              </Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Descripción">
                  <input className="adm-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%' }} />
                </Field>
              </div>
              <Field label="Monto">
                <PriceInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="0" style={{ width: '100%' }} />
              </Field>
              <Field label="Medio de pago">
                <select className="adm-select" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })} style={{ width: '100%' }}>
                  <option value="Transfer">Transferencia</option>
                  <option value="Cash">Efectivo</option>
                  <option value="Other">Otro</option>
                </select>
              </Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Proveedor (opcional)">
                  <select className="adm-select" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} style={{ width: '100%' }}>
                    <option value="">— Sin proveedor —</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.companyOrFullName}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="adm-btn" onClick={onSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="adm-btn ghost" onClick={() => setForm(null)} style={{ flex: 1 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar gasto"
          message={`¿Eliminar el gasto #${confirmDelete.number} (${confirmDelete.description})?`}
          confirmLabel="Eliminar"
          danger
          onConfirm={() => onDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
