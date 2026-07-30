'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductQuickView } from '@/components/ui/ProductQuickView'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

const PAGE_SIZE = 6

const tabStyle = (active: boolean) => ({
  padding: '12px 20px',
  background: active ? 'var(--ink)' : 'transparent',
  color: active ? 'var(--bg)' : 'var(--ink)',
  border: 0, cursor: 'pointer',
  fontFamily: 'var(--font-ui)', fontSize: 11,
  letterSpacing: '0.16em', textTransform: 'uppercase' as const,
  fontWeight: 500, transition: 'background 0.25s, color 0.25s',
})

interface ProductosProps {
  products: Product[]
  initialCategory?: 'mayor' | 'tesoro'
}

export function Productos({ products, initialCategory }: ProductosProps) {
  const [tab, setTab] = useState<'mayores' | 'tesoros'>(initialCategory === 'tesoro' ? 'tesoros' : 'mayores')
  const [added, setAdded] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [quickView, setQuickView] = useState<Product | null>(null)
  const { add } = useCart()
  const router = useRouter()

  const onAdd = (p: Product) => {
    add(p)
    setAdded(p.id)
    setTimeout(() => setAdded(v => v === p.id ? null : v), 1200)
  }

  const changeTab = (t: typeof tab) => { setTab(t); setPage(0) }

  const piezasMayores  = products.filter(p => p.category === 'mayor')
  const pequenosTesoros = products.filter(p => p.category === 'tesoro')
  const items      = tab === 'mayores' ? piezasMayores : pequenosTesoros
  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pageItems  = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <section data-dt="productos" id="catalogo" style={{ position: 'relative', padding: '88px 0 80px', overflow: 'hidden' }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="prod-header" style={{ padding: '0 24px', marginBottom: 32 }}>
          <h2 className="display prod-h2" data-reveal="headline" style={{ fontSize: 34, margin: '16px 0 14px' }}>
            Para <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>casi</em><br />todo lo demás.
          </h2>

          <RevealOnScroll delay={2}>
            <p className="edit" style={{ margin: '0 0 28px', color: 'var(--ink-soft)', maxWidth: 380, fontSize: 20 }}>
              Dos casas dentro de la casa. Las piezas grandes que{' '}
              <strong style={{ fontWeight: 500, fontStyle: 'normal' }}>cambian un cuarto</strong>; y los pequeños tesoros que lo{' '}
              <strong style={{ fontWeight: 500, fontStyle: 'normal' }}>terminan</strong>.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={2}>
            <div role="tablist" style={{ display: 'inline-flex', alignItems: 'stretch', border: '1px solid var(--ink)' }}>
              <button role="tab" aria-selected={tab === 'mayores'} onClick={() => changeTab('mayores')} style={tabStyle(tab === 'mayores')}>
                Piezas Mayores
              </button>
              <button role="tab" aria-selected={tab === 'tesoros'} onClick={() => changeTab('tesoros')} style={{ ...tabStyle(tab === 'tesoros'), borderLeft: '1px solid var(--ink)' }}>
                Pequeños Tesoros
              </button>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={3}>
            <div style={{ marginTop: 16 }}>
              <span className="mono">
                {tab === 'mayores' ? 'Desde $ 2.190.000 · piezas de inversión' : 'Desde $ 22.000 · regalos, detalles, comienzos'}
              </span>
            </div>
          </RevealOnScroll>
        </div>

        {/* ── Grid + arrows ────────────────────────────────────── */}
        <div className="prod-nav">
          <button
            className="prod-arrow prod-arrow-left"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 0}
            aria-label="Página anterior"
          >
            <Icon.Arrow style={{ transform: 'rotate(180deg)' }} />
          </button>

          <div
            className={tab === 'mayores' ? 'prod-grid-mayores' : 'prod-grid-tesoros'}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px 16px' }}
          >
            {pageItems.map((p, i) => (
              <RevealOnScroll key={`${p.id}-${page}`} delay={Math.min(i, 3)}>
                <ProductCard
                  p={p}
                  variant="grid"
                  onAdd={onAdd}
                  added={added}
                  onSelect={(prod) => router.push(`/producto/${prod.id}`)}
                  onQuickView={setQuickView}
                />
              </RevealOnScroll>
            ))}
          </div>

          <button
            className="prod-arrow prod-arrow-right"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
            aria-label="Página siguiente"
          >
            <Icon.Arrow />
          </button>
        </div>

        {/* ── Page dots ────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 32, padding: '0 24px' }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} aria-label={`Página ${i + 1}`}
                style={{ width: i === page ? 24 : 8, height: 2, border: 0, padding: 0, cursor: 'pointer', background: i === page ? 'var(--ink)' : 'var(--line)', transition: 'width 0.3s, background 0.3s' }}
              />
            ))}
          </div>
        )}

        <ProductQuickView product={quickView} onClose={() => setQuickView(null)} onAdd={onAdd} />
    </section>
  )
}
