import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, saveAdminPassword } from '@/lib/admin-credentials'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/admin-session'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if (process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'La contraseña está fijada por variable de entorno (ADMIN_PASSWORD) y no puede cambiarse desde el panel' },
      { status: 400 },
    )
  }

  const body = await request.json().catch(() => null)
  const { currentPassword, newPassword } = body || {}

  if (typeof currentPassword !== 'string' || !(await verifyAdminPassword(currentPassword))) {
    return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  await saveAdminPassword(newPassword)
  return NextResponse.json({ ok: true })
}
