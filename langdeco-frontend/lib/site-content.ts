import { readFile, writeFile } from 'fs/promises'
import { ensureDataDir, dataPath } from './storage'
import type { LookbookEntry } from './types'

export interface SiteContent {
  promoBar: string
  inspiracion: [LookbookEntry, LookbookEntry, LookbookEntry]
}

const FILE_NAME = 'site-content.json'

const DEFAULT_CONTENT: SiteContent = {
  promoBar: '20% Descuento en contado o efectivo · 3 cuotas sin interés · Rafaela, Santa Fe',
  inspiracion: [
    {
      id: 'estar-norte', n: '01', name: 'Estar del norte', place: 'Piso · Chamberí',
      desc: 'Luz fría, lana cruda, una pieza por pared.',
      pieces: ['Butaca Laurel', 'Alfombra Anatolia', 'Cerámica Sojo'],
      imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=85',
    },
    {
      id: 'comedor-lento', n: '02', name: 'Comedor lento', place: 'Casa · Mallorca',
      desc: 'Mesa de piedra, sillas dispares, sin centro.',
      pieces: ['Mesa Arenisca', 'Sillas Möller', 'Lámpara Pergamino'],
      imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=85',
    },
    {
      id: 'estudio-tinta', n: '03', name: 'Estudio de tinta', place: 'Atelier · Salamanca',
      desc: 'Una mesa larga, paredes encaladas, pocos libros.',
      pieces: ['Mesa Olmo', 'Silla Hara', 'Lámpara Pergamino'],
      imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=85',
    },
  ],
}

function isValidContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.promoBar === 'string' && Array.isArray(v.inspiracion) && v.inspiracion.length === 3
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const raw = await readFile(dataPath(FILE_NAME), 'utf-8')
    const parsed = JSON.parse(raw)
    return isValidContent(parsed) ? parsed : DEFAULT_CONTENT
  } catch {
    return DEFAULT_CONTENT
  }
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  await ensureDataDir()
  await writeFile(dataPath(FILE_NAME), JSON.stringify(content, null, 2), 'utf-8')
}
