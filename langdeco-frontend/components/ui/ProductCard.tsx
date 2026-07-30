'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
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
  onQuickView?: (p: Product) => void
  showBadge?: boolean
}

export function ProductCard({ p, variant = 'grid', added, onAdd, onSelect, onQuickView, showBadge }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const isAdded = added === p.id
  const showImage = !!p.imageUrl && !imgError
  const addBtnRef = useRef<HTMLButtonElement>(null)
  // Aspect fijo por variante — todas las cards del mismo listado miden igual,
  // sin importar la proporción de la foto que haya cargado cada producto.
  const aspect = variant === 'strip' ? '3/4' : '1/1'
  const installment = p.priceNum > 0 ? formatPrice(p.priceNum / 3) : null
  const hasDiscount = !!p.originalPriceNum && p.originalPriceNum > p.priceNum
  const discountPercent = hasDiscount ? Math.round((1 - p.priceNum / p.originalPriceNum!) * 100) : null
  const isOutOfStock = p.stock !== undefined && p.stock <= 0
  const isLowStock = p.stock !== undefined && p.stock > 0 && p.stock <= 3
  const roomTags = p.roomTags?.slice(0, 2) ?? []
  const extraRoomTags = (p.roomTags?.length ?? 0) - roomTags.length

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
          // Foto cargada por la administradora como URL libre (sin upload propio todavía —
          // ver Pendiente en DOCUMENTACION.md): puede ser cualquier dominio, así que se sirve
          // `unoptimized` en vez de pasar por el pipeline de optimización de next/image.
          <Image
            src={p.imageUrl!}
            alt={p.name}
            fill
            unoptimized
            sizes="(min-width: 900px) 33vw, 50vw"
            onError={() => setImgError(true)}
            style={{ objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.5s ease' }}
          />
        ) : (
          <ImagePlaceholder />
        )}

        <div className="prod-card-overlay" />
        <div className="prod-card-gradient" />

        {p.tag && (
          <div className="mono" style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, padding: '5px 9px', background: 'rgba(242,241,237,0.92)', fontSize: 8, letterSpacing: '0.12em' }}>
            {p.tag}
          </div>
        )}

        {hasDiscount && (
          <div className="mono" style={{ position: 'absolute', top: p.tag ? 34 : 10, left: 10, zIndex: 3, padding: '5px 9px', background: 'var(--leaf)', color: 'var(--bg)', fontSize: 8, letterSpacing: '0.12em' }}>
            -{discountPercent}%
          </div>
        )}

        {isOutOfStock && (
          <div className="mono" style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'grid', placeItems: 'center', background: 'rgba(242,241,237,0.6)' }}>
            <span style={{ padding: '6px 12px', background: 'var(--ink)', color: 'var(--bg)', fontSize: 9, letterSpacing: '0.16em' }}>Sin stock</span>
          </div>
        )}

        {showBadge && (
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 3, padding: '6px 10px', background: 'var(--ink)', color: 'var(--bg)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500 }}>
            ★ Favorito
          </div>
        )}

        {onQuickView && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickView(p) }}
            aria-label={`Vista rápida de ${p.name}`}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 4,
              width: 32, height: 32, borderRadius: 999,
              background: 'rgba(242,241,237,0.92)', color: 'var(--ink)',
              border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center',
              boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)',
              transition: 'background 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.color = 'var(--bg)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(242,241,237,0.92)'; e.currentTarget.style.color = 'var(--ink)' }}
          >
            <Icon.Eye />
          </button>
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
          disabled={isOutOfStock}
          onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) onAdd(p) }}
          style={{
            position: 'absolute', right: 10, bottom: 10, zIndex: 4,
            width: 36, height: 36, borderRadius: 999,
            background: isAdded ? 'var(--leaf)' : 'rgba(242,241,237,0.96)',
            color: isAdded ? 'var(--bg)' : 'var(--ink)',
            border: 0, cursor: isOutOfStock ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)',
            transition: 'background 0.25s, color 0.25s, transform 0.2s',
            fontSize: isAdded ? 16 : 'inherit',
            opacity: isOutOfStock ? 0.4 : 1,
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, marginTop: 2 }}>
            {hasDiscount && (
              <span style={{ fontFamily: 'ui-monospace,"SF Mono",Menlo,monospace', fontSize: variant === 'strip' ? 10 : 9, color: 'var(--ink-mute)', textDecoration: 'line-through' }}>
                {formatPrice(p.originalPriceNum!)}
              </span>
            )}
            <span style={{ fontFamily: 'ui-monospace,"SF Mono",Menlo,monospace', fontSize: variant === 'strip' ? 13 : 11, letterSpacing: '0.04em', color: hasDiscount ? 'var(--leaf)' : 'var(--ink)', fontWeight: 500 }}>
              {p.price}
            </span>
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-ui)', fontSize: variant === 'strip' ? 13 : 12, color: 'var(--ink-soft)', marginBottom: 6 }}>
          {p.material}
        </div>

        {roomTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {roomTags.map((tag) => (
              <span key={tag} className="mono" style={{ padding: '3px 7px', border: '1px solid var(--line)', borderRadius: 999, fontSize: 8, color: 'var(--ink-soft)' }}>
                {tag}
              </span>
            ))}
            {extraRoomTags > 0 && (
              <span className="mono" style={{ padding: '3px 7px', fontSize: 8, color: 'var(--ink-mute)' }}>+{extraRoomTags}</span>
            )}
          </div>
        )}

        {(installment || isLowStock) && !isOutOfStock && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            {installment && (
              <div className="mono" style={{ fontSize: 8, color: 'var(--ink-mute)' }}>
                3 cuotas de {installment}
              </div>
            )}
            {isLowStock && (
              <div className="mono" style={{ fontSize: 8, color: 'var(--ink)', fontWeight: 600 }}>
                ¡Últimas {p.stock} unidades!
              </div>
            )}
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
