'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useCart, useCartUI } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { normalize } from '@/lib/normalize'
import { useSiteLogo } from '@/lib/useSiteLogo'
import { Tooltip } from '@/components/ui/Tooltip'
import { Magnetic } from '@/components/ui/Magnetic'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

interface HeaderProps {
  hasPromo?: boolean
}

const SEARCH_RESULTS_LIMIT = 5
const QUICK_TERMS = ['Sofá', 'Alfombra', 'Cerámica', 'Lámpara', 'Mesas', 'Velas']

const NAV_LINKS = [
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Inspiración', href: '/#inspiracion' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Visualizador', href: '/#visualizador' },
]

const DRAWER_LINKS = [
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'La Selección', href: '/#seleccion' },
  { label: 'Inspiración', href: '/#inspiracion' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Visualizador de espacios', href: '/#visualizador' },
  { label: 'Contacto / Showroom', href: '/contacto' },
]

export function Header({ hasPromo = false }: HeaderProps) {
  const { count } = useCart()
  const { open: onCartOpen } = useCartUI()
  const { count: savedCount } = useWishlist()
  const router = useRouter()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [query, setQuery]           = useState('')
  const [catalog, setCatalog]       = useState<Product[] | null>(null)
  const [catalogError, setCatalogError] = useState(false)
  const logoUrl                     = useSiteLogo()
  const inputRef                    = useRef<HTMLInputElement>(null)
  const inputMobileRef              = useRef<HTMLInputElement>(null)
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

  const allResults = useMemo(() => {
    const q = normalize(query.trim())
    if (!q || !catalog) return []
    return catalog.filter((p) =>
      normalize(p.name).includes(q) ||
      normalize(p.material).includes(q) ||
      (p.tag && normalize(p.tag).includes(q)) ||
      (p.note && normalize(p.note).includes(q))
    )
  }, [query, catalog])

  const results = allResults.slice(0, SEARCH_RESULTS_LIMIT)

  const closeSearch = () => setSearchOpen(false)

  const goToProduct = (id: string) => {
    closeSearch()
    router.push(`/producto/${id}`)
  }

  const viewAllResults = () => {
    const q = query.trim()
    if (!q) return
    closeSearch()
    router.push(`/catalogo?q=${encodeURIComponent(q)}`)
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

  /* ── lock body scroll (solo el drawer mobile, la búsqueda ya no es
     pantalla completa) ─────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  /* ── auto-focus del input al abrir el buscador ───────────── */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => (inputRef.current ?? inputMobileRef.current)?.focus(), 60)
    } else {
      setQuery('')
    }
  }, [searchOpen])

  /* ── ESC y click afuera cierran el buscador / el menú ────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setMenuOpen(false) }
    }
    const onPointerDown = (e: MouseEvent) => {
      if (searchOpen && !(e.target as Element).closest('.nav-search-scope')) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [searchOpen])

  const closeAll = () => { setMenuOpen(false); setSearchOpen(false) }

  const searchPanelProps = {
    query, results, totalResults: allResults.length, catalog, catalogError,
    onSelect: goToProduct, onViewAll: viewAllResults,
    onQuickTerm: (term: string) => setQuery(term),
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════
          HEADER BAR
      ══════════════════════════════════════════════════ */}
      <header
        className={`header${scrolled ? ' condensed' : ''}${hasPromo ? ' has-promo' : ''}${searchOpen ? ' search-open' : ''}`}
      >

        {/* Mobile: hamburger — se oculta por CSS (solo en mobile) mientras se busca, para no
            afectar nunca el grid de desktop, donde el logo y el resto de la barra son fijos. */}
        <button
          className="icon-btn mb-only header-hamburger"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
        >
          <Icon.Menu />
        </button>

        {/* Logo — siempre montado; en mobile se oculta por CSS mientras se busca */}
        <Link
          href="/"
          className="header-logo-link"
          style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          aria-label="LasLangDeco — inicio"
        >
          <Image
            src={logoUrl}
            alt="LasLangDeco"
            className="logo-img"
            width={150}
            height={150}
            priority
          />
        </Link>

        {/* Desktop: nav — todos los links en una sola fila centrada, separados a distancia pareja */}
        <nav className="nav-links dt-only" aria-label="Navegación principal">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
          ))}
        </nav>

        {/* Desktop: search + cart */}
        <div className="nav-icons dt-only">
          <div className="nav-search-scope" style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && results.length > 0) goToProduct(results[0].id) }}
              placeholder="Buscar…"
              aria-label="Buscar en la colección"
              className={`nav-search-input${searchOpen ? ' open' : ''}`}
            />
            {searchOpen && <SearchPanel {...searchPanelProps} />}
          </div>
          <Tooltip label={searchOpen ? 'Cerrar' : 'Buscar'} side="bottom">
            <Magnetic>
              <button
                className="icon-btn search-btn"
                aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
                onClick={() => setSearchOpen((v) => !v)}
              >
                {searchOpen ? <Icon.Close /> : <Icon.Search />}
              </button>
            </Magnetic>
          </Tooltip>
          <Tooltip label="Guardados" side="bottom">
            <Magnetic>
              <Link href="/guardados" aria-label="Ver guardados" className="icon-btn" style={{ position: 'relative' }}>
                <Icon.Heart width={19} height={19} filled={savedCount > 0} />
                {savedCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    minWidth: 14, height: 14, padding: '0 3px', borderRadius: 999,
                    background: 'var(--ink)', color: 'var(--bg)',
                    fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 700,
                    display: 'grid', placeItems: 'center',
                  }}>{savedCount}</span>
                )}
              </Link>
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
        </div>

        {/* Mobile: search + cart group */}
        {searchOpen ? (
          <div className="nav-search-scope mb-only" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, gridColumn: '1 / -1' }}>
            <input
              ref={inputMobileRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && results.length > 0) goToProduct(results[0].id) }}
              placeholder="Buscar…"
              aria-label="Buscar en la colección"
              className="nav-search-input open mobile"
              style={{ flex: 1 }}
            />
            <button className="icon-btn" onClick={closeSearch} aria-label="Cerrar búsqueda">
              <Icon.Close />
            </button>
            <SearchPanel {...searchPanelProps} mobile />
          </div>
        ) : (
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
            <Link href="/guardados" className="icon-btn" aria-label="Ver guardados" style={{ position: 'relative' }}>
              <Icon.Heart width={19} height={19} filled={savedCount > 0} />
              {savedCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 14, height: 14, borderRadius: 999,
                  background: 'var(--ink)', color: 'var(--bg)',
                  fontFamily: 'var(--font-ui)', fontSize: 8, fontWeight: 700,
                  display: 'grid', placeItems: 'center',
                }}>{savedCount}</span>
              )}
            </Link>
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
        )}
      </header>

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
            <Link href="/" onClick={closeAll} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Image src={logoUrl} alt="LasLangDeco" width={150} height={150} style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
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

