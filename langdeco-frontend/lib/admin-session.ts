import { createHmac, timingSafeEqual } from 'crypto'

export const SESSION_COOKIE = 'lld_admin_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 días

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'dev-insecure-secret-change-me'
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const payload = `${expiresAt}`
  const signature = sign(payload)
  return `${payload}.${signature}`
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false

  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt)) return false

  return Date.now() < expiresAt
}

export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000
