'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { BackendCategory, BackendProduct } from '@/lib/backend-types'
import { useAdminToast } from '@/components/admin/AdminToast'

type ProductForm = {
  id: string
  name: string
  categoryId: string
  tag: string
  material: string
  origin: string
  roomTags: string[]
  price: string
  originalPrice: string
  wholesalePrice: string
  stock: string
  note: string
  aspect: string
  featured: boolean
  specs: { label: string; value: string }[]
  images: string[]
}

const EMPTY_FORM: ProductForm = {
  id: '', name: '', categoryId: '', tag: '', material: '', origin: '', roomTags: [],
  price: '', originalPrice: '', wholesalePrice: '', stock: '0', note: '', aspect: '', featured: false,
  specs: [], images: [],
}

const ROOM_TAG_OPTIONS = ['Living', 'Comedor', 'Dormitorio', 'Cocina', 'Baño', 'Exterior', 'Oficina', 'Entrada']

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/backend${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

export default function ProductosAdmin() {
  const toast = useAdminToast()
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm | null>(null)
  // Se fija una sola vez al abrir el modal (create vs edit) — si se derivara en
  // cada render comparando form.id contra la lista de productos, tipear un id
  // nuevo que coincide por casualidad con uno existente convertiría el alta en
  // una edición silenciosa de ese producto.
  const [isNewForm, setIsNewForm] = useState(true)
  const [saving, setSaving] = useState(false)

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
    return true
  })

  const openCreate = () => {
    setIsNewForm(true)
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' })
  }

  const openEdit = (p: BackendProduct) => {
    setIsNewForm(false)
    setForm({
      id: p.id, name: p.name, categoryId: p.categoryId, tag: p.tag || '', material: p.material,
      origin: p.origin || '', roomTags: [...p.roomTags], price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      wholesalePrice: p.wholesalePrice ? String(p.wholesalePrice) : '',
      stock: String(p.stock), note: p.note || '', aspect: p.aspect || '', featured: p.featured,
      specs: p.specs.map((s) => ({ ...s })), images: [...p.images],
    })
  }

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        id: form.id, name: form.name, categoryId: form.categoryId, tag: form.tag || null,
        material: form.material, origin: form.origin || null, roomTags: form.roomTags,
        price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        wholesalePrice: form.wholesalePrice ? Number(form.wholesalePrice) : null,
        stock: Number(form.stock), note: form.note || null, aspect: form.aspect || null,
        featured: form.featured, specs: form.specs, images: form.images,
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

  const onDelete = async (p: BackendProduct) => {
    if (!confirm(`¿Eliminar/desactivar "${p.name}"?`)) return
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
          <p className="adm-eyebrow">{filtered.length} piezas</p>
        </div>
        <button className="adm-btn" onClick={openCreate}>+ Añadir pieza</button>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <div className="adm-toolbar">
        <input
          className="adm-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pieza..."
          style={{ flex: 1, maxWidth: 280 }}
        />
        <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="adm-checkbox-row">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Mostrar inactivos
        </label>
      </div>

      <div className="adm-card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
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
              <tr><td colSpan={6}><div className="adm-loading">Cargando…</div></td></tr>
            )}
            {!loading && filtered.map((p) => (
              <tr key={p.id} className={p.active ? '' : 'inactive'}>
                <td>
                  <div className="adm-table-name">{p.name}{p.featured && ' ★'}</div>
                  <div className="adm-table-sub">{p.tag || '—'}</div>
                </td>
                <td>{p.categoryName}</td>
                <td className="mono">$ {p.price.toLocaleString('de-DE')}</td>
                <td className="mono">{p.stock}</td>
                <td><span className={`adm-badge ${p.active ? 'ok' : 'danger'}`}>{p.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-link-btn" onClick={() => openEdit(p)}>Editar</button>
                    {p.active ? (
                      <button className="adm-link-btn danger" onClick={() => onDelete(p)}>Eliminar</button>
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

        <Field label="Nombre"><input className="adm-input" value={form.name} onChange={(e) => set('name', e.target.value)} style={{ width: '100%' }} /></Field>

        <div className="adm-grid-2" style={{ marginTop: 12 }}>
          <Field label="Tag (opcional)"><input className="adm-input" value={form.tag} onChange={(e) => set('tag', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Aspecto (ej. 4/5)"><input className="adm-input" value={form.aspect} onChange={(e) => set('aspect', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Material"><input className="adm-input" value={form.material} onChange={(e) => set('material', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Origen (opcional)"><input className="adm-input" value={form.origin} onChange={(e) => set('origin', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Precio"><input className="adm-input" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Precio tachado (opcional)"><input className="adm-input" type="number" value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Precio mayorista (opcional)"><input className="adm-input" type="number" value={form.wholesalePrice} onChange={(e) => set('wholesalePrice', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Stock"><input className="adm-input" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} style={{ width: '100%' }} /></Field>
          <Field label="Destacado">
            <label className="adm-checkbox-row" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              <span>Selección destacada</span>
            </label>
          </Field>
        </div>

        <Field label="¿Para qué ambiente se recomienda? (opcional)">
          <RoomTagsInput value={form.roomTags} onChange={(v) => set('roomTags', v)} />
        </Field>

        <Field label="Nota curatorial (opcional)">
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
      const res = await fetch('/api/admin/products/upload', { method: 'POST', body: form })
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
      <input className="adm-input" value={url} onChange={(e) => onChange(e.target.value)} placeholder="https://... o subí un archivo" style={{ flex: 1 }} />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = '' }}
      />
      <button type="button" className="adm-btn ghost sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? 'Subiendo...' : 'Subir'}
      </button>
      <button type="button" className="adm-btn ghost sm" onClick={onRemove}>✕</button>
      {error && <span style={{ color: 'var(--danger, #c0392b)', fontSize: 11 }}>{error}</span>}
    </div>
  )
}

function RoomTagsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState('')

  const toggle = (tag: string) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag])
  }

  const addCustom = () => {
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
          placeholder="Otro ambiente (para esta pieza)"
          style={{ flex: 1 }}
        />
        <button type="button" className="adm-btn ghost sm" onClick={addCustom}>+ Agregar</button>
      </div>
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
