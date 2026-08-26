'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { Underline } from '@/components/ui/Underline'
import { SplitChars } from '@/components/ui/SplitChars'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductQuickView } from '@/components/ui/ProductQuickView'
import * as Icon from '@/components/ui/Icon'
import { normalize } from '@/lib/normalize'
import type { Product } from '@/lib/types'
import type { BackendCategory } from '@/lib/backend-types'

const PAGE_SIZE = 6

const tabStyle = (active: boolean) => ({
  padding: '12px 20px',
  background: active ? 'var(--ink)' : 'transparent',
  color: active ? 'var(--bg)' : 'var(--ink)',
  border: 0, cursor: 'pointer',
  fontFamily: 'var(--font-ui)', fontSize: 11,
  letterSpacing: '0.16em', textTransform: 'uppercase' as const,
  fontWeight: 500, transition: 'background 0.25s, color 0.25s',
})

type SortOption = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre-asc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevancia', label: 'Destacado' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre-asc', label: 'Nombre A-Z' },
]

interface ProductosProps {
  products: Product[]
  categories: BackendCategory[]
  initialCategory?: 'mayor' | 'tesoro'
  initialQuery?: string
}

export function Productos({ products, categories, initialCategory, initialQuery }: ProductosProps) {
  const [tab, setTab] = useState<'mayores' | 'tesoros'>(initialCategory === 'tesoro' ? 'tesoros' : 'mayores')
  const [subcategory, setSubcategory] = useState<string>('all')
  const [added, setAdded] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [quickView, setQuickView] = useState<Product | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('relevancia')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? '')
  const { add } = useCart()
  const router = useRouter()

  const searchActive = searchQuery.trim().length > 0
  const clearSearch = () => { setSearchQuery(''); setPage(0); router.replace('/catalogo') }

  const onAdd = (p: Product) => {
    add(p)
    setAdded(p.id)
    setTimeout(() => setAdded(v => v === p.id ? null : v), 1200)
  }

  const changeTab = (t: typeof tab) => { setTab(t); setSubcategory('all'); setPage(0) }
  const changeSubcategory = (c: string) => { setSubcategory(c); setPage(0) }
  const changeSort = (s: SortOption) => { setSortBy(s); setPage(0) }
  const changePriceMin = (v: string) => { setPriceMin(v); setPage(0) }
  const changePriceMax = (v: string) => { setPriceMax(v); setPage(0) }

  const hasActiveFilters = sortBy !== 'relevancia' || priceMin !== '' || priceMax !== '' || subcategory !== 'all'
  const clearFilters = () => { setSortBy('relevancia'); setPriceMin(''); setPriceMax(''); setSubcategory('all'); setPage(0) }

  const groupByCategoryId = new Map(categories.map(c => [c.id, c.group]))
  const categoriesInTab = categories.filter(c => c.group === (tab === 'mayores' ? 'Mayor' : 'Tesoro'))

  const piezasMayores  = products.filter(p => groupByCategoryId.get(p.category) === 'Mayor')
  const pequenosTesoros = products.filter(p => groupByCategoryId.get(p.category) === 'Tesoro')

  const categoryItems = searchActive
    ? (() => {
        const q = normalize(searchQuery.trim())
        return products.filter(p =>
          normalize(p.name).includes(q) ||
          normalize(p.material).includes(q) ||
          (p.tag && normalize(p.tag).includes(q)) ||
          (p.note && normalize(p.note).includes(q))
        )
      })()
    : (tab === 'mayores' ? piezasMayores : pequenosTesoros)

  const min = priceMin !== '' ? Number(priceMin) : null
  const max = priceMax !== '' ? Number(priceMax) : null
  const filteredItems = categoryItems.filter(p =>
    (min === null || p.priceNum >= min) && (max === null || p.priceNum <= max) &&
    // El selector de categoría se oculta durante la búsqueda (más abajo), así que el filtro
    // tampoco debe aplicarse ahí — si no, quedaba "fantasma" escondiendo resultados sin aviso.
    (searchActive || subcategory === 'all' || p.category === subcategory)
  )

  const items = [...filteredItems].sort((a, b) => {
    if (sortBy === 'precio-asc') return a.priceNum - b.priceNum
    if (sortBy === 'precio-desc') return b.priceNum - a.priceNum
    if (sortBy === 'nombre-asc') return a.name.localeCompare(b.name)
    return 0
  })

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pageItems  = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <section data-dt="productos" id="catalogo" style={{ position: 'relative', padding: '48px 0 80px', overflow: 'hidden' }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="prod-header" style={{ padding: '0 24px', marginBottom: 32 }}>
          <h2 className="display prod-h2" data-reveal="headline" style={{ fontSize: 34, margin: '16px 0 14px' }}>
            <SplitChars text="Para" />{' '}
            <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}><Underline><SplitChars text="casi" /></Underline></em><br />
            <SplitChars text="todo lo demás." />
          </h2>

          <div className="subtitle-connector" data-reveal="up" data-delay="0.15" style={{ marginBottom: 28 }}>
            <p className="edit" style={{ margin: 0, color: 'var(--ink-soft)', maxWidth: 380, fontSize: 20 }}>
              Dos casas dentro de la casa. Las piezas grandes que{' '}
              <strong style={{ fontWeight: 500, fontStyle: 'normal' }}>cambian un cuarto</strong>; y los pequeños tesoros que lo{' '}
              <strong style={{ fontWeight: 500, fontStyle: 'normal' }}>terminan</strong>.
            </p>
          </div>

          {searchActive ? (
            <RevealOnScroll delay={2}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span className="mono" style={{ color: 'var(--ink-mute)' }}>
                  Resultados para &ldquo;{searchQuery}&rdquo;
                </span>
                <button className="cat-clear-btn" onClick={clearSearch} style={{ alignSelf: 'auto' }}>
                  <Icon.Close /> Ver todo el catálogo
                </button>
              </div>
            </RevealOnScroll>
          ) : (
            <>
              <RevealOnScroll delay={2}>
                <div role="tablist" style={{ display: 'inline-flex', alignItems: 'stretch', border: '1px solid var(--ink)' }}>
                  <button role="tab" aria-selected={tab === 'mayores'} onClick={() => changeTab('mayores')} style={tabStyle(tab === 'mayores')}>
                    Piezas Mayores
                  </button>
                  <button role="tab" aria-selected={tab === 'tesoros'} onClick={() => changeTab('tesoros')} style={{ ...tabStyle(tab === 'tesoros'), borderLeft: '1px solid var(--ink)' }}>
                    Pequeños Tesoros
                  </button>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={3}>
                <div style={{ marginTop: 16 }}>
                  <span className="mono">
                    {tab === 'mayores' ? 'Desde $ 2.190.000 · piezas de inversión' : 'Desde $ 22.000 · regalos, detalles, comienzos'}
                  </span>
                </div>
              </RevealOnScroll>
            </>
          )}
        </div>

        {/* ── Sidebar de filtros + contenido ──────────────────── */}
        <div className="cat-layout">
          <aside className="cat-sidebar">
            {!searchActive && categoriesInTab.length > 0 && (
              <div className="cat-sidebar-block">
                <span className="mono cat-sidebar-label">Categoría</span>
                <div className="cat-sort-list">
                  <button
                    className="cat-sort-btn"
                    data-active={subcategory === 'all'}
                    onClick={() => changeSubcategory('all')}
                  >
                    Todas
                  </button>
                  {categoriesInTab.map(c => (
                    <button
                      key={c.id}
                      className="cat-sort-btn"
                      data-active={subcategory === c.id}
                      onClick={() => changeSubcategory(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="cat-sidebar-block">
              <span className="mono cat-sidebar-label">Ordenar por</span>
              <div className="cat-sort-list">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className="cat-sort-btn"
                    data-active={sortBy === opt.value}
                    onClick={() => changeSort(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cat-sidebar-block">
              <span className="mono cat-sidebar-label">Precio</span>
              <div className="cat-price-inputs">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="Mín"
                  value={priceMin}
                  onChange={(e) => changePriceMin(e.target.value)}
                  className="cat-price-input"
                  aria-label="Precio mínimo"
                />
                <span className="cat-price-sep">—</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="Máx"
                  value={priceMax}
                  onChange={(e) => changePriceMax(e.target.value)}
                  className="cat-price-input"
                  aria-label="Precio máximo"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button className="cat-clear-btn" onClick={clearFilters}>
                <Icon.Close /> Limpiar filtros
              </button>
            )}
          </aside>

          <div className="cat-content">
            <div className="mono" style={{ marginBottom: 16, color: 'var(--ink-mute)' }}>
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </div>

            {items.length === 0 ? (
              <div className="cat-empty">
                <p className="edit" style={{ fontSize: 18, margin: '0 0 16px', color: 'var(--ink-soft)' }}>
                  {searchActive
                    ? <>No encontramos productos para &ldquo;{searchQuery}&rdquo;.</>
                    : 'No encontramos productos con estos filtros.'}
                </p>
                <button className="cat-clear-btn" onClick={searchActive ? clearSearch : clearFilters}>
                  <Icon.Close /> {searchActive ? 'Ver todo el catálogo' : 'Limpiar filtros'}
                </button>
              </div>
            ) : (
              <>
                <div className="prod-nav">
                  <button
                    className="prod-arrow prod-arrow-left"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 0}
                    aria-label="Página anterior"
                  >
                    <Icon.Arrow style={{ transform: 'rotate(180deg)' }} />
                  </button>

                  <div
                    className={tab === 'mayores' ? 'prod-grid-mayores' : 'prod-grid-tesoros'}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px 16px' }}
                  >
                    {pageItems.map((p, i) => (
                      <RevealOnScroll key={`${p.id}-${page}`} delay={Math.min(i, 3)}>
                        <ProductCard
                          p={p}
                          variant="grid"
                          onAdd={onAdd}
                          added={added}
                          onSelect={(prod) => router.push(`/producto/${prod.id}`)}
                          onQuickView={setQuickView}
                        />
                      </RevealOnScroll>
                    ))}
                  </div>

                  <button
                    className="prod-arrow prod-arrow-right"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                    aria-label="Página siguiente"
                  >
                    <Icon.Arrow />
                  </button>
                </div>

                {/* ── Page dots ────────────────────────────────── */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 32 }}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} onClick={() => setPage(i)} aria-label={`Página ${i + 1}`}
                        style={{ width: i === page ? 24 : 8, height: 2, border: 0, padding: 0, cursor: 'pointer', background: i === page ? 'var(--ink)' : 'var(--line)', transition: 'width 0.3s, background 0.3s' }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <ProductQuickView product={quickView} onClose={() => setQuickView(null)} onAdd={onAdd} />
    </section>
  )
}
