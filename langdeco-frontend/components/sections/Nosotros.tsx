import Image from 'next/image'
import Link from 'next/link'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'
import { Underline } from '@/components/ui/Underline'
import * as Icon from '@/components/ui/Icon'
import type { NosotrosContent } from '@/lib/types'

const DEFAULT_NOSOTROS: NosotrosContent = {
  title: 'Una casa no se decora.',
  titleEmphasis: 'Se compone.',
  intro: 'Desde 2014 elegimos, a mano, mobiliario y objetos para hogares que no tienen apuro. En Rafaela, Santa Fe, armamos un showroom con piezas que acompañan una casa durante años, no una temporada.',
  photos: {
    showroom: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&q=80',
    taller: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=700&q=80',
    detalle: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=700&q=80',
  },
  hitos: [
    { year: '2014', label: 'Abrimos las puertas en Rafaela, con un puñado de piezas elegidas a mano.' },
    { year: '2017', label: 'Mudamos el showroom a Sgto. Cabral, para tener más lugar para curar.' },
    { year: '2021', label: 'Sumamos Pequeños Tesoros: objetos y detalles además del mobiliario grande.' },
    { year: 'Hoy', label: 'Seguimos visitando talleres chicos, una pieza a la vez.' },
  ],
  pilares: [
    { title: 'Curaduría a mano', desc: 'Cada pieza se elige una por una — no compramos por catálogo de fábrica, visitamos talleres chicos.' },
    { title: 'Materiales que duran', desc: 'Maderas honestas, telas que envejecen con gracia. Nada pensado para tirar en un par de años.' },
    { title: 'Piezas atemporales', desc: 'Diseño que no depende de una moda de temporada — para casas que no tienen apuro.' },
  ],
}

interface NosotrosProps {
  content?: NosotrosContent
}

export function Nosotros({ content = DEFAULT_NOSOTROS }: NosotrosProps) {
  const { title, titleEmphasis, intro, photos, hitos, pilares } = content
  // Cada pilar reutiliza una de las 3 fotos de la franja (mismo orden que antes:
  // taller, detalle, showroom) para no duplicar la carga de imágenes en el admin.
  const pilarImages = [photos.taller, photos.detalle, photos.showroom]

  return (
    <section data-dt="nosotros" style={{ position: 'relative', padding: '56px 24px 80px', overflow: 'hidden' }}>
      <RevealOnScroll>
        <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>Nosotros · desde 2014</span>
        <h1 className="display" style={{ fontSize: 44, margin: '0 0 24px', maxWidth: 640 }}>
          {title}<br />
          <em style={{ fontFamily: 'var(--font-edit)', fontWeight: 400, fontStyle: 'italic' }}><Underline>{titleEmphasis}</Underline></em>
        </h1>
      </RevealOnScroll>

      <RevealOnScroll delay={1} className="subtitle-connector" style={{ marginBottom: 40 }}>
        <p className="edit" style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 560, color: 'var(--ink-soft)', margin: 0 }}>
          {intro}
        </p>
      </RevealOnScroll>

      {/* ── Franja de fotos ─────────────────────────────────── */}
      <RevealOnScroll delay={2}>
        <div className="nosotros-photos">
          <div className="nosotros-photo nosotros-photo-lg">
            <Image src={photos.showroom} alt="Showroom de LasLangDeco" fill unoptimized sizes="(min-width: 900px) 55vw, 100vw" style={{ objectFit: 'cover' }} />
          </div>
          <div className="nosotros-photo">
            <Image src={photos.taller} alt="Taller de un proveedor" fill unoptimized sizes="(min-width: 900px) 25vw, 50vw" style={{ objectFit: 'cover' }} />
          </div>
          <div className="nosotros-photo">
            <Image src={photos.detalle} alt="Detalle de una pieza" fill unoptimized sizes="(min-width: 900px) 25vw, 50vw" style={{ objectFit: 'cover' }} />
          </div>
        </div>
      </RevealOnScroll>

      {/* ── Línea de tiempo ─────────────────────────────────── */}
      <RevealOnScroll delay={3}>
        <div className="nosotros-timeline">
          {hitos.map((h) => (
            <div key={h.year} className="nosotros-timeline-item">
              <div className="mono nosotros-timeline-year">{h.year}</div>
              <p className="edit" style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink-soft)', margin: 0 }}>{h.label}</p>
            </div>
          ))}
        </div>
      </RevealOnScroll>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28, marginBottom: 56 }}>
        {pilares.map((p, i) => (
          <RevealOnScroll key={p.title} delay={i + 4}>
            <div>
              <div className="nosotros-pilar-img">
                <Image src={pilarImages[i]} alt="" fill unoptimized sizes="(min-width: 900px) 25vw, 45vw" style={{ objectFit: 'cover' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 500, margin: '14px 0 8px' }}>{p.title}</h3>
              <p className="edit" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-mute)', margin: 0 }}>{p.desc}</p>
            </div>
          </RevealOnScroll>
        ))}
      </div>

      <RevealOnScroll delay={7}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/catalogo" className="btn" style={{ textDecoration: 'none' }}>
            Ver el catálogo <Icon.Arrow />
          </Link>
          <Link href="/contacto" className="btn ghost" style={{ textDecoration: 'none' }}>
            Conocé el showroom <Icon.Arrow />
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  )
}
