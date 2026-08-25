'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { Magnetic } from '@/components/ui/Magnetic'
import * as Icon from '@/components/ui/Icon'
import { Underline } from '@/components/ui/Underline'
import { SplitChars } from '@/components/ui/SplitChars'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/data'
import type { LookbookEntry, Product } from '@/lib/types'

interface InspiracionProps {
  items: LookbookEntry[]
  products: Product[]
}

export function Inspiracion({ items, products }: InspiracionProps) {
  const { add } = useCart()
  const [openMarker, setOpenMarker] = useState<string | null>(null)
  const [added, setAdded] = useState<string | null>(null)

  const matchProduct = (pieceName: string) =>
    products.find((prod) => prod.name.trim().toLowerCase() === pieceName.trim().toLowerCase())

  /* ── cierra la tarjeta del punto al clickear afuera o con Escape ─── */
  useEffect(() => {
    if (!openMarker) return
    const onPointerDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.look-hotspot-scope')) setOpenMarker(null)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMarker(null) }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [openMarker])

  const onQuickAdd = (p: Product) => {
    add(p)
    setAdded(p.id)
    setTimeout(() => setAdded((v) => v === p.id ? null : v), 1200)
  }

  return (
    <section data-dt="lookbook" id="inspiracion" style={{ position: 'relative', padding: '72px 0', background: 'var(--ink)', color: 'var(--bg)', overflow: 'hidden' }}>
      <div className="look-header" style={{ padding: '0 24px', marginBottom: 32 }}>
        <h2 className="display look-h2" data-reveal="headline" style={{ fontSize: 44, margin: 0, color: 'var(--bg)' }}>
          <SplitChars text="Cada hogar," /><br />
          <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}><Underline><SplitChars text="con su estilo" /></Underline></em>.
        </h2>
        <div className="subtitle-connector" data-reveal="up" data-delay="0.15">
          <p className="edit" style={{ margin: 0, color: 'rgba(242,241,237,0.7)', maxWidth: 380, fontSize: 18 }}>
            Te ayudamos a imaginar el potencial que tiene tu espacio.
          </p>
        </div>
      </div>

      <div
        className="look-items"
        style={{ display: 'flex', flexDirection: 'row', gap: 20, padding: '0 24px 12px', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' as const }}
      >
        {items.map((l, i) => {
          const hotspots = l.hotspots ?? []
          const linkedPieces = l.pieces
            .map((name) => matchProduct(name))
            .filter((prod): prod is Product => !!prod)

          return (
          <RevealOnScroll key={l.id} delay={Math.min(i, 3)} className="look-item-wrap" style={{ flex: '0 0 82%', scrollSnapAlign: 'start', position: 'relative' }}>
            <article className="look-item" style={{ position: 'relative' }}>

              {/* ── Image with border-light wrapper ────────────── */}
              <div
                className="look-frame"
                style={{
                  width: '100%',
                  position: 'relative',
                }}
              >
                <div className="look-img-box look-hotspot-scope" style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/5',
                  background: '#1a1a18',
                  overflow: 'hidden',
                }}>
                  {l.imageUrl ? (
                    <Image
                      data-reveal="clip"
                      className="look-img"
                      src={l.imageUrl}
                      alt={l.name}
                      fill
                      sizes="(min-width: 900px) 33vw, 82vw"
                      style={{ objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.6s ease' }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(242,241,237,0.25)' }}>
                      <Icon.ImageOff />
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.45) 100%)' }} />
                  <span style={{
                    position: 'absolute',
                    top: -18,
                    right: -8,
                    color: 'var(--bg)',
                    fontSize: 56,
                    fontFamily: 'var(--font-edit)',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    opacity: 0.92,
                    lineHeight: 1,
                  }}>{l.n}</span>

                  {/* ── Hotspots: "shop the look" ──────────────── */}
                  {hotspots.map((h, hi) => {
                    const product = products.find((p) => p.id === h.productId)
                    if (!product) return null
                    const key = `${l.id}:${hi}`
                    const isOpen = openMarker === key
                    const openUp = h.y > 55
                    const alignLeft = h.x < 25
                    const alignRight = h.x > 75

                    return (
                      <div key={key} style={{ position: 'absolute', left: `${h.x}%`, top: `${h.y}%`, zIndex: isOpen ? 32 : 30 }}>
                        <button
                          className="look-hotspot"
                          onClick={(e) => { e.stopPropagation(); setOpenMarker(isOpen ? null : key) }}
                          aria-label={`Ver ${product.name}`}
                          aria-expanded={isOpen}
                        >
                          <span className="look-hotspot-ring" />
                          <Icon.Plus width={11} height={11} />
                        </button>

                        {isOpen && (
                          <div
                            className={`look-hotspot-card${openUp ? ' up' : ''}${alignLeft ? ' left' : alignRight ? ' right' : ''}`}
                          >
                            <Link href={`/producto/${product.id}`} className="look-hotspot-thumb" aria-label={product.name}>
                              {product.imageUrl && (
                                <Image src={product.imageUrl} alt="" fill unoptimized sizes="52px" style={{ objectFit: 'cover' }} />
                              )}
                            </Link>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Link href={`/producto/${product.id}`} className="look-hotspot-name">{product.name}</Link>
                              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--ink)' }}>{formatPrice(product.priceNum)}</div>
                            </div>
                            <button
                              className="look-hotspot-add"
                              aria-label={`Añadir ${product.name}`}
                              onClick={() => onQuickAdd(product)}
                            >
                              {added === product.id ? '✓' : <Icon.Plus width={14} height={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Caption ────────────────────────────────────── */}
              <div className="look-cap" style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 22, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                  <em style={{ fontFamily: 'var(--font-edit)', fontStyle: 'italic', fontWeight: 400 }}>{l.name}</em>
                </h3>
                <div className="mono" style={{ color: 'rgba(242,241,237,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {l.place}
                  {l.isPatio && (
                    <span style={{ fontSize: 10, padding: '2px 8px', border: '1px solid rgba(242,241,237,0.3)', borderRadius: 999, letterSpacing: '0.06em', color: 'rgba(242,241,237,0.7)' }}>
                      Exterior
                    </span>
                  )}
                </div>
                <p className="edit" style={{ fontSize: 16, lineHeight: 1.4, margin: '4px 0 12px', color: 'rgba(242,241,237,0.8)' }}>
                  {l.desc}
                </p>
                {hotspots.length === 0 && linkedPieces.length > 0 && (
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: 'rgba(242,241,237,0.4)', marginBottom: 6 }}>
                      Piezas de este ambiente
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {linkedPieces.map((prod) => (
                      <Link
                        key={prod.id}
                        href={`/producto/${prod.id}`}
                        style={{ fontSize: 11, padding: '6px 10px', border: '1px solid rgba(242,241,237,0.2)', color: 'rgba(242,241,237,0.85)', letterSpacing: '0.04em', cursor: 'pointer', transition: 'background 0.2s, color 0.2s', textDecoration: 'none' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--ink)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(242,241,237,0.85)' }}
                      >
                        {prod.name}
                      </Link>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          </RevealOnScroll>
          )
        })}
      </div>

      <div style={{ padding: '40px 24px 0', textAlign: 'center' }}>
        <Magnetic>
          <Link href="/catalogo" className="btn" style={{ background: 'transparent', color: 'var(--bg)', borderColor: 'rgba(242,241,237,0.4)', textDecoration: 'none' }}>
            Ver todo el catálogo <Icon.Arrow />
          </Link>
        </Magnetic>
      </div>
    </section>
  )
}
