'use client'

import { useRef, useState } from 'react'
import * as Icon from '@/components/ui/Icon'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import type { Product } from '@/lib/types'

interface Props {
  products: Product[]
  compact?: boolean
}

interface PlacedItem {
  uid: string
  productId: string
  imageUrl: string
  name: string
  x: number      // % — borde izquierdo relativo al ancho de la foto
  y: number      // % — borde superior relativo al alto de la foto
  width: number  // % del ancho de la foto
  z: number
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function Visualizador({ products, compact = false }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoSize, setPhotoSize] = useState<{ w: number; h: number } | null>(null)
  const [items, setItems] = useState<PlacedItem[]>([])
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zCounter = useRef(1)

  const withImage = products.filter((p) => p.imageUrl)

  function handlePhotoFile(file?: File) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const probe = new Image()
      probe.onload = () => setPhotoSize({ w: probe.naturalWidth, h: probe.naturalHeight })
      probe.src = url
      setPhotoUrl(url)
      setItems([])
      setSelectedUid(null)
    }
    reader.readAsDataURL(file)
  }

  function addItem(product: Product, xPct = 42, yPct = 42) {
    if (!product.imageUrl) return
    const uid = crypto.randomUUID()
    zCounter.current += 1
    setItems((prev) => [
      ...prev,
      {
        uid,
        productId: product.id,
        imageUrl: product.imageUrl!,
        name: product.name,
        x: clamp(xPct - 15, 0, 82),
        y: clamp(yPct - 15, 0, 82),
        width: 28,
        z: zCounter.current,
      },
    ])
    setSelectedUid(uid)
  }

  function handleCanvasDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)

    if (e.dataTransfer.files?.length) {
      handlePhotoFile(e.dataTransfer.files[0])
      return
    }
    const productId = e.dataTransfer.getData('text/plain')
    if (!productId || !wrapperRef.current) return
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const rect = wrapperRef.current.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    addItem(product, xPct, yPct)
  }

  function handleThumbDragStart(e: React.DragEvent, product: Product) {
    e.dataTransfer.setData('text/plain', product.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function bringToFront(uid: string) {
    zCounter.current += 1
    const z = zCounter.current
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, z } : i)))
  }

  function handleItemPointerDown(e: React.PointerEvent<HTMLDivElement>, uid: string) {
    e.stopPropagation()
    if (!wrapperRef.current) return
    setSelectedUid(uid)
    bringToFront(uid)

    const item = items.find((i) => i.uid === uid)
    if (!item) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const startClientX = e.clientX
    const startClientY = e.clientY
    const startX = item.x
    const startY = item.y

    function onMove(ev: PointerEvent) {
      const dxPct = ((ev.clientX - startClientX) / rect.width) * 100
      const dyPct = ((ev.clientY - startClientY) / rect.height) * 100
      setItems((prev) =>
        prev.map((i) =>
          i.uid === uid
            ? { ...i, x: clamp(startX + dxPct, -10, 96), y: clamp(startY + dyPct, -10, 96) }
            : i
        )
      )
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function handleResizePointerDown(e: React.PointerEvent<HTMLDivElement>, uid: string) {
    e.stopPropagation()
    e.preventDefault()
    if (!wrapperRef.current) return
    const item = items.find((i) => i.uid === uid)
    if (!item) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const startClientX = e.clientX
    const startWidth = item.width

    function onMove(ev: PointerEvent) {
      const dxPct = ((ev.clientX - startClientX) / rect.width) * 100
      setItems((prev) =>
        prev.map((i) => (i.uid === uid ? { ...i, width: clamp(startWidth + dxPct, 8, 92) } : i))
      )
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function removeItem(uid: string) {
    setItems((prev) => prev.filter((i) => i.uid !== uid))
    setSelectedUid((s) => (s === uid ? null : s))
  }

  function resetPhoto() {
    setPhotoUrl(null)
    setPhotoSize(null)
    setItems([])
    setSelectedUid(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDownload() {
    if (!photoUrl || !photoSize) return
    const canvas = document.createElement('canvas')
    canvas.width = photoSize.w
    canvas.height = photoSize.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bg = new Image()
    bg.src = photoUrl
    await new Promise((res) => { bg.onload = res; bg.onerror = res })
    ctx.drawImage(bg, 0, 0, photoSize.w, photoSize.h)

    for (const item of [...items].sort((a, b) => a.z - b.z)) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = item.imageUrl
      await new Promise((res) => { img.onload = res; img.onerror = res })
      if (!img.naturalWidth) continue
      const itemW = (item.width / 100) * photoSize.w
      const itemH = itemW * (img.naturalHeight / img.naturalWidth)
      const itemX = (item.x / 100) * photoSize.w
      const itemY = (item.y / 100) * photoSize.h
      ctx.drawImage(img, itemX, itemY, itemW, itemH)
    }

    try {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'mi-espacio-laslangdeco.png'
      a.click()
    } catch {
      alert('No se pudo generar la descarga de esta combinación de imágenes.')
    }
  }

  return (
    <section data-dt="visualizador-embed" data-size={compact ? 'compact' : undefined} style={{ position: 'relative', padding: '32px 24px 72px' }}>
      <RevealOnScroll style={{ marginBottom: 20 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>Probalo en tu casa</div>
        <h2 className="display" style={{ fontSize: compact ? 'clamp(24px, 4.5vw, 34px)' : 'clamp(28px, 5vw, 40px)', margin: '0 0 10px' }}>
          Visualizador de{' '}
          <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>espacios</em>
        </h2>
        <p style={{ maxWidth: 560, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          Subí una foto de tu ambiente y arrastrá piezas del catálogo encima para imaginar cómo quedan
          antes de comprar. Podés moverlas, cambiarlas de tamaño y descargar el resultado.
        </p>
      </RevealOnScroll>

      <div className="viz-layout">
        {/* ── Canvas ─────────────────────────────────────────── */}
        <RevealOnScroll delay={1} className="viz-canvas-col">
          {!photoUrl ? (
            <div
              className={`viz-dropzone${dragOver ? ' over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                if (e.dataTransfer.files?.length) handlePhotoFile(e.dataTransfer.files[0])
              }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <Icon.Plus style={{ width: 22, height: 22 }} />
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500 }}>Subí una foto de tu espacio</div>
              <div className="mono" style={{ marginTop: 6, fontSize: 9 }}>Arrastrá una imagen o hacé clic para elegir un archivo</div>
            </div>
          ) : (
            <>
              <div
                ref={wrapperRef}
                className="viz-canvas"
                onDragOver={handleCanvasDragOver}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleCanvasDrop}
                onPointerDown={() => setSelectedUid(null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Tu espacio" className="viz-photo" draggable={false} />

                {dragOver && <div className="viz-canvas-hint">Soltá aquí</div>}

                {items.map((item) => (
                  <div
                    key={item.uid}
                    className={`viz-item${selectedUid === item.uid ? ' selected' : ''}`}
                    style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, zIndex: item.z }}
                    onPointerDown={(e) => handleItemPointerDown(e, item.uid)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} draggable={false} />
                    {selectedUid === item.uid && (
                      <>
                        <button
                          className="viz-item-remove"
                          aria-label={`Quitar ${item.name}`}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => removeItem(item.uid)}
                        >
                          <Icon.Close style={{ width: 11, height: 11 }} />
                        </button>
                        <div
                          className="viz-item-resize"
                          onPointerDown={(e) => handleResizePointerDown(e, item.uid)}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="viz-canvas-actions">
                <button className="btn ghost" onClick={resetPhoto}>
                  <Icon.Trash /> Cambiar foto
                </button>
                <button className="btn" onClick={handleDownload} disabled={items.length === 0}>
                  Descargar imagen
                </button>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handlePhotoFile(e.target.files?.[0])}
          />
        </RevealOnScroll>

        {/* ── Catálogo lateral ───────────────────────────────── */}
        <RevealOnScroll delay={2} as="aside" className="viz-sidebar">
          <div className="mono" style={{ marginBottom: 12, fontSize: 9, letterSpacing: '0.18em' }}>
            Arrastrá un mueble a la foto
          </div>
          <div className="viz-sidebar-grid">
            {withImage.map((p) => (
              <button
                key={p.id}
                className="viz-thumb"
                draggable
                onDragStart={(e) => handleThumbDragStart(e, p)}
                onClick={() => addItem(p)}
                disabled={!photoUrl}
                title={photoUrl ? `Arrastrar o tocar para colocar «${p.name}»` : 'Subí una foto primero'}
              >
                <div className="viz-thumb-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.name} draggable={false} />
                </div>
                <span className="viz-thumb-name">{p.name}</span>
              </button>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
