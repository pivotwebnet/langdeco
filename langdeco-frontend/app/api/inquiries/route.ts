import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited, registerAttempt } from '@/lib/inquiry-rate-limit'

const API_URL = process.env.API_URL || 'http://localhost:5279'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

// Endpoint público: cualquier visitante puede crear una consulta, sin sesión de admin.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Enviaste varias consultas seguidas. Probá de nuevo en unos minutos.' },
      { status: 429 },
    )
  }
  registerAttempt(ip)

  const body = await request.text()

  const res = await fetch(`${API_URL}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  })

  const data = await res.json().catch(() => null)
  return NextResponse.json(data, { status: res.status })
}
