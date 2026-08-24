'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { ProductCard } from '@/components/ui/ProductCard'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

interface GuardadosProps {
  products: Product[]
}

export function Guardados({ products }: GuardadosProps) {
  const { ids } = useWishlist()
  const { add } = useCart()
  const [added, setAdded] = useState<string | null>(null)
  const router = useRouter()

  const saved = products.filter((p) => ids.includes(p.id))

  const onAdd = (p: Product) => {
    add(p)
    setAdded(p.id)
    setTimeout(() => setAdded((v) => v === p.id ? null : v), 1200)
  }

  return (
    <section style={{ padding: '0 24px 96px', maxWidth: 1180, margin: '0 auto' }}>
      {saved.length === 0 ? (
        <div className="cat-empty">
          <Icon.Heart width={28} height={28} style={{ color: 'var(--ink-mute)', marginBottom: 16 }} />
          <p className="edit" style={{ fontSize: 18, margin: '0 0 16px', color: 'var(--ink-soft)' }}>
            Todavía no guardaste ninguna pieza.
          </p>
          <button className="btn ghost" onClick={() => router.push('/catalogo')}>
            Ver el catálogo <Icon.Arrow />
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '32px 16px' }}>
          {saved.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              variant="grid"
              onAdd={onAdd}
              added={added}
              onSelect={(prod) => router.push(`/producto/${prod.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
