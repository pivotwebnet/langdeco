import { writeFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import { ensureDataDir, dataPath } from './storage'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_BYTES = 6 * 1024 * 1024 // 6 MB, mismo límite que el resto del panel

/**
 * Guarda una imagen subida en disco (DATA_DIR/uploads) con nombre único, y devuelve
 * la URL pública que la sirve (GET /api/media/<archivo>). Cuando se migre a Cloudflare R2,
 * solo esta función cambia — el resto del código consume la URL devuelta, no el storage.
 */
export async function saveUploadedImage(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) throw new Error('Formato de imagen no soportado (usar JPG, PNG o WEBP)')
  if (file.size > MAX_BYTES) throw new Error('La imagen no puede superar 6 MB')

  await ensureDataDir('uploads')
  const filename = `${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(dataPath('uploads', filename), buffer)

  return `/api/media/${filename}`
}
