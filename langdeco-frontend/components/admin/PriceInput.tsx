// Input de precio en pesos enteros. Se usa texto en vez de <input type="number">
// porque ese tipo siempre interpreta "." como separador decimal (aunque el
// formato local uses "." como separador de miles) — tipear "982.300" queda
// en 982.3 en vez de 982300. Acá se descarta todo lo que no sea dígito y se
// muestra formateado con el mismo criterio que formatPrice (lib/data.ts).
import type { CSSProperties } from 'react'

export function PriceInput({ value, onChange, placeholder, style }: {
  value: string
  onChange: (digits: string) => void
  placeholder?: string
  style?: CSSProperties
}) {
  const display = value ? Number(value).toLocaleString('de-DE') : ''

  return (
    <input
      className="adm-input"
      type="text"
      inputMode="numeric"
      value={display}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      placeholder={placeholder}
      style={style}
    />
  )
}
