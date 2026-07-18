'use client'

import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/lib/cart'
import * as Icon from '@/components/ui/Icon'

interface HeaderProps {
  onCartOpen: () => void
  logoFont?: string
}

const NAV_LINKS = [
  { label: 'Catálogo', href: '#catalogo' },
  { label: 'Inspiración', href: '#inspiracion' },
  { label: 'La selección', href: '#seleccion' },
  { label: 'Visita', href: '#visita' },
]

const DRAWER_LINKS = [
  { label: 'Catálogo', href: '#catalogo' },
  { label: 'La Selección', href: '#seleccion' },
  { label: 'Inspiración', href: '#inspiracion' },
  { label: 'Visita el showroom', href: '#visita' },
  { label: 'Diario', href: '#' },
]

export function Header({ onCartOpen, logoFont = 'Sail' }: HeaderProps) {
  const { count } = useCart()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [query, setQuery]           = useState('')
  const inputRef                    = useRef<HTMLInputElement>(null)

  /* ── scroll condensed ─────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── lock body scroll ─────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = (menuOpen || searchOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen, searchOpen])

  /* ── auto-focus search input ──────────────────────────── */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 60)
    } else {
      setQuery('')
    }
  }, [searchOpen])

  /* ── ESC to close any panel ───────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setMenuOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const closeAll = () => { setMenuOpen(false); setSearchOpen(false) }

  return (
    <>
      {/* ══════════════════════════════════════════════════
          HEADER BAR
      ══════════════════════════════════════════════════ */}
      <header className={`header${scrolled ? ' condensed' : ''}`}>

        {/* Mobile: hamburger */}
        <button
          className="icon-btn mb-only"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
        >
          <Icon.Menu />
        </button>

        {/* Desktop: nav left */}
        <nav className="nav-left dt-only" aria-label="Navegación principal">
          {NAV_LINKS.slice(0, 2).map((l) => (
            <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
          ))}
        </nav>

        {/* Logo — always visible */}
        <a
          href="#"
          style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          aria-label="LasLongDeco — inicio"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo.png"
            alt="LasLongDeco"
            className="logo-img"
          />
        </a>

        {/* Desktop: nav right */}
        <nav className="nav-right dt-only" aria-label="Navegación secundaria">
          {NAV_LINKS.slice(2).map((l) => (
            <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
          ))}
          <button
            className="icon-btn search-btn"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
          >
            <Icon.Search />
          </button>
          <button onClick={onCartOpen} aria-label="Ver selección" className="cart-pill">
            <Icon.Cart />
            <span style={{ minWidth: 14, textAlign: 'center' }}>{count}</span>
          </button>
        </nav>

        {/* Mobile: search + cart group */}
        <div
          className="mb-only"
          style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}
        >
          <button
            className="icon-btn search-btn"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
          >
            <Icon.Search />
          </button>
          <button
            className="icon-btn"
            onClick={onCartOpen}
            aria-label="Ver selección"
            style={{ position: 'relative' }}
          >
            <Icon.Cart />
            {count > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 14, height: 14, borderRadius: 999,
                background: 'var(--ink)', color: 'var(--bg)',
                fontFamily: 'var(--font-ui)', fontSize: 8, fontWeight: 700,
                display: 'grid', placeItems: 'center',
              }}>{count}</span>
            )}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          SEARCH OVERLAY
      ══════════════════════════════════════════════════ */}
      <div
        role="dialog"
        aria-label="Buscar en la colección"
        aria-modal="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(242,241,237,0.96)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 24px',
          opacity: searchOpen ? 1 : 0,
          pointerEvents: searchOpen ? 'all' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      >
        {/* Close */}
        <button
          onClick={() => setSearchOpen(false)}
          style={{
            position: 'absolute', top: 20, right: 20,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 0, cursor: 'pointer',
            color: 'var(--ink-mute)',
            fontFamily: 'var(--font-ui)', fontSize: 10,
            letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
          }}
          aria-label="Cerrar búsqueda"
        >
          Cerrar&nbsp;
          <span style={{
            width: 28, height: 28, borderRadius: 999,
            border: '1px solid var(--line)',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon.Close />
          </span>
        </button>

        {/* Search content — slides up on open */}
        <div
          style={{
            width: '100%', maxWidth: 580,
            transform: searchOpen ? 'translateY(0)' : 'translateY(20px)',
            transition: 'transform 0.38s cubic-bezier(.16,.84,.2,1)',
          }}
        >
          {/* Label */}
          <div
            className="mono"
            style={{ textAlign: 'center', marginBottom: 32, letterSpacing: '0.24em', color: 'var(--ink-mute)' }}
          >
            Buscar en la colección
          </div>

          {/* Input */}
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="sofá, alfombra, cerámica…"
              aria-label="Término de búsqueda"
              style={{
                width: '100%',
                fontFamily: 'var(--font-edit)', fontStyle: 'italic',
                fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 300,
                border: 'none',
                borderBottom: '1.5px solid var(--ink)',
                background: 'transparent', outline: 'none',
                padding: '10px 40px 10px 0', color: 'var(--ink)',
                textAlign: 'left', letterSpacing: '-0.01em',
                caretColor: 'var(--ink)',
              }}
            />
            {query.length > 0 && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                style={{
                  position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 0, cursor: 'pointer',
                  color: 'var(--ink-mute)', display: 'grid', placeItems: 'center',
                }}
                aria-label="Borrar"
              >
                <Icon.Close />
              </button>
            )}
          </div>

          {/* Hint */}
          <div
            className="mono"
            style={{ marginTop: 18, color: 'var(--ink-mute)', fontSize: 9, textAlign: 'center' }}
          >
            Pulsa&nbsp;
            <kbd style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--line)', borderRadius: 4,
              padding: '1px 5px', fontSize: 9, fontFamily: 'inherit',
              color: 'var(--ink-mute)', background: 'var(--bg-deep)',
            }}>ESC</kbd>
            &nbsp;para cerrar
          </div>

          {/* Quick links when empty */}
          {query.length === 0 && (
            <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['Sofá', 'Alfombra', 'Cerámica', 'Lámpara', 'Mesas', 'Velas'].map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); inputRef.current?.focus() }}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg-deep)',
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--font-ui)', fontSize: 12,
                    cursor: 'pointer', borderRadius: 999,
                    transition: 'border-color 0.18s, background 0.18s',
                    letterSpacing: '0.02em',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--ink)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-deep)' }}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MOBILE DRAWER (slide from left)
      ══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          pointerEvents: menuOpen ? 'all' : 'none',
        }}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(10,10,10,0.36)',
            opacity: menuOpen ? 1 : 0,
            transition: 'opacity 0.32s ease',
          }}
        />

        {/* Drawer */}
        <aside
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 'min(300px, 84vw)',
            background: 'var(--bg)',
            display: 'flex', flexDirection: 'column',
            transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.38s cubic-bezier(.16,.84,.2,1)',
            boxShadow: '8px 0 60px rgba(0,0,0,0.18)',
          }}
          role="navigation"
          aria-label="Menú de navegación"
        >
          {/* Drawer header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '18px 20px',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}>
            <a href="#" onClick={closeAll} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="LasLongDeco" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
            </a>
            <button
              className="icon-btn"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              style={{ color: 'var(--ink-mute)' }}
            >
              <Icon.Close />
            </button>
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {DRAWER_LINKS.map(({ label, href }, i) => (
              <a
                key={label}
                href={href}
                onClick={closeAll}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px',
                  color: 'var(--ink)', textDecoration: 'none',
                  fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 400,
                  letterSpacing: '0.01em',
                  borderBottom: '1px solid var(--line)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-deep)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
              >
                <span>{label}</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </a>
            ))}
          </nav>

          {/* Drawer footer */}
          <div style={{ padding: '20px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
            <div className="mono" style={{ marginBottom: 4 }}>Rafaela · Santa Fe</div>
            <div className="mono">Sgto. Cabral 104 · S2300</div>
          </div>
        </aside>
      </div>
    </>
  )
}
