'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'error'
interface ToastItem { id: number; kind: ToastKind; message: string }

interface AdminToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

const AdminToastContext = createContext<AdminToastApi | null>(null)

const AUTO_DISMISS_MS = 4000

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++
    setToasts((list) => [...list, { id, kind, message }])
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }, [dismiss])

  const api: AdminToastApi = {
    success: (message) => push('success', message),
    error: (message) => push('error', message),
  }

  return (
    <AdminToastContext.Provider value={api}>
      {children}
      <div className="adm-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`adm-toast ${t.kind}`} onClick={() => dismiss(t.id)}>
            <span className="adm-toast-icon">{t.kind === 'success' ? '✓' : '✕'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  )
}

export function useAdminToast(): AdminToastApi {
  const ctx = useContext(AdminToastContext)
  if (!ctx) throw new Error('useAdminToast debe usarse dentro de <AdminToastProvider>')
  return ctx
}
