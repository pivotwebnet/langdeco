'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BackendCategory, BackendProduct } from '@/lib/backend-types'

type ProductForm = {
  id: string
  name: string
  categoryId: string
  tag: string
  material: string
  origin: string
  price: string
  originalPrice: string
  stock: string
  note: string
  aspect: string
  featured: boolean
  specs: { label: string; value: string }[]
  images: string[]
}

const EMPTY_FORM: ProductForm = {
  id: '', name: '', categoryId: '', tag: '', material: '', origin: '',
  price: '', originalPrice: '', stock: '0', note: '', aspect: '', featured: false,
  specs: [], images: [],
}

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
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm | null>(null)
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

  const openCreate = () => setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' })

  const openEdit = (p: BackendProduct) => setForm({
    id: p.id, name: p.name, categoryId: p.categoryId, tag: p.tag || '', material: p.material,
    origin: p.origin || '', price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : '',
    stock: String(p.stock), note: p.note || '', aspect: p.aspect || '', featured: p.featured,
    specs: p.specs.map((s) => ({ ...s })), images: [...p.images],
  })

  const isEditing = (id: string) => products.some((p) => p.id === id)

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        id: form.id, name: form.name, categoryId: form.categoryId, tag: form.tag || null,
        material: form.material, origin: form.origin || null,
        price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        stock: Number(form.stock), note: form.note || null, aspect: form.aspect || null,
        featured: form.featured, specs: form.specs, images: form.images,
      }

      if (isEditing(form.id)) {
        await api(`/products/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await api(`/products`, { method: 'POST', body: JSON.stringify(payload) })
      }

      setForm(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (p: BackendProduct) => {
    if (!confirm(`¿Eliminar/desactivar "${p.name}"?`)) return
    try {
      await api(`/products/${p.id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const onActivate = async (p: BackendProduct) => {
    try {
      await api(`/products/${p.id}/activate`, { method: 'POST' })
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
            Productos
          </h1>
          <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: 6 }}>
            {filtered.length} piezas
          </p>
        </div>
        <button className="btn" style={{ fontSize: 11 }} onClick={openCreate}>+ Añadir pieza</button>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pieza..."
          style={{ flex: 1, maxWidth: 280, border: '1px solid var(--line)', background: 'white', padding: '10px 14px', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink)', outline: 'none' }}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--line)', fontSize: 13 }}>
          <option value="all">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Mostrar inactivos
        </label>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 100px 140px', padding: '12px 24px', borderBottom: '1px solid var(--line)', background: '#F8F7F4' }}>
          {['Nombre', 'Categoría', 'Precio', 'Stock', 'Estado', ''].map((h) => (
            <span key={h} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>{h}</span>
          ))}
        </div>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mute)' }}>Cargando...</div>}
        {!loading && filtered.map((p, i) => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 100px 140px', padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'center', opacity: p.active ? 1 : 0.5 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
                {p.name}{p.featured && ' ★'}
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>{p.tag || '—'}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{p.categoryName}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ink)' }}>$ {p.price.toLocaleString('de-DE')}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{p.stock}</div>
            <div>
              <span className="mono" style={{ fontSize: 9, color: p.active ? '#065F46' : '#991B1B' }}>{p.active ? 'Activo' : 'Inactivo'}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => openEdit(p)} style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', padding: 0 }}>
                Editar
              </button>
              {p.active ? (
                <button onClick={() => onDelete(p)} style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#991B1B', padding: 0 }}>
                  Eliminar
                </button>
              ) : (
                <button onClick={() => onActivate(p)} style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#065F46', padding: 0 }}>
                  Reactivar
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'var(--font-edit)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 18 }}>
            Sin resultados.
          </div>
        )}
      </div>

      {form && (
        <ProductFormModal
          form={form}
          categories={categories}
          isNew={!isEditing(form.id)}
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ background: 'white', width: 640, maxHeight: '90vh', overflowY: 'auto', padding: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 20px' }}>{isNew ? 'Nueva pieza' : 'Editar pieza'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Id (slug)">
            <input value={form.id} onChange={(e) => set('id', e.target.value)} disabled={!isNew} placeholder="mesa-comedor" style={inputStyle} />
          </Field>
          <Field label="Categoría">
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} style={inputStyle}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Nombre"><input value={form.name} onChange={(e) => set('name', e.target.value)} style={{ ...inputStyle, width: '100%' }} /></Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Field label="Tag (opcional)"><input value={form.tag} onChange={(e) => set('tag', e.target.value)} style={inputStyle} /></Field>
          <Field label="Aspecto (ej. 4/5)"><input value={form.aspect} onChange={(e) => set('aspect', e.target.value)} style={inputStyle} /></Field>
          <Field label="Material"><input value={form.material} onChange={(e) => set('material', e.target.value)} style={inputStyle} /></Field>
          <Field label="Origen (opcional)"><input value={form.origin} onChange={(e) => set('origin', e.target.value)} style={inputStyle} /></Field>
          <Field label="Precio"><input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} style={inputStyle} /></Field>
          <Field label="Precio tachado (opcional)"><input type="number" value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} style={inputStyle} /></Field>
          <Field label="Stock"><input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} style={inputStyle} /></Field>
          <Field label="Destacado">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              <span style={{ fontSize: 13 }}>Selección destacada</span>
            </label>
          </Field>
        </div>

        <Field label="Nota curatorial (opcional)">
          <textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
        </Field>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Ficha técnica</span>
            <button type="button" onClick={addSpec} style={smallBtnStyle}>+ Agregar</button>
          </div>
          {form.specs.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input value={s.label} onChange={(e) => updateSpec(i, 'label', e.target.value)} placeholder="Etiqueta" style={{ ...inputStyle, flex: 1 }} />
              <input value={s.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} placeholder="Valor" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={() => removeSpec(i)} style={smallBtnStyle}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono">Fotos (URL, hasta 6 — la primera es la portada)</span>
            <button type="button" onClick={addImage} disabled={form.images.length >= 6} style={smallBtnStyle}>+ Agregar</button>
          </div>
          {form.images.map((url, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input value={url} onChange={(e) => updateImage(i, e.target.value)} placeholder="https://..." style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={() => removeImage(i)} style={smallBtnStyle}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn" onClick={onSave} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="btn ghost" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-mute)', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--line)', fontSize: 13, fontFamily: 'var(--font-ui)' }
const smallBtnStyle: React.CSSProperties = { padding: '4px 10px', border: '1px solid var(--line)', background: 'white', cursor: 'pointer', fontSize: 11 }
