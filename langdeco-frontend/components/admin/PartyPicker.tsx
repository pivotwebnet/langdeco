'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import type { BackendPartyBase } from '@/lib/backend-types'
import { useEscapeKey } from '@/lib/useEscapeKey'

interface PartyPickerProps<T extends BackendPartyBase> {
  items: T[]
  entityLabel: string
  onSelect: (item: T) => void
  onClose: () => void
  allowNone?: { label: string; onSelect: () => void }
}

const rowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14, width: '100%',
  padding: '12px 6px', background: 'none', border: 0, cursor: 'pointer',
  borderBottom: '1px solid var(--adm-border)', textAlign: 'left',
}

export function PartyPicker<T extends BackendPartyBase>({ items, entityLabel, onSelect, onClose, allowNone }: PartyPickerProps<T>) {
  const [search, setSearch] = useState('')
  useEscapeKey(onClose)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((p) =>
      p.companyOrFullName.toLowerCase().includes(q) || (p.taxId ?? '').toLowerCase().includes(q))
  }, [search, items])

  return (
    <div className="adm-modal-backdrop" style={{ zIndex: 110 }} onClick={(e) => { e.stopPropagation(); onClose() }}>
      <div className="adm-modal" style={{ width: 480, maxWidth: '92vw', padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-modal-title" style={{ marginBottom: 12 }}>Buscar {entityLabel.toLowerCase()}</h2>
        <input
          autoFocus
          className="adm-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Nombre o CUIT del ${entityLabel.toLowerCase()}...`}
          style={{ width: '100%', marginBottom: 12 }}
        />
        <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {allowNone && (
            <button onClick={allowNone.onSelect} style={rowStyle}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)' }}>{allowNone.label}</div>
              </div>
            </button>
          )}
          {filtered.length === 0 && (
            <div className="adm-empty" style={{ padding: '24px 0' }}>Sin resultados.</div>
          )}
          {filtered.map((p) => (
            <button key={p.id} onClick={() => onSelect(p)} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)', lineHeight: 1.35 }}>{p.companyOrFullName}</div>
                <div className="adm-table-sub" style={{ fontSize: 11, marginTop: 4 }}>
                  {[p.taxId, p.locality].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
            </button>
          ))}
        </div>
        <button className="adm-btn ghost" onClick={onClose} style={{ width: '100%', marginTop: 12 }}>Cancelar</button>
      </div>
    </div>
  )
}

interface PartyPickerFieldProps<T extends BackendPartyBase> {
  items: T[]
  entityLabel: string
  value: T | null
  onChange: (item: T | null) => void
  allowNoneLabel?: string
  placeholder?: string
}

// Trigger reutilizable: cajita con el nombre elegido + botón "Buscar" que abre el PartyPicker,
// y una "✕" para limpiar la selección. Reemplaza al <select> de Cliente/Proveedor en los 6
// lugares del admin que elegían uno de una lista — el onChange recibe el item completo (o null)
// para que cada página mantenga sus propios side-effects (autocompletar contacto/CUIT, filtrar).
export function PartyPickerField<T extends BackendPartyBase>({
  items, entityLabel, value, onChange, allowNoneLabel, placeholder,
}: PartyPickerFieldProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="adm-input" style={{ flex: 1, display: 'flex', alignItems: 'center', color: value ? 'var(--ink)' : 'var(--ink-soft)' }}>
          {value ? value.companyOrFullName : (placeholder ?? allowNoneLabel ?? `— Elegir ${entityLabel.toLowerCase()} —`)}
        </div>
        <button type="button" className="adm-btn ghost sm" onClick={() => setOpen(true)}>Buscar</button>
        {value && <button type="button" className="adm-btn ghost sm" onClick={() => onChange(null)}>✕</button>}
      </div>
      {open && (
        <PartyPicker
          items={items}
          entityLabel={entityLabel}
          onClose={() => setOpen(false)}
          onSelect={(item) => { onChange(item); setOpen(false) }}
          allowNone={allowNoneLabel ? { label: allowNoneLabel, onSelect: () => { onChange(null); setOpen(false) } } : undefined}
        />
      )}
    </>
  )
}
