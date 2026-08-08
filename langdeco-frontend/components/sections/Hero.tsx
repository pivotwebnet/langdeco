'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { SplitChars } from '@/components/ui/SplitChars'
import * as Icon from '@/components/ui/Icon'
import { prefersReducedMotion } from '@/lib/gsap'

gsap.registerPlugin(ScrollTrigger)

export function Hero() {
  const heroImgRef  = useRef<HTMLDivElement>(null)
  const titleRef    = useRef<HTMLHeadingElement>(null)

  useGSAP(() => {
    if (!heroImgRef.current || prefersReducedMotion()) return
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
    const words = titleRef.current.querySelectorAll<HTMLElement>('.split-word')
    const masks = titleRef.current.querySelectorAll<HTMLElement>('.split-mask')
    // Cada línea ya tiene su propio overflow:hidden (ver JSX) — eso hace de
    // máscara para las palabras. No necesitamos además la máscara por letra.
    masks.forEach((m) => { m.style.overflow = 'visible' })

    // A propósito NO chequeamos prefersReducedMotion acá: el título principal
    // tiene que animar siempre al entrar, sea cual sea la config del visitante.
    gsap.fromTo(titleRef.current,
      { scale: 1.015 },
      { scale: 1, duration: 0.9, ease: 'power2.out' }
    )
    gsap.fromTo(words,
      { yPercent: 45, opacity: 0, filter: 'blur(6px)' },
      {
        yPercent: 0, opacity: 1, filter: 'blur(0px)',
        duration: 0.6, ease: 'power2.out', stagger: 0.035, delay: 0.15,
      }
    )
  }, { scope: titleRef })

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
              <span className="mono">est. 2014</span>
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
          <div className="hero-image" style={{ position: 'relative', width: '100%', aspectRatio: '3/4', overflow: 'hidden', marginBottom: 20, borderRadius: 18 }}>
            <div ref={heroImgRef} style={{ position: 'absolute', inset: 0 }}>
              <Image
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85"
                alt="Salón curado por LasLangDeco"
                fill
                sizes="(min-width: 900px) 50vw, 100vw"
                priority
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
