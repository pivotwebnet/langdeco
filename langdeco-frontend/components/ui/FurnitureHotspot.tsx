'use client'

import Link from 'next/link'
import { useRef, type CSSProperties, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface FurnitureHotspotProps {
  children: ReactNode
  href: string
  label: string
  speed?: number
  rotate?: number
  style?: CSSProperties
}

/**
 * Pieza flotante del hero (parallax al scrollear, igual que ParallaxElement) que además
 * es un link al catálogo: hover la escala levemente en desktop, y en mobile el tap navega
 * directo (no hay estado de hover en touch, así que el tap hace de click normal).
 */
export function FurnitureHotspot({ children, href, label, speed = 0.35, rotate = 0, style }: FurnitureHotspotProps) {
  const ref = useRef<HTMLAnchorElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    gsap.to(ref.current, {
      y: () => speed * -150,
      rotation: rotate * 0.5,
      ease: 'none',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })
  }, { scope: ref })

  return (
    <Link
      ref={ref}
      href={href}
      aria-label={`Ver ${label} en el catálogo`}
      className="furniture-hotspot"
      style={{ position: 'absolute', willChange: 'transform', zIndex: 5, ...style }}
    >
      <span className="furniture-hotspot-inner">{children}</span>
      <span className="furniture-hotspot-label mono">{label} →</span>
    </Link>
  )
}
