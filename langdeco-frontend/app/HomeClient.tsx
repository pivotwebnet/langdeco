'use client'

import { useEffect, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { Favoritos } from '@/components/sections/Favoritos'
import { CatalogoRapido } from '@/components/sections/CatalogoRapido'
import { Inspiracion } from '@/components/sections/Inspiracion'
import { Visualizador } from '@/components/sections/Visualizador'
import { Visita } from '@/components/sections/Visita'
import { Explorar } from '@/components/sections/Explorar'
import { ScrollAnimator } from '@/components/ui/ScrollAnimator'
import { Marquee } from '@/components/ui/Marquee'
import { PromoBar } from '@/components/ui/PromoBar'
import type { Product } from '@/lib/types'
import type { SiteContent } from '@/lib/site-content'
import type { BackendCategory } from '@/lib/backend-types'

interface HomeClientProps {
  products: Product[]
  featured: Product[]
  siteContent: SiteContent
  categories: BackendCategory[]
}

export default function HomeClient({ products, featured, siteContent, categories }: HomeClientProps) {
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      requestAnimationFrame(() => {
        const y = window.scrollY
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

          <Header hasPromo={Boolean(siteContent.promoBar)} />

          <Hero
            heroImageUrl={siteContent.heroImageUrl}
            heroTitle={siteContent.heroTitle}
            heroTitleEmphasis={siteContent.heroTitleEmphasis}
            heroSubtitle={siteContent.heroSubtitle}
          />

          <Favoritos showBadge items={featured} />

          <CatalogoRapido products={products} />

          {/* Animated marquee ticker */}
          <Marquee />

          <Inspiracion items={siteContent.inspiracion} products={products} />

          <Visualizador products={products} categories={categories} compact />

          <Visita />

          <Explorar />
        </div>

        {/* Footer lives outside .device so its dark background is truly full-width */}
        <Footer />
      </div>
    </>
  )
}
