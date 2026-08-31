'use client'

import { useState } from 'react'
import { useEscapeKey } from '@/lib/useEscapeKey'

interface PercentAdjustDialogProps {
  count: number
  onConfirm: (percent: number) => void
  onCancel: () => void
}

// Modal para ajustar el precio de varios productos a la vez por un porcentaje —
// mismo lenguaje visual que ConfirmDialog. El signo (aumento vs. descuento) se
// resuelve acá y se manda ya calculado a onConfirm (positivo = aumento, negativo = descuento).
export function PercentAdjustDialog({ count, onConfirm, onCancel }: PercentAdjustDialogProps) {
  const [isDiscount, setIsDiscount] = useState(true)
  const [value, setValue] = useState(0)
  useEscapeKey(onCancel)

  const percent = isDiscount ? -value : value
  const canConfirm = value > 0 && (!isDiscount || value < 100)

  return (
    <div className="adm-modal-backdrop" onClick={onCancel}>
      <div className="adm-modal" style={{ width: 420, padding: 28 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-modal-title" style={{ marginBottom: 12 }}>Ajustar precio</h2>
        <p style={{ margin: '0 0 20px', color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>
          Se aplica a {count} producto{count === 1 ? '' : 's'} seleccionado{count === 1 ? '' : 's'} — precio, precio tachado y precio mayorista se ajustan por igual.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <select className="adm-select" value={isDiscount ? 'discount' : 'increase'} onChange={(e) => setIsDiscount(e.target.value === 'discount')} style={{ flex: 1 }}>
            <option value="increase">Aumentar</option>
            <option value="discount">Descuento</option>
          </select>
          <input
            className="adm-input" type="number" min={0} max={isDiscount ? 100 : 500}
            value={value} onChange={(e) => setValue(Number(e.target.value))} style={{ flex: 1 }} autoFocus
          />
          <span style={{ alignSelf: 'center', color: 'var(--ink-soft)' }}>%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="adm-btn ghost" onClick={onCancel}>Cancelar</button>
          <button className="adm-btn" disabled={!canConfirm} onClick={() => onConfirm(percent)}>Aplicar</button>
        </div>
      </div>
    </div>
  )
}
