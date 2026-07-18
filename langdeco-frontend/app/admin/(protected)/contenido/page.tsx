'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SiteContent } from '@/lib/site-content'

type InspiracionForm = SiteContent['inspiracion'][number]

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

export default function ContenidoAdmin() {
  const [content, setContent] = useState<SiteContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setContent(await api<SiteContent>('/api/admin/site-content'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const setPromoBar = (value: string) => setContent((c) => c && { ...c, promoBar: value })

  const setItem = (index: number, patch: Partial<InspiracionForm>) => {
    setContent((c) => {
      if (!c) return c
      const inspiracion = [...c.inspiracion] as SiteContent['inspiracion']
      inspiracion[index] = { ...inspiracion[index], ...patch }
      return { ...c, inspiracion }
    })
  }

  const uploadImage = async (index: number, file: globalThis.File) => {
    setUploadingIndex(index)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/site-content/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al subir la imagen')
      setItem(index, { imageUrl: data.url })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploadingIndex(null)
    }
  }

  const onSave = async () => {
    if (!content) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await api('/api/admin/site-content', { method: 'PUT', body: JSON.stringify(content) })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Cargando…</p>
  if (!content) return <p style={{ color: 'crimson' }}>{error || 'No se pudo cargar el contenido'}</p>

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 24, fontWeight: 500, margin: '0 0 4px' }}>Contenido del sitio</h1>
      <p style={{ color: 'var(--ink-mute)', fontSize: 13, margin: '0 0 28px' }}>
        Barra de promociones y las 3 imágenes de Inspiración de la home.
      </p>

      {error && <p style={{ color: 'crimson', fontSize: 13 }}>{error}</p>}

      <section style={{ marginBottom: 36 }}>
        <Field label="Barra de promociones (arriba del header)">
          <input
            value={content.promoBar}
            onChange={(e) => setPromoBar(e.target.value)}
            placeholder="20% Descuento en contado o efectivo · 3 cuotas sin interés · Rafaela, Santa Fe"
            style={{ ...inputStyle, width: '100%' }}
          />
        </Field>
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 12px' }}>Inspiración</h2>
        {content.inspiracion.map((item, i) => (
          <InspiracionCard
            key={i}
            index={i}
            item={item}
            uploading={uploadingIndex === i}
            onChange={(patch) => setItem(i, patch)}
            onUpload={(file) => uploadImage(i, file)}
          />
        ))}
      </section>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
        <button className="btn" onClick={onSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && <span style={{ fontSize: 13, color: 'var(--leaf)' }}>Guardado ✓</span>}
      </div>
    </div>
  )
}

function InspiracionCard({ index, item, uploading, onChange, onUpload }: {
  index: number
  item: InspiracionForm
  uploading: boolean
  onChange: (patch: Partial<InspiracionForm>) => void
  onUpload: (file: globalThis.File) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, border: '1px solid var(--line)', marginBottom: 12 }}>
      <div style={{ flexShrink: 0, width: 120 }}>
        <div style={{ width: 120, height: 150, background: '#ECEAE4', overflow: 'hidden', marginBottom: 8, position: 'relative' }}>
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }}
        />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={smallBtnStyle}>
          {uploading ? 'Subiendo...' : 'Cambiar foto'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Nombre"><input value={item.name} onChange={(e) => onChange({ name: e.target.value })} style={inputStyle} /></Field>
        <Field label="Lugar"><input value={item.place} onChange={(e) => onChange({ place: e.target.value })} style={inputStyle} /></Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Descripción">
            <textarea value={item.desc} onChange={(e) => onChange({ desc: e.target.value })} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Piezas (separadas por coma)">
            <input
              value={item.pieces.join(', ')}
              onChange={(e) => onChange({ pieces: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              style={{ ...inputStyle, width: '100%' }}
            />
          </Field>
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
const smallBtnStyle: React.CSSProperties = { padding: '4px 10px', border: '1px solid var(--line)', background: 'white', cursor: 'pointer', fontSize: 11, width: '100%' }
