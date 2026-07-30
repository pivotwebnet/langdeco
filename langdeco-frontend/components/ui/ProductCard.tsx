'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import * as Icon from '@/components/ui/Icon'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatPrice } from '@/lib/data'
import type { Product } from '@/lib/types'

const WHATSAPP_NUMBER = '5493492287864'
const URGENT = '#A8432A'

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
        style={{ width: '100%', aspectRatio: aspect, marginBottom: 8 }}
      >
        <div className="prod-card-media" style={{ background: '#ECEAE4' }}>
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

          {isOutOfStock && (
            <div className="mono" style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'grid', placeItems: 'center', background: 'rgba(242,241,237,0.6)' }}>
              <span style={{ padding: '6px 12px', background: 'var(--ink)', color: 'var(--bg)', fontSize: 9, letterSpacing: '0.16em' }}>Sin stock</span>
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', top: 10, left: 10, right: 50, zIndex: 3, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-start' }}>
          {isLowStock && !isOutOfStock && (
            <Tooltip label="Quedan pocas unidades en stock">
              <span className="mono" style={{ padding: '7px 11px', background: URGENT, color: '#fff', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, borderRadius: 5 }}>
                ¡Últimas {p.stock}!
              </span>
            </Tooltip>
          )}

          {showBadge && (
            <span className="mono" style={{ padding: '7px 11px', background: 'var(--ink)', color: 'var(--bg)', fontSize: 10, letterSpacing: '0.1em', borderRadius: 5 }}>
              ★ Favorito
            </span>
          )}

          {p.tag && (
            <span className="mono" style={{ padding: '7px 11px', background: 'rgba(242,241,237,0.92)', fontSize: 10, letterSpacing: '0.1em', borderRadius: 5 }}>
              {p.tag}
            </span>
          )}

          {hasDiscount && (
            <span className="mono" style={{ padding: '7px 11px', background: 'var(--leaf)', color: 'var(--bg)', fontSize: 10, letterSpacing: '0.1em', borderRadius: 5 }}>
              -{discountPercent}%
            </span>
          )}

          {roomTags.map((tag) => (
            <Tooltip key={tag} label="Ambiente">
              <span className="mono" style={{ padding: '7px 11px', background: 'rgba(242,241,237,0.92)', fontSize: 10, letterSpacing: '0.08em', borderRadius: 5 }}>
                {tag}
              </span>
            </Tooltip>
          ))}

          {extraRoomTags > 0 && (
            <span className="mono" style={{ padding: '7px 11px', background: 'rgba(242,241,237,0.92)', fontSize: 10, borderRadius: 5, color: 'var(--ink-mute)' }}>
              +{extraRoomTags}
            </span>
          )}
        </div>

        {p.material && (
          <div style={{ position: 'absolute', left: 10, bottom: 10, zIndex: 4 }}>
            <Tooltip label="Material" side="bottom">
              <span className="mono" style={{ padding: '7px 11px', background: 'var(--umber)', color: '#F5EFE0', fontSize: 10, letterSpacing: '0.08em', borderRadius: 5, boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)' }}>
                {p.material}
              </span>
            </Tooltip>
          </div>
        )}

        {onQuickView && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 4 }}>
            <Tooltip label="Detalle">
              <button
                onClick={(e) => { e.stopPropagation(); onQuickView(p) }}
                aria-label={`Vista rápida de ${p.name}`}
                style={{
                  width: 40, height: 40, borderRadius: 999,
                  background: 'rgba(242,241,237,0.92)', color: 'var(--ink)',
                  border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center',
                  boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)',
                  transition: 'background 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.color = 'var(--bg)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(242,241,237,0.92)'; e.currentTarget.style.color = 'var(--ink)' }}
              >
                <Icon.Eye width={19} height={19} />
              </button>
            </Tooltip>
          </div>
        )}

        <div style={{ position: 'absolute', right: 60, bottom: 10, zIndex: 4 }}>
          <Tooltip label="Consulta rápida">
            <a
              href={whatsappHref(p)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Consultar por ${p.name} en WhatsApp`}
              style={{
                width: 42, height: 42, borderRadius: 999,
                background: 'rgba(242,241,237,0.96)', color: 'var(--whatsapp)',
                display: 'grid', placeItems: 'center',
                boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)',
                transition: 'background 0.2s, color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--whatsapp)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(242,241,237,0.96)'; e.currentTarget.style.color = 'var(--whatsapp)' }}
            >
              <Icon.Whatsapp width={19} height={19} />
            </a>
          </Tooltip>
        </div>

        <div style={{ position: 'absolute', right: 10, bottom: 10, zIndex: 4 }}>
          <Tooltip label="Agregar">
            <button
              ref={addBtnRef}
              aria-label="Añadir al carrito"
              disabled={isOutOfStock}
              onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) onAdd(p) }}
              style={{
                width: 42, height: 42, borderRadius: 999,
                background: isAdded ? 'var(--leaf)' : 'rgba(242,241,237,0.96)',
                color: isAdded ? 'var(--bg)' : 'var(--ink)',
                border: 0, cursor: isOutOfStock ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center',
                boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)',
                transition: 'background 0.25s, color 0.25s, transform 0.2s',
                fontSize: isAdded ? 18 : 'inherit',
                opacity: isOutOfStock ? 0.4 : 1,
              }}
            >
              {isAdded ? '✓' : <Icon.Plus width={17} height={17} />}
            </button>
          </Tooltip>
        </div>
      </div>

      <div>
        <h3 className="prod-card-title" style={{ fontFamily: 'var(--font-ui)', fontSize: variant === 'strip' ? 21 : 16, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--ink)' }}>
          {p.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: variant === 'strip' ? 24 : 19, letterSpacing: '-0.01em', color: hasDiscount ? 'var(--leaf)' : 'var(--ink)', fontWeight: 600 }}>
            {p.price}
          </span>
          {hasDiscount && (
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: variant === 'strip' ? 13 : 11, color: 'var(--ink-mute)', textDecoration: 'line-through' }}>
              {formatPrice(p.originalPriceNum!)}
            </span>
          )}
        </div>

        {installment && !isOutOfStock && (
          <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: 'var(--leaf)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', borderRadius: 999 }}>
            ✓ 3 cuotas sin interés
          </span>
        )}

        {onSelect && (
          <button
            className="prod-card-detail-btn"
            onClick={(e) => { e.stopPropagation(); onSelect(p) }}
            style={{
              width: '100%', marginTop: 10,
              padding: '13px 16px', borderRadius: 8,
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Ver detalles
          </button>
        )}
      </div>
    </article>
  )
}
