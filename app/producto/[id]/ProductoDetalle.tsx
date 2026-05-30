'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { Header } from '@/components/layout/Header'
import { CartDrawer } from '@/components/layout/CartDrawer'
import { Footer } from '@/components/layout/Footer'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
  related: Product[]
}

export function ProductoDetalle({ product, related }: Props) {
  const [imgIdx, setImgIdx]   = useState(0)
  const [added, setAdded]     = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { add } = useCart()

  const allImages = [product.imageUrl, ...(product.extraImages ?? [])].filter(Boolean) as string[]

  const onAdd = () => {
    add(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <>
      <Header onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <main style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* ── Back bar ─────────────────────────────────────── */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)' }}>
          <Link
            href="/#catalogo"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--ink-mute)', textDecoration: 'none',
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
          <div className="pd-gallery">
            <div className="pd-main-img">
              {allImages[imgIdx] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={allImages[imgIdx]} src={allImages[imgIdx]} alt={product.name} />
              )}
            </div>
            {allImages.length > 1 && (
              <div className="pd-thumbs">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    className={`pd-thumb${i === imgIdx ? ' active' : ''}`}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pd-info">
            {product.tag && (
              <div className="mono" style={{ marginBottom: 12, fontSize: 9, letterSpacing: '0.2em' }}>
                {product.tag}
              </div>
            )}

            <h1 className="pd-name">{product.name}</h1>
            <div className="pd-price">{product.price}</div>

            <div className="mono" style={{ marginBottom: 4, marginTop: 16 }}>{product.material}</div>
            {product.origin && (
              <div className="mono" style={{ color: 'var(--ink-mute)' }}>{product.origin}</div>
            )}

            {/* Ficha técnica */}
            {product.specs && product.specs.length > 0 && (
              <div className="pd-specs">
                <div style={{ height: 1, background: 'var(--line)', margin: '28px 0 20px' }} />
                <div className="mono" style={{ marginBottom: 16, fontSize: 9, letterSpacing: '0.22em' }}>
                  Ficha Técnica
                </div>
                {product.specs.map(spec => (
                  <div key={spec.label} className="pd-spec-row">
                    <span className="mono" style={{ color: 'var(--ink-mute)' }}>{spec.label}</span>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              className={`btn pd-cta${added ? ' added' : ''}`}
              onClick={onAdd}
            >
              {added
                ? <><span>✓</span>&nbsp;Añadido a la selección</>
                : <><Icon.Plus />&nbsp;Añadir a la selección</>}
            </button>

            <div className="mono" style={{ marginTop: 16, fontSize: 9, color: 'var(--ink-mute)', lineHeight: 1.7 }}>
              Consultas por WhatsApp · Envíos a todo el país<br />
              Pago en cuotas · Coordinar entrega
            </div>
          </div>
        </div>

        {/* ── Related ──────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="pd-related">
            <div style={{ height: 1, background: 'var(--line)' }} />
            <div style={{ padding: '40px 24px 0' }}>
              <div className="mono" style={{ marginBottom: 28, fontSize: 9, letterSpacing: '0.22em' }}>
                También te puede gustar
              </div>
              <div className="pd-related-grid">
                {related.map(p => (
                  <Link key={p.id} href={`/producto/${p.id}`} className="pd-related-card">
                    <div className="pd-related-img">
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} />
                      )}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500,
                      margin: '10px 0 4px', color: 'var(--ink)',
                    }}>
                      {p.name}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{p.price}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
