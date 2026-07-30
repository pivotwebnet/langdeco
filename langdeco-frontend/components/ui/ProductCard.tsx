'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import * as Icon from '@/components/ui/Icon'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import { formatPrice } from '@/lib/data'
import type { Product } from '@/lib/types'

const WHATSAPP_NUMBER = '5493492287864'

function whatsappHref(p: Product) {
  const msg = `Hola, me interesa consultar por "${p.name}" (${p.price}). ¿Me pasás más información?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

interface ProductCardProps {
  p: Product
  variant?: 'grid' | 'strip'
  added: string | null
  onAdd: (p: Product) => void
  onSelect?: (p: Product) => void
  showBadge?: boolean
}

export function ProductCard({ p, variant = 'grid', added, onAdd, onSelect, showBadge }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const isAdded = added === p.id
  const showImage = !!p.imageUrl && !imgError
  const addBtnRef = useRef<HTMLButtonElement>(null)
  // Aspect fijo por variante — todas las cards del mismo listado miden igual,
  // sin importar la proporción de la foto que haya cargado cada producto.
  const aspect = variant === 'strip' ? '3/4' : '1/1'
  const installment = p.priceNum > 0 ? formatPrice(p.priceNum / 3) : null

  useGSAP(() => {
    if (!isAdded || !addBtnRef.current) return
    gsap.fromTo(addBtnRef.current, { scale: 1 }, { scale: 1.25, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 })
  }, { dependencies: [isAdded] })

  return (
    <article
      className={`prod-card prod-card-${variant}`}
      data-card={variant === 'strip' ? true : undefined}
      onClick={onSelect ? () => onSelect(p) : undefined}
      style={onSelect ? { cursor: 'pointer' } : undefined}
    >
      <div
        className="prod-card-img"
        style={{ position: 'relative', width: '100%', aspectRatio: aspect, background: '#ECEAE4', marginBottom: 8, overflow: 'hidden' }}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            onError={() => setImgError(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.5s ease' }}
          />
        ) : (
          <ImagePlaceholder />
        )}

        <div className="prod-card-overlay" />
        <div className="prod-card-gradient" />

        {variant === 'grid' && <div className="prod-card-price-label">{p.price}</div>}

        {p.tag && (
          <div className="mono" style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, padding: '5px 9px', background: 'rgba(242,241,237,0.92)', fontSize: 8, letterSpacing: '0.12em' }}>
            {p.tag}
          </div>
        )}

        {showBadge && (
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 3, padding: '6px 10px', background: 'var(--ink)', color: 'var(--bg)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500 }}>
            ★ Favorito
          </div>
        )}

        <a
          href={whatsappHref(p)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Consultar por ${p.name} en WhatsApp`}
          style={{
            position: 'absolute', right: 54, bottom: 10, zIndex: 4,
            width: 36, height: 36, borderRadius: 999,
            background: 'rgba(242,241,237,0.96)', color: 'var(--whatsapp)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)',
            transition: 'background 0.2s, color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--whatsapp)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(242,241,237,0.96)'; e.currentTarget.style.color = 'var(--whatsapp)' }}
        >
          <Icon.Whatsapp />
        </a>

        <button
          ref={addBtnRef}
          aria-label="Añadir al carrito"
          onClick={(e) => { e.stopPropagation(); onAdd(p) }}
          style={{
            position: 'absolute', right: 10, bottom: 10, zIndex: 4,
            width: 36, height: 36, borderRadius: 999,
            background: isAdded ? 'var(--leaf)' : 'rgba(242,241,237,0.96)',
            color: isAdded ? 'var(--bg)' : 'var(--ink)',
            border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)',
            transition: 'background 0.25s, color 0.25s, transform 0.2s',
            fontSize: isAdded ? 16 : 'inherit',
          }}
        >
          {isAdded ? '✓' : <Icon.Plus />}
        </button>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
          <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: variant === 'strip' ? 17 : 13, fontWeight: 500, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
            {p.name}
          </h3>
          <span style={{ fontFamily: 'ui-monospace,"SF Mono",Menlo,monospace', fontSize: variant === 'strip' ? 13 : 11, letterSpacing: '0.04em', color: 'var(--ink)', fontWeight: 500, flexShrink: 0, marginTop: 2 }}>
            {p.price}
          </span>
        </div>
        <div className="mono" style={{ marginBottom: 3, fontSize: variant === 'strip' ? 10 : 9 }}>{p.material}</div>
        {installment && (
          <div className="mono" style={{ fontSize: 8, color: 'var(--ink-mute)' }}>
            3 cuotas de {installment}
          </div>
        )}

        {variant === 'strip' && p.note && (
          <p className="edit" style={{ fontSize: 14, lineHeight: 1.45, margin: '8px 0', color: 'var(--ink-soft)' }}>
            <span style={{ fontStyle: 'normal', fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginRight: 6, color: 'var(--ink-mute)' }}>Nota ·</span>
            {p.note}
          </p>
        )}
      </div>
    </article>
  )
}
