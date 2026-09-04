'use client'

import { useEffect, useState } from 'react'
import type { BackendCategory, BackendProduct } from '@/lib/backend-types'
import { adminApi as api } from '@/lib/admin/api'
import { useAdminToast } from '@/components/admin/AdminToast'
import { formatPrice } from '@/lib/data'

// Categoría placeholder asignada por la importación de Excel (ver
// ProductsController.PendingCategoryId en el backend) — los productos que caen acá
// esperan a que un humano les asigne la categoría real, uno por uno.
export const PENDING_CATEGORY_ID = 'sin-categoria'

export function CategoryAssignWizard({ categories, onClose, onDone }: {
  categories: BackendCategory[]
  onClose: () => void
  onDone: () => void
}) {
  const toast = useAdminToast()
  const [list, setList] = useState<BackendProduct[] | null>(null)
  const [index, setIndex] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    api<BackendProduct[]>(`/products?includeInactive=true&category=${PENDING_CATEGORY_ID}`)
      .then(setList)
      .catch((e) => setError((e as Error).message))
  }, [])

  const assignableCategories = categories.filter((c) => c.active && c.id !== PENDING_CATEGORY_ID)
  const current = list?.[index]

  const close = () => {
    if (touched) onDone()
    onClose()
  }

  const onSaveAndNext = async () => {
    if (!current || !categoryId) return
    setSaving(true)
    setError(null)
    try {
      await api(`/products/${current.id}/category`, { method: 'POST', body: JSON.stringify({ categoryId }) })
      setTouched(true)
      setIndex((i) => i + 1)
      setCategoryId('')
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const onSkip = () => {
    setIndex((i) => i + 1)
    setCategoryId('')
  }

  return (
    <div className="adm-modal-backdrop">
      <div className="adm-modal" style={{ maxWidth: 480 }}>
        <h2 className="adm-modal-title">Asignar categorías</h2>

        {error && <div className="adm-alert error">{error}</div>}

        {list === null && <p className="adm-eyebrow">Cargando productos pendientes...</p>}

        {list !== null && current && (
          <>
            <p className="adm-eyebrow">Producto {index + 1} de {list.length}</p>
            <div className="adm-card" style={{ padding: 16, marginBottom: 16 }}>
              <div className="adm-table-name" style={{ marginBottom: 4 }}>{current.name}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                {formatPrice(current.price)} · {current.supplierName || 'Sin proveedor'}
              </div>
            </div>

            <label className="adm-field-label" style={{ display: 'block', marginBottom: 6 }}>Categoría</label>
            <select className="adm-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%', marginBottom: 16 }}>
              <option value="">Elegir categoría...</option>
              {assignableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="adm-btn" onClick={onSaveAndNext} disabled={saving || !categoryId} style={{ flex: 1 }}>
                {saving ? 'Guardando...' : 'Guardar y siguiente'}
              </button>
              <button className="adm-btn ghost" onClick={onSkip} disabled={saving}>Omitir por ahora</button>
            </div>
            <button className="adm-link-btn" onClick={close} style={{ marginTop: 16 }}>Cerrar</button>
          </>
        )}

        {list !== null && !current && (
          <>
            <p>Ya categorizaste todos los productos pendientes.</p>
            <button className="adm-btn" onClick={close} style={{ marginTop: 16, width: '100%' }}>Cerrar</button>
          </>
        )}
      </div>
    </div>
  )
}
