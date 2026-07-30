'use client'

import Link from 'next/link'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { Magnetic } from '@/components/ui/Magnetic'
import * as Icon from '@/components/ui/Icon'
import type { LookbookEntry, Product } from '@/lib/types'

interface InspiracionProps {
  items: LookbookEntry[]
  products: Product[]
}

export function Inspiracion({ items, products }: InspiracionProps) {
  const matchProduct = (pieceName: string) =>
    products.find((prod) => prod.name.trim().toLowerCase() === pieceName.trim().toLowerCase())
  return (
    <section data-dt="lookbook" id="inspiracion" style={{ position: 'relative', padding: '72px 0', background: 'var(--ink)', color: 'var(--bg)', overflow: 'hidden' }}>
      <div className="look-header" style={{ padding: '0 24px', marginBottom: 32 }}>
        <RevealOnScroll delay={1}>
          <h2 className="display look-h2" style={{ fontSize: 38, margin: 0, color: 'var(--bg)' }}>
            Tres casas,<br />
            <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>tres reposos</em>.
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={2}>
          <p className="edit" style={{ margin: '16px 0 0', color: 'rgba(242,241,237,0.7)', maxWidth: 380, fontSize: 18 }}>
            Te ayudamos a imaginar el potencial que tiene tu espacio.
          </p>
        </RevealOnScroll>
      </div>

      <div className="look-items" style={{ display: 'flex', flexDirection: 'column', gap: 56, padding: '0 24px' }}>
        {items.map((l, i) => (
          <RevealOnScroll key={l.id} delay={Math.min(i, 3)}>
            <article className="look-item" style={{ position: 'relative' }}>

              {/* ── Image with border-light wrapper ────────────── */}
              <div
                className="look-frame"
                style={{
                  width: '100%',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/5',
                  background: '#1a1a18',
                  overflow: 'hidden',
                }}>
                  {l.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img data-reveal="clip" src={l.imageUrl} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.45) 100%)' }} />
                  <span style={{
                    position: 'absolute',
                    top: -18,
                    right: -8,
                    color: 'var(--bg)',
                    fontSize: 56,
                    fontFamily: 'var(--font-edit)',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    opacity: 0.92,
                    lineHeight: 1,
                  }}>{l.n}</span>
                </div>
              </div>

              {/* ── Caption ────────────────────────────────────── */}
              <div className="look-cap" style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 22, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                  <em style={{ fontFamily: 'var(--font-edit)', fontStyle: 'italic', fontWeight: 400 }}>{l.name}</em>
                </h3>
                <div className="mono" style={{ color: 'rgba(242,241,237,0.5)' }}>{l.place}</div>
                <p className="edit" style={{ fontSize: 16, lineHeight: 1.4, margin: '4px 0 12px', color: 'rgba(242,241,237,0.8)' }}>
                  {l.desc}
                </p>
                {(() => {
                  const linkedPieces = l.pieces
                    .map((name) => matchProduct(name))
                    .filter((prod): prod is Product => !!prod)
                  if (linkedPieces.length === 0) return null
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {linkedPieces.map((prod) => (
                        <Link
                          key={prod.id}
                          href={`/producto/${prod.id}`}
                          style={{ fontSize: 11, padding: '6px 10px', border: '1px solid rgba(242,241,237,0.2)', color: 'rgba(242,241,237,0.85)', letterSpacing: '0.04em', cursor: 'pointer', transition: 'background 0.2s, color 0.2s', textDecoration: 'none' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--ink)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(242,241,237,0.85)' }}
                        >
                          {prod.name}
                        </Link>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </article>
          </RevealOnScroll>
        ))}
      </div>

      <div style={{ padding: '40px 24px 0', textAlign: 'center' }}>
        <Magnetic>
          <Link href="/catalogo" className="btn" style={{ background: 'transparent', color: 'var(--bg)', borderColor: 'rgba(242,241,237,0.4)', textDecoration: 'none' }}>
            Ver todo el catálogo <Icon.Arrow />
          </Link>
        </Magnetic>
      </div>
    </section>
  )
}
