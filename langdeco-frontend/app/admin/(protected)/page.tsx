'use client'

import { useState, useEffect } from 'react'
import type { SalesSummary } from '@/lib/backend-types'

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`/api/admin/backend${path}`)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data as T
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<SalesSummary>('/sales/summary').then(setSummary).catch((e) => setError((e as Error).message))
  }, [])

  const stats = summary ? [
    { label: 'Ingresos (cobrados)', value: `$ ${summary.revenue.toLocaleString('de-DE')}` },
    { label: 'Ticket promedio', value: `$ ${Math.round(summary.averageTicket).toLocaleString('de-DE')}` },
    { label: 'Ventas cobradas', value: summary.salesCount },
    { label: 'Mayorista / Minorista', value: `$${(summary.wholesaleRevenue / 1000).toFixed(0)}k / $${(summary.retailRevenue / 1000).toFixed(0)}k` },
  ] : []

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 36, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
          Panel de control
        </h1>
        <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: 8 }}>
          LasLongDeco · Casa &amp; Curaduría
        </p>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', marginBottom: 24, fontSize: 13 }}>{error}</div>}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'white', border: '1px solid var(--line)', padding: '24px 28px' }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 12 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 32, lineHeight: 1, color: 'var(--ink)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Ranking */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-ui)', fontWeight: 400, fontSize: 18, letterSpacing: '-0.01em', margin: '0 0 20px', color: 'var(--ink)' }}>
            Más vendidos
          </h2>
          <div style={{ background: 'white', border: '1px solid var(--line)' }}>
            {summary?.ranking.length ? summary.ranking.map((r, i) => (
              <div key={r.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px', borderBottom: i < summary.ranking.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500 }}>{r.productName}</div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{r.quantitySold} unidades vendidas</div>
                </div>
                <div className="mono" style={{ fontSize: 12 }}>$ {r.revenue.toLocaleString('de-DE')}</div>
              </div>
            )) : (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>Sin ventas cobradas todavía.</div>
            )}
          </div>
        </div>

        {/* Reposición de stock */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-ui)', fontWeight: 400, fontSize: 18, letterSpacing: '-0.01em', margin: '0 0 20px', color: 'var(--ink)' }}>
            Reposición de stock
          </h2>
          <div style={{ background: 'white', border: '1px solid var(--line)' }}>
            {summary?.lowStock.length ? summary.lowStock.map((p, i) => (
              <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px', borderBottom: i < summary.lowStock.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14 }}>{p.productName}</span>
                <span className="mono" style={{ fontSize: 11, color: p.stock === 0 ? '#991B1B' : '#92400E' }}>
                  {p.stock === 0 ? 'Agotado' : `${p.stock} unidades`}
                </span>
              </div>
            )) : (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>Todo con stock suficiente.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
