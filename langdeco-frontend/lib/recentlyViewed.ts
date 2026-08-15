'use client'

import { useEffect, useState } from 'react'
import type { Product } from './types'

const KEY = '__lld_recently_viewed_v1'
const MAX_ITEMS = 8

export function trackRecentlyViewed(product: Product) {
  try {
    const raw = localStorage.getItem(KEY)
    const list: Product[] = raw ? JSON.parse(raw) : []
    const next = [product, ...list.filter((p) => p.id !== product.id)].slice(0, MAX_ITEMS)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch { /* ignore */ }
}

export function useRecentlyViewed(excludeId?: string): Product[] {
  const [items, setItems] = useState<Product[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      const list: Product[] = raw ? JSON.parse(raw) : []
      setItems(excludeId ? list.filter((p) => p.id !== excludeId) : list)
    } catch { /* ignore */ }
  }, [excludeId])

  return items
}
