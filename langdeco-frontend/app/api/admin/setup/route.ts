import { NextRequest, NextResponse } from 'next/server'
import { setupRequired, saveAdminPassword } from '@/lib/admin-credentials'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/admin-session'

export async function GET() {
  return NextResponse.json({ setupRequired: await setupRequired() })
}

export async function POST(request: NextRequest) {
  if (!(await setupRequired())) {
    return NextResponse.json({ error: 'La configuración inicial ya fue realizada' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const password = body?.password

  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  await saveAdminPassword(password)

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
