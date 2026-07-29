'use client'

import { useEffect, useState } from 'react'
import { useCart, useCartUI } from '@/lib/cart'
import { Tooltip } from '@/components/ui/Tooltip'
import { Magnetic } from '@/components/ui/Magnetic'
import * as Icon from '@/components/ui/Icon'

export function FloatingCartButton() {
  const { count } = useCart()
  const { open } = useCartUI()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`floating-cart${scrollY > 200 ? ' in' : ''}`}>
      <Tooltip label="Ver selección" side="bottom">
        <Magnetic strength={0.25}>
          <button className="floating-cart-btn" onClick={open} aria-label="Ver selección">
            <Icon.Cart />
            {count > 0 && <span className="floating-cart-badge">{count}</span>}
          </button>
        </Magnetic>
      </Tooltip>
    </div>
  )
}
