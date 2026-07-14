const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos

interface Attempt {
  count: number
  windowStart: number
}

const attemptsByIp = new Map<string, Attempt>()

export function isRateLimited(ip: string): boolean {
  const attempt = attemptsByIp.get(ip)
  if (!attempt) return false

  if (Date.now() - attempt.windowStart > WINDOW_MS) {
    attemptsByIp.delete(ip)
    return false
  }

  return attempt.count >= MAX_ATTEMPTS
}

export function registerFailedAttempt(ip: string): void {
  const attempt = attemptsByIp.get(ip)

  if (!attempt || Date.now() - attempt.windowStart > WINDOW_MS) {
    attemptsByIp.set(ip, { count: 1, windowStart: Date.now() })
    return
  }

  attempt.count += 1
}

export function clearAttempts(ip: string): void {
  attemptsByIp.delete(ip)
}
