'use client'

interface BulkActionBarProps {
  count: number
  onClear: () => void
  children: React.ReactNode
}

// Barra de acciones en lote — aparece arriba de la tabla cuando hay filas
// seleccionadas. Mismo lenguaje visual que .adm-toolbar del resto del panel.
export function BulkActionBar({ count, onClear, children }: BulkActionBarProps) {
  return (
    <div className="adm-toolbar" style={{ background: 'var(--adm-surface-2)', alignItems: 'center' }}>
      <span className="mono" style={{ fontSize: 12 }}>{count} seleccionado{count === 1 ? '' : 's'}</span>
      <button type="button" className="adm-btn ghost sm" onClick={onClear}>Limpiar selección</button>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 8 }}>{children}</div>
    </div>
  )
}
