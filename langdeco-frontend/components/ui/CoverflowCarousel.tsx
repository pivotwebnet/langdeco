'use client'

// Carrusel "coverflow": la imagen activa es una foto grande centrada, y el resto
// son franjas angostas a los costados que se van agrandando/achicando a medida
// que se acercan/alejan del centro. Adaptado de un componente de referencia
// (Originkit, para Framer) al stack del sitio: se saca todo lo específico de
// Framer (RenderTarget, property controls, tipos de asset con src/srcSet) y las
// imágenes pasan a ser URLs simples con next/image. La física de movimiento
// (un solo MotionValue `pos` maneja posición X, tamaño, radio y sombra de cada
// tarjeta vía useTransform) se mantiene igual — es lo que hace que el tamaño
// crezca/decrezca en el mismo instante en que la tarjeta se desliza al centro.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion'
import * as Icon from '@/components/ui/Icon'

interface CoverflowCarouselProps {
  images: string[]
  alt: string
  activeWidth?: number
  activeHeight?: number
  restWidth?: number
  restHeight?: number
  gap?: number
  /** 0–20: 0 = esquinas rectas, 20 = circular/pill. Escala proporcional al tamaño de cada tarjeta. */
  radius?: number
  autoplay?: boolean
}

type Sizing = { restWidth: number; restHeight: number; activeWidth: number; activeHeight: number }

const RENDER_RANGE = 6 // máximo de franjas a cada lado

// Distancia con signo de la tarjeta `index` al centro en la posición `pos`, ajustada
// al rango (-count/2, count/2]. El salto del wrap queda en la costura, donde la
// opacidad ya es 0 — el "teletransporte" es invisible y el loop es infinito.
function relOf(index: number, pos: number, count: number): number {
  let rel = (((index - pos) % count) + count) % count
  if (rel > count / 2) rel -= count
  return rel
}

// Offset horizontal (px) desde el centro para una distancia con signo `rel`.
function xForRel(rel: number, s: Sizing, gap: number): number {
  const ar = Math.abs(rel)
  const c1 = s.activeWidth / 2 + gap + s.restWidth / 2
  const pitch = s.restWidth + gap
  const mag = ar <= 1 ? ar * c1 : c1 + (ar - 1) * pitch
  return (rel < 0 ? -1 : 1) * mag
}

// 0 en el centro (tamaño activo completo) → 1 a una franja de distancia (tamaño de reposo).
function blendForRel(rel: number): number {
  return Math.min(Math.abs(rel), 1)
}

function Card({
  src, alt, index, pos, count, R, sizing, gap, radius, onSelect,
}: {
  src: string
  alt: string
  index: number
  pos: MotionValue<number>
  count: number
  R: number
  sizing: Sizing
  gap: number
  radius: number
  onSelect?: (index: number) => void
}) {
  const x = useTransform(pos, (p: number) => xForRel(relOf(index, p, count), sizing, gap))
  const opacity = useTransform(pos, (p: number) => {
    const ar = Math.abs(relOf(index, p, count))
    return ar <= R ? 1 : ar >= R + 1 ? 0 : 1 - (ar - R)
  })
  const zIndex = useTransform(pos, (p: number) => Math.round(1000 - Math.abs(relOf(index, p, count)) * 100))
  const width = useTransform(pos, (p: number) => {
    const a = blendForRel(relOf(index, p, count))
    return sizing.activeWidth + (sizing.restWidth - sizing.activeWidth) * a
  })
  const height = useTransform(pos, (p: number) => {
    const a = blendForRel(relOf(index, p, count))
    return sizing.activeHeight + (sizing.restHeight - sizing.activeHeight) * a
  })
  const borderRadius = useTransform(pos, (p: number) => {
    const a = blendForRel(relOf(index, p, count))
    const w = sizing.activeWidth + (sizing.restWidth - sizing.activeWidth) * a
    const h = sizing.activeHeight + (sizing.restHeight - sizing.activeHeight) * a
    return (Math.max(0, Math.min(20, radius)) / 20) * (Math.min(w, h) / 2)
  })
  const boxShadow = useTransform(pos, (p: number) =>
    Math.abs(relOf(index, p, count)) < 0.5
      ? '0 24px 60px -12px rgba(10,10,10,0.35)'
      : '0 12px 32px -10px rgba(10,10,10,0.25)'
  )

  return (
    <motion.div
      onClick={onSelect ? () => onSelect(index) : undefined}
      style={{ position: 'absolute', left: '50%', top: '50%', x, zIndex, opacity, cursor: onSelect ? 'pointer' : 'default' }}
    >
      <motion.div style={{ x: '-50%', y: '-50%', width, height, borderRadius, overflow: 'hidden', position: 'relative', background: '#ECEAE4', boxShadow }}>
        <Image src={src} alt={alt} fill sizes="600px" style={{ objectFit: 'cover' }} draggable={false} />
      </motion.div>
    </motion.div>
  )
}

function ArrowButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const isLeft = side === 'left'
  return (
    <button
      type="button"
      aria-label={isLeft ? 'Foto anterior' : 'Foto siguiente'}
      onClick={onClick}
      className="coverflow-arrow"
      style={isLeft ? { left: 8 } : { right: 8 }}
    >
      <Icon.Arrow style={isLeft ? { transform: 'rotate(180deg)' } : undefined} />
    </button>
  )
}

export function CoverflowCarousel({
  images,
  alt,
  activeWidth = 720,
  activeHeight = 480,
  restWidth = 190,
  restHeight = 260,
  gap = 22,
  radius = 2,
  autoplay = false,
}: CoverflowCarouselProps) {
  const count = images.length
  const R = Math.max(1, Math.min(RENDER_RANGE, Math.floor(count / 2) - 1 || 1))
  const reducedMotion = useReducedMotion()

  // Los tamaños de las tarjetas son en px fijos (el efecto coverflow necesita medidas
  // concretas para su matemática de posición) — en una pantalla angosta la tarjeta
  // activa se achica para entrar en el contenedor, dejando siempre un margen para
  // ver un poco de las tarjetas vecinas a los costados.
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const compute = (containerWidth: number) => {
      const desiredWidth = activeWidth + 2 * (gap + restWidth * 0.6)
      setScale(Math.min(1, containerWidth / desiredWidth))
    }
    compute(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => compute(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [activeWidth, restWidth, gap])

  const sizing: Sizing = useMemo(() => ({
    restWidth: restWidth * scale,
    restHeight: restHeight * scale,
    activeWidth: activeWidth * scale,
    activeHeight: activeHeight * scale,
  }), [restWidth, restHeight, activeWidth, activeHeight, scale])
  const scaledGap = gap * scale

  // Un solo driver rAF mueve `pos`; cada tarjeta deriva su posición/tamaño/radio/sombra
  // de ese valor vía useTransform — así el tamaño crece exactamente al mismo ritmo que
  // el desplazamiento, sin animaciones independientes que se desincronicen.
  const pos = useMotionValue(0)
  const targetRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTRef = useRef<number | null>(null)
  const autoplayingRef = useRef(false)
  const dwellAccRef = useRef(0)
  const moveDur = 0.5
  const dwell = 3.2

  // `tick` se llama a sí mismo (rAF recursivo) — se guarda en un ref (asignado desde un
  // efecto, nunca durante el render) para que ni el self-reference ni ensureRunning
  // necesiten `tick` como dependencia estable.
  const tickRef = useRef<(t: number) => void>(() => {})
  useEffect(() => {
    tickRef.current = (t: number) => {
      const last = lastTRef.current ?? t
      const dt = Math.min((t - last) / 1000, 1 / 30)
      lastTRef.current = t

      const cur = pos.get()
      const diff = targetRef.current - cur
      const step = (1 / moveDur) * dt
      const arriving = reducedMotion || Math.abs(diff) <= step

      if (arriving) {
        pos.set(targetRef.current)
        if (autoplayingRef.current) {
          dwellAccRef.current += dt
          if (dwellAccRef.current >= dwell) {
            dwellAccRef.current = 0
            targetRef.current += 1
          }
          rafRef.current = requestAnimationFrame((t2) => tickRef.current(t2))
          return
        }
        rafRef.current = null
        lastTRef.current = null
        return
      }

      pos.set(cur + Math.sign(diff) * step)
      rafRef.current = requestAnimationFrame((t2) => tickRef.current(t2))
    }
  })

  const ensureRunning = useCallback(() => {
    if (rafRef.current == null) {
      lastTRef.current = null
      rafRef.current = requestAnimationFrame((t) => tickRef.current(t))
    }
  }, [])

  const goNext = useCallback(() => { targetRef.current += 1; ensureRunning() }, [ensureRunning])
  const goPrev = useCallback(() => { targetRef.current -= 1; ensureRunning() }, [ensureRunning])
  const goTo = useCallback((index: number) => {
    const cur = targetRef.current
    let d = index - cur
    d = ((d % count) + count) % count
    if (d > count / 2) d -= count
    targetRef.current = cur + d
    ensureRunning()
  }, [ensureRunning, count])

  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current) }, [])

  useEffect(() => {
    const on = autoplay && count > 1 && !reducedMotion
    autoplayingRef.current = on
    if (on) { dwellAccRef.current = 0; ensureRunning() }
    return () => { autoplayingRef.current = false }
  }, [autoplay, count, reducedMotion, ensureRunning])

  if (count === 0) return null

  const selectable = !autoplay

  return (
    <div ref={containerRef} className="coverflow" style={{ height: sizing.activeHeight + 24 }}>
      {images.map((src, i) => (
        <Card
          key={src + i}
          src={src}
          alt={alt}
          index={i}
          pos={pos}
          count={count}
          R={R}
          sizing={sizing}
          gap={scaledGap}
          radius={radius}
          onSelect={selectable ? goTo : undefined}
        />
      ))}
      {count > 1 && (
        <>
          <ArrowButton side="left" onClick={goPrev} />
          <ArrowButton side="right" onClick={goNext} />
        </>
      )}
    </div>
  )
}
