import type { CSSProperties, ReactNode } from 'react'

// Input de formulario con label, compartido por las páginas del panel admin —
// antes cada page.tsx redeclaraba este mismo componente.
export function Field({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="adm-field" style={style}>
      <label className="adm-field-label">{label}</label>
      {children}
    </div>
  )
}
