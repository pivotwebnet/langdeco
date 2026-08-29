import { writeFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import { createRequire } from 'module'
import type SharpType from 'sharp'
import { ensureDataDir, dataPath } from './storage'
import { putObjectR2 } from './r2'

// sharp expone entrada ESM (dist/index.mjs) y CJS (dist/index.cjs) — bajo Next en
// Windows, resolver la variante ESM rompe la carga del binario nativo (.node) con
// ERR_DLOPEN_FAILED. Forzar require() (vía createRequire, ya que este módulo es
// ESM) resuelve siempre por el path CJS, que carga el binario sin problemas.
const require = createRequire(import.meta.url)
const sharp = require('sharp') as typeof SharpType

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB — tamaño del archivo crudo, antes de comprimir

// Carpetas válidas dentro de uploads/ — una por origen de imagen. Whitelist explícita
// (en vez de aceptar cualquier string del cliente) para no dar pie a que un folder
// arbitrario termine siendo una ruta rara en disco o en el bucket de R2.
export const UPLOAD_FOLDERS = ['productos', 'productos-cutout', 'hero', 'logo', 'nosotros', 'inspiracion'] as const
export type UploadFolder = typeof UPLOAD_FOLDERS[number]

// La carpeta 'productos-cutout' es la Imagen PNG (recorte sin fondo) que usa el
// Visualizador — necesita canal alfa intacto, así que solo acepta PNG y nunca se
// reencodea a WebP/JPEG (ver compressImage).
const CUTOUT_FOLDER: UploadFolder = 'productos-cutout'

export function isUploadFolder(value: unknown): value is UploadFolder {
  return typeof value === 'string' && (UPLOAD_FOLDERS as readonly string[]).includes(value)
}

const MAX_DIMENSION = 2000

async function compressImage(buffer: Buffer, isCutout: boolean): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const resized = sharp(buffer).rotate().resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: 'inside',
    withoutEnlargement: true,
  })

  if (isCutout) {
    // Sin pérdida: un recorte con fondo transparente no puede perder calidad en
    // el borde (ahí es donde más se nota al componerlo sobre la foto del Visualizador).
    const out = await resized.png({ compressionLevel: 9 }).toBuffer()
    return { buffer: out, ext: 'png', contentType: 'image/png' }
  }

  const out = await resized.webp({ quality: 82 }).toBuffer()
  return { buffer: out, ext: 'webp', contentType: 'image/webp' }
}

/**
 * Guarda una imagen subida — comprimida siempre — y devuelve la URL pública que la
 * sirve. Si hay credenciales de Cloudflare R2 configuradas (R2_ACCOUNT_ID), sube ahí;
 * si no (typ. desarrollo local), guarda en disco bajo DATA_DIR/uploads/<folder> y la
 * sirve vía GET /api/media/<folder>/<archivo>, igual que siempre.
 */
export async function saveUploadedImage(file: File, folder: UploadFolder): Promise<string> {
  const isCutout = folder === CUTOUT_FOLDER

  if (isCutout && file.type !== 'image/png') {
    throw new Error('La imagen PNG debe ser un archivo .png')
  }
  if (!isCutout && !ALLOWED_TYPES[file.type]) {
    throw new Error('Formato de imagen no soportado (usar JPG, PNG o WEBP)')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen no puede superar 20 MB')
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())
  const { buffer, ext, contentType } = await compressImage(rawBuffer, isCutout)
  const filename = `${randomUUID()}.${ext}`

  if (process.env.R2_ACCOUNT_ID) {
    await putObjectR2(`${folder}/${filename}`, buffer, contentType)
    return `${process.env.R2_PUBLIC_URL}/${folder}/${filename}`
  }

  await ensureDataDir('uploads', folder)
  await writeFile(dataPath('uploads', folder, filename), buffer)
  return `/api/media/${folder}/${filename}`
}
