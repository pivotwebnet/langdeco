'use client'

import { useState, useEffect } from 'react'
import type { BudgetsSummary, SalesSummary } from '@/lib/backend-types'
import MonthlyRevenueChart from '@/components/admin/MonthlyRevenueChart'
import { adminApi as api } from '@/lib/admin/api'
import { formatPrice } from '@/lib/data'

type RangePreset = 3 | 6 | 12 | 'custom'

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [budgetsSummary, setBudgetsSummary] = useState<BudgetsSummary | null>(null)
  const [budgetsSummaryError, setBudgetsSummaryError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [preset, setPreset] = useState<RangePreset>(12)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    let from: string | null = null
    let to: string | null = null

    if (preset === 'custom') {
      if (!customFrom || !customTo) return
      from = customFrom
      to = customTo
    } else {
      const fromDate = new Date()
      fromDate.setMonth(fromDate.getMonth() - preset)
      from = toDateInputValue(fromDate)
    }

    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    setLoading(true)
    api<SalesSummary>(`/sales/summary?${params.toString()}`)
      .then(setSummary)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [preset, customFrom, customTo])

  useEffect(() => {
    setBudgetsSummaryError(null)
    api<BudgetsSummary>('/budgets/summary')
      .then(setBudgetsSummary)
      .catch((e) => setBudgetsSummaryError((e as Error).message))
  }, [])

  const revenueChange = summary?.revenueChangePercent ?? null
  const deltaDirection = revenueChange === null ? 'flat' : revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'flat'
  const deltaArrow = deltaDirection === 'up' ? '▲' : deltaDirection === 'down' ? '▼' : '—'

  const stats = summary ? [
    {
      label: 'Ingresos (cobrados)',
      value: formatPrice(summary.revenue),
      delta: revenueChange !== null ? (
        <span className={`adm-stat-delta ${deltaDirection}`}>
          {deltaArrow} {Math.abs(revenueChange).toFixed(1)}%
          <span className="adm-stat-delta-label">&nbsp;vs. período anterior</span>
        </span>
      ) : null,
    },
    { label: 'Ticket promedio', value: formatPrice(summary.averageTicket), delta: null },
    { label: 'Ventas cobradas', value: summary.salesCount, delta: null },
    { label: 'Mayorista / Minorista', value: `$${(summary.wholesaleRevenue / 1000).toFixed(0)}k / $${(summary.retailRevenue / 1000).toFixed(0)}k`, delta: null },
  ] : []

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Panel de control</h1>
          <p className="adm-eyebrow">LasLangDeco · Casa &amp; Curaduría</p>
        </div>
      </div>

      <div className="adm-toolbar">
        {([3, 6, 12] as const).map((m) => (
          <button
            key={m}
            className={`adm-btn sm ${preset === m ? '' : 'ghost'}`}
            onClick={() => setPreset(m)}
          >
            {m} meses
          </button>
        ))}
        <button
          className={`adm-btn sm ${preset === 'custom' ? '' : 'ghost'}`}
          onClick={() => setPreset('custom')}
        >
          Rango libre
        </button>

        {preset === 'custom' && (
          <>
            <input
              className="adm-input"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              style={{ width: 150 }}
            />
            <span style={{ alignSelf: 'center' }}>a</span>
            <input
              className="adm-input"
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              style={{ width: 150 }}
            />
          </>
        )}
      </div>

      {error && <div className="adm-alert error">{error}</div>}

      {/* Stats grid */}
      <div className="adm-stat-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="adm-stat-card">
                <div className="adm-skel" style={{ width: 90, height: 9, marginBottom: 14 }} />
                <div className="adm-skel" style={{ width: 60, height: 26 }} />
              </div>
            ))
          : stats.map((s) => (
              <div key={s.label} className="adm-stat-card">
                <div className="adm-stat-label">{s.label}</div>
                <div className="adm-stat-value">{s.value}</div>
                {s.delta}
              </div>
            ))}
      </div>

      {/* Evolución mensual */}
      <div style={{ marginBottom: 24 }}>
        <h2 className="adm-section-title">Evolución mensual</h2>
        <div className="adm-card">
          {loading ? (
            <div className="adm-loading">Cargando…</div>
          ) : (
            <MonthlyRevenueChart data={summary?.monthlyRevenue ?? []} />
          )}
        </div>
      </div>

      <div className="adm-grid-2" style={{ display: 'grid', gap: 24 }}>
        {/* Ranking */}
        <div>
          <h2 className="adm-section-title">Más vendidos</h2>
          <div className="adm-card">
            {loading ? (
              <div className="adm-loading">Cargando…</div>
            ) : summary?.ranking.length ? (
              summary.ranking.map((r, i) => (
                <div key={r.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 22px', borderBottom: i < summary.ranking.length - 1 ? '1px solid var(--adm-border)' : 'none' }}>
                  <div>
                    <div className="adm-table-name">{r.productName}</div>
                    <div className="adm-table-sub">{r.quantitySold} unidades vendidas</div>
                  </div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{formatPrice(r.revenue)}</div>
                </div>
              ))
            ) : (
              <div className="adm-empty">Sin ventas cobradas todavía.</div>
            )}
          </div>
        </div>

        {/* Reposición de stock */}
        <div>
          <h2 className="adm-section-title">Reposición de stock</h2>
          <div className="adm-card">
            {loading ? (
              <div className="adm-loading">Cargando…</div>
            ) : summary?.lowStock.length ? (
              summary.lowStock.map((p, i) => (
                <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: i < summary.lowStock.length - 1 ? '1px solid var(--adm-border)' : 'none' }}>
                  <span style={{ fontSize: 14 }}>{p.productName}</span>
                  <span className={`adm-badge ${p.stock === 0 ? 'danger' : 'warn'}`}>
                    {p.stock === 0 ? 'Agotado' : `${p.stock} unidades`}
                  </span>
                </div>
              ))
            ) : (
              <div className="adm-empty">Todo con stock suficiente.</div>
            )}
          </div>
        </div>

        {/* Presupuestos por vencer */}
        <div>
          <h2 className="adm-section-title">Presupuestos por vencer (próx. 7 días)</h2>
          <div className="adm-card">
            {budgetsSummaryError ? (
              <div className="adm-alert error" style={{ margin: 16 }}>{budgetsSummaryError}</div>
            ) : !budgetsSummary ? (
              <div className="adm-loading">Cargando…</div>
            ) : budgetsSummary.expiringSoon.length ? (
              budgetsSummary.expiringSoon.map((b, i) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: i < budgetsSummary.expiringSoon.length - 1 ? '1px solid var(--adm-border)' : 'none' }}>
                  <div>
                    <div className="adm-table-name">#{b.number} · {b.customerName}</div>
                    <div className="adm-table-sub">Vence {new Date(b.validUntil).toLocaleDateString('es-AR')}</div>
                  </div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{formatPrice(b.total)}</div>
                </div>
              ))
            ) : (
              <div className="adm-empty">Ningún presupuesto abierto vence pronto.</div>
            )}
            {budgetsSummary && budgetsSummary.expiringSoonCount > budgetsSummary.expiringSoon.length && (
              <div style={{ padding: '10px 22px', fontSize: 12, color: 'var(--ink-soft)', borderBottom: '1px solid var(--adm-border)' }}>
                +{budgetsSummary.expiringSoonCount - budgetsSummary.expiringSoon.length} más por vencer
              </div>
            )}
            {budgetsSummary && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid var(--adm-border)', fontSize: 12, color: 'var(--ink-soft)' }}>
                <span>{budgetsSummary.openCount} abiertos</span>
                <span>Tasa de conversión: {budgetsSummary.conversionRatePercent}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
