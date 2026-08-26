import { NextRequest, NextResponse } from 'next/server'
import { setupRequired, saveAdminPassword } from '@/lib/admin-credentials'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/admin-session'
import { isPasswordStrong, PASSWORD_REQUIREMENTS_HINT } from '@/lib/password-policy'
import { isRateLimited, registerFailedAttempt, clearAttempts } from '@/lib/login-rate-limit'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return `setup:${forwarded?.split(',')[0]?.trim() || 'unknown'}`
}

export async function GET() {
  return NextResponse.json({ setupRequired: await setupRequired() })
}

export async function POST(request: NextRequest) {
  if (!(await setupRequired())) {
    return NextResponse.json({ error: 'La configuración inicial ya fue realizada' }, { status: 400 })
  }

  const ip = getClientIp(request)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
      { status: 429 },
    )
  }

  const body = await request.json().catch(() => null)
  const password = body?.password

  if (typeof password !== 'string' || !isPasswordStrong(password)) {
    registerFailedAttempt(ip)
    return NextResponse.json({ error: PASSWORD_REQUIREMENTS_HINT }, { status: 400 })
  }

  await saveAdminPassword(password)
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
