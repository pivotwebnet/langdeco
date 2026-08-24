'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useCart, useCartUI } from '@/lib/cart'
import { Tooltip } from '@/components/ui/Tooltip'
import { Magnetic } from '@/components/ui/Magnetic'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

interface HeaderProps {
  logoFont?: string
  hasPromoBar?: boolean
}

const SEARCH_RESULTS_LIMIT = 6

function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

const NAV_LINKS = [
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Inspiración', href: '/inspiracion' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Visualizador', href: '/visualizador' },
]

const DRAWER_LINKS = [
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'La Selección', href: '/#seleccion' },
  { label: 'Inspiración', href: '/inspiracion' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Visualizador de espacios', href: '/visualizador' },
  { label: 'Contacto / Showroom', href: '/contacto' },
]

export function Header({ logoFont = 'Sail', hasPromoBar = false }: HeaderProps) {
  const { count } = useCart()
  const { open: onCartOpen } = useCartUI()
  const router = useRouter()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [query, setQuery]           = useState('')
  const [catalog, setCatalog]       = useState<Product[] | null>(null)
  const [catalogError, setCatalogError] = useState(false)
  const inputRef                    = useRef<HTMLInputElement>(null)
  const cartCountRef                = useRef<HTMLSpanElement>(null)
  const cartBadgeRef                = useRef<HTMLSpanElement>(null)
  const prevCount                   = useRef(count)

  /* ── trae el catálogo recién al abrir el buscador la primera vez ─ */
  useEffect(() => {
    if (!searchOpen || catalog !== null) return
    fetch('/api/products')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((data: Product[]) => setCatalog(data))
      .catch(() => setCatalogError(true))
  }, [searchOpen, catalog])

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q || !catalog) return []
    return catalog
      .filter((p) =>
        normalize(p.name).includes(q) ||
        normalize(p.material).includes(q) ||
        (p.tag && normalize(p.tag).includes(q)) ||
        (p.note && normalize(p.note).includes(q))
      )
      .slice(0, SEARCH_RESULTS_LIMIT)
  }, [query, catalog])

  const goToProduct = (id: string) => {
    setSearchOpen(false)
    router.push(`/producto/${id}`)
  }

  /* ── bump + flash del contador cuando se agrega algo al carrito ─ */
  useGSAP(() => {
    if (count > prevCount.current) {
      for (const el of [cartCountRef.current, cartBadgeRef.current]) {
        if (!el) continue
        gsap.fromTo(el,
          { scale: 1.5, color: 'var(--leaf)' },
          { scale: 1, color: 'inherit', duration: 0.6, ease: 'power2.out' }
        )
      }
    }
    prevCount.current = count
  }, { dependencies: [count] })

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
      <header className={`header${scrolled ? ' condensed' : ''}${hasPromoBar ? ' with-promo' : ''}`}>

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
          {NAV_LINKS.slice(0, 3).map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
          ))}
        </nav>

        {/* Logo — always visible */}
        <Link
          href="/"
          style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          aria-label="LasLangDeco — inicio"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.png" alt="LasLangDeco" className="logo-img" />
        </Link>

        {/* Desktop: nav right */}
        <nav className="nav-right dt-only" aria-label="Navegación secundaria">
          {NAV_LINKS.slice(3).map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
          ))}
          <Tooltip label="Buscar" side="bottom">
            <Magnetic>
              <button
                className="icon-btn search-btn"
                aria-label="Buscar"
                onClick={() => setSearchOpen(true)}
              >
                <Icon.Search />
              </button>
            </Magnetic>
          </Tooltip>
          <Tooltip label="Ver selección" side="bottom">
            <Magnetic>
              <button onClick={onCartOpen} aria-label="Ver selección" className="cart-pill">
                <Icon.Cart />
                <span ref={cartCountRef} style={{ minWidth: 14, textAlign: 'center', display: 'inline-block' }}>{count}</span>
              </button>
            </Magnetic>
          </Tooltip>
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
              <span ref={cartBadgeRef} style={{
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
              onKeyDown={(e) => { if (e.key === 'Enter' && results.length > 0) goToProduct(results[0].id) }}
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

          {/* Live results */}
          {query.length > 0 && (
            <div style={{ marginTop: 32, maxHeight: '46vh', overflowY: 'auto' }}>
              {!catalog && !catalogError && (
                <div className="mono" style={{ textAlign: 'center', color: 'var(--ink-mute)', fontSize: 11 }}>
                  Buscando…
                </div>
              )}
              {catalogError && (
                <div className="mono" style={{ textAlign: 'center', color: 'var(--ink-mute)', fontSize: 11 }}>
                  No pudimos cargar el catálogo. Probá de nuevo en un momento.
                </div>
              )}
              {catalog && results.length === 0 && (
                <div className="mono" style={{ textAlign: 'center', color: 'var(--ink-mute)', fontSize: 11 }}>
                  Sin resultados para &ldquo;{query}&rdquo;. Probá con otra palabra o consultanos por WhatsApp.
                </div>
              )}
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goToProduct(p.id)}
                  aria-label={`Ver ${p.name}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: '10px 6px', background: 'none', border: 0, cursor: 'pointer',
                    borderBottom: '1px solid var(--line)', textAlign: 'left',
                  }}
                >
                  <div style={{ position: 'relative', width: 44, height: 54, flexShrink: 0, background: '#ECEAE4', overflow: 'hidden', borderRadius: 3 }}>
                    {p.imageUrl && (
                      <Image src={p.imageUrl} alt="" fill unoptimized sizes="44px" style={{ objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)' }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', marginTop: 2 }}>{p.material}</div>
                  </div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--ink)', flexShrink: 0 }}>{p.price}</div>
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
            padding: '26px 20px',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}>
            <Link href="/" onClick={closeAll} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="LasLangDeco" style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
            </Link>
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
            {DRAWER_LINKS.map(({ label, href }) => (
              <Link
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
                <Icon.Arrow style={{ width: 12, height: 12, color: 'var(--ink-mute)' }} />
              </Link>
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
