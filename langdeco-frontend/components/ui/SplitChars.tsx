interface SplitCharsProps {
  text: string
  charClassName?: string
}

/**
 * Parte un string en spans por letra, cada una envuelta en una máscara overflow:hidden,
 * para poder animarlas individualmente (yPercent/opacity) con GSAP desde el componente padre.
 * El padre debe apuntar a `.split-char` dentro de su propio scope de useGSAP, y debe liberar
 * la máscara (overflow: visible) una vez termina la animación de entrada — si no, los
 * ascendentes de letras como "d" o "l" quedan recortados por el borde de la máscara.
 * Cada palabra queda envuelta en `.split-word`, con su propio subrayado on-hover (ver globals.css).
 */
export function SplitChars({ text, charClassName = 'split-char' }: SplitCharsProps) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, wi) => (
        <span key={wi} className="split-word" style={{ display: 'inline-block', whiteSpace: 'nowrap', lineHeight: 'normal' }}>
          {word.split('').map((c, ci) => (
            <span key={ci} className="split-mask" style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', lineHeight: 'normal' }}>
              <span className={charClassName} style={{ display: 'inline-block', lineHeight: 'normal' }}>{c}</span>
            </span>
          ))}
        </span>
      )).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, ' ', el], [])}
    </>
  )
}
