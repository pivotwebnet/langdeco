'use client'

import { useState } from 'react'

export type RangePreset = 3 | 6 | 12 | 'all' | 'custom'

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Mismo cálculo de rango que usa el Dashboard (Panel de control) — se comparte para que
 * Ventas y Presupuestos filtren de forma consistente contra los mismos `from`/`to` que el
 * backend espera en /sales y /budgets. */
export function useDateRangeFilter(defaultPreset: RangePreset = 'all') {
  const [preset, setPreset] = useState<RangePreset>(defaultPreset)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  let from: string | null = null
  let to: string | null = null
  let ready = true

  if (preset === 'custom') {
    if (!customFrom || !customTo) ready = false
    else { from = customFrom; to = customTo }
  } else if (preset !== 'all') {
    const fromDate = new Date()
    fromDate.setMonth(fromDate.getMonth() - preset)
    from = toDateInputValue(fromDate)
  }

  const queryString = ready
    ? [from ? `from=${from}` : null, to ? `to=${to}` : null].filter(Boolean).join('&')
    : ''

  return { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, ready, queryString }
}

export function DateRangeFilter({
  preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, presets = [3, 6, 12],
}: {
  preset: RangePreset
  setPreset: (p: RangePreset) => void
  customFrom: string
  setCustomFrom: (v: string) => void
  customTo: string
  setCustomTo: (v: string) => void
  presets?: number[]
}) {
  return (
    <>
      <button className={`adm-btn sm ${preset === 'all' ? '' : 'ghost'}`} onClick={() => setPreset('all')}>Todo</button>
      {presets.map((m) => (
        <button key={m} className={`adm-btn sm ${preset === m ? '' : 'ghost'}`} onClick={() => setPreset(m as RangePreset)}>
          {m} meses
        </button>
      ))}
      <button className={`adm-btn sm ${preset === 'custom' ? '' : 'ghost'}`} onClick={() => setPreset('custom')}>
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
    </>
  )
}
