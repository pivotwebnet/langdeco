'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useCart } from '@/lib/cart'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

const WHATSAPP_NUMBER = '5493492287864'

interface Props {
  product: Product
  related: Product[]
}

export function ProductoDetalle({ product, related }: Props) {
  const [imgIdx, setImgIdx]   = useState(0)
  const [imgError, setImgError] = useState(false)
  const [added, setAdded]     = useState(false)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const { add } = useCart()

  const allImages = [product.imageUrl, ...(product.extraImages ?? [])].filter(Boolean) as string[]
  const showMainImage = !!allImages[imgIdx] && !imgError

  useGSAP(() => {
    if (!added || !ctaRef.current) return
    gsap.fromTo(ctaRef.current, { scale: 1 }, { scale: 1.04, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1 })
  }, { dependencies: [added] })

  const onAdd = () => {
    add(product)
    setAdded(true)
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
            <div className="pd-main-wrap">
              {showMainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={allImages[imgIdx]} src={allImages[imgIdx]} alt={product.name} onError={() => setImgError(true)} />
              ) : (
                <ImagePlaceholder size={36} />
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

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                ref={ctaRef}
                className={`btn pd-cta${added ? ' added' : ''}`}
                onClick={onAdd}
                style={{ flex: 1 }}
              >
                {added
                  ? <><span>✓</span>&nbsp;Añadido a la selección</>
                  : <><Icon.Plus />&nbsp;Añadir a la selección</>}
              </button>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="pd-wa-cta"
                aria-label={`Consultar por ${product.name} en WhatsApp`}
              >
                <Icon.Whatsapp />
              </a>
            </div>

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
              <div className="pd-related-track">
                {related.map(p => (
                  <Link key={p.id} href={`/producto/${p.id}`} className="pd-related-card">
                    <div className="pd-related-img" style={{ position: 'relative' }}>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} />
                      ) : (
                        <ImagePlaceholder size={18} />
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
