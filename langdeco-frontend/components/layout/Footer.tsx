import type { CSSProperties, ReactNode } from 'react'

const FOOTER_LINKS = {
  coleccion: [
    { label: 'Catálogo',              href: '#catalogo' },
    { label: 'Nuestra Selección',     href: '#seleccion' },
    { label: 'Inspiración',           href: '#inspiracion' },
    { label: 'Piezas Mayores',        href: '#catalogo' },
    { label: 'Pequeños Tesoros',      href: '#catalogo' },
  ],
  showroom: [
    { label: 'Visita el showroom',       href: '#visita' },
    { label: 'Asesoría de interiorismo', href: '#visita' },
    { label: 'Diario',                   href: '#' },
    { label: 'Sobre Nosotros',           href: '#' },
  ],
}

const linkStyle: CSSProperties = {
  color: 'rgba(242,241,237,0.58)',
  textDecoration: 'none',
  fontFamily: 'var(--font-ui)',
  fontSize: 13,
  fontWeight: 400,
  letterSpacing: '0.01em',
  lineHeight: 1,
  display: 'inline-block',
  transition: 'color 0.18s',
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={linkStyle}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.95)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.58)' }}
    >
      {children}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">

      {/* ── Main grid ────────────────────────────────────────────── */}
      <div className="footer-body">

        {/* Brand */}
        <div className="footer-brand">
          <a href="#" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo.png"
              alt="LasLongDeco"
              style={{ height: 52, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.88 }}
            />
          </a>
          <div className="mono" style={{ color: 'rgba(242,241,237,0.3)', marginBottom: 18 }}>
            Casa &amp; curaduría · desde 1994
          </div>
          <p style={{
            fontFamily: 'var(--font-edit)',
            fontStyle: 'italic',
            fontSize: 15,
            lineHeight: 1.5,
            color: 'rgba(242,241,237,0.48)',
            margin: 0,
            maxWidth: 300,
          }}>
            Piezas que duran treinta años. Talleres pequeños, maderas honestas, telas que envejecen con gracia.
          </p>
        </div>

        {/* Colección */}
        <div className="footer-col">
          <div className="mono" style={{ color: 'rgba(242,241,237,0.28)', marginBottom: 18, fontSize: 9 }}>
            Colección
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {FOOTER_LINKS.coleccion.map((l) => (
              <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>
            ))}
          </div>
        </div>

        {/* Showroom */}
        <div className="footer-col">
          <div className="mono" style={{ color: 'rgba(242,241,237,0.28)', marginBottom: 18, fontSize: 9 }}>
            Showroom
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {FOOTER_LINKS.showroom.map((l) => (
              <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>
            ))}
          </div>
        </div>

        {/* Contacto */}
        <div className="footer-col">
          <div className="mono" style={{ color: 'rgba(242,241,237,0.28)', marginBottom: 18, fontSize: 9 }}>
            Contacto
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(242,241,237,0.58)' }}>
              Sgto. Cabral 104<br />S2300 Rafaela · Santa Fe
            </div>
            <a
              href="tel:+34914321860"
              style={{ ...linkStyle, marginTop: 2 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.95)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.58)' }}
            >
              +34 914 32 18 60
            </a>
            <a
              href="mailto:asesoria@laslongdeco.es"
              style={linkStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.95)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.58)' }}
            >
              asesoria@laslongdeco.es
            </a>
            <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(242,241,237,0.36)', lineHeight: 1.55 }}>
              Lun — Vie · 10:30 – 20:00<br />Sáb · 11:00 – 14:30
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className="footer-bottom">
        <div style={{ height: 1, background: 'rgba(242,241,237,0.08)', marginBottom: 20 }} />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 10,
        }}>
          <span className="mono" style={{ color: 'rgba(242,241,237,0.28)', fontSize: 9 }}>
            © 2026 · LasLongDeco SL
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacidad', 'Cookies', 'Aviso legal'].map((label) => (
              <a
                key={label}
                href="#"
                style={{
                  ...linkStyle,
                  fontSize: 10, letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  color: 'rgba(242,241,237,0.28)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.7)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.28)' }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
