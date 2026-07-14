'use client'

import { useEffect, useState, useRef } from 'react'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { ParallaxElement } from '@/components/ui/ParallaxElement'

const SEGMENTS = [
  { text: '”Buscamos lo que durará treinta años en tu casa. La curaduría es ', bold: false },
  { text: 'el lujo de no equivocarte', bold: true },
  { text: '.”', bold: false },
]
const FULL_LENGTH = SEGMENTS.reduce((acc, s) => acc + s.text.length, 0)

function TypewriterQuote({ count }: { count: number }) {
  let remaining = count
  return (
    <>
      {SEGMENTS.map((seg, i) => {
        if (remaining <= 0) return null
        const visible = seg.text.slice(0, remaining)
        remaining -= seg.text.length
        if (seg.bold) {
          return <strong key={i} style={{ fontWeight: 500, fontStyle: 'normal' }}>{visible}</strong>
        }
        return <span key={i}>{visible}</span>
      })}
      {count < FULL_LENGTH && <span className="typewriter-cursor">|</span>}
    </>
  )
}

export function Manifesto() {
  const [charCount, setCharCount] = useState(0)
  const [started, setStarted]     = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let i = 0
    const id = setInterval(() => {
      i++
      setCharCount(i)
      if (i >= FULL_LENGTH) clearInterval(id)
    }, 30)
    return () => clearInterval(id)
  }, [started])

  return (
    <section ref={sectionRef} data-dt="manifesto" style={{ position: 'relative', padding: '72px 24px', background: 'var(--bg-deep)', overflow: 'hidden' }}>
      <RevealOnScroll><div className="kicker mfst-kicker" /></RevealOnScroll>

      <RevealOnScroll delay={1}>
        <p className="edit mfst-quote" style={{ fontSize: 28, lineHeight: 1.35, margin: '20px 0 36px', color: 'var(--ink)', minHeight: '4.8em' }}>
          <TypewriterQuote count={charCount} />
        </p>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <div className="mfst-author" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 88, height: 88, borderRadius: 999, overflow: 'hidden', flexShrink: 0, background: '#ECEAE4', boxShadow: '0 8px 32px -12px rgba(0,0,0,0.22)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=180&q=85"
              alt="Carmen Longo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-edit)', fontStyle: 'italic', fontSize: 26, lineHeight: 1.1, marginBottom: 6 }}>
              Carmen Longo
            </div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em' }}>Fundadora · curadora · Madrid</div>
            <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-edit)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)', maxWidth: 280 }}>
              Treinta años eligiendo lo que dura.
            </p>
          </div>
        </div>
      </RevealOnScroll>

      <ParallaxElement speed={0.35} rotate={-3} style={{ top: '20%', right: -36, width: 90, height: 130, zIndex: 5, opacity: 0.7 }} tag="3D · helecho">
        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)' }} />
      </ParallaxElement>
    </section>
  )
}
