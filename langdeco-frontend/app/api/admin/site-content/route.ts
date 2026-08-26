import { NextRequest, NextResponse } from 'next/server'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/admin-session'
import { getSiteContent, saveSiteContent, type SiteContent } from '@/lib/site-content'

// GET es público: la home necesita leer este contenido sin sesión de admin.
export async function GET() {
  return NextResponse.json(await getSiteContent())
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as Partial<SiteContent> | null

  const hasValidHotspots = (item: { hotspots?: unknown }) =>
    item.hotspots === undefined ||
    (Array.isArray(item.hotspots) && item.hotspots.every((h) =>
      h && typeof h.x === 'number' && h.x >= 0 && h.x <= 100 &&
      typeof h.y === 'number' && h.y >= 0 && h.y <= 100 &&
      typeof h.productId === 'string' && h.productId.length > 0
    ))

  const isValidNosotros = (n: unknown): boolean => {
    if (!n || typeof n !== 'object') return false
    const v = n as Record<string, unknown>
    const photos = v.photos as unknown
    return (
      typeof v.title === 'string' &&
      typeof v.titleEmphasis === 'string' &&
      typeof v.intro === 'string' &&
      Array.isArray(photos) && photos.every((p) => typeof p === 'string') &&
      Array.isArray(v.hitos) && v.hitos.length === 4 &&
      v.hitos.every((h) => h && typeof h.year === 'string' && typeof h.label === 'string') &&
      Array.isArray(v.pilares) && v.pilares.length === 3 &&
      v.pilares.every((p) => p && typeof p.title === 'string' && typeof p.desc === 'string')
    )
  }

  if (
    !body ||
    typeof body.promoBar !== 'string' ||
    !Array.isArray(body.inspiracion) ||
    body.inspiracion.length !== 4 ||
    body.inspiracion.some((item) => !item || typeof item.name !== 'string' || !hasValidHotspots(item)) ||
    typeof body.heroImageUrl !== 'string' ||
    typeof body.heroTitle !== 'string' ||
    typeof body.heroTitleEmphasis !== 'string' ||
    typeof body.heroSubtitle !== 'string' ||
    typeof body.logoUrl !== 'string' ||
    !isValidNosotros(body.nosotros)
  ) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Estos campos son texto principal siempre visible en el sitio público —
  // guardarlos vacíos deja huecos en producción sin ningún aviso.
  const nosotros = body.nosotros as SiteContent['nosotros']
  if (
    body.heroTitle.trim().length === 0 ||
    body.heroSubtitle.trim().length === 0 ||
    nosotros.title.trim().length === 0 ||
    nosotros.intro.trim().length === 0
  ) {
    return NextResponse.json({ error: 'El título y la bajada del Hero, y el título e intro de Nosotros, no pueden quedar vacíos' }, { status: 400 })
  }

  await saveSiteContent(body as SiteContent)
  return NextResponse.json({ ok: true })
}
