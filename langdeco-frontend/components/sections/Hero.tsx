'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ParallaxElement } from '@/components/ui/ParallaxElement'
import { FurnitureHotspot } from '@/components/ui/FurnitureHotspot'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import * as Icon from '@/components/ui/Icon'
import type { HeroVariant } from '@/lib/types'

gsap.registerPlugin(ScrollTrigger)

interface HeroProps {
  variant?: HeroVariant
}

export function Hero({ variant = 'editorial' }: HeroProps) {
  const heroImgRef  = useRef<HTMLDivElement>(null)
  const titleRef    = useRef<HTMLHeadingElement>(null)

  useGSAP(() => {
    if (!heroImgRef.current) return
    gsap.to(heroImgRef.current, {
      y: 60,
      scale: 1.08,
      ease: 'none',
      scrollTrigger: {
        trigger: heroImgRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })
  }, { scope: heroImgRef })

  useGSAP(() => {
    if (!titleRef.current) return
    const lines = titleRef.current.querySelectorAll<HTMLElement>('.hero-line')
    gsap.fromTo(lines,
      { yPercent: 108, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.25, ease: 'expo.out', stagger: 0.22, delay: 0.25 }
    )
  })

  if (variant === 'cinematic') {
    return (
      <section data-dt="hero-cinematic" style={{ position: 'relative', padding: '0 0 64px', overflow: 'hidden' }}>
        <div className="cine-wrap" style={{ position: 'relative', width: '100%', aspectRatio: '3/4.4', overflow: 'hidden', background: '#ECEAE4' }}>
          <div ref={heroImgRef} style={{ position: 'absolute', inset: 0, background: '#DDDCD5' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.5) 100%)' }} />
          <div className="cine-caption" style={{ position: 'absolute', left: 24, right: 24, bottom: 32, color: '#F2F1ED' }}>
            <div>
              <div className="kicker" style={{ color: 'rgba(242,241,237,0.7)' }}>Catálogo · Otoño 26</div>
              <RevealOnScroll delay={1}>
                <h1 className="display" style={{ fontSize: 46, margin: '12px 0 18px', color: '#F2F1ED' }}>
                  Habitar es{' '}
                  <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>
                    una conversación
                  </em>{' '}
                  con la casa.
                </h1>
              </RevealOnScroll>
            </div>
            <button className="btn" style={{ borderColor: '#F2F1ED', background: '#F2F1ED', color: '#0A0A0A' }}>
              Ver la selección <Icon.Arrow />
            </button>
          </div>
        </div>
        <ParallaxElement speed={0.45} rotate={-6} style={{ top: '24%', right: -60, width: 180, height: 240, zIndex: 5 }} tag="3D · monstera deliciosa">
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)' }} />
        </ParallaxElement>
      </section>
    )
  }

  if (variant === 'showroom') {
    return (
      <section data-dt="hero-showroom" style={{ position: 'relative', padding: '32px 24px 80px', overflow: 'hidden' }}>
        <div className="show-text">
          <RevealOnScroll><div className="kicker" style={{ marginBottom: 12 }}>Showroom Madrid · desde 1994</div></RevealOnScroll>
          <RevealOnScroll delay={1}>
            <h1 className="display show-h1" style={{ fontSize: 44, margin: '0 0 24px' }}>
              Una casa<br />no se decora.<br />
              <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>Se compone.</em>
            </h1>
          </RevealOnScroll>
          <RevealOnScroll delay={3}>
            <p className="edit show-tagline dt-only" style={{ fontSize: 18, lineHeight: 1.4, margin: 0, color: 'var(--ink-soft)' }}>
              Treinta años buscando piezas que <strong style={{ fontWeight: 500, fontStyle: 'normal' }}>permanezcan</strong> — talleres pequeños, maderas honestas, telas que envejecen con gracia.
            </p>
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={2}>
          <div className="show-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
            <div style={{ aspectRatio: '3/4', background: '#ECEAE4', borderRadius: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ aspectRatio: '3/2.5', background: '#ECEAE4', borderRadius: 2 }} />
              <div style={{ aspectRatio: '3/2', background: '#DDDCD5', borderRadius: 2 }} />
            </div>
          </div>
        </RevealOnScroll>

        <ParallaxElement speed={0.4} rotate={5} style={{ top: '40%', left: -50, width: 140, height: 200, zIndex: 5 }} tag="3D · palmera salón">
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)' }} />
        </ParallaxElement>
      </section>
    )
  }

  // editorial (default)
  return (
    <section data-dt="hero-editorial" style={{ position: 'relative', padding: '20px 24px 72px', overflow: 'hidden' }}>
      <RevealOnScroll>
        <div className="hero-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <span className="kicker" />
          <span className="kicker mb-only">Rafaela · Santa Fe</span>
        </div>
      </RevealOnScroll>

      <div className="hero-grid">
        <div className="hero-text-col">
          <h1 ref={titleRef} className="display hero-h1" style={{ fontSize: 48, margin: '0 0 6px' }}>
            <span style={{ display: 'block', overflow: 'hidden', lineHeight: 1.06 }}>
              <span className="hero-line" style={{ display: 'block' }}>El hogar es</span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden', lineHeight: 1.06 }}>
              <em className="hero-line" style={{ display: 'block', fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>donde comienza la historia</em>
            </span>
          </h1>

          <RevealOnScroll delay={2}>
            <div className="hero-rule" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 28 }}>
              <span className="hairline" style={{ flex: 1 }} />
              <span className="mono">est. 1994</span>
              <span className="hairline" style={{ flex: 1 }} />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={3}>
            <div className="hero-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="edit" style={{ fontSize: 16, margin: 0, lineHeight: 1.4, maxWidth: 230 }}>
                Y en <strong style={{ fontWeight: 500, fontStyle: 'normal' }}>Las Lang</strong> vas a encontrar el mueble que va a acompañar ese proceso.
              </p>
              <Icon.ArrowDown style={{ color: 'var(--ink)' }} />
            </div>
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={2}>
          <div className="hero-image" style={{ position: 'relative', width: '100%', aspectRatio: '3/4', overflow: 'hidden', marginBottom: 20 }}>
            <div ref={heroImgRef} style={{ position: 'absolute', inset: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85" alt="Salón curado por LasLongDeco" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            </div>
          </div>
        </RevealOnScroll>
      </div>

      {/*
        Piezas flotantes clickeables: hover en desktop (escala + label), tap navega directo en mobile.
        Mapeo mueble → categoría es provisorio (el catálogo hoy solo tiene "mayor"/"tesoro",
        no hay categorías por tipo de mueble todavía) — cambiar cat= acá cuando existan categorías reales.
      */}
      <FurnitureHotspot href="/?cat=mayor#catalogo" label="Sillón" speed={0.55} rotate={-8} style={{ top: '28%', right: -58, width: 150, height: 190 }}>
        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)' }} />
      </FurnitureHotspot>

      <FurnitureHotspot href="/?cat=tesoro#catalogo" label="Lámpara" speed={0.4} rotate={5} style={{ top: '4%', left: -34, width: 88, height: 168 }}>
        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)', borderRadius: '999px 999px 8px 8px' }} />
      </FurnitureHotspot>

      <FurnitureHotspot href="/?cat=tesoro#catalogo" label="Mesa de luz" speed={0.3} rotate={4} style={{ bottom: '4%', left: -44, width: 120, height: 110 }}>
        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)' }} />
      </FurnitureHotspot>
    </section>
  )
}
