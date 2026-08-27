'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as Icon from '@/components/ui/Icon'
import { Underline } from '@/components/ui/Underline'
import { SplitChars } from '@/components/ui/SplitChars'
import { Tooltip } from '@/components/ui/Tooltip'
import { useCart } from '@/lib/cart'
import type { Product } from '@/lib/types'
import type { BackendCategory } from '@/lib/backend-types'

interface Props {
  products: Product[]
  categories?: BackendCategory[]
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

export function Visualizador({ products, categories = [], compact = false }: Props) {
  const cart = useCart()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoSize, setPhotoSize] = useState<{ w: number; h: number } | null>(null)
  const [items, setItems] = useState<PlacedItem[]>([])
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [addedId, setAddedId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const changeCategoryFilter = (id: string | null) => setCategoryFilter(id)

  function addToCart(product: Product) {
    cart.add(product)
    setAddedId(product.id)
    setTimeout(() => setAddedId((v) => (v === product.id ? null : v)), 1200)
  }

  const wrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const catalogRef = useRef<HTMLDivElement>(null)
  const canvasColRef = useRef<HTMLDivElement>(null)
  const catTitleRef = useRef<HTMLDivElement>(null)
  const zCounter = useRef(1)

  // Hay muchas más categorías de las que entran en la altura del cuadro de la
  // foto — un CSS fijo no puede "adivinar" esa altura (cambia con el tamaño de
  // la foto subida y el breakpoint), así que se mide en vivo con ResizeObserver
  // y se aplica como max-height a la columna de categorías (menos el alto del
  // título "Categorías" que va arriba), con scroll interno para las que no entren.
  const [catColMaxHeight, setCatColMaxHeight] = useState<number | null>(null)
  const CAT_TITLE_GAP = 10
  useEffect(() => {
    const el = canvasColRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const titleH = catTitleRef.current?.offsetHeight ?? 0
      setCatColMaxHeight(entry.contentRect.height - titleH - CAT_TITLE_GAP)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // El límite de altura solo aplica cuando el layout está en fila (desktop) —
  // en mobile las columnas van apiladas, ahí las categorías deben mostrarse
  // completas sin recortarse.
  const [isRowLayout, setIsRowLayout] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const update = () => setIsRowLayout(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const withImage = products.filter((p) => p.imageUrl)
  const filteredProducts = categoryFilter ? withImage.filter((p) => p.category === categoryFilter) : withImage

  // Flechas en vez de la barra de scroll nativa — igual siguen pudiendo deslizar
  // con el dedo/mouse, las flechas solo dan otra forma de moverse por la fila.
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const updateCatalogScroll = () => {
    const el = catalogRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }
  useEffect(() => { updateCatalogScroll() }, [filteredProducts.length])
  const scrollCatalog = (dir: 1 | -1) => {
    catalogRef.current?.scrollBy({ left: dir * catalogRef.current.clientWidth * 0.8, behavior: 'smooth' })
  }

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

  async function buildCompositeCanvas(): Promise<HTMLCanvasElement | null> {
    if (!photoUrl || !photoSize) return null
    const canvas = document.createElement('canvas')
    canvas.width = photoSize.w
    canvas.height = photoSize.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

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
    return canvas
  }

  async function handleDownload() {
    const canvas = await buildCompositeCanvas()
    if (!canvas) return
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

  // Compartir el ARCHIVO de imagen (no solo un link/texto) a WhatsApp desde la web
  // solo es posible vía Web Share API con `files` — la soportan los navegadores
  // mobile (donde vive WhatsApp), no la mayoría de desktop, y no hay forma de
  // adjuntar una imagen a un chat de WhatsApp por URL sin la API de Negocios de
  // Meta. Si no está disponible, se descarga la imagen para adjuntarla a mano.
  async function handleShareWhatsapp() {
    const canvas = await buildCompositeCanvas()
    if (!canvas) return
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) { alert('No se pudo generar la imagen para compartir.'); return }
    const file = new File([blob], 'mi-espacio-laslangdeco.png', { type: 'image/png' })

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Mi espacio LasLangDeco', text: '¡Mirá cómo quedaría este espacio!' })
        return
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
      }
    }

    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'mi-espacio-laslangdeco.png'
    a.click()
    alert('Tu navegador no permite compartir la imagen directamente por WhatsApp — se descargó para que la adjuntes vos.')
  }

  return (
    <section id="visualizador" data-dt="visualizador-embed" data-size={compact ? 'compact' : undefined} style={{ position: 'relative', padding: '32px 24px 72px' }}>
      <div style={{ marginBottom: 28, maxWidth: 640 }}>
        <div className="kicker" data-reveal="up" style={{ marginBottom: 10 }}>Probalo en tu casa</div>
        <h2 className="display" data-reveal="headline" style={{ fontSize: compact ? 'clamp(24px, 4.5vw, 34px)' : 'clamp(28px, 5vw, 40px)', margin: '0 0 16px' }}>
          <SplitChars text="Visualizador de" />{' '}
          <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}><Underline><SplitChars text="espacios" /></Underline></em>
        </h2>
        <div className="subtitle-connector" data-reveal="up" data-delay="0.15" style={{ maxWidth: 480 }}>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            Subí una foto de tu ambiente y arrastrá piezas del catálogo encima para imaginar cómo quedan
            antes de comprar. Podés moverlas, cambiarlas de tamaño y descargar el resultado.
          </p>
        </div>
      </div>

      <div className="viz-layout">
        <div className="viz-top">
        {/* ── Canvas ─────────────────────────────────────────── */}
        <div className="viz-canvas-col" ref={canvasColRef}>
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
                        <Tooltip label="Quitar">
                          <button
                            className="viz-item-remove"
                            aria-label={`Quitar ${item.name}`}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => removeItem(item.uid)}
                          >
                            <Icon.Close style={{ width: 11, height: 11 }} />
                          </button>
                        </Tooltip>
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
                <button className="btn ghost" onClick={handleShareWhatsapp} disabled={items.length === 0}>
                  <Icon.Whatsapp style={{ width: 15, height: 15 }} /> Enviar por WhatsApp
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
        </div>

        {/* ── Categorías, a la derecha del cuadro de subir foto ── */}
        {categories.length > 0 && (
          <div className="viz-cat-block">
            <div ref={catTitleRef} className="mono" style={{ fontSize: 9, letterSpacing: '0.18em' }}>
              Categorías
            </div>
            <div
              className="viz-cat-col"
              style={isRowLayout && catColMaxHeight ? { maxHeight: catColMaxHeight, overflowY: 'auto' } : undefined}
            >
              <button
                type="button"
                onClick={() => changeCategoryFilter(null)}
                className="viz-cat-chip"
                data-active={categoryFilter === null}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => changeCategoryFilter(c.id)}
                  className="viz-cat-chip"
                  data-active={categoryFilter === c.id}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
        </div>

        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.18em' }}>
          Arrastrá un mueble a la foto
        </div>

        {/* ── Catálogo, fila horizontal debajo de la foto ─────── */}
        <aside className="viz-sidebar">
          <div className="viz-catalog">
            <button
              type="button"
              className="viz-catalog-arrow prev"
              onClick={() => scrollCatalog(-1)}
              disabled={!canScrollLeft}
              aria-label="Ver productos anteriores"
            >
              <Icon.Arrow style={{ transform: 'rotate(180deg)' }} />
            </button>

            <div className="viz-sidebar-grid" ref={catalogRef} onScroll={updateCatalogScroll}>
            {filteredProducts.map((p) => (
              <div key={p.id} className="viz-thumb">
                <div
                  className="viz-thumb-img"
                  draggable={!!photoUrl}
                  onDragStart={(e) => handleThumbDragStart(e, p)}
                  onClick={() => photoUrl && addItem(p)}
                  role="button"
                  tabIndex={photoUrl ? 0 : -1}
                  aria-disabled={!photoUrl}
                  title={photoUrl ? `Arrastrar o tocar para colocar «${p.name}»` : 'Subí una foto primero'}
                  style={!photoUrl ? { cursor: 'default', opacity: 0.5 } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.name} draggable={false} />
                  <div className="viz-thumb-actions">
                    <Tooltip label="Agregar al carrito">
                      <button
                        type="button"
                        className="viz-thumb-action"
                        onClick={(e) => { e.stopPropagation(); addToCart(p) }}
                        aria-label={`Agregar ${p.name} al carrito`}
                      >
                        {addedId === p.id ? '✓' : <Icon.Cart style={{ width: 13, height: 13 }} />}
                      </button>
                    </Tooltip>
                    <Tooltip label="Ver detalle">
                      <Link
                        href={`/producto/${p.id}`}
                        className="viz-thumb-action"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Ver detalle de ${p.name}`}
                      >
                        <Icon.Eye style={{ width: 13, height: 13 }} />
                      </Link>
                    </Tooltip>
                  </div>
                </div>
                <span className="viz-thumb-name">{p.name}</span>
              </div>
            ))}
            </div>

            <button
              type="button"
              className="viz-catalog-arrow next"
              onClick={() => scrollCatalog(1)}
              disabled={!canScrollRight}
              aria-label="Ver más productos"
            >
              <Icon.Arrow />
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}
