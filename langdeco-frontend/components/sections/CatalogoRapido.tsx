'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { ProductCard } from '@/components/ui/ProductCard'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

const PAGE_SIZE = 8

interface CatalogoRapidoProps {
  products: Product[]
}

export function CatalogoRapido({ products }: CatalogoRapidoProps) {
  const [added, setAdded] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const { add } = useCart()
  const router = useRouter()

  const onAdd = (p: Product) => {
    add(p)
    setAdded(p.id)
    setTimeout(() => setAdded((v) => (v === p.id ? null : v)), 1200)
  }

  const totalPages = Math.ceil(products.length / PAGE_SIZE)
  const pageItems = products.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (products.length === 0) return null

  return (
    <section data-dt="catalogo-rapido" style={{ position: 'relative', padding: '64px 0 72px', overflow: 'hidden' }}>
      <div style={{ padding: '0 24px', marginBottom: 32, textAlign: 'center' }}>
        <RevealOnScroll>
          <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>El catálogo</span>
        </RevealOnScroll>
        <RevealOnScroll delay={1}>
          <h2 className="display" style={{ fontSize: 32, margin: '0 0 20px' }}>
            Para consultar <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>rápido</em>.
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={2}>
          <Link href="/catalogo" className="btn" style={{ textDecoration: 'none' }}>
            Catálogo completo <Icon.Arrow />
          </Link>
        </RevealOnScroll>
      </div>

      <div className="prod-nav">
        <button
          className="prod-arrow prod-arrow-left"
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 0}
          aria-label="Página anterior"
        >
          <Icon.Arrow style={{ transform: 'rotate(180deg)' }} />
        </button>

        <div
          className="catrapido-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px 16px' }}
        >
          {pageItems.map((p, i) => (
            <RevealOnScroll key={`${p.id}-${page}`} delay={Math.min(i, 3)}>
              <ProductCard p={p} variant="grid" onAdd={onAdd} added={added} onSelect={(prod) => router.push(`/producto/${prod.id}`)} />
            </RevealOnScroll>
          ))}
        </div>

        <button
          className="prod-arrow prod-arrow-right"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Página siguiente"
        >
          <Icon.Arrow />
        </button>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 32, padding: '0 24px' }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Página ${i + 1}`}
              style={{
                width: i === page ? 24 : 8, height: 2, border: 0, padding: 0, cursor: 'pointer',
                background: i === page ? 'var(--ink)' : 'var(--line)', transition: 'width 0.3s, background 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
