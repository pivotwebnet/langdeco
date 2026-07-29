'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useEscapeKey } from '@/lib/useEscapeKey'
import { formatPrice } from '@/lib/data'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

const WHATSAPP_NUMBER = '5493492287864'

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

  useEscapeKey(onClose)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!product) return null

  const added = addedId === product.id
  const installment = product.priceNum > 0 ? formatPrice(product.priceNum / 3) : null
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, me interesa consultar por "${product.name}" (${product.price}). ¿Me pasás más información?`
  )}`

  const handleAdd = () => {
    onAdd(product)
    setAddedId(product.id)
  }

  return (
    <div
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
        onClick={(e) => e.stopPropagation()}
        className="qv-panel"
        style={{
          position: 'relative',
          width: '100%', maxWidth: 720,
          maxHeight: '86vh', overflowY: 'auto',
          background: 'var(--bg)',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.4)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar vista rápida"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 2,
            width: 34, height: 34, borderRadius: 999,
            background: 'rgba(242,241,237,0.92)', border: 0, cursor: 'pointer',
            display: 'grid', placeItems: 'center', color: 'var(--ink)',
          }}
        >
          <Icon.Close />
        </button>

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
          {product.tag && (
            <div className="mono" style={{ marginBottom: 10, fontSize: 9, letterSpacing: '0.2em' }}>{product.tag}</div>
          )}
          <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 24, fontWeight: 500, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            {product.name}
          </h3>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 16, marginBottom: 4 }}>{product.price}</div>
          {installment && (
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', marginBottom: 14 }}>
              3 cuotas de {installment}
            </div>
          )}
          <div className="mono" style={{ marginBottom: 16 }}>{product.material}</div>

          {product.note && (
            <p className="edit" style={{ fontSize: 15, lineHeight: 1.5, margin: '0 0 18px', color: 'var(--ink-soft)' }}>
              {product.note}
            </p>
          )}

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
            <button className={`btn${added ? ' added' : ''}`} onClick={handleAdd} style={{ flex: 1, justifyContent: 'center' }}>
              {added ? <>✓&nbsp;Añadido</> : <><Icon.Plus />&nbsp;Añadir a la selección</>}
            </button>
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
