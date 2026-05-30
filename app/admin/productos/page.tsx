'use client'

import { useState } from 'react'
import { PIEZAS_MAYORES, PEQUENOS_TESOROS } from '@/lib/data'
import type { Product } from '@/lib/types'

const ALL_PRODUCTS = [...PIEZAS_MAYORES, ...PEQUENOS_TESOROS]

export default function ProductosAdmin() {
  const [filter, setFilter] = useState<'all' | 'mayor' | 'tesoro'>('all')
  const [search, setSearch] = useState('')

  const filtered = ALL_PRODUCTS.filter((p) => {
    if (filter !== 'all' && p.category !== filter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 32, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
            Productos
          </h1>
          <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: 6 }}>
            {ALL_PRODUCTS.length} piezas en catálogo
          </p>
        </div>
        <button className="btn" style={{ fontSize: 11 }}>+ Añadir pieza</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pieza..."
          style={{
            flex: 1, maxWidth: 280,
            border: '1px solid var(--line)', background: 'white',
            padding: '10px 14px', fontFamily: 'var(--font-ui)', fontSize: 13,
            color: 'var(--ink)', outline: 'none',
          }}
        />
        {(['all', 'mayor', 'tesoro'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 14px',
              background: filter === f ? 'var(--ink)' : 'white',
              color: filter === f ? 'var(--bg)' : 'var(--ink)',
              border: '1px solid var(--ink)',
              cursor: 'pointer',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
          >
            {f === 'all' ? 'Todos' : f === 'mayor' ? 'Piezas Mayores' : 'Pequeños Tesoros'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 80px', padding: '12px 24px', borderBottom: '1px solid var(--line)', background: '#F8F7F4' }}>
          {['Nombre', 'Material', 'Origen', 'Precio', ''].map((h) => (
            <span key={h} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>{h}</span>
          ))}
        </div>
        {filtered.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 80px',
              padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>
                {p.category === 'mayor' ? 'Pieza Mayor' : 'Pequeño Tesoro'} · {p.tag || '—'}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{p.material}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.04em' }}>{p.origin || '—'}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ink)', letterSpacing: '0.04em' }}>{p.price}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', padding: 0 }}>
                Editar
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'var(--font-edit)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 18 }}>
            Sin resultados.
          </div>
        )}
      </div>
    </div>
  )
}
