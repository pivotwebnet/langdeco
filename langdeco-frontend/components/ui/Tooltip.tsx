'use client'

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom'
}

const EDGE_MARGIN = 8
const GAP = 10
const ARROW_MARGIN = 12

export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; arrow: number } | null>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => { setMounted(true) }, [])

  // Se posiciona con coordenadas de viewport (no CSS relativo al trigger) y se
  // porta a <body> — así nunca lo recorta un contenedor con overflow (carruseles,
  // cards) ni se corta contra el borde de la ventana. La flechita se reubica
  // dentro de la burbuja para seguir apuntando al disparador aunque la burbuja
  // se haya desplazado para entrar en pantalla.
  useLayoutEffect(() => {
    if (!show || !anchorRef.current || !bubbleRef.current) { setPos(null); return }
    const a = anchorRef.current.getBoundingClientRect()
    const b = bubbleRef.current.getBoundingClientRect()
    const anchorCenter = a.left + a.width / 2

    let left = anchorCenter - b.width / 2
    left = Math.min(Math.max(left, EDGE_MARGIN), window.innerWidth - b.width - EDGE_MARGIN)

    const top = side === 'top' ? a.top - b.height - GAP : a.bottom + GAP
    const arrow = Math.min(Math.max(anchorCenter - left, ARROW_MARGIN), b.width - ARROW_MARGIN)

    setPos({ top, left, arrow })
  }, [show, side, label])

  return (
    <span
      ref={anchorRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {mounted && createPortal(
        <span
          ref={bubbleRef}
          role="tooltip"
          className={`tooltip-bubble ${side}${show && pos ? ' is-visible' : ''}`}
          style={{
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            ['--tt-arrow' as string]: `${pos?.arrow ?? 0}px`,
          } as CSSProperties}
        >
          {label}
        </span>,
        document.body
      )}
    </span>
  )
}
