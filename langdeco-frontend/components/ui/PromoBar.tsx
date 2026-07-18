'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export function PromoBar({ text }: { text: string }) {
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const track = trackRef.current
    if (!track) return
    const totalW = track.scrollWidth / 2
    gsap.fromTo(track, { x: 0 }, { x: -totalW, duration: 26, ease: 'none', repeat: -1 })
  }, { scope: trackRef })

  if (!text) return null

  return (
    <div
      className="promo-bar"
      style={{
        position: 'sticky', top: 0, zIndex: 41,
        height: 'var(--promo-h)', overflow: 'hidden',
        background: 'var(--ink)', display: 'flex', alignItems: 'center',
      }}
    >
      <div ref={trackRef} style={{ display: 'flex', whiteSpace: 'nowrap', width: 'max-content' }}>
        {[text, text].map((t, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex', alignItems: 'center',
              paddingRight: 48,
              fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 500,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--bg)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
