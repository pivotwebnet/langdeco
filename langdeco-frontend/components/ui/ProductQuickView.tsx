'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEscapeKey } from '@/lib/useEscapeKey'
import { formatPrice } from '@/lib/data'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import { Tooltip } from '@/components/ui/Tooltip'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

const WHATSAPP_NUMBER = '5493492287864'
const URGENT = '#A8432A'

interface ProductQuickViewProps {
  product: Product | null
  onClose: () => void
  onAdd: (p: Product) => void
}

export function ProductQuickView({ product, onClose, onAdd }: ProductQuickViewProps) {
  // Guarda el id del último producto agregado en vez de un booleano: así, al abrir
  // otro producto, "added" da false sin necesitar un efecto que lo resetee.
  const [addedId, setAddedId] = useState<string | null>(null)
  const open = !!product
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEscapeKey(onClose)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* ── entrada suave al abrir: backdrop funde, panel sube con un leve rebote ─ */
  useGSAP(() => {
    if (!open || !backdropRef.current || !panelRef.current) return
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 28, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }
    )
  }, { dependencies: [product?.id] })

  if (!product) return null

  const added = addedId === product.id
  const hasDiscount = !!product.originalPriceNum && product.originalPriceNum > product.priceNum
  const discountPercent = hasDiscount ? Math.round((1 - product.priceNum / product.originalPriceNum!) * 100) : null
  const isOutOfStock = product.stock !== undefined && product.stock <= 0
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3
  const showInstallment = product.priceNum > 0 && !!product.installments && !isOutOfStock
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, me interesa consultar por "${product.name}" (${product.price}). ¿Me pasás más información?`
  )}`

  const handleAdd = () => {
    if (isOutOfStock) return
    onAdd(product)
    setAddedId(product.id)
  }

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Vista rápida — ${product.name}`}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: 'rgba(10,10,10,0.5)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="qv-panel"
        style={{
          position: 'relative',
          width: '100%', maxWidth: 720,
          maxHeight: '86vh', overflow: 'hidden', overflowY: 'auto',
          background: '#EDE6D2',
          borderRadius: 16,
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
          <Tooltip label="Cerrar">
            <button
              onClick={onClose}
              aria-label="Cerrar vista rápida"
              style={{
                width: 34, height: 34, borderRadius: 999,
                background: 'rgba(242,241,237,0.92)', border: 0, cursor: 'pointer',
                display: 'grid', placeItems: 'center', color: 'var(--ink)',
              }}
            >
              <Icon.Close />
            </button>
          </Tooltip>
        </div>

        <div className="qv-image" style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#ECEAE4', flexShrink: 0 }}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              sizes="(min-width: 900px) 320px, 100vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          ) : (
            <ImagePlaceholder size={32} />
          )}
        </div>

        <div style={{ padding: '28px 28px 32px' }}>
          {(isLowStock || isOutOfStock) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
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

          <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 24, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            {product.name}
          </h3>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: showInstallment ? 10 : 16 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em', color: hasDiscount ? 'var(--leaf)' : 'var(--ink)' }}>
              {product.price}
            </span>
            {hasDiscount && (
              <>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink-mute)', textDecoration: 'line-through' }}>
                  {formatPrice(product.originalPriceNum!)}
                </span>
                <span className="mono" style={{ padding: '4px 9px', background: 'var(--leaf)', color: '#fff', fontSize: 10, letterSpacing: '0.06em', borderRadius: 5 }}>
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {product.cardPriceNum != null && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink-mute)', marginBottom: 8 }}>
              {formatPrice(product.cardPriceNum)} con tarjeta
            </div>
          )}

          {showInstallment && (
            <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'var(--leaf)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', borderRadius: 999, marginBottom: 16 }}>
              ✓ {product.installments} cuotas sin interés
            </span>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            <span className="mono" style={{ padding: '6px 11px', background: 'var(--umber)', color: '#F5EFE0', fontSize: 10, letterSpacing: '0.08em', borderRadius: 5 }}>
              {product.material}
            </span>
            {product.roomTags?.map((tag) => (
              <span key={tag} className="mono" style={{ padding: '6px 11px', background: 'rgba(242,241,237,0.7)', border: '1px solid var(--line)', color: 'var(--ink-soft)', fontSize: 10, letterSpacing: '0.08em', borderRadius: 5 }}>
                {tag}
              </span>
            ))}
          </div>

          {product.specs && product.specs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ height: 1, background: 'var(--line)', marginBottom: 14 }} />
              {product.specs.slice(0, 4).map((spec) => (
                <div key={spec.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}>
                  <span className="mono" style={{ color: 'var(--ink-mute)' }}>{spec.label}</span>
                  <span>{spec.value}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button
              className={`btn${added ? ' added' : ''}`}
              onClick={handleAdd}
              disabled={isOutOfStock}
              style={{ flex: 1, justifyContent: 'center', opacity: isOutOfStock ? 0.4 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
            >
              {isOutOfStock ? 'Sin stock' : added ? <>✓&nbsp;Añadido</> : <><Icon.Plus />&nbsp;Añadir a la selección</>}
            </button>
            <Tooltip label="Consulta rápida">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Consultar por ${product.name} en WhatsApp`}
                style={{
                  width: 44, flexShrink: 0, borderRadius: 4,
                  border: '1px solid var(--line)', color: 'var(--whatsapp)',
                  display: 'grid', placeItems: 'center', textDecoration: 'none',
                }}
              >
                <Icon.Whatsapp />
              </a>
            </Tooltip>
          </div>

          <Link
            href={`/producto/${product.id}`}
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'ui-monospace, monospace', fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--ink-mute)', textDecoration: 'none',
            }}
          >
            Ver ficha completa <Icon.Arrow style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </div>
    </div>
  )
}
