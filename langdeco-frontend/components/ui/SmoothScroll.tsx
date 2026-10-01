'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/lib/gsap'
import { setLenisInstance } from '@/lib/lenis'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll() {
  const pathname = usePathname()
  // El panel admin comparte este layout raíz con el sitio público, pero es un panel de
  // formularios y modales con su propio scroll interno — el scroll suavizado de Lenis
  // intercepta la rueda del mouse a nivel de documento y pisa el overflow de esos modales
  // (ej. no se podía scrollear la lista de productos al cargar una venta).
  const isAdmin = pathname?.startsWith('/admin') ?? false

  useEffect(() => {
    if (isAdmin) return
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    setLenisInstance(lenis)
    lenis.on('scroll', ScrollTrigger.update)

    const onTick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onTick)
      setLenisInstance(null)
      lenis.destroy()
    }
  }, [isAdmin])

  return null
}
