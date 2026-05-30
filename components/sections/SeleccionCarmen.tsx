'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart'
import { SELECCION } from '@/lib/data'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { ParallaxElement } from '@/components/ui/ParallaxElement'
import * as Icon from '@/components/ui/Icon'

interface SeleccionCarmenProps {
  showBadge?: boolean
}

export function SeleccionCarmen({ showBadge = false }: SeleccionCarmenProps) {
  const [active, setActive] = useState(0)
  const [added, setAdded] = useState<string | null>(null)
  const { add } = useCart()

  const onAdd = (p: typeof SELECCION[number]) => {
    add({ id: p.id, name: p.name, material: p.material, price: p.price, priceNum: p.priceNum, category: p.category })
    setAdded(p.id)
    setTimeout(() => setAdded((v) => v === p.id ? null : v), 1200)
  }

  return (
    <section id="seleccion" data-dt="seleccion" style={{ position: 'relative', padding: '80px 0 64px', overflow: 'hidden' }}>
      <div className="sel-header" style={{ padding: '0 24px', marginBottom: 28 }}>
        <RevealOnScroll>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="kicker" />
            <span className="mono">{String(active + 1).padStart(2, '0')} / {String(SELECCION.length).padStart(2, '0')}</span>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={1}>
          <h2 className="display sel-h2" style={{ fontSize: 34, margin: '0 0 4px' }}>
            Nuestros <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>Favoritos</em>
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={2}>
          <p className="edit" style={{ margin: '14px 0 0', color: 'var(--ink-soft)', maxWidth: 320, fontSize: 20 }}>
            Cuatro piezas que entraron al showroom este otoño. Cada una con su pequeña historia.
          </p>
        </RevealOnScroll>
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
            <article data-card>
              <div style={{ position: 'relative', width: '100%', aspectRatio: p.aspect, marginBottom: 14, background: '#ECEAE4', overflow: 'hidden' }}>
                {p.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img data-reveal="clip" src={p.imageUrl} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                )}
                {showBadge && i === 0 && (
                  <div style={{ position: 'absolute', top: 12, left: 12, padding: '6px 10px', background: 'var(--ink)', color: 'var(--bg)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500 }}>
                    ★ Pieza Carmen
                  </div>
                )}
                <button
                  aria-label="Añadir"
                  onClick={() => onAdd(p)}
                  style={{
                    position: 'absolute', right: 10, bottom: 10,
                    width: 36, height: 36, borderRadius: 999,
                    background: added === p.id ? 'var(--leaf)' : 'var(--bg)',
                    color: added === p.id ? 'var(--bg)' : 'var(--ink)',
                    border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center',
                    boxShadow: '0 4px 14px -4px rgba(0,0,0,0.25)',
                    transition: 'background 0.25s, color 0.25s',
                    fontSize: added === p.id ? 16 : 'inherit',
                  }}
                >
                  {added === p.id ? '✓' : <Icon.Plus />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 17, fontWeight: 500, margin: 0, letterSpacing: '-0.005em' }}>{p.name}</h3>
                <span className="mono">{p.price}</span>
              </div>
              <div className="mono" style={{ marginBottom: 10 }}>{p.material}</div>
              <p className="edit" style={{ fontSize: 14, lineHeight: 1.45, margin: '0 0 8px', color: 'var(--ink-soft)' }}>
                <span style={{ fontStyle: 'normal', fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginRight: 6, color: 'var(--ink-mute)' }}>Nota ·</span>
                {p.note}
              </p>
              <div className="mono" style={{ color: 'var(--ink-mute)' }}>{p.origin}</div>
            </article>
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

      <ParallaxElement speed={0.5} rotate={-7} style={{ top: '18%', left: -70, width: 160, height: 160, zIndex: 1 }} tag="3D · sillón flotante">
        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)' }} />
      </ParallaxElement>
    </section>
  )
}
