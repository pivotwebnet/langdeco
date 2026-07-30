import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:5279'

// Endpoint público: cualquier visitante puede crear una consulta, sin sesión de admin.
export async function POST(request: NextRequest) {
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
