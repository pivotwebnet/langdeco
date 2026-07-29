'use client'

import { useEffect, useState } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'
import { Magnetic } from '@/components/ui/Magnetic'
import * as Icon from '@/components/ui/Icon'

export function FloatingDock() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`floating-stack${scrollY > 200 ? ' in' : ''}`}>
      <Tooltip label="Volver arriba" side="top">
        <Magnetic>
          <button
            className="scroll-top-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Volver al inicio"
          >
            <Icon.ArrowDown style={{ transform: 'rotate(180deg)' }} />
          </button>
        </Magnetic>
      </Tooltip>

      <Magnetic strength={0.2}>
        <button
          className="wa-pill"
          onClick={() => window.open('https://wa.me/5493492287864', '_blank')}
          aria-label="Hablar con nosotros"
        >
          <div className="dot"><Icon.Whatsapp /></div>
          <span>Hablar con nosotros</span>
        </button>
      </Magnetic>
    </div>
  )
}
