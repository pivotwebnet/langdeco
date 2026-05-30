'use client'

import { useRef, type CSSProperties, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ParallaxElementProps {
  children: ReactNode
  speed?: number
  rotate?: number
  style?: CSSProperties
  className?: string
  tag?: string
}

export function ParallaxElement({ children, speed = 0.25, rotate = 0, style, className = '', tag }: ParallaxElementProps) {
  const ref = useRef<HTMLDivElement>(null)

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
    <div
      ref={ref}
      className={`px ${className}`}
      style={{ position: 'absolute', pointerEvents: 'none', willChange: 'transform', opacity: 0.92, ...style }}
    >
      {children}
      {tag && (
        <span style={{
          position: 'absolute', bottom: -14, left: 8,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontSize: 8, letterSpacing: '0.1em',
          color: 'var(--ink-mute)', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          {tag}
        </span>
      )}
    </div>
  )
}
