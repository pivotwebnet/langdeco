'use client'

import { useCartUI } from '@/lib/cart'
import { CartDrawer } from '@/components/layout/CartDrawer'

export function CartDrawerHost() {
  const { isOpen, close } = useCartUI()
  return <CartDrawer open={isOpen} onClose={close} />
}
