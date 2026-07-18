'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

interface MarqueeProps {
  items?: string[]
  speed?: number
  dark?: boolean
}

const DEFAULT_ITEMS = [
  'Desde 2014',
  'Materiales que Duran',
  'Piezas Atemporales',
]

export function Marquee({ items = DEFAULT_ITEMS, speed = 22, dark = false }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const track = trackRef.current
    if (!track) return

    const totalW = track.scrollWidth / 2

    gsap.fromTo(
      track,
      { x: 0 },
      { x: -totalW, duration: speed, ease: 'none', repeat: -1 }
    )
  }, { scope: trackRef })

  /* duplicate items for seamless loop */
  const doubled = [...items, ...items]

  const bg    = dark ? 'var(--ink)' : 'var(--bg-deep)'
  const color = dark ? 'rgba(242,241,237,0.55)' : 'var(--ink-mute)'
  const dot   = dark ? 'rgba(242,241,237,0.2)' : 'rgba(10,10,10,0.15)'
  const border = dark
    ? 'rgba(242,241,237,0.1)'
    : 'rgba(10,10,10,0.08)'

  return (
    <div style={{
      overflow: 'hidden',
      background: bg,
      borderTop: `1px solid ${border}`,
      borderBottom: `1px solid ${border}`,
      padding: '15px 0',
    }}>
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap: 0,
          whiteSpace: 'nowrap',
          width: 'max-content',
          alignItems: 'center',
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 32,
              paddingRight: 32,
              fontFamily: 'var(--font-edit)',
              fontStyle: 'italic',
              fontSize: 17,
              fontWeight: 300,
              color,
              letterSpacing: '0.01em',
            }}
          >
            {item}
            <span style={{
              width: 3, height: 3, borderRadius: '50%',
              background: dot, flexShrink: 0,
            }} />
          </span>
        ))}
      </div>
    </div>
  )
}
