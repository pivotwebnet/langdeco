'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SiteContent } from '@/lib/site-content'
import { useAdminToast } from '@/components/admin/AdminToast'

type InspiracionForm = SiteContent['inspiracion'][number]

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

export default function ContenidoAdmin() {
  const toast = useAdminToast()
  const [content, setContent] = useState<SiteContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

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
  const setField = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) =>
    setContent((c) => c && { ...c, [key]: value })

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
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setUploadingIndex(null)
    }
  }

  const uploadFieldImage = async (
    field: 'heroImageUrl' | 'logoUrl',
    file: globalThis.File,
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/site-content/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al subir la imagen')
      setField(field, data.url)
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
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
      toast.success('Contenido guardado.')
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="adm-loading">Cargando…</div>
  if (!content) return <div className="adm-alert error">{error || 'No se pudo cargar el contenido'}</div>

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Contenido del sitio</h1>
          <p className="adm-eyebrow">Barra de promociones, Hero, logotipo y los 4 estilos de Inspiración de la home (el cuarto es el patio).</p>
        </div>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <section style={{ marginBottom: 36 }}>
        <Field label="Barra de promociones (arriba del header)">
          <input
            className="adm-input"
            value={content.promoBar}
            onChange={(e) => setPromoBar(e.target.value)}
            placeholder="20% Descuento en contado o efectivo · 3 cuotas sin interés · Rafaela, Santa Fe"
            style={{ width: '100%' }}
          />
        </Field>
      </section>

      <section className="adm-card" style={{ display: 'flex', gap: 16, padding: 16, marginBottom: 36 }}>
        <div style={{ flexShrink: 0, width: 120 }}>
          <div style={{ width: 120, height: 150, background: 'var(--adm-surface-2)', overflow: 'hidden', marginBottom: 8, position: 'relative' }}>
            {content.heroImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.heroImageUrl} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <HiddenFileInput uploading={uploadingHero} onUpload={(f) => uploadFieldImage('heroImageUrl', f, setUploadingHero)} />
        </div>
        <div className="adm-grid-2" style={{ flex: 1, gap: 10 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <h2 className="adm-section-title" style={{ margin: '0 0 4px' }}>Hero (portada del home)</h2>
          </div>
          <Field label="Título">
            <input className="adm-input" value={content.heroTitle} onChange={(e) => setField('heroTitle', e.target.value)} style={{ width: '100%' }} />
          </Field>
          <Field label="Título — énfasis (en cursiva, segunda línea)">
            <input className="adm-input" value={content.heroTitleEmphasis} onChange={(e) => setField('heroTitleEmphasis', e.target.value)} style={{ width: '100%' }} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Subtítulo">
              <textarea className="adm-textarea" value={content.heroSubtitle} onChange={(e) => setField('heroSubtitle', e.target.value)} rows={2} />
            </Field>
          </div>
        </div>
      </section>

      <section className="adm-card" style={{ display: 'flex', gap: 16, padding: 16, marginBottom: 36, alignItems: 'center' }}>
        <div style={{ flexShrink: 0, width: 120 }}>
          <div style={{ width: 120, height: 80, background: 'var(--adm-surface-2)', overflow: 'hidden', marginBottom: 8, position: 'relative', display: 'grid', placeItems: 'center' }}>
            {content.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.logoUrl} alt="Logotipo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            )}
          </div>
          <HiddenFileInput uploading={uploadingLogo} onUpload={(f) => uploadFieldImage('logoUrl', f, setUploadingLogo)} />
        </div>
        <div>
          <h2 className="adm-section-title" style={{ margin: '0 0 4px' }}>Logotipo</h2>
          <p className="adm-eyebrow" style={{ margin: 0 }}>Se usa en el header y el pie de página de todo el sitio.</p>
        </div>
      </section>

      <section>
        <h2 className="adm-section-title">Inspiración</h2>
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
        <button className="adm-btn" onClick={onSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && <span className="adm-badge ok">Guardado ✓</span>}
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
  return (
    <div className="adm-card" style={{ display: 'flex', gap: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ flexShrink: 0, width: 120 }}>
        <div style={{ width: 120, height: 150, background: 'var(--adm-surface-2)', overflow: 'hidden', marginBottom: 8, position: 'relative' }}>
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <HiddenFileInput uploading={uploading} onUpload={onUpload} />
      </div>

      <div className="adm-grid-2" style={{ flex: 1, gap: 10 }}>
        <Field label="Nombre"><input className="adm-input" value={item.name} onChange={(e) => onChange({ name: e.target.value })} style={{ width: '100%' }} /></Field>
        <Field label="Lugar"><input className="adm-input" value={item.place} onChange={(e) => onChange({ place: e.target.value })} style={{ width: '100%' }} /></Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={!!item.isPatio} onChange={(e) => onChange({ isPatio: e.target.checked })} />
            Es un patio / exterior (no habitación)
          </label>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Descripción">
            <textarea className="adm-textarea" value={item.desc} onChange={(e) => onChange({ desc: e.target.value })} rows={2} />
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Piezas (separadas por coma)">
            <input
              className="adm-input"
              value={item.pieces.join(', ')}
              onChange={(e) => onChange({ pieces: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              style={{ width: '100%' }}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

function HiddenFileInput({ uploading, onUpload }: { uploading: boolean; onUpload: (file: globalThis.File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }}
      />
      <button type="button" className="adm-btn ghost sm" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: '100%' }}>
        {uploading ? 'Subiendo...' : 'Cambiar foto'}
      </button>
    </>
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
