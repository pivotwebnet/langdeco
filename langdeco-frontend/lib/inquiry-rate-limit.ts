const MAX_ATTEMPTS = 3
const WINDOW_MS = 10 * 60 * 1000 // 10 minutos

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

export function registerAttempt(ip: string): void {
  const attempt = attemptsByIp.get(ip)

  if (!attempt || Date.now() - attempt.windowStart > WINDOW_MS) {
    attemptsByIp.set(ip, { count: 1, windowStart: Date.now() })
    return
  }

  attempt.count += 1
}
