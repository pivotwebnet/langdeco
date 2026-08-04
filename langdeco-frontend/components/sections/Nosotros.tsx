import Link from 'next/link'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { Underline } from '@/components/ui/Underline'
import * as Icon from '@/components/ui/Icon'

const PILARES = [
  {
    title: 'Curaduría a mano',
    desc: 'Cada pieza se elige una por una — no compramos por catálogo de fábrica, visitamos talleres chicos.',
  },
  {
    title: 'Materiales que duran',
    desc: 'Maderas honestas, telas que envejecen con gracia. Nada pensado para tirar en un par de años.',
  },
  {
    title: 'Piezas atemporales',
    desc: 'Diseño que no depende de una moda de temporada — para casas que no tienen apuro.',
  },
]

export function Nosotros() {
  return (
    <section data-dt="nosotros" style={{ position: 'relative', padding: '56px 24px 80px', overflow: 'hidden' }}>
      <RevealOnScroll>
        <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>Nosotros · desde 2014</span>
        <h1 className="display" style={{ fontSize: 44, margin: '0 0 24px', maxWidth: 640 }}>
          Una casa no se decora.<br />
          <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}><Underline>Se compone.</Underline></em>
        </h1>
      </RevealOnScroll>

      <RevealOnScroll delay={1} className="subtitle-connector" style={{ marginBottom: 48 }}>
        <p className="edit" style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 560, color: 'var(--ink-soft)', margin: 0 }}>
          Desde 2014 elegimos, a mano, mobiliario y objetos para hogares que no tienen apuro. En Rafaela, Santa Fe,
          armamos un showroom con piezas que acompañan una casa durante años, no una temporada.
        </p>
      </RevealOnScroll>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, marginBottom: 56 }}>
        {PILARES.map((p, i) => (
          <RevealOnScroll key={p.title} delay={i + 2}>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 500, margin: '0 0 8px' }}>{p.title}</h3>
              <p className="edit" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-mute)', margin: 0 }}>{p.desc}</p>
            </div>
          </RevealOnScroll>
        ))}
      </div>

      <RevealOnScroll delay={5}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/catalogo" className="btn" style={{ textDecoration: 'none' }}>
            Ver el catálogo <Icon.Arrow />
          </Link>
          <Link href="/contacto" className="btn ghost" style={{ textDecoration: 'none' }}>
            Conocé el showroom <Icon.Arrow />
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  )
}
