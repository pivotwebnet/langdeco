import { mkdir } from 'fs/promises'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')

export function dataPath(...segments: string[]): string {
  return path.join(DATA_DIR, ...segments)
}

export async function ensureDataDir(...segments: string[]): Promise<string> {
  const dir = dataPath(...segments)
  await mkdir(dir, { recursive: true })
  return dir
}
