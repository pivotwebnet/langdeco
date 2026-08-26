import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * true si el usuario activó "reducir movimiento" en su sistema operativo.
 * Los componentes con animación ambiental (scroll-reveal, parallax, marquee,
 * magnetic hover) deben chequear esto y saltear la animación por completo
 * en vez de solo acortarla — dejando el contenido en su estado final visible.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
