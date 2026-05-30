'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import * as Icon from '@/components/ui/Icon'
import { useCart } from '@/lib/cart'
import { PIEZAS_MAYORES, PEQUENOS_TESOROS } from '@/lib/data'
import type { Product } from '@/lib/types'

interface Props {
  product: Product | null
  onClose: () => void
  onSelect: (p: Product) => void
}

export function ProductModal({ product, onClose, onSelect }: Props) {
  const [imgIdx, setImgIdx] = useState(0)
  const [added, setAdded]   = useState(false)
  const { add } = useCart()

  const allImages = product
    ? [product.imageUrl, ...(product.extraImages ?? [])].filter(Boolean) as string[]
    : []

  useEffect(() => { setImgIdx(0); setAdded(false) }, [product?.id])

  useEffect(() => {
    if (!product) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [product])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  // Don't render if no product — also avoids SSR portal issues
  if (!product) return null

  const onAdd = () => {
    add(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  const all     = [...PIEZAS_MAYORES, ...PEQUENOS_TESOROS]
  const related = all.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)

  return createPortal(
    <div className="modal-root">
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Sheet / Dialog */}
      <div className="product-modal" role="dialog" aria-modal="true" aria-label={product.name}>

        <div className="modal-handle" />

        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.16em' }}>Cerrar</span>
          <span style={{ width: 28, height: 28, border: '1px solid var(--line)', borderRadius: 999, display: 'grid', placeItems: 'center' }}>
            <Icon.Close />
          </span>
        </button>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="modal-body">

          {/* Gallery */}
          <div className="modal-gallery">
            <div className="modal-main-img">
              {allImages[imgIdx] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={allImages[imgIdx]} src={allImages[imgIdx]} alt={product.name} />
              )}
            </div>
            {allImages.length > 1 && (
              <div className="modal-thumbs">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    className={`modal-thumb${i === imgIdx ? ' active' : ''}`}
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
          <div className="modal-info">
            {product.tag && (
              <div className="mono" style={{ marginBottom: 10, fontSize: 9, letterSpacing: '0.18em' }}>{product.tag}</div>
            )}
            <div className="modal-name-row">
              <h2 className="modal-name">{product.name}</h2>
              <div className="modal-price">{product.price}</div>
            </div>
            <div className="mono" style={{ marginBottom: 3 }}>{product.material}</div>
            {product.origin && (
              <div className="mono" style={{ color: 'var(--ink-mute)' }}>{product.origin}</div>
            )}

            {/* Ficha técnica */}
            {product.specs && product.specs.length > 0 && (
              <div className="modal-specs">
                <div style={{ height: 1, background: 'var(--line)', margin: '20px 0 16px' }} />
                <div className="mono" style={{ marginBottom: 14, fontSize: 9, letterSpacing: '0.22em' }}>Ficha Técnica</div>
                {product.specs.map(spec => (
                  <div key={spec.label} className="modal-spec-row">
                    <span className="mono" style={{ color: 'var(--ink-mute)' }}>{spec.label}</span>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button className={`btn modal-cta${added ? ' added' : ''}`} onClick={onAdd}>
              {added
                ? <><span>✓</span>&nbsp;Añadido</>
                : <><Icon.Plus />&nbsp;Añadir a la selección</>}
            </button>
          </div>
        </div>

        {/* ── Related ────────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="modal-related">
            <div style={{ height: 1, background: 'var(--line)', marginBottom: 24 }} />
            <div className="mono" style={{ marginBottom: 18, fontSize: 9, letterSpacing: '0.22em' }}>
              También te puede gustar
            </div>
            <div className="modal-related-grid">
              {related.map(p => (
                <button key={p.id} className="modal-related-card" onClick={() => onSelect(p)}>
                  <div className="modal-related-img">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} />
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500, margin: '8px 0 3px', textAlign: 'left' }}>
                    {p.name}
                  </div>
                  <div className="mono" style={{ fontSize: 10, textAlign: 'left' }}>{p.price}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
