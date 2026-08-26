'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/lib/gsap'

gsap.registerPlugin(ScrollTrigger)

export function ScrollAnimator() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {

      /* ── Clip-path image reveal ─────────────────────────────────────── */
      document.querySelectorAll<HTMLElement>('[data-reveal="clip"]').forEach((el) => {
        gsap.fromTo(el,
          { clipPath: 'inset(100% 0 0 0)', scale: 1.08 },
          {
            clipPath: 'inset(0% 0 0 0)',
            scale: 1,
            duration: 1.5,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 82%',
            },
          }
        )
      })

      /* ── Slide-up with blur ─────────────────────────────────────────── */
      document.querySelectorAll<HTMLElement>('[data-reveal="up"]').forEach((el) => {
        const delay = parseFloat(el.dataset.delay ?? '0')
        gsap.fromTo(el,
          { opacity: 0, y: 36, filter: 'blur(4px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.1,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
            },
          }
        )
      })

      /* ── Staggered grid cards ───────────────────────────────────────── */
      document.querySelectorAll<HTMLElement>('[data-reveal="grid"]').forEach((container) => {
        const cards = container.querySelectorAll<HTMLElement>('[data-card-item]')
        gsap.fromTo(cards,
          { opacity: 0, y: 28, scale: 0.97 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.75,
            ease: 'power2.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
            },
          }
        )
      })

      /* ── Hairline lines grow from left ─────────────────────────────── */
      document.querySelectorAll<HTMLElement>('[data-reveal="line"]').forEach((el) => {
        gsap.fromTo(el,
          { scaleX: 0, transformOrigin: 'left center' },
          {
            scaleX: 1,
            duration: 1.4,
            ease: 'expo.inOut',
            scrollTrigger: {
              trigger: el,
              start: 'top 92%',
            },
          }
        )
      })

      /* ── Large display headlines ──────────────────────────────────────
         Si el título usa <SplitChars> (mismo tratamiento que el H1 del
         Hero), animamos palabra por palabra al entrar en viewport. Si no,
         caemos al fade+skew genérico. */
      document.querySelectorAll<HTMLElement>('[data-reveal="headline"]').forEach((el) => {
        const words = el.querySelectorAll<HTMLElement>('.split-word')
        const masks = el.querySelectorAll<HTMLElement>('.split-mask')
        masks.forEach((m) => { m.style.overflow = 'visible' })

        if (words.length > 0) {
          gsap.fromTo(words,
            { yPercent: 130, opacity: 0, filter: 'blur(6px)' },
            {
              yPercent: 0, opacity: 1, filter: 'blur(0px)',
              duration: 0.9,
              stagger: 0.09,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 85%',
              },
            }
          )
          return
        }

        gsap.fromTo(el,
          { opacity: 0, y: 48, skewY: 1.5 },
          {
            opacity: 1, y: 0, skewY: 0,
            duration: 1.3,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
            },
          }
        )
      })

      /* ── Parallax depth on images ───────────────────────────────────── */
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const speed = parseFloat(el.dataset.parallax ?? '0.15')
        gsap.to(el, {
          yPercent: speed * -100,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      })

    }) // end gsap.context

    return () => ctx.revert()
  }, [])

  return null
}
