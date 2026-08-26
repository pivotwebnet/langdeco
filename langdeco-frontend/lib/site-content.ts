import { readFile, writeFile } from 'fs/promises'
import { ensureDataDir, dataPath } from './storage'
import type { LegalContent, LookbookEntry, NosotrosContent } from './types'

export interface SiteContent {
  promoBar: string
  inspiracion: [LookbookEntry, LookbookEntry, LookbookEntry, LookbookEntry]
  heroImageUrl: string
  heroTitle: string
  heroTitleEmphasis: string
  heroSubtitle: string
  logoUrl: string
  nosotros: NosotrosContent
  legal: LegalContent
}

const FILE_NAME = 'site-content.json'

const DEFAULT_CONTENT: SiteContent = {
  promoBar: '20% Descuento en contado o efectivo · 3 cuotas sin interés · Rafaela, Santa Fe',
  heroImageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85',
  heroTitle: 'El hogar es',
  heroTitleEmphasis: 'donde comienza la historia',
  heroSubtitle: 'Y en Las Lang vas a encontrar el mueble que va a acompañar ese proceso.',
  logoUrl: '/assets/logo.png',
  nosotros: {
    title: 'Una casa no se decora.',
    titleEmphasis: 'Se compone.',
    subtitle: 'Nuestro viaje, paso a paso',
    intro: 'Desde 2014 elegimos, a mano, mobiliario y objetos para hogares que no tienen apuro. En Rafaela, Santa Fe, armamos un showroom con piezas que acompañan una casa durante años, no una temporada.',
    photos: [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&q=80',
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=700&q=80',
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=700&q=80',
    ],
    hitos: [
      { year: '2014', label: 'Abrimos las puertas en Rafaela, con un puñado de piezas elegidas a mano.', imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=700&q=80' },
      { year: '2017', label: 'Mudamos el showroom a Sgto. Cabral, para tener más lugar para curar.', imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&q=80' },
      { year: '2021', label: 'Sumamos Pequeños Tesoros: objetos y detalles además del mobiliario grande.', imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=700&q=80' },
      { year: 'Hoy', label: 'Seguimos visitando talleres chicos, una pieza a la vez.', imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&q=80' },
    ],
    pilares: [
      { title: 'Curaduría a mano', desc: 'Cada pieza se elige una por una — no compramos por catálogo de fábrica, visitamos talleres chicos.' },
      { title: 'Materiales que duran', desc: 'Maderas honestas, telas que envejecen con gracia. Nada pensado para tirar en un par de años.' },
      { title: 'Piezas atemporales', desc: 'Diseño que no depende de una moda de temporada — para casas que no tienen apuro.' },
    ],
    team: [],
  },
  legal: {
    envios: { zonas: '', costosPlazos: '', plazoDevolucionDias: '', plazoDanioHoras: '' },
    terminos: { razonSocial: '' },
    faq: { zonasCobertura: '', plazoEntrega: '', garantia: '' },
    privacidad: { terceros: '', cookies: '' },
  },
  inspiracion: [
    {
      id: 'estar-norte', n: '01', name: 'Estar del norte', place: 'Piso · Chamberí',
      desc: 'Luz fría, lana cruda, una pieza por pared.',
      pieces: ['Butaca Laurel', 'Alfombra Anatolia', 'Cerámica Sojo'],
      imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=85',
      hotspots: [],
    },
    {
      id: 'comedor-lento', n: '02', name: 'Comedor lento', place: 'Casa · Mallorca',
      desc: 'Mesa de piedra, sillas dispares, sin centro.',
      pieces: ['Mesa Arenisca', 'Sillas Möller', 'Lámpara Pergamino'],
      imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=85',
      hotspots: [],
    },
    {
      id: 'estudio-tinta', n: '03', name: 'Estudio de tinta', place: 'Atelier · Salamanca',
      desc: 'Una mesa larga, paredes encaladas, pocos libros.',
      pieces: ['Mesa Olmo', 'Silla Hara', 'Lámpara Pergamino'],
      imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=85',
      hotspots: [],
    },
    {
      id: 'patio-quieto', n: '04', name: 'Patio quieto', place: 'Exterior · Terraza',
      desc: 'Piedra al sol, verde disperso, una silla que espera.',
      pieces: [],
      imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=85',
      isPatio: true,
      hotspots: [],
    },
  ],
}

function isValidContent(value: unknown): value is Partial<SiteContent> {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.promoBar === 'string' && Array.isArray(v.inspiracion) && v.inspiracion.length === 4
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const raw = await readFile(dataPath(FILE_NAME), 'utf-8')
    const parsed = JSON.parse(raw)
    // Se mezcla con los defaults para que archivos guardados antes de agregar
    // los campos de Hero/logo no pierdan promoBar/inspiración ya editados.
    return isValidContent(parsed) ? { ...DEFAULT_CONTENT, ...parsed } : DEFAULT_CONTENT
  } catch {
    return DEFAULT_CONTENT
  }
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  await ensureDataDir()
  await writeFile(dataPath(FILE_NAME), JSON.stringify(content, null, 2), 'utf-8')
}
