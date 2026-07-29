'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { SplitChars } from '@/components/ui/SplitChars'
import { Magnetic } from '@/components/ui/Magnetic'
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
    const chars = titleRef.current.querySelectorAll<HTMLElement>('.split-char')
    const masks = titleRef.current.querySelectorAll<HTMLElement>('.split-mask')

    // Entrada: letra por letra al cargar/scrollear a la vista. Al terminar,
    // liberamos la máscara overflow:hidden — si no, ascendentes como la "d" quedan recortados.
    gsap.fromTo(chars,
      { yPercent: 108, opacity: 0 },
      {
        yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.018, delay: 0.25,
        onComplete: () => masks.forEach((m) => { m.style.overflow = 'visible' }),
      }
    )
  }, { scope: titleRef })

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
            <Magnetic>
              <button className="btn" style={{ borderColor: '#F2F1ED', background: '#F2F1ED', color: '#0A0A0A' }}>
                Ver la selección <Icon.Arrow />
              </button>
            </Magnetic>
          </div>
        </div>
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
              <span style={{ display: 'block' }}><SplitChars text="El hogar es" /></span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden', lineHeight: 1.06 }}>
              <em style={{ display: 'block', fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}>
                <SplitChars text="donde comienza la historia" />
              </em>
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
    </section>
  )
}
