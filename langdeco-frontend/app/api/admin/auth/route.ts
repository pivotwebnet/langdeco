import { NextRequest, NextResponse } from 'next/server'
import { setupRequired, verifyAdminPassword } from '@/lib/admin-credentials'
import { createSessionToken, isValidSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/admin-session'
import { isRateLimited, registerFailedAttempt, clearAttempts } from '@/lib/login-rate-limit'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  return NextResponse.json({ authenticated: isValidSessionToken(token) })
}

export async function POST(request: NextRequest) {
  if (await setupRequired()) {
    return NextResponse.json({ error: 'Falta configurar la contraseña inicial' }, { status: 400 })
  }

  const ip = getClientIp(request)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos fallidos. Probá de nuevo en unos minutos.' },
      { status: 429 },
    )
  }

  const body = await request.json().catch(() => null)
  const password = body?.password

  if (typeof password !== 'string' || !(await verifyAdminPassword(password))) {
    registerFailedAttempt(ip)
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  clearAttempts(ip)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