/* ══════════════════════════════════════════════════════════
   Panel desplegable de resultados — comparte markup entre el
   buscador inline de desktop (ancla a la derecha) y el de mobile
   (ocupa todo el ancho debajo de la barra).
══════════════════════════════════════════════════════════ */
interface SearchPanelProps {
  query: string
  results: Product[]
  totalResults: number
  catalog: Product[] | null
  catalogError: boolean
  onSelect: (id: string) => void
  onViewAll: () => void
  onQuickTerm: (term: string) => void
  mobile?: boolean
}

function SearchPanel({ query, results, totalResults, catalog, catalogError, onSelect, onViewAll, onQuickTerm, mobile }: SearchPanelProps) {
  return (
    <div className={`nav-search-dropdown${mobile ? ' mobile' : ''}`}>
      {query.length === 0 && (
        <>
          <div className="mono" style={{ color: 'var(--ink-mute)', marginBottom: 10 }}>Búsquedas frecuentes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_TERMS.map((term) => (
              <button key={term} className="nav-search-chip" onClick={() => onQuickTerm(term)}>
                {term}
              </button>
            ))}
          </div>
        </>
      )}

      {query.length > 0 && (
        <>
          {!catalog && !catalogError && (
            <div className="mono" style={{ color: 'var(--ink-mute)', padding: '8px 0' }}>Buscando…</div>
          )}
          {catalogError && (
            <div className="mono" style={{ color: 'var(--ink-mute)', padding: '8px 0' }}>
              No pudimos cargar el catálogo.
            </div>
          )}
          {catalog && results.length === 0 && (
            <div className="mono" style={{ color: 'var(--ink-mute)', padding: '8px 0' }}>
              Sin resultados para &ldquo;{query}&rdquo;.
            </div>
          )}

          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              aria-label={`Ver ${p.name}`}
              className="nav-search-result"
            >
              <div style={{ position: 'relative', width: 38, height: 46, flexShrink: 0, background: '#ECEAE4', overflow: 'hidden', borderRadius: 3 }}>
                {p.imageUrl && (
                  <Image src={p.imageUrl} alt="" fill unoptimized sizes="38px" style={{ objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', marginTop: 2 }}>{p.material}</div>
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ink)', flexShrink: 0 }}>{p.price}</div>
            </button>
          ))}

          {totalResults > 0 && (
            <button className="nav-search-viewall" onClick={onViewAll}>
              Ver {totalResults === 1 ? 'el resultado' : `los ${totalResults} resultados`} para &ldquo;{query}&rdquo;
              <Icon.Arrow width={12} height={12} />
            </button>
          )}
        </>
      )}
    </div>
  )
}
