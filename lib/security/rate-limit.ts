type RateLimitOptions = {
  windowMs: number
  max: number
}

const ipHits = new Map<string, { count: number; expiresAt: number }>()

export function rateLimit(ip: string, { windowMs, max }: RateLimitOptions) {
  const now = Date.now()
  const existing = ipHits.get(ip)

  if (!existing || existing.expiresAt < now) {
    ipHits.set(ip, { count: 1, expiresAt: now + windowMs })
    return { allowed: true, remaining: max - 1 }
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0 }
  }

  existing.count += 1
  return { allowed: true, remaining: max - existing.count }
}

