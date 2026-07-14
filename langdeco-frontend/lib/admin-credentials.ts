import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { dataPath } from './storage'

const ITERATIONS = 100_000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

interface AdminCredentialFile {
  salt: string
  hash: string
}

function credentialsPath(): string {
  return dataPath('admin.json')
}

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
}

export async function hasAdminCredentials(): Promise<boolean> {
  try {
    await readFile(credentialsPath(), 'utf-8')
    return true
  } catch {
    return false
  }
}

export async function setupRequired(): Promise<boolean> {
  if (process.env.ADMIN_PASSWORD) return false
  return !(await hasAdminCredentials())
}

export async function saveAdminPassword(password: string): Promise<void> {
  const salt = randomBytes(16).toString('hex')
  const hash = hashPassword(password, salt)
  const payload: AdminCredentialFile = { salt, hash }

  await mkdir(path.dirname(credentialsPath()), { recursive: true })
  await writeFile(credentialsPath(), JSON.stringify(payload, null, 2), 'utf-8')
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (process.env.ADMIN_PASSWORD) {
    return password === process.env.ADMIN_PASSWORD
  }

  try {
    const raw = await readFile(credentialsPath(), 'utf-8')
    const { salt, hash } = JSON.parse(raw) as AdminCredentialFile
    const candidate = hashPassword(password, salt)

    const a = Buffer.from(candidate, 'hex')
    const b = Buffer.from(hash, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
