'use client'

import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from 'react'
import type { CartItem, Product } from './types'

const CART_KEY = '__lld_cart_v1'

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD'; product: Product }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

/** Redondea y limita una cantidad a 1..stock (si el stock es conocido) para no pedir más de lo disponible. */
function clampQty(qty: number, stock?: number): number {
  const q = Math.max(1, Math.floor(qty))
  if (typeof stock === 'number' && Number.isFinite(stock) && stock > 0) {
    return Math.min(q, stock)
  }
  return q
}

/** Descarta cualquier item con forma inválida (localStorage corrompido a mano, extensión de browser, etc.) en vez de romper el carrito. */
function sanitizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((item): item is CartItem =>
      !!item && typeof item === 'object' &&
      typeof (item as CartItem).id === 'string' && (item as CartItem).id.length > 0 &&
      typeof (item as CartItem).name === 'string' &&
      Number.isFinite((item as CartItem).qty) &&
      Number.isFinite((item as CartItem).priceNum) && (item as CartItem).priceNum >= 0)
    .map((item) => ({ ...item, qty: clampQty(item.qty, item.stock) }))
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.product.id)
      if (existing) {
        return { items: state.items.map((i) => i.id === action.product.id ? { ...i, qty: clampQty(i.qty + 1, i.stock) } : i) }
      }
      return { items: [...state.items, { ...action.product, qty: clampQty(1, action.product.stock) }] }
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.id !== action.id) }
    case 'SET_QTY':
      if (action.qty <= 0) return { items: state.items.filter((i) => i.id !== action.id) }
      return { items: state.items.map((i) => i.id === action.id ? { ...i, qty: clampQty(action.qty, i.stock) } : i) }
    case 'CLEAR':
      return { items: [] }
    case 'HYDRATE':
      return { items: sanitizeItems(action.items) }
    default:
      return state
  }
}

interface CartContextValue {
  items: CartItem[]
  count: number
  total: number
  add: (product: Product) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (raw) dispatch({ type: 'HYDRATE', items: JSON.parse(raw) })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.items))
    } catch { /* ignore */ }
  }, [state.items])

  const count = state.items.reduce((s, i) => s + i.qty, 0)
  const total = state.items.reduce((s, i) => s + i.priceNum * i.qty, 0)

  return (
    <CartContext.Provider value={{
      items: state.items,
      count,
      total,
      add: (product) => dispatch({ type: 'ADD', product }),
      remove: (id) => dispatch({ type: 'REMOVE', id }),
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      clear: () => dispatch({ type: 'CLEAR' }),
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

/* ── Cart drawer UI state — global, para que el mismo drawer se abra
   desde el header, el catálogo o el botón flotante en cualquier página. */
interface CartUIContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const CartUIContext = createContext<CartUIContextValue | null>(null)

export function CartUIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <CartUIContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </CartUIContext.Provider>
  )
}

export function useCartUI() {
  const ctx = useContext(CartUIContext)
  if (!ctx) throw new Error('useCartUI must be used within CartUIProvider')
  return ctx
}
