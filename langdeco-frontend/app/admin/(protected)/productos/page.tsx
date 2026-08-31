'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { BackendCategory, BackendProduct } from '@/lib/backend-types'
import { useAdminToast } from '@/components/admin/AdminToast'
import { adminApi as api } from '@/lib/admin/api'
import { Field } from '@/components/admin/Field'
import { formatPrice } from '@/lib/data'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { TableSkeletonRows } from '@/components/admin/TableSkeleton'
import { BulkActionBar } from '@/components/admin/BulkActionBar'
import { PercentAdjustDialog } from '@/components/admin/PercentAdjustDialog'

type ProductForm = {
  id: string
  name: string
  categoryId: string
  material: string
  roomTags: string[]
  price: string
  cardPrice: string
  originalPrice: string
  wholesalePrice: string
  stock: string
  installments: string
  note: string
  featured: boolean
  specs: { label: string; value: string }[]
  images: string[]
  cutoutImageUrl: string
}

// Mismo umbral que usa el badge público "¡Últimas N!" en ProductCard.tsx.
const LOW_STOCK_THRESHOLD = 3

const EMPTY_FORM: ProductForm = {
  id: '', name: '', categoryId: '', material: '', roomTags: [],
  price: '', cardPrice: '', originalPrice: '', wholesalePrice: '', stock: '0', installments: '', note: '', featured: false,
  specs: [], images: [], cutoutImageUrl: '',
}

const ROOM_TAG_OPTIONS = ['Living', 'Comedor', 'Dormitorio', 'Cocina', 'Baño', 'Exterior', 'Oficina', 'Entrada']
const MAX_ROOM_TAGS = 6
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/

function validateProductForm(form: ProductForm, isNew: boolean): string | null {
  if (isNew && !SLUG_REGEX.test(form.id)) {
    return 'El id debe ser un slug (minúsculas-números-guiones)'
  }
  if (form.name.length > 200) return 'El nombre no puede superar los 200 caracteres'
  if (form.material.length > 200) return 'El material no puede superar los 200 caracteres'

  const price = Number(form.price)
  if (!form.price || !(price > 0)) return 'El precio debe ser mayor a cero'

  if (form.originalPrice) {
    const originalPrice = Number(form.originalPrice)
    if (!(originalPrice > price)) return 'El precio original (tachado) debe ser mayor que el precio'
  }

  if (form.wholesalePrice) {
    const wholesalePrice = Number(form.wholesalePrice)
    if (!(wholesalePrice < price)) return 'El precio mayorista debe ser menor que el precio'
  }

  return null
}


