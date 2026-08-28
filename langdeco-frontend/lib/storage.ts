import { mkdir } from 'fs/promises'
import path from 'path'

// El ignore comment evita que Turbopack, al no poder resolver esta ruta en
// build-time (depende de DATA_DIR/cwd en runtime), trace todo el proyecto
// "por las dudas" para el bundle de output:standalone — sin esto, la imagen
// Docker terminaba incluyendo de más.
const DATA_DIR = process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data')

export function dataPath(...segments: string[]): string {
  return path.join(/*turbopackIgnore: true*/ DATA_DIR, ...segments)
}

export async function ensureDataDir(...segments: string[]): Promise<string> {
  const dir = dataPath(...segments)
  await mkdir(dir, { recursive: true })
  return dir
}
