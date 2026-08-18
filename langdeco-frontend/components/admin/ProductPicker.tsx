'use client'

import { useMemo, useState } from 'react'
import type { BackendProduct } from '@/lib/backend-types'
import { formatPrice } from '@/lib/data'
import { useEscapeKey } from '@/lib/useEscapeKey'

interface ProductPickerProps {
  products: BackendProduct[]
  onSelect: (product: BackendProduct) => void
  onClose: () => void
  title?: string
}

export function ProductPicker({ products, onSelect, onClose, title = 'Elegir producto' }: ProductPickerProps) {
  const [search, setSearch] = useState('')
  useEscapeKey(onClose)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [search, products])

  return (
    <div className="adm-modal-backdrop" style={{ zIndex: 110 }} onClick={(e) => { e.stopPropagation(); onClose() }}>
      <div className="adm-modal" style={{ width: 420, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-modal-title" style={{ marginBottom: 12 }}>{title}</h2>
        <input
          autoFocus
          className="adm-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          style={{ width: '100%', marginBottom: 12 }}
        />
        <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div className="adm-empty" style={{ padding: '24px 0' }}>Sin resultados.</div>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '8px 6px', background: 'none', border: 0, cursor: 'pointer',
                borderBottom: '1px solid var(--adm-border)', textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 48, flexShrink: 0, background: 'var(--adm-surface-2)', overflow: 'hidden', borderRadius: 4 }}>
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div className="adm-table-sub">{p.categoryName}</div>
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--ink)', flexShrink: 0 }}>{formatPrice(p.price)}</div>
            </button>
          ))}
        </div>
        <button className="adm-btn ghost" onClick={onClose} style={{ width: '100%', marginTop: 12 }}>Cancelar</button>
      </div>
    </div>
  )
}