export default function ProductosAdmin() {
  const toast = useAdminToast()
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm | null>(null)
  // Se fija una sola vez al abrir el modal (create vs edit) — si se derivara en
  // cada render comparando form.id contra la lista de productos, tipear un id
  // nuevo que coincide por casualidad con uno existente convertiría el alta en
  // una edición silenciosa de ese producto.
  const [isNewForm, setIsNewForm] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'deactivate' | null>(null)
  const [showPercentDialog, setShowPercentDialog] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prods, cats] = await Promise.all([
        api<BackendProduct[]>(`/products?includeInactive=true`),
        api<BackendCategory[]>(`/categories?includeInactive=true`),
      ])
      setProducts(prods)
      setCategories(cats)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter((p) => {
    if (!showInactive && !p.active) return false
    if (filter !== 'all' && p.categoryId !== filter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (lowStockOnly && !(p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)) return false
    return true
  })

  const lowStockCount = products.filter((p) => p.active && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id))
  const toggleSelectAll = () => {
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filtered.map((p) => p.id)))
  }

  const runBulkAction = async (path: string, successLabel: (r: { updated: number; skipped: string[] }) => string) => {
    setBulkBusy(true)
    try {
      const result = await api<{ updated: number; skipped: string[] }>(path, {
        method: 'POST',
        body: JSON.stringify({ ids: [...selectedIds] }),
      })
      toast.success(successLabel(result))
      setSelectedIds(new Set())
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBulkBusy(false)
    }
  }

  const onBulkConfirm = async () => {
    const action = bulkConfirm
    setBulkConfirm(null)
    if (action === 'activate') {
      await runBulkAction('/products/bulk-activate', (r) => `${r.updated} pieza${r.updated === 1 ? '' : 's'} activada${r.updated === 1 ? '' : 's'}.`)
    } else if (action === 'deactivate') {
      await runBulkAction('/products/bulk-deactivate', (r) => `${r.updated} pieza${r.updated === 1 ? '' : 's'} desactivada${r.updated === 1 ? '' : 's'}.`)
    }
  }

  const onBulkPriceAdjust = async (percent: number) => {
    setShowPercentDialog(false)
    setBulkBusy(true)
    try {
      const result = await api<{ updated: number; skipped: string[] }>('/products/bulk-price-adjust', {
        method: 'POST',
        body: JSON.stringify({ ids: [...selectedIds], percent }),
      })
      const skippedMsg = result.skipped.length > 0 ? ` ${result.skipped.length} sin cambios (el ajuste dejaba el precio en cero o menos).` : ''
      toast.success(`${result.updated} precio${result.updated === 1 ? '' : 's'} ajustado${result.updated === 1 ? '' : 's'}.${skippedMsg}`)
      setSelectedIds(new Set())
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBulkBusy(false)
    }
  }

  const openCreate = () => {
    setIsNewForm(true)
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' })
  }

  const openEdit = (p: BackendProduct) => {
    setIsNewForm(false)
    setForm({
      id: p.id, name: p.name, categoryId: p.categoryId, material: p.material,
      roomTags: [...p.roomTags], price: String(p.price), cardPrice: p.cardPrice ? String(p.cardPrice) : '',
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      wholesalePrice: p.wholesalePrice ? String(p.wholesalePrice) : '',
      stock: String(p.stock), installments: p.installments ? String(p.installments) : '', note: p.note || '', featured: p.featured,
      specs: p.specs.map((s) => ({ ...s })), images: [...p.images],
      cutoutImageUrl: p.cutoutImageUrl || '',
    })
  }

  const onSave = async () => {
    if (!form) return
    const validationError = validateProductForm(form, isNewForm)
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        id: form.id, name: form.name, categoryId: form.categoryId,
        material: form.material, roomTags: form.roomTags,
        price: Number(form.price), cardPrice: form.cardPrice ? Number(form.cardPrice) : null,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        wholesalePrice: form.wholesalePrice ? Number(form.wholesalePrice) : null,
        stock: Number(form.stock), installments: form.installments ? Number(form.installments) : null, note: form.note || null,
        featured: form.featured, specs: form.specs, images: form.images,
        cutoutImageUrl: form.cutoutImageUrl || null,
      }

      if (isNewForm) {
        await api(`/products`, { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Pieza creada.')
      } else {
        await api(`/products/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.success('Pieza actualizada.')
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

  const [confirmDelete, setConfirmDelete] = useState<BackendProduct | null>(null)

  const onDelete = async (p: BackendProduct) => {
    setConfirmDelete(null)
    try {
      await api(`/products/${p.id}`, { method: 'DELETE' })
      toast.success('Pieza eliminada o desactivada.')
      await load()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    }
  }

  const onActivate = async (p: BackendProduct) => {
    try {
      await api(`/products/${p.id}/activate`, { method: 'POST' })
      toast.success('Pieza reactivada.')
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
          <h1 className="adm-title">Productos</h1>
          <p className="adm-eyebrow">
            {filtered.length} piezas
            {lowStockCount > 0 && <> · <span style={{ color: '#A8432A' }}>{lowStockCount} con stock bajo</span></>}
          </p>
        </div>
        <button className="adm-btn" onClick={openCreate}>+ Añadir pieza</button>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <div className="adm-toolbar">
        <input
          className="adm-input"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedIds(new Set()) }}
          placeholder="Buscar pieza..."
          style={{ flex: 1, maxWidth: 280 }}
        />
        <select className="adm-select" value={filter} onChange={(e) => { setFilter(e.target.value); setSelectedIds(new Set()) }}>
          <option value="all">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="adm-checkbox-row">
          <input type="checkbox" checked={showInactive} onChange={(e) => { setShowInactive(e.target.checked); setSelectedIds(new Set()) }} />
          Mostrar inactivos
        </label>
        <label className="adm-checkbox-row">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setSelectedIds(new Set()) }} />
          Solo stock bajo
        </label>
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
          <button type="button" className="adm-btn ghost sm" disabled={bulkBusy} onClick={() => setBulkConfirm('activate')}>Activar</button>
          <button type="button" className="adm-btn ghost sm" disabled={bulkBusy} onClick={() => setBulkConfirm('deactivate')}>Desactivar</button>
          <button type="button" className="adm-btn sm" disabled={bulkBusy} onClick={() => setShowPercentDialog(true)}>Ajustar precio %</button>
        </BulkActionBar>
      )}

      <div className="adm-card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} aria-label="Seleccionar todo" />
              </th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <TableSkeletonRows columns={7} />
            )}
            {!loading && filtered.map((p) => (
              <tr key={p.id} className={p.active ? '' : 'inactive'}>
                <td>
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label={`Seleccionar ${p.name}`} />
                </td>
                <td>
                  <div className="adm-table-name">{p.name}{p.featured && ' ★'}</div>
                </td>
                <td>{p.categoryName}</td>
                <td className="mono">{formatPrice(p.price)}</td>
                <td className="mono">
                  {p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD ? (
                    <span className="adm-badge warn">{p.stock}</span>
                  ) : p.stock <= 0 ? (
                    <span className="adm-badge danger">0</span>
                  ) : p.stock}
                </td>
                <td><span className={`adm-badge ${p.active ? 'ok' : 'danger'}`}>{p.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-link-btn" onClick={() => openEdit(p)}>Editar</button>
                    {p.active ? (
                      <button className="adm-link-btn danger" onClick={() => setConfirmDelete(p)}>Eliminar</button>
                    ) : (
                      <button className="adm-link-btn success" onClick={() => onActivate(p)}>Reactivar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <div className="adm-empty">Sin resultados.</div>}
      </div>

      {form && (
        <ProductFormModal
          form={form}
          categories={categories}
          isNew={isNewForm}
          saving={saving}
          onChange={setForm}
          onCancel={() => setForm(null)}
          onSave={onSave}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar pieza"
          message={`¿Eliminar "${confirmDelete.name}"? Si tiene ventas o presupuestos asociados, se desactiva en vez de borrarse.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={() => onDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {bulkConfirm && (
        <ConfirmDialog
          title={bulkConfirm === 'activate' ? 'Activar piezas' : 'Desactivar piezas'}
          message={`¿${bulkConfirm === 'activate' ? 'Activar' : 'Desactivar'} ${selectedIds.size} pieza${selectedIds.size === 1 ? '' : 's'} seleccionada${selectedIds.size === 1 ? '' : 's'}?`}
          confirmLabel={bulkConfirm === 'activate' ? 'Activar' : 'Desactivar'}
          danger={bulkConfirm === 'deactivate'}
          onConfirm={onBulkConfirm}
          onCancel={() => setBulkConfirm(null)}
        />
      )}

      {showPercentDialog && (
        <PercentAdjustDialog
          count={selectedIds.size}
          onConfirm={onBulkPriceAdjust}
          onCancel={() => setShowPercentDialog(false)}
        />
      )}
    </div>
  )
}

function ProductFormModal({ form, categories, isNew, saving, onChange, onCancel, onSave }: {
  form: ProductForm
  categories: BackendCategory[]
  isNew: boolean
  saving: boolean
  onChange: (f: ProductForm) => void
  onCancel: () => void
  onSave: () => void
}) {
  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => onChange({ ...form, [key]: value })

  const addSpec = () => set('specs', [...form.specs, { label: '', value: '' }])
  const updateSpec = (i: number, field: 'label' | 'value', value: string) => {
    const specs = [...form.specs]
    specs[i] = { ...specs[i], [field]: value }
    set('specs', specs)
  }
  const removeSpec = (i: number) => set('specs', form.specs.filter((_, idx) => idx !== i))

  const addImage = () => { if (form.images.length < 6) set('images', [...form.images, '']) }
  const updateImage = (i: number, value: string) => {
    const images = [...form.images]
    images[i] = value
    set('images', images)
  }
  const removeImage = (i: number) => set('images', form.images.filter((_, idx) => idx !== i))
  const moveImage = (i: number, dir: -1 | 1) => {
    const target = i + dir
    if (target < 0 || target >= form.images.length) return
    const images = [...form.images]
    ;[images[i], images[target]] = [images[target], images[i]]
    set('images', images)
  }

  return (
    <div className="adm-modal-backdrop">
      <div className="adm-modal">
        <h2 className="adm-modal-title">{isNew ? 'Nueva pieza' : 'Editar pieza'}</h2>

        <div className="adm-grid-2" style={{ marginBottom: 12 }}>
          <Field label="Id (slug)">
            <input className="adm-input" value={form.id} onChange={(e) => set('id', e.target.value)} disabled={!isNew} placeholder="mesa-comedor" style={{ width: '100%' }} />
          </Field>
          <Field label="Categoría">
            <select className="adm-select" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} style={{ width: '100%' }}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Nombre"><input className="adm-input" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={200} style={{ width: '100%' }} /></Field>

        <div className="adm-grid-2" style={{ marginTop: 12 }}>
          <Field label="Material"><input className="adm-input" value={form.material} onChange={(e) => set('material', e.target.value)} maxLength={200} style={{ width: '100%' }} /></Field>
          <Field label="Precio"><input className="adm-input" type="number" required min="0.01" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Precio tarjeta (opcional)"><input className="adm-input" type="number" value={form.cardPrice} onChange={(e) => set('cardPrice', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Precio tachado (opcional)"><input className="adm-input" type="number" value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Precio mayorista (opcional)"><input className="adm-input" type="number" value={form.wholesalePrice} onChange={(e) => set('wholesalePrice', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Stock"><input className="adm-input" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Cuotas sin interés (opcional)"><input className="adm-input" type="number" min="0" value={form.installments} onChange={(e) => set('installments', e.target.value)} placeholder="ej. 3" style={{ width: '100%' }} /></Field>
          <Field label="Destacado">
            <label className="adm-checkbox-row" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              <span>Selección destacada</span>
            </label>
          </Field>
        </div>

        <Field label={`¿Para qué ambiente se recomienda? (opcional, hasta ${MAX_ROOM_TAGS})`}>
          <RoomTagsInput value={form.roomTags} onChange={(v) => set('roomTags', v)} />
        </Field>

        <Field label="Descripción (opcional)">
          <textarea className="adm-textarea" value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} />
        </Field>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Ficha técnica</span>
            <button type="button" className="adm-btn ghost sm" onClick={addSpec}>+ Agregar</button>
          </div>
          {form.specs.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input className="adm-input" value={s.label} onChange={(e) => updateSpec(i, 'label', e.target.value)} placeholder="Etiqueta" style={{ flex: 1 }} />
              <input className="adm-input" value={s.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} placeholder="Valor" style={{ flex: 1 }} />
              <button type="button" className="adm-btn ghost sm" onClick={() => removeSpec(i)}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Fotos (hasta 6 — la primera es la portada)</span>
            <button type="button" className="adm-btn ghost sm" onClick={addImage} disabled={form.images.length >= 6}>+ Agregar</button>
          </div>
          {form.images.map((url, i) => (
            <ImageSlot
              key={i}
              url={url}
              isCover={i === 0}
              canMoveUp={i > 0}
              canMoveDown={i < form.images.length - 1}
              onChange={(v) => updateImage(i, v)}
              onRemove={() => removeImage(i)}
              onMoveUp={() => moveImage(i, -1)}
              onMoveDown={() => moveImage(i, 1)}
            />
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <span className="mono">Imagen PNG (sin fondo — usada en el Visualizador)</span>
          </div>
          <CutoutImageSlot url={form.cutoutImageUrl} onChange={(v) => set('cutoutImageUrl', v)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="adm-btn" onClick={onSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="adm-btn ghost" onClick={onCancel} style={{ flex: 1 }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function ImageSlot({ url, isCover, canMoveUp, canMoveDown, onChange, onRemove, onMoveUp, onMoveDown }: {
  url: string
  isCover: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onChange: (url: string) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const toast = useAdminToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onPickFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'productos')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al subir la imagen')
      onChange(data.url)
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        <button type="button" className="adm-btn ghost sm" onClick={onMoveUp} disabled={!canMoveUp} title="Subir" style={{ padding: '2px 6px', lineHeight: 1 }}>▲</button>
        <button type="button" className="adm-btn ghost sm" onClick={onMoveDown} disabled={!canMoveDown} title="Bajar" style={{ padding: '2px 6px', lineHeight: 1 }}>▼</button>
      </div>
      <div style={{ width: 40, height: 40, flexShrink: 0, background: 'var(--adm-surface-2)', overflow: 'hidden', position: 'relative' }}>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      {isCover && <span className="adm-badge ok" style={{ flexShrink: 0 }}>Portada</span>}
      <span className="mono" style={{ flex: 1, fontSize: 11, color: url ? 'var(--ink-soft)' : 'var(--danger, #c0392b)' }}>
        {url ? 'Imagen cargada' : 'Sin imagen — subí un archivo'}
      </span>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = '' }}
      />
      <button type="button" className="adm-btn ghost sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? 'Subiendo...' : url ? 'Reemplazar' : 'Subir'}
      </button>
      <button type="button" className="adm-btn ghost sm" onClick={onRemove}>✕</button>
      {error && <span style={{ color: 'var(--danger, #c0392b)', fontSize: 11 }}>{error}</span>}
    </div>
  )
}

function CutoutImageSlot({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const toast = useAdminToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onPickFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'productos-cutout')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al subir la imagen')
      onChange(data.url)
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ width: 40, height: 40, flexShrink: 0, background: 'var(--adm-surface-2)', overflow: 'hidden', position: 'relative' }}>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <span className="mono" style={{ flex: 1, fontSize: 11, color: url ? 'var(--ink-soft)' : 'var(--danger, #c0392b)' }}>
        {url ? 'Imagen PNG cargada' : 'Sin imagen PNG — el producto no aparece en el Visualizador'}
      </span>
      <input
        ref={fileRef}
        type="file"
        accept="image/png"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = '' }}
      />
      <button type="button" className="adm-btn ghost sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? 'Subiendo...' : url ? 'Reemplazar' : 'Subir'}
      </button>
      {url && <button type="button" className="adm-btn ghost sm" onClick={() => onChange('')}>✕</button>}
      {error && <span style={{ color: 'var(--danger, #c0392b)', fontSize: 11 }}>{error}</span>}
    </div>
  )
}

function RoomTagsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState('')
  const atLimit = value.length >= MAX_ROOM_TAGS

  const toggle = (tag: string) => {
    if (!value.includes(tag) && atLimit) return
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag])
  }

  const addCustom = () => {
    if (atLimit) return
    const tag = custom.trim()
    if (!tag || value.some((t) => t.toLowerCase() === tag.toLowerCase())) return
    onChange([...value, tag])
    setCustom('')
  }

  const customTags = value.filter((t) => !ROOM_TAG_OPTIONS.includes(t))

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {ROOM_TAG_OPTIONS.map((tag) => {
          const active = value.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              className="adm-btn ghost sm"
              onClick={() => toggle(tag)}
              disabled={!active && atLimit}
              style={active ? { background: 'var(--ink)', color: 'var(--adm-bg)' } : undefined}
            >
              {active ? '✓ ' : '+ '}{tag}
            </button>
          )
        })}
      </div>

      {customTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {customTags.map((tag) => (
            <span key={tag} className="adm-btn ghost sm" style={{ background: 'var(--ink)', color: 'var(--adm-bg)' }}>
              {tag}
              <button type="button" onClick={() => toggle(tag)} style={{ marginLeft: 6, background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }}>✕</button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="adm-input"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          placeholder={atLimit ? `Máximo ${MAX_ROOM_TAGS} ambientes` : 'Otro ambiente (para esta pieza)'}
          disabled={atLimit}
          style={{ flex: 1 }}
        />
        <button type="button" className="adm-btn ghost sm" onClick={addCustom} disabled={atLimit}>+ Agregar</button>
      </div>
      {atLimit && <p style={{ fontSize: 12, color: 'var(--ink-soft, #6d6858)', margin: '6px 0 0' }}>Máximo {MAX_ROOM_TAGS} ambientes por producto.</p>}
    </div>
  )
}

