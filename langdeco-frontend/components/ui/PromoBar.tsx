'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export function PromoBar({ text }: { text: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLSpanElement>(null)
  const [copies, setCopies] = useState(4)

  // Calcula cuántas copias del texto hacen falta para que la tira nunca
  // se quede corta (evita el hueco/corte que se veía al llegar al borde).
  useEffect(() => {
    const item = itemRef.current
    if (!item) return
    const itemWidth = item.getBoundingClientRect().width || 1
    const needed = Math.ceil((window.innerWidth * 2) / itemWidth) + 2
    setCopies(Math.max(needed, 4))
  }, [text])

  useGSAP(() => {
    const track = trackRef.current
    if (!track || copies < 2) return
    const totalW = track.scrollWidth / copies
    const tween = gsap.fromTo(track, { x: 0 }, { x: -totalW, duration: 26, ease: 'none', repeat: -1 })
    return () => { tween.kill() }
  }, { scope: trackRef, dependencies: [copies, text] })

  if (!text) return null

  return (
    <div
      className="promo-bar"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 41,
        height: 'var(--promo-h)', overflow: 'hidden',
        background: 'var(--ink)', display: 'flex', alignItems: 'center',
        width: '100%',
      }}
    >
      <div ref={trackRef} style={{ display: 'flex', whiteSpace: 'nowrap', width: 'max-content' }}>
        {Array.from({ length: copies }).map((_, i) => (
          <span
            key={i}
            ref={i === 0 ? itemRef : undefined}
            style={{
              display: 'inline-flex', alignItems: 'center',
              paddingRight: 48,
              fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 500,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--bg)',
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
