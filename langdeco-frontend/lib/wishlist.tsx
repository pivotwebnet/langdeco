'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const WISHLIST_KEY = '__lld_wishlist_v1'

interface WishlistContextValue {
  ids: string[]
  count: number
  has: (id: string) => boolean
  toggle: (id: string) => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      // Si el dato guardado está corrompido (no es un array de ids), lo ignoramos en vez de romper la página.
      if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) {
        setIds(parsed)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids))
    } catch { /* ignore */ }
  }, [ids])

  const toggle = (id: string) => {
    setIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  return (
    <WishlistContext.Provider value={{ ids, count: ids.length, has: (id) => ids.includes(id), toggle }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
