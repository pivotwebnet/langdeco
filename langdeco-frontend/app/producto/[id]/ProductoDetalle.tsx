'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { trackRecentlyViewed, useRecentlyViewed } from '@/lib/recentlyViewed'
import { useEscapeKey } from '@/lib/useEscapeKey'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { Tooltip } from '@/components/ui/Tooltip'
import { ProductCard } from '@/components/ui/ProductCard'
import * as Icon from '@/components/ui/Icon'
import { formatPrice } from '@/lib/data'
import type { Product } from '@/lib/types'

const WHATSAPP_NUMBER = '5493492287864'
const URGENT = '#A8432A'

interface Props {
  product: Product
  related: Product[]
}

export function ProductoDetalle({ product, related }: Props) {
  const [imgIdx, setImgIdx]   = useState(0)
  const [imgError, setImgError] = useState(false)
  const [added, setAdded]     = useState(false)
  const [addedRelatedId, setAddedRelatedId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [hoverZoom, setHoverZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const ctaRef = useRef<HTMLButtonElement>(null)
  const { add } = useCart()
  const { has: isSaved, toggle: toggleSaved } = useWishlist()
  const recentlyViewed = useRecentlyViewed(product.id)
  const router = useRouter()

  useEscapeKey(() => setZoomOpen(false))

  useEffect(() => {
    document.body.style.overflow = zoomOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [zoomOpen])

  useEffect(() => { trackRecentlyViewed(product) }, [product])

  const onAddRelated = (p: Product) => {
    add(p)
    setAddedRelatedId(p.id)
    setTimeout(() => setAddedRelatedId((v) => (v === p.id ? null : v)), 1200)
  }

  const allImages = [product.imageUrl, ...(product.extraImages ?? [])].filter(Boolean) as string[]
  const showMainImage = !!allImages[imgIdx] && !imgError
  const hasDiscount = !!product.originalPriceNum && product.originalPriceNum > product.priceNum
  const discountPercent = hasDiscount ? Math.round((1 - product.priceNum / product.originalPriceNum!) * 100) : null
  const isOutOfStock = product.stock !== undefined && product.stock <= 0
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3
  const showInstallment = product.priceNum > 0 && !isOutOfStock
  const maxQty = product.stock !== undefined ? Math.max(1, Math.min(product.stock, 99)) : 99

  useGSAP(() => {
    if (!added || !ctaRef.current) return
    gsap.fromTo(ctaRef.current, { scale: 1 }, { scale: 1.04, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1 })
  }, { dependencies: [added] })

  const onAdd = () => {
    if (isOutOfStock) return
    for (let i = 0; i < qty; i++) add(product)
    setAdded(true)
    setQty(1)
    setTimeout(() => setAdded(false), 1400)
  }

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, me interesa consultar por "${product.name}" (${product.price}). ¿Me pasás más información?`
  )}`

  return (
    <>
      <Header />

      <main style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* ── Back bar ─────────────────────────────────────── */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)' }}>
          <Link
            href="/catalogo"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--ink-soft)', textDecoration: 'none',
              fontFamily: 'ui-monospace, monospace', fontSize: 9,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
          >
            <Icon.Arrow style={{ transform: 'rotate(180deg)', width: 14, height: 14 }} />
            Catálogo
          </Link>
        </div>

        {/* ── Main: gallery + info ─────────────────────────── */}
        <div className="pd-body">

          {/* Gallery */}
          <RevealOnScroll className="pd-gallery">
            <div
              className="pd-main-wrap"
              onClick={() => showMainImage && setZoomOpen(true)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setZoomPos({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100,
                })
              }}
              onMouseEnter={() => setHoverZoom(true)}
              onMouseLeave={() => setHoverZoom(false)}
              style={{ cursor: showMainImage ? 'zoom-in' : 'default' }}
            >
              {showMainImage ? (
                <Image
                  key={allImages[imgIdx]}
                  src={allImages[imgIdx]}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(min-width: 900px) 50vw, 100vw"
                  priority={imgIdx === 0}
                  onError={() => setImgError(true)}
                  style={hoverZoom
                    ? { transform: 'scale(1.8)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transition: 'transform 0.05s linear, opacity 0.35s ease' }
                    : { transition: 'transform 0.25s ease, opacity 0.35s ease' }}
                />
              ) : (
                <ImagePlaceholder size={36} />
              )}
              {showMainImage && (
                <div className="pd-zoom-hint" aria-hidden="true">
                  <Icon.Search style={{ width: 14, height: 14 }} />
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="pd-thumbs">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    className={`pd-thumb${i === imgIdx ? ' active' : ''}`}
                    onClick={() => { setImgIdx(i); setImgError(false) }}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    <Image src={url} alt="" width={56} height={56} unoptimized />
                  </button>
                ))}
              </div>
            )}
          </RevealOnScroll>

          {/* Info */}
          <RevealOnScroll delay={1} className="pd-info">
            {(product.tag || isLowStock || isOutOfStock) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {product.tag && (
                  <span className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-soft)' }}>{product.tag}</span>
                )}
                {isOutOfStock ? (
                  <span className="mono" style={{ padding: '5px 10px', background: 'var(--ink)', color: 'var(--bg)', fontSize: 9, letterSpacing: '0.16em', borderRadius: 5 }}>
                    Sin stock
                  </span>
                ) : isLowStock && (
                  <span className="mono" style={{ padding: '5px 10px', background: URGENT, color: '#fff', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', borderRadius: 5 }}>
                    ¡Últimas {product.stock}!
                  </span>
                )}
              </div>
            )}

            <h1 className="pd-name">{product.name}</h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: showInstallment ? 10 : 20 }}>
              <span className="pd-price" style={{ color: hasDiscount ? 'var(--leaf)' : 'var(--ink)' }}>{product.price}</span>
              {hasDiscount && (
                <>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--ink-mute)', textDecoration: 'line-through' }}>
                    {formatPrice(product.originalPriceNum!)}
                  </span>
                  <span className="mono" style={{ padding: '4px 9px', background: 'var(--leaf)', color: '#fff', fontSize: 10, letterSpacing: '0.06em', borderRadius: 5 }}>
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {showInstallment && (
              <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 13px', background: 'var(--leaf)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', borderRadius: 999, marginBottom: 20 }}>
                ✓ 3 cuotas sin interés
              </span>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              <span className="mono" style={{ padding: '7px 12px', background: 'var(--umber)', color: '#F5EFE0', fontSize: 10, letterSpacing: '0.08em', borderRadius: 5 }}>
                {product.material}
              </span>
              {product.roomTags?.map((tag) => (
                <span key={tag} className="mono" style={{ padding: '7px 12px', background: 'rgba(242,241,237,0.7)', border: '1px solid var(--line)', color: 'var(--ink-soft)', fontSize: 10, letterSpacing: '0.08em', borderRadius: 5 }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Ficha técnica */}
            {product.specs && product.specs.length > 0 && (
              <div className="pd-specs">
                <div style={{ height: 1, background: 'var(--line)', margin: '28px 0 20px' }} />
                <div className="mono" style={{ marginBottom: 16, fontSize: 9, letterSpacing: '0.22em', color: 'var(--ink-soft)' }}>
                  Ficha Técnica
                </div>
                {product.specs.map(spec => (
                  <div key={spec.label} className="pd-spec-row">
                    <span className="mono" style={{ color: 'var(--ink-soft)' }}>{spec.label}</span>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {!isOutOfStock && (
              <div className="pd-qty-stepper" style={{ marginTop: product.specs?.length ? 20 : 24 }}>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Restar cantidad"
                >
                  <Icon.Minus style={{ width: 12, height: 12 }} />
                </button>
                <span aria-live="polite">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  aria-label="Sumar cantidad"
                >
                  <Icon.Plus style={{ width: 12, height: 12 }} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: isOutOfStock ? (product.specs?.length ? 0 : 24) : 10 }}>
              <button
                ref={ctaRef}
                className={`btn pd-cta${added ? ' added' : ''}`}
                onClick={onAdd}
                disabled={isOutOfStock}
                style={{ flex: 1, opacity: isOutOfStock ? 0.4 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
              >
                {isOutOfStock
                  ? 'Sin stock'
                  : added
                    ? <><span>✓</span>&nbsp;Añadido a la selección</>
                    : <><Icon.Plus />&nbsp;Añadir{qty > 1 ? ` ${qty}` : ''} a la selección</>}
              </button>
              <Tooltip label="Consulta rápida">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pd-wa-cta"
                  aria-label={`Consultar por ${product.name} en WhatsApp`}
                >
                  <Icon.Whatsapp />
                </a>
              </Tooltip>
              <Tooltip label={isSaved(product.id) ? 'Quitar de guardados' : 'Guardar'}>
                <button
                  className="pd-save-cta"
                  data-saved={isSaved(product.id)}
                  onClick={() => toggleSaved(product.id)}
                  aria-label={isSaved(product.id) ? `Quitar ${product.name} de guardados` : `Guardar ${product.name}`}
                  aria-pressed={isSaved(product.id)}
                >
                  <Icon.Heart filled={isSaved(product.id)} />
                </button>
              </Tooltip>
            </div>

            <div className="mono" style={{ marginTop: 16, fontSize: 9, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              Consultas por WhatsApp · Envíos a todo el país<br />
              Pago en cuotas · Coordinar entrega
            </div>
          </RevealOnScroll>
        </div>

        {/* ── Related ──────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="pd-related">
            <div style={{ height: 1, background: 'var(--line)' }} />
            <div style={{ padding: '24px 24px 0' }}>
              <div className="pd-related-label" style={{ marginBottom: 18 }}>
                También te puede gustar
              </div>
              <div className="pd-related-track">
                {related.map((p, i) => (
                  <RevealOnScroll key={p.id} delay={Math.min(i, 3)} className="pd-related-item">
                    <ProductCard
                      p={p}
                      variant="grid"
                      added={addedRelatedId}
                      onAdd={onAddRelated}
                      onSelect={(prod) => router.push(`/producto/${prod.id}`)}
                    />
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Vistos recientemente ────────────────────────────── */}
        {recentlyViewed.length > 0 && (
          <div className="pd-recent">
            <div style={{ padding: '0 24px' }}>
              <div className="pd-related-label" style={{ marginBottom: 18 }}>
                Vistos recientemente
              </div>
              <div className="pd-related-track">
                {recentlyViewed.map((p, i) => (
                  <RevealOnScroll key={p.id} delay={Math.min(i, 3)} className="pd-related-item">
                    <ProductCard
                      p={p}
                      variant="grid"
                      added={addedRelatedId}
                      onAdd={onAddRelated}
                      onSelect={(prod) => router.push(`/producto/${prod.id}`)}
                    />
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {zoomOpen && showMainImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada — ${product.name}`}
          onClick={() => setZoomOpen(false)}
          className="pd-lightbox"
        >
          <button
            onClick={() => setZoomOpen(false)}
            aria-label="Cerrar"
            className="pd-lightbox-close"
          >
            <Icon.Close />
          </button>

          <div className="pd-lightbox-frame" onClick={(e) => e.stopPropagation()}>
            <Image
              key={allImages[imgIdx]}
              src={allImages[imgIdx]}
              alt={product.name}
              fill
              unoptimized
              sizes="90vw"
              style={{ objectFit: 'contain' }}
            />
          </div>

          {allImages.length > 1 && (
            <>
              <button
                className="pd-lightbox-nav pd-lightbox-prev"
                aria-label="Foto anterior"
                onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + allImages.length) % allImages.length) }}
              >
                <Icon.Arrow style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button
                className="pd-lightbox-nav pd-lightbox-next"
                aria-label="Foto siguiente"
                onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % allImages.length) }}
              >
                <Icon.Arrow />
              </button>
            </>
          )}
        </div>
      )}

      <Footer />
    </>
  )
}
