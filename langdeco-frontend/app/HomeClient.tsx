'use client'

import { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/layout/CartDrawer'
import { Hero } from '@/components/sections/Hero'
import { Favoritos } from '@/components/sections/Favoritos'
import { Inspiracion } from '@/components/sections/Inspiracion'
import { Productos } from '@/components/sections/Productos'
import { Visita } from '@/components/sections/Visita'
import { ScrollAnimator } from '@/components/ui/ScrollAnimator'
import { Marquee } from '@/components/ui/Marquee'
import { PromoBar } from '@/components/ui/PromoBar'
import * as Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'
import type { SiteContent } from '@/lib/site-content'

interface HomeClientProps {
  products: Product[]
  featured: Product[]
  initialCategory?: 'mayor' | 'tesoro'
  siteContent: SiteContent
}

export default function HomeClient({ products, featured, initialCategory, siteContent }: HomeClientProps) {
  const [cartOpen, setCartOpen] = useState(false)
  const [scrollY, setScrollY]   = useState(0)
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      requestAnimationFrame(() => {
        const y = window.scrollY
        setScrollY(y)
        if (fillRef.current) {
          const doc = document.documentElement
          const max = (doc.scrollHeight - window.innerHeight) || 1
          fillRef.current.style.width = Math.min(100, (y / max) * 100) + '%'
        }
        ticking = false
      })
      ticking = true
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Animated background orbs — fixed, behind everything */}
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* GSAP scroll animation setup */}
      <ScrollAnimator />

      <div className="stage">
        <div className="device" id="device">

          <PromoBar text={siteContent.promoBar} />

          {/* Scroll progress */}
          <div className="scroll-track">
            <div ref={fillRef} className="fill" />
          </div>

          <Header onCartOpen={() => setCartOpen(true)} />

          <Hero variant="editorial" />

          <Favoritos showBadge items={featured} />

          {/* Animated marquee ticker */}
          <Marquee />

          <Inspiracion items={siteContent.inspiracion} />

          <Productos products={products} initialCategory={initialCategory} />

          <Visita />

          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </div>

        {/* Footer lives outside .device so its dark background is truly full-width */}
        <Footer />
      </div>

      {/* Floating action buttons — right side, fixed */}
      <div className={`floating-stack${scrollY > 320 ? ' in' : ''}`}>
        <button
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver al inicio"
        >
          <Icon.ArrowDown style={{ transform: 'rotate(180deg)' }} />
        </button>
        <button
          className="wa-pill"
          onClick={() => window.open('https://wa.me/34914321860', '_blank')}
          aria-label="Hablar por WhatsApp"
        >
          <div className="dot"><Icon.Whatsapp /></div>
          <span>Hablar por WhatsApp</span>
        </button>
      </div>
    </>
  )
}
