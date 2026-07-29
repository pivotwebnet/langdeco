'use client'

import { useRef, cloneElement, isValidElement, type ReactElement, type Ref } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

interface MagneticProps {
  children: ReactElement
  strength?: number
}

/**
 * Envuelve un único elemento (button/link) y lo hace "magnético": se desplaza
 * levemente hacia el cursor al pasar por encima, y vuelve a su lugar al salir.
 */
export function Magnetic({ children, strength = 0.35 }: MagneticProps) {
  const ref = useRef<HTMLElement | null>(null)

  useGSAP(() => {
    const el = ref.current
    if (!el) return
    const quickX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const quickY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      quickX((e.clientX - r.left - r.width / 2) * strength)
      quickY((e.clientY - r.top - r.height / 2) * strength)
    }
    const onLeave = () => { quickX(0); quickY(0) }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  if (!isValidElement(children)) return children

  // eslint-disable-next-line react-hooks/refs -- forwarding a ref into a cloned child is intentional here
  return cloneElement(children as ReactElement<{ ref?: Ref<HTMLElement> }>, { ref })
}
