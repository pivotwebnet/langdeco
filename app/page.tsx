'use client'

import { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/layout/CartDrawer'
import { Hero } from '@/components/sections/Hero'
import { Manifesto } from '@/components/sections/Manifesto'
import { SeleccionCarmen } from '@/components/sections/SeleccionCarmen'
import { Lookbook } from '@/components/sections/Lookbook'
import { Productos } from '@/components/sections/Productos'
import { Visita } from '@/components/sections/Visita'
import { ScrollAnimator } from '@/components/ui/ScrollAnimator'
import { Marquee } from '@/components/ui/Marquee'
import * as Icon from '@/components/ui/Icon'

export default function HomePage() {
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

          {/* Scroll progress */}
          <div className="scroll-track">
            <div ref={fillRef} className="fill" />
          </div>

          <Header onCartOpen={() => setCartOpen(true)} />

          <Hero variant="editorial" />

          <Manifesto />

          <SeleccionCarmen showBadge />

          {/* Animated marquee ticker */}
          <Marquee />

          <Lookbook />

          <Productos />

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
          aria-label="Hablar con Carmen por WhatsApp"
        >
          <div className="dot"><Icon.Whatsapp /></div>
          <span>Hablar con Carmen</span>
        </button>
      </div>
    </>
  )
}
