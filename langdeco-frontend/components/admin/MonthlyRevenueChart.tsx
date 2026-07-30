'use client'

import { useState } from 'react'
import type { MonthlyRevenue } from '@/lib/backend-types'

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return `${MONTH_LABELS[Number(m) - 1]} ${year.slice(2)}`
}

function formatCurrency(value: number): string {
  return `$ ${Math.round(value).toLocaleString('de-DE')}`
}

export default function MonthlyRevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (data.length === 0) {
    return <div className="adm-empty">Sin ventas cobradas en el período.</div>
  }

  const max = Math.max(...data.map((d) => d.revenue), 1)
  const labelStep = Math.max(1, Math.ceil(data.length / 12))

  return (
    <div className="adm-chart">
      <div className="adm-chart-bars">
        {data.map((d, i) => {
          const heightPct = d.revenue > 0 ? Math.max((d.revenue / max) * 100, 3) : 0
          return (
            <div
              key={d.month}
              className="adm-chart-col"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              {hovered === i && (
                <div className="adm-chart-tooltip">
                  <div className="adm-chart-tooltip-value">{formatCurrency(d.revenue)}</div>
                  <div className="adm-chart-tooltip-sub">
                    {d.salesCount} venta{d.salesCount === 1 ? '' : 's'}
                  </div>
                </div>
              )}
              <div className="adm-chart-bar-track">
                <div className="adm-chart-bar" style={{ height: `${heightPct}%` }} />
              </div>
              <div className="adm-chart-label">{i % labelStep === 0 ? formatMonth(d.month) : ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
