import type Lenis from 'lenis'

// Singleton mínimo para que otros componentes (ej. los links de ancla del Header)
// puedan pedirle a Lenis que scrollee, en vez de dejar que un salto nativo (<a href="#id">)
// mueva la ventana por fuera de Lenis — eso desincroniza su posición interna y en el
// próximo scroll con rueda/touch "tira" de vuelta a donde Lenis creía que estabas.
let instance: Lenis | null = null

export function setLenisInstance(l: Lenis | null) {
  instance = l
}

export function getLenisInstance(): Lenis | null {
  return instance
}
