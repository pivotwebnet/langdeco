'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SiteContent } from '@/lib/site-content'
import type { BackendProduct } from '@/lib/backend-types'
import type { LookbookHotspot, NosotrosHito, NosotrosPilar, NosotrosTeamMember } from '@/lib/types'
import { formatPrice } from '@/lib/data'
import { useAdminToast } from '@/components/admin/AdminToast'
import { useEscapeKey } from '@/lib/useEscapeKey'
import { ProductPicker } from '@/components/admin/ProductPicker'
import { adminFetch as api } from '@/lib/admin/api'
import { Field } from '@/components/admin/Field'

type InspiracionForm = SiteContent['inspiracion'][number]

type ContentTab = 'general' | 'nosotros' | 'legal' | 'inspiracion'
const TABS: { id: ContentTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'legal', label: 'Legal' },
  { id: 'inspiracion', label: 'Inspiración' },
]

export default function ContenidoAdmin() {
  const toast = useAdminToast()
  const [content, setContent] = useState<SiteContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<ContentTab>('general')
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingNosotrosPhoto, setUploadingNosotrosPhoto] = useState<'showroom' | 'taller' | 'detalle' | null>(null)
  const [uploadingHitoImage, setUploadingHitoImage] = useState<number | null>(null)
  const [uploadingTeamPhoto, setUploadingTeamPhoto] = useState<number | null>(null)
  const [products, setProducts] = useState<BackendProduct[]>([])

  useEffect(() => {
    fetch('/api/admin/backend/products')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((data: BackendProduct[]) => setProducts(data))
      .catch(() => {})
  }, [])

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

  const setNosotros = (patch: Partial<SiteContent['nosotros']>) =>
    setContent((c) => c && { ...c, nosotros: { ...c.nosotros, ...patch } })

  const setNosotrosPhoto = (key: keyof SiteContent['nosotros']['photos'], url: string) =>
    setContent((c) => c && { ...c, nosotros: { ...c.nosotros, photos: { ...c.nosotros.photos, [key]: url } } })

  const setHito = (index: number, patch: Partial<NosotrosHito>) => {
    setContent((c) => {
      if (!c) return c
      const hitos = [...c.nosotros.hitos] as SiteContent['nosotros']['hitos']
      hitos[index] = { ...hitos[index], ...patch }
      return { ...c, nosotros: { ...c.nosotros, hitos } }
    })
  }

  const setPilar = (index: number, patch: Partial<NosotrosPilar>) => {
    setContent((c) => {
      if (!c) return c
      const pilares = [...c.nosotros.pilares] as SiteContent['nosotros']['pilares']
      pilares[index] = { ...pilares[index], ...patch }
      return { ...c, nosotros: { ...c.nosotros, pilares } }
    })
  }

  const setTeamMember = (index: number, patch: Partial<NosotrosTeamMember>) => {
    setContent((c) => {
      if (!c) return c
      const team = [...c.nosotros.team]
      team[index] = { ...team[index], ...patch }
      return { ...c, nosotros: { ...c.nosotros, team } }
    })
  }

  const addTeamMember = () =>
    setContent((c) => c && { ...c, nosotros: { ...c.nosotros, team: [...c.nosotros.team, { name: '', role: '', photo: '' }] } })

  const removeTeamMember = (index: number) =>
    setContent((c) => c && { ...c, nosotros: { ...c.nosotros, team: c.nosotros.team.filter((_, i) => i !== index) } })

  const setLegal = <K extends keyof SiteContent['legal']>(section: K, patch: Partial<SiteContent['legal'][K]>) =>
    setContent((c) => c && { ...c, legal: { ...c.legal, [section]: { ...c.legal[section], ...patch } } })

  const uploadImage = async (index: number, file: globalThis.File) => {
    setUploadingIndex(index)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
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
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
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

  const uploadNosotrosPhoto = async (key: 'showroom' | 'taller' | 'detalle', file: globalThis.File) => {
    setUploadingNosotrosPhoto(key)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al subir la imagen')
      setNosotrosPhoto(key, data.url)
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setUploadingNosotrosPhoto(null)
    }
  }

  const uploadHitoImage = async (index: number, file: globalThis.File) => {
    setUploadingHitoImage(index)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al subir la imagen')
      setHito(index, { imageUrl: data.url })
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setUploadingHitoImage(null)
    }
  }

  const uploadTeamPhoto = async (index: number, file: globalThis.File) => {
    setUploadingTeamPhoto(index)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al subir la imagen')
      setTeamMember(index, { photo: data.url })
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(msg)
    } finally {
      setUploadingTeamPhoto(null)
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
          <p className="adm-eyebrow">Barra de promociones, Hero, logotipo, la página Nosotros y los 4 estilos de Inspiración de la home (el cuarto es el patio).</p>
        </div>
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      <div className="adm-toolbar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`adm-btn sm ${tab === t.id ? '' : 'ghost'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
      <>
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
      </>
      )}

      {tab === 'nosotros' && (
      <section className="adm-card" style={{ padding: 16, marginBottom: 36 }}>
        <h2 className="adm-section-title" style={{ margin: '0 0 12px' }}>Nosotros</h2>

        <div className="adm-grid-2" style={{ gap: 10, marginBottom: 20 }}>
          <Field label="Título">
            <input className="adm-input" value={content.nosotros.title} onChange={(e) => setNosotros({ title: e.target.value })} style={{ width: '100%' }} />
          </Field>
          <Field label="Título — énfasis (en cursiva, segunda línea)">
            <input className="adm-input" value={content.nosotros.titleEmphasis} onChange={(e) => setNosotros({ titleEmphasis: e.target.value })} style={{ width: '100%' }} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Subtítulo (línea corta debajo del título)">
              <input className="adm-input" value={content.nosotros.subtitle} onChange={(e) => setNosotros({ subtitle: e.target.value })} style={{ width: '100%' }} />
            </Field>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Texto introductorio">
              <textarea className="adm-textarea" value={content.nosotros.intro} onChange={(e) => setNosotros({ intro: e.target.value })} rows={3} />
            </Field>
          </div>
        </div>

        <h3 className="adm-eyebrow" style={{ margin: '0 0 8px' }}>Fotos (franja + pilares)</h3>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['showroom', 'taller', 'detalle'] as const).map((key) => (
            <div key={key} style={{ flexShrink: 0, width: 120 }}>
              <div style={{ width: 120, height: 150, background: 'var(--adm-surface-2)', overflow: 'hidden', marginBottom: 8, position: 'relative' }}>
                {content.nosotros.photos[key] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={content.nosotros.photos[key]} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <p className="adm-eyebrow" style={{ margin: '0 0 4px', textTransform: 'capitalize' }}>{key}</p>
              <HiddenFileInput uploading={uploadingNosotrosPhoto === key} onUpload={(f) => uploadNosotrosPhoto(key, f)} />
            </div>
          ))}
        </div>

        <h3 className="adm-eyebrow" style={{ margin: '0 0 8px' }}>Línea de tiempo (4 hitos)</h3>
        {content.nosotros.hitos.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flexShrink: 0, width: 84 }}>
              <div style={{ width: 84, height: 84, background: 'var(--adm-surface-2)', overflow: 'hidden', marginBottom: 6, position: 'relative' }}>
                {h.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <HiddenFileInput uploading={uploadingHitoImage === i} onUpload={(f) => uploadHitoImage(i, f)} />
            </div>
            <div className="adm-grid-2" style={{ gap: 10, flex: 1 }}>
              <Field label={`Año ${i + 1}`}>
                <input className="adm-input" value={h.year} onChange={(e) => setHito(i, { year: e.target.value })} style={{ width: '100%' }} />
              </Field>
              <Field label={`Texto ${i + 1}`}>
                <input className="adm-input" value={h.label} onChange={(e) => setHito(i, { label: e.target.value })} style={{ width: '100%' }} />
              </Field>
            </div>
          </div>
        ))}

        <h3 className="adm-eyebrow" style={{ margin: '24px 0 8px' }}>Pilares (3)</h3>
        {content.nosotros.pilares.map((p, i) => (
          <div key={i} className="adm-grid-2" style={{ gap: 10, marginBottom: 10 }}>
            <Field label={`Título ${i + 1}`}>
              <input className="adm-input" value={p.title} onChange={(e) => setPilar(i, { title: e.target.value })} style={{ width: '100%' }} />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label={`Descripción ${i + 1}`}>
                <textarea className="adm-textarea" value={p.desc} onChange={(e) => setPilar(i, { desc: e.target.value })} rows={2} />
              </Field>
            </div>
          </div>
        ))}

        <h3 className="adm-eyebrow" style={{ margin: '24px 0 4px' }}>Equipo (opcional)</h3>
        <p className="adm-eyebrow" style={{ margin: '0 0 12px' }}>
          Si no cargás a nadie, esta sección no se muestra en el sitio.
        </p>
        {content.nosotros.team.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 84 }}>
              <div style={{ width: 84, height: 84, background: 'var(--adm-surface-2)', overflow: 'hidden', marginBottom: 6, position: 'relative', borderRadius: '50%' }}>
                {m.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <HiddenFileInput uploading={uploadingTeamPhoto === i} onUpload={(f) => uploadTeamPhoto(i, f)} />
            </div>
            <div className="adm-grid-2" style={{ gap: 10, flex: 1 }}>
              <Field label="Nombre">
                <input className="adm-input" value={m.name} onChange={(e) => setTeamMember(i, { name: e.target.value })} style={{ width: '100%' }} />
              </Field>
              <Field label="Rol">
                <input className="adm-input" value={m.role} onChange={(e) => setTeamMember(i, { role: e.target.value })} style={{ width: '100%' }} />
              </Field>
            </div>
            <button type="button" className="adm-link-btn danger" onClick={() => removeTeamMember(i)} style={{ marginTop: 24 }}>
              Quitar
            </button>
          </div>
        ))}
        <button type="button" className="adm-btn ghost sm" onClick={addTeamMember}>+ Agregar integrante</button>
      </section>
      )}

      {tab === 'legal' && (
      <section className="adm-card" style={{ padding: 16, marginBottom: 36 }}>
        <h2 className="adm-section-title" style={{ margin: '0 0 12px' }}>Legal</h2>
        <p className="adm-eyebrow" style={{ margin: '0 0 16px' }}>
          Completa estos datos para reemplazar los textos pendientes en Envíos y devoluciones, Términos, Preguntas frecuentes y Privacidad.
        </p>

        <h3 className="adm-eyebrow" style={{ margin: '0 0 8px' }}>Envíos y devoluciones</h3>
        <div className="adm-grid-2" style={{ gap: 10, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Zonas de cobertura y transportistas">
              <textarea className="adm-textarea" value={content.legal.envios.zonas} onChange={(e) => setLegal('envios', { zonas: e.target.value })} rows={2} />
            </Field>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Costos de envío y tiempo estimado de entrega">
              <textarea className="adm-textarea" value={content.legal.envios.costosPlazos} onChange={(e) => setLegal('envios', { costosPlazos: e.target.value })} rows={2} />
            </Field>
          </div>
          <Field label="Plazo de devolución (días)">
            <input className="adm-input" value={content.legal.envios.plazoDevolucionDias} onChange={(e) => setLegal('envios', { plazoDevolucionDias: e.target.value })} style={{ width: '100%' }} />
          </Field>
          <Field label="Plazo para reportar daños de envío (ej. '48 horas')">
            <input className="adm-input" value={content.legal.envios.plazoDanioHoras} onChange={(e) => setLegal('envios', { plazoDanioHoras: e.target.value })} style={{ width: '100%' }} />
          </Field>
        </div>

        <h3 className="adm-eyebrow" style={{ margin: '0 0 8px' }}>Términos y condiciones</h3>
        <div className="adm-grid-2" style={{ gap: 10, marginBottom: 20 }}>
          <Field label="Razón social / CUIT">
            <input className="adm-input" value={content.legal.terminos.razonSocial} onChange={(e) => setLegal('terminos', { razonSocial: e.target.value })} style={{ width: '100%' }} />
          </Field>
        </div>

        <h3 className="adm-eyebrow" style={{ margin: '0 0 8px' }}>Preguntas frecuentes</h3>
        <div className="adm-grid-2" style={{ gap: 10, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="¿Hacen envíos a todo el país?">
              <textarea className="adm-textarea" value={content.legal.faq.zonasCobertura} onChange={(e) => setLegal('faq', { zonasCobertura: e.target.value })} rows={2} />
            </Field>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="¿Cuánto tarda en llegar mi pedido?">
              <textarea className="adm-textarea" value={content.legal.faq.plazoEntrega} onChange={(e) => setLegal('faq', { plazoEntrega: e.target.value })} rows={2} />
            </Field>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="¿Las piezas tienen garantía?">
              <textarea className="adm-textarea" value={content.legal.faq.garantia} onChange={(e) => setLegal('faq', { garantia: e.target.value })} rows={2} />
            </Field>
          </div>
        </div>

        <h3 className="adm-eyebrow" style={{ margin: '0 0 8px' }}>Política de privacidad</h3>
        <div className="adm-grid-2" style={{ gap: 10 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Con quién se comparten los datos (envío/logística, terceros)">
              <textarea className="adm-textarea" value={content.legal.privacidad.terceros} onChange={(e) => setLegal('privacidad', { terceros: e.target.value })} rows={2} />
            </Field>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Cookies analíticas o de terceros (si se usan)">
              <textarea className="adm-textarea" value={content.legal.privacidad.cookies} onChange={(e) => setLegal('privacidad', { cookies: e.target.value })} rows={2} />
            </Field>
          </div>
        </div>
      </section>
      )}

      {tab === 'inspiracion' && (
      <section>
        <h2 className="adm-section-title">Inspiración</h2>
        {content.inspiracion.map((item, i) => (
          <InspiracionCard
            key={i}
            index={i}
            item={item}
            products={products}
            uploading={uploadingIndex === i}
            onChange={(patch) => setItem(i, patch)}
            onUpload={(file) => uploadImage(i, file)}
          />
        ))}
      </section>
      )}

      <div className="adm-savebar">
        <button className="adm-btn" onClick={onSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && <span className="adm-badge ok">Guardado ✓</span>}
      </div>
    </div>
  )
}

function InspiracionCard({ index, item, products, uploading, onChange, onUpload }: {
  index: number
  item: InspiracionForm
  products: BackendProduct[]
  uploading: boolean
  onChange: (patch: Partial<InspiracionForm>) => void
  onUpload: (file: globalThis.File) => void
}) {
  const [editingHotspots, setEditingHotspots] = useState(false)
  const hotspotCount = item.hotspots?.length ?? 0

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
          <Field label="Piezas (separadas por coma) — se usa solo si no hay puntos de producto">
            <input
              className="adm-input"
              value={item.pieces.join(', ')}
              onChange={(e) => onChange({ pieces: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              style={{ width: '100%' }}
            />
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <button
            type="button"
            className="adm-btn ghost sm"
            onClick={() => setEditingHotspots(true)}
            disabled={!item.imageUrl}
            title={!item.imageUrl ? 'Primero subí una foto' : undefined}
          >
            Editar puntos de producto{hotspotCount > 0 ? ` (${hotspotCount})` : ''}
          </button>
        </div>
      </div>

      {editingHotspots && (
        <HotspotEditorModal
          item={item}
          products={products}
          onChange={onChange}
          onClose={() => setEditingHotspots(false)}
        />
      )}
    </div>
  )
}

function HotspotEditorModal({ item, products, onChange, onClose }: {
  item: InspiracionForm
  products: BackendProduct[]
  onChange: (patch: Partial<InspiracionForm>) => void
  onClose: () => void
}) {
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null)
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  useEscapeKey(onClose)

  const hotspots = item.hotspots ?? []
  const productById = (id: string) => products.find((p) => p.id === id)

  const addHotspot = (product: BackendProduct) => {
    if (!pendingPoint) return
    const next: LookbookHotspot[] = [...hotspots, { x: pendingPoint.x, y: pendingPoint.y, productId: product.id }]
    onChange({ hotspots: next })
    setPendingPoint(null)
  }

  const replaceHotspot = (index: number, product: BackendProduct) => {
    const next = hotspots.map((h, i) => i === index ? { ...h, productId: product.id } : h)
    onChange({ hotspots: next })
    setPickerForIndex(null)
  }

  const removeHotspot = (index: number) => {
    onChange({ hotspots: hotspots.filter((_, i) => i !== index) })
  }

  const onImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10
    setPendingPoint({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) })
  }

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-modal-title">Puntos de producto — {item.name || 'sin nombre'}</h2>
        <p className="adm-eyebrow" style={{ marginTop: -12, marginBottom: 16 }}>
          Hacé click sobre la foto para marcar un punto y elegir qué producto real muestra ahí.
        </p>

        <div
          ref={imgRef}
          onClick={onImageClick}
          style={{
            position: 'relative', width: '100%', aspectRatio: '4/5',
            background: 'var(--adm-surface-2)', overflow: 'hidden',
            borderRadius: 8, cursor: 'crosshair', marginBottom: 16,
          }}
        >
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
          )}

          {hotspots.map((h, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setPickerForIndex(i) }}
              title={productById(h.productId)?.name ?? 'Producto no encontrado'}
              style={{
                position: 'absolute', left: `${h.x}%`, top: `${h.y}%`, transform: 'translate(-50%, -50%)',
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--ink)', color: '#fff', border: '2px solid #fff',
                fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
                display: 'grid', placeItems: 'center', cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              }}
            >
              {i + 1}
            </button>
          ))}

          {pendingPoint && (
            <span
              style={{
                position: 'absolute', left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%`, transform: 'translate(-50%, -50%)',
                width: 26, height: 26, borderRadius: '50%',
                border: '2px dashed #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              }}
            />
          )}
        </div>

        {hotspots.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {hotspots.map((h, i) => {
              const prod = productById(h.productId)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--adm-border)' }}>
                  <span className="adm-badge">{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod ? prod.name : <em style={{ color: 'var(--adm-danger)' }}>Producto no encontrado</em>}
                    </div>
                    {prod && <div className="adm-table-sub">{formatPrice(prod.price)}</div>}
                  </div>
                  <button type="button" className="adm-link-btn" onClick={() => setPickerForIndex(i)}>Cambiar</button>
                  <button type="button" className="adm-link-btn danger" onClick={() => removeHotspot(i)}>Quitar</button>
                </div>
              )
            })}
          </div>
        )}

        <button className="adm-btn" onClick={onClose} style={{ width: '100%' }}>Listo</button>
      </div>

      {pendingPoint && (
        <ProductPicker
          products={products}
          title="¿Qué producto va en este punto?"
          onSelect={addHotspot}
          onClose={() => setPendingPoint(null)}
        />
      )}
      {pickerForIndex !== null && (
        <ProductPicker
          products={products}
          title="Reemplazar producto del punto"
          onSelect={(p) => replaceHotspot(pickerForIndex, p)}
          onClose={() => setPickerForIndex(null)}
        />
      )}
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

