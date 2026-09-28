'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

/* ── Gift card popup UI state — global, para que el mismo popup se abra
   desde el dock flotante o desde el destaque del footer en cualquier página. */
interface GiftCardUIContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const GiftCardUIContext = createContext<GiftCardUIContextValue | null>(null)

export function GiftCardUIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <GiftCardUIContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </GiftCardUIContext.Provider>
  )
}

export function useGiftCardUI() {
  const ctx = useContext(GiftCardUIContext)
  if (!ctx) throw new Error('useGiftCardUI must be used within GiftCardUIProvider')
  return ctx
}
