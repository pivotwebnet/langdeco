import { NextRequest, NextResponse } from 'next/server'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/admin-session'
import { forwardToBackend } from '@/lib/api'

async function handle(request: NextRequest, path: string[]): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const targetPath = `/api/${path.join('/')}${request.nextUrl.search}`
  const hasBody = !['GET', 'HEAD', 'DELETE'].includes(request.method)
  const incomingContentType = request.headers.get('content-type') || ''
  const isJsonBody = hasBody && (incomingContentType === '' || incomingContentType.includes('application/json'))

  const res = await forwardToBackend(targetPath, {
    method: request.method,
    headers: isJsonBody ? { 'Content-Type': 'application/json' } : (incomingContentType ? { 'Content-Type': incomingContentType } : {}),
    body: hasBody ? (isJsonBody ? await request.text() : await request.arrayBuffer()) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/pdf') || contentType.includes('spreadsheetml.sheet')) {
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': res.headers.get('content-disposition') || (contentType.includes('application/pdf') ? 'inline' : 'attachment'),
      },
    })
  }

  if (res.status === 204 || !contentType.includes('application/json')) {
    return new NextResponse(null, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handle(request, (await params).path)
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handle(request, (await params).path)
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handle(request, (await params).path)
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handle(request, (await params).path)
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handle(request, (await params).path)
}
