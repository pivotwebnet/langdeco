'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/lib/gsap'

gsap.registerPlugin(ScrollTrigger)

// Círculo marcador de línea de tiempo que pasa de "hueco" a relleno (clase .filled)
// apenas entra en viewport — mismo trigger que RevealOnScroll, pero con toggle de
// clase en vez de animar opacidad/y, porque acá el efecto es un cambio de color sólido.
// once:true → se rellena una vez y queda así (no vuelve a vaciarse si se sube el scroll).
export function ScrollFillDot({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    if (prefersReducedMotion()) {
      ref.current.classList.add('filled')
      return
    }
    const el = ref.current
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => el.classList.add('filled'),
    })
  }, { scope: ref })

  return <div ref={ref} className={`nosotros-timeline-dot ${className}`} aria-hidden="true" />
}
