'use client'

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import * as Icon from '@/components/ui/Icon'
import { useSiteLogo } from '@/lib/useSiteLogo'

const FOOTER_LINKS = {
  navegacion: [
    { label: 'Inicio',            href: '/' },
    { label: 'Catálogo',          href: '/catalogo' },
    { label: 'Nuestra Selección', href: '/#seleccion' },
    { label: 'Inspiración',       href: '/#inspiracion' },
    { label: 'Nosotros',          href: '/nosotros' },
    { label: 'Contacto',          href: '/contacto' },
  ],
  ayuda: [
    { label: 'Cómo comprar',              href: '/como-comprar' },
    { label: 'Envíos y devoluciones',     href: '/envios-y-devoluciones' },
    { label: 'Preguntas frecuentes',      href: '/preguntas-frecuentes' },
    { label: 'Términos y condiciones',    href: '/terminos-y-condiciones' },
    { label: 'Política de privacidad',    href: '/politica-de-privacidad' },
  ],
}

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/laslangdeco/', cls: 'ig', icon: <Icon.Instagram width={16} height={16} /> },
  { label: 'WhatsApp',  href: 'https://wa.me/5493492287864',            cls: 'wa', icon: <Icon.Whatsapp width={15} height={15} /> },
  { label: 'Facebook',  href: 'https://www.facebook.com/laslangdeco/',  cls: 'fb', icon: <Icon.Facebook width={16} height={16} /> },
]

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

function ContactRow({ href, icon, children, external }: { href: string; icon: ReactNode; children: ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="footer-contact-row"
    >
      <span className="footer-contact-icon">{icon}</span>
      <span>{children}</span>
    </a>
  )
}

export function Footer() {
  const logoUrl = useSiteLogo()

  return (
    <footer className="site-footer">

      {/* ── Main grid ────────────────────────────────────────────── */}
      <div className="footer-body">

        {/* Brand */}
        <div className="footer-brand">
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
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
            margin: '0 0 20px',
            maxWidth: 300,
          }}>
            Piezas que duran treinta años. Talleres pequeños, maderas honestas, telas que envejecen con gracia.
          </p>
          <div className="footer-socials">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className={`footer-social-btn ${s.cls}`}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <div className="footer-col">
          <div className="mono" style={{ color: 'rgba(242,241,237,0.28)', marginBottom: 18, fontSize: 9 }}>
            Navegación
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {FOOTER_LINKS.navegacion.map((l) => (
              <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>
            ))}
          </div>
        </div>

        {/* Ayuda */}
        <div className="footer-col">
          <div className="mono" style={{ color: 'rgba(242,241,237,0.28)', marginBottom: 18, fontSize: 9 }}>
            Ayuda
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {FOOTER_LINKS.ayuda.map((l) => (
              <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>
            ))}
          </div>
        </div>

        {/* Contacto */}
        <div className="footer-col">
          <div className="mono" style={{ color: 'rgba(242,241,237,0.28)', marginBottom: 18, fontSize: 9 }}>
            Contacto
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div className="footer-contact-row">
              <span className="footer-contact-icon"><Icon.Pin /></span>
              <span>Sgto. Cabral 104, Rafaela</span>
            </div>
            <ContactRow href="https://wa.me/5493492287864" icon={<Icon.Whatsapp width={15} height={15} />} external>
              3492 28-7864 (WhatsApp)
            </ContactRow>
            <ContactRow href="mailto:laslangdeco@gmail.com" icon={<Icon.Mail />}>
              laslangdeco@gmail.com
            </ContactRow>
            <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(242,241,237,0.36)', lineHeight: 1.55 }}>
              9:00 – 12:00<br />15:30 – 19:30
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="footer-col">
          <div className="mono" style={{ color: 'rgba(242,241,237,0.28)', marginBottom: 18, fontSize: 9 }}>
            Ubicación
          </div>
          <div className="footer-map">
            <iframe
              title="Showroom · Sgto. Cabral 104, Rafaela"
              src="https://maps.google.com/maps?q=-31.254139,-61.488861&output=embed&z=15"
              style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href="https://maps.google.com/?q=-31.254139,-61.488861"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-map-link"
          >
            <Icon.Pin width={13} height={13} /> Ver en Google Maps
          </a>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className="footer-bottom">
        <div style={{ height: 1, background: 'rgba(242,241,237,0.08)', marginBottom: 20 }} />
        <div className="footer-bottom-row">
          <span className="mono" style={{ color: 'rgba(242,241,237,0.28)', fontSize: 9 }}>
            © 2026 · LasLangDeco
          </span>
          <div className="footer-credit">
            <span className="mono footer-credit-label">Creado por</span>
            <a
              href="https://www.pivotweb.com.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-credit-brand"
            >
              PIVOT
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
