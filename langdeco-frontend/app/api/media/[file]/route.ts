import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { dataPath } from '@/lib/storage'

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params

  // el filename siempre es un randomUUID().ext generado por nosotros — cualquier otra cosa es sospechosa
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i.test(file)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const ext = file.split('.').pop()!.toLowerCase()
  const contentType = CONTENT_TYPES[ext]

  try {
    const buffer = await readFile(dataPath('uploads', file))
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        // el nombre es único por subida (uuid), así que una foto nueva es otra URL: cachear para siempre es seguro
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
