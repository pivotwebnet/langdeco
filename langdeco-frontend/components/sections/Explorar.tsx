import Link from 'next/link'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import * as Icon from '@/components/ui/Icon'

const LINKS = [
  { label: 'Catálogo completo', desc: 'Piezas Mayores y Pequeños Tesoros.', href: '/catalogo' },
  { label: 'Inspiración', desc: 'Casas reales, compuestas con nuestras piezas.', href: '/#inspiracion' },
  { label: 'Nosotros', desc: 'Quiénes somos y qué buscamos en cada pieza.', href: '/nosotros' },
  { label: 'Contacto', desc: 'Showroom en Rafaela, Santa Fe.', href: '/contacto' },
]

export function Explorar() {
  return (
    <section data-dt="explorar" style={{ position: 'relative', padding: '64px 24px', overflow: 'hidden' }}>
      <RevealOnScroll>
        <span className="kicker" style={{ display: 'block', marginBottom: 24 }}>Seguí explorando</span>
      </RevealOnScroll>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1, background: 'var(--line)' }}>
        {LINKS.map((l, i) => (
          <RevealOnScroll key={l.href} delay={i + 1}>
            <Link
              href={l.href}
              className="explorar-link"
              style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                padding: '28px 24px', height: '100%',
                textDecoration: 'none', color: 'var(--ink)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 500 }}>
                {l.label} <Icon.Arrow style={{ width: 14, height: 14 }} />
              </span>
              <span className="edit" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>{l.desc}</span>
            </Link>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  )
}
