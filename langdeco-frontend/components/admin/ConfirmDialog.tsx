'use client'

import { useEscapeKey } from '@/lib/useEscapeKey'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Diálogo de confirmación propio, sobre la infraestructura de modal ya existente
// (`adm-modal-backdrop`) — reemplaza `window.confirm()`, que rompe con el lenguaje
// visual del resto del panel.
export function ConfirmDialog({
  title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  useEscapeKey(onCancel)

  return (
    <div className="adm-modal-backdrop" onClick={onCancel}>
      <div className="adm-modal" style={{ width: 420, padding: 28 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-modal-title" style={{ marginBottom: 12 }}>{title}</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="adm-btn ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={`adm-btn${danger ? ' danger' : ''}`} onClick={onConfirm} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
