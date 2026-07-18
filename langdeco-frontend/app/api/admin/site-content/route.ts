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

  if (
    !body ||
    typeof body.promoBar !== 'string' ||
    !Array.isArray(body.inspiracion) ||
    body.inspiracion.length !== 3 ||
    body.inspiracion.some((item) => !item || typeof item.name !== 'string')
  ) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  await saveSiteContent(body as SiteContent)
  return NextResponse.json({ ok: true })
}
