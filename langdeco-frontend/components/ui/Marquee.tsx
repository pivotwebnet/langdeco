'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'

interface MarqueeProps {
  items?: string[]
  speed?: number // pixels per second
  dark?: boolean
}

const DEFAULT_ITEMS = [
  'Desde 2014',
  'Materiales que Duran',
  'Piezas Atemporales',
]

export function Marquee({ items = DEFAULT_ITEMS, speed = 40, dark = false }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [repeatCount, setRepeatCount] = useState(4)

  /* With only 1-2 copies of a short item list, one copy can be narrower than
     the viewport (wide monitors, few items) — the visible half then runs out
     mid-screen before the loop resets, reading as "stuck halfway". Keep
     growing the copy count until a single copy alone already spans the full
     viewport, so the animation always has enough content to travel the
     whole width with room to spare. */
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    const singleCopyWidth = track.scrollWidth / 2
    if (singleCopyWidth > 0 && singleCopyWidth < window.innerWidth) {
      setRepeatCount((c) => c + 2)
    }
  }, [repeatCount, items])

  useLayoutEffect(() => {
    const onResize = () => setRepeatCount((c) => Math.max(c, 4))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useGSAP(() => {
    const track = trackRef.current
    if (!track || prefersReducedMotion()) return

    /* xPercent -50 (not a pixel width from scrollWidth) so the loop stays
       exact regardless of font-load timing — the two halves are identical,
       so -50% always lines up seamlessly instead of jumping partway. Duration
       derives from the measured width so speed (px/s) stays constant no
       matter how many copies repeatCount ended up needing. */
    const halfWidth = track.scrollWidth / 2
    const duration = halfWidth / speed

    gsap.fromTo(
      track,
      { xPercent: 0 },
      { xPercent: -50, duration, ease: 'none', repeat: -1 }
    )
  }, { scope: trackRef, dependencies: [repeatCount, speed] })

  const singleSet = Array.from({ length: repeatCount }, () => items).flat()
  const doubled = [...singleSet, ...singleSet]

  const bg    = dark ? 'var(--ink)' : 'var(--bg-deep)'
  const color = dark ? 'rgba(242,241,237,0.55)' : 'var(--ink)'
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
