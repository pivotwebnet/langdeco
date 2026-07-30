import { NextRequest, NextResponse } from 'next/server'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/admin-session'
import { saveUploadedImage } from '@/lib/media'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
  }

  try {
    const url = await saveUploadedImage(file)
    return NextResponse.json({ url })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al subir la imagen' }, { status: 400 })
  }
}
