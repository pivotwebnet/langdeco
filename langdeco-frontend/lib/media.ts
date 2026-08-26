import { writeFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import { ensureDataDir, dataPath } from './storage'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_BYTES = 6 * 1024 * 1024 // 6 MB, mismo límite que el resto del panel

// Carpetas válidas dentro de uploads/ — una por origen de imagen. Whitelist explícita
// (en vez de aceptar cualquier string del cliente) para no dar pie a que un folder
// arbitrario termine siendo una ruta rara en disco o, más adelante, en el bucket de R2.
export const UPLOAD_FOLDERS = ['productos', 'hero', 'logo', 'nosotros', 'inspiracion'] as const
export type UploadFolder = typeof UPLOAD_FOLDERS[number]

export function isUploadFolder(value: unknown): value is UploadFolder {
  return typeof value === 'string' && (UPLOAD_FOLDERS as readonly string[]).includes(value)
}

/**
 * Guarda una imagen subida en disco (DATA_DIR/uploads/<folder>) con nombre único, y
 * devuelve la URL pública que la sirve (GET /api/media/<folder>/<archivo>). Cuando se
 * migre a Cloudflare R2, solo esta función cambia — el resto del código consume la URL
 * devuelta, no el storage — y `folder` pasa a ser el prefijo del key en el bucket.
 */
export async function saveUploadedImage(file: File, folder: UploadFolder): Promise<string> {
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) throw new Error('Formato de imagen no soportado (usar JPG, PNG o WEBP)')
  if (file.size > MAX_BYTES) throw new Error('La imagen no puede superar 6 MB')

  await ensureDataDir('uploads', folder)
  const filename = `${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(dataPath('uploads', folder, filename), buffer)

  return `/api/media/${folder}/${filename}`
}
