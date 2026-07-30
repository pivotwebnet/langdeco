'use client'

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'

const FOOTER_LINKS = {
  coleccion: [
    { label: 'Catálogo',              href: '/catalogo' },
    { label: 'Nuestra Selección',     href: '/#seleccion' },
    { label: 'Inspiración',           href: '/inspiracion' },
    { label: 'Piezas Mayores',        href: '/catalogo?cat=mayor' },
    { label: 'Pequeños Tesoros',      href: '/catalogo?cat=tesoro' },
  ],
  empresa: [
    { label: 'Nosotros',                 href: '/nosotros' },
    { label: 'Visita el showroom',       href: '/contacto' },
    { label: 'Asesoría de interiorismo', href: '/contacto' },
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
    <Link
      href={href}
      style={linkStyle}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.95)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.58)' }}
    >
      {children}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">

      {/* ── Main grid ────────────────────────────────────────────── */}
      <div className="footer-body">

        {/* Brand */}
        <div className="footer-brand">
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo.png"
              alt="LasLangDeco"
              style={{ height: 52, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.88 }}
            />
          </Link>
          <div className="mono" style={{ color: 'rgba(242,241,237,0.3)', marginBottom: 18 }}>
            Casa &amp; curaduría · desde 2014
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

        {/* Empresa */}
        <div className="footer-col">
          <div className="mono" style={{ color: 'rgba(242,241,237,0.28)', marginBottom: 18, fontSize: 9 }}>
            Empresa
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {FOOTER_LINKS.empresa.map((l) => (
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
            <div className="footer-map">
              <iframe
                title="Showroom · Sgto. Cabral 104, Rafaela"
                src="https://maps.google.com/maps?q=-31.254139,-61.488861&output=embed&z=15"
                style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(242,241,237,0.58)' }}>
              Sgto. Cabral 104<br />S2300 Rafaela · Santa Fe
            </div>
            <a
              href="https://wa.me/5493492287864"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkStyle, marginTop: 2 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.95)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.58)' }}
            >
              Hablar con nosotros
            </a>
            <a
              href="mailto:laslangdeco@gmail.com"
              style={linkStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.95)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,241,237,0.58)' }}
            >
              laslangdeco@gmail.com
            </a>
            <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(242,241,237,0.36)', lineHeight: 1.55 }}>
              9:00 – 12:00<br />15:30 – 19:30
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
            © 2026 · LasLangDeco
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
