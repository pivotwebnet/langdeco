'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { Underline } from '@/components/ui/Underline'
import { SplitChars } from '@/components/ui/SplitChars'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductQuickView } from '@/components/ui/ProductQuickView'
import type { Product } from '@/lib/types'

interface FavoritosProps {
  showBadge?: boolean
  items: Product[]
}

export function Favoritos({ showBadge = false, items: SELECCION }: FavoritosProps) {
  const [active, setActive] = useState(0)
  const [added, setAdded] = useState<string | null>(null)
  const [quickView, setQuickView] = useState<Product | null>(null)
  const { add } = useCart()
  const router = useRouter()

  const onAdd = (p: Product) => {
    add(p)
    setAdded(p.id)
    setTimeout(() => setAdded((v) => v === p.id ? null : v), 1200)
  }

  return (
    <section id="seleccion" data-dt="seleccion" style={{ position: 'relative', padding: '80px 0 64px', overflow: 'hidden', background: 'var(--bg-deep)' }}>
      <div className="sel-header" style={{ padding: '0 24px', marginBottom: 28 }}>
        <h2 className="display sel-h2" data-reveal="headline" style={{ fontSize: 34, margin: '16px 0 4px' }}>
          <SplitChars text="Nuestros" />{' '}
          <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}><Underline><SplitChars text="Favoritos" /></Underline></em>
        </h2>

        <div className="subtitle-connector" data-reveal="up" data-delay="0.15">
          <p className="edit" style={{ margin: 0, color: 'var(--ink-soft)', maxWidth: 320, fontSize: 20 }}>
            Piezas que entraron al showroom hace poco. Cada una con su pequeña historia.
          </p>
        </div>
      </div>

      {/* Horizontal scroll strip */}
      <div
        className="sel-strip"
        style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '8px 24px 24px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' as const }}
        onScroll={(e) => {
          const el = e.currentTarget
          const card = el.querySelector('[data-card]') as HTMLElement | null
          if (!card) return
          const w = card.getBoundingClientRect().width + 12
          const i = Math.round(el.scrollLeft / w)
          if (i !== active) setActive(Math.max(0, Math.min(SELECCION.length - 1, i)))
        }}
      >
        {SELECCION.map((p, i) => (
          <RevealOnScroll
            key={p.id}
            delay={Math.min(i, 3)}
            style={{ flex: '0 0 78%', scrollSnapAlign: 'start', position: 'relative' }}
          >
            <ProductCard
              p={p}
              variant="strip"
              onAdd={onAdd}
              added={added}
              showBadge={showBadge && i === 0}
              onSelect={(prod) => router.push(`/producto/${prod.id}`)}
              onQuickView={setQuickView}
            />
          </RevealOnScroll>
        ))}
        <div style={{ flex: '0 0 24px' }} />
      </div>

      {/* Pagination dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: -8, marginBottom: 8 }}>
        {SELECCION.map((p, i) => (
          <span key={p.id} style={{ width: i === active ? 18 : 6, height: 2, background: i === active ? 'var(--ink)' : 'var(--line)', transition: 'width 0.3s, background 0.3s' }} />
        ))}
      </div>

      <ProductQuickView product={quickView} onClose={() => setQuickView(null)} onAdd={onAdd} />
    </section>
  )
}
