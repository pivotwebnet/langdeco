import { useEffect, useRef } from 'react'

// Pila de handlers activos: si hay un modal abierto encima de otro (ej. el selector de producto
// dentro del formulario de venta), ESC solo cierra el de más arriba, no todos a la vez.
const stack: symbol[] = []
const handlers = new Map<symbol, () => void>()

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  const top = stack[stack.length - 1]
  if (top) handlers.get(top)?.()
}

export function useEscapeKey(onEscape: () => void) {
  const ref = useRef(onEscape)
  useEffect(() => { ref.current = onEscape })

  useEffect(() => {
    const id = Symbol('escape')
    if (stack.length === 0) document.addEventListener('keydown', onKeyDown)
    stack.push(id)
    handlers.set(id, () => ref.current())
    return () => {
      stack.splice(stack.indexOf(id), 1)
      handlers.delete(id)
      if (stack.length === 0) document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}

// Cierra al hacer click en el fondo (no dentro del modal). Se usa mousedown y no click para que
// arrastrar la selección de un texto desde adentro hacia afuera no cierre el modal sin querer.
export function backdropClose(onClose: () => void) {
  return {
    onMouseDown: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
  }
}
