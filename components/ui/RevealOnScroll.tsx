'use client'

import React, { useRef, type ReactNode, type CSSProperties } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface RevealOnScrollProps {
  children: ReactNode
  delay?: number
  style?: CSSProperties
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}

export function RevealOnScroll({ children, delay = 0, style, className = '', as: Tag = 'div' }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        delay: delay * 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 92%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, { scope: ref })

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}
