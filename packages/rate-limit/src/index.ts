import { Redis } from '@upstash/redis'

let redis: Redis | null = null

try {
  redis = Redis.fromEnv()
} catch (error) {
  console.warn(
    '[rate-limit] Redis not configured. Rate limiting disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local',
  )
}

export type RateLimitConfig = {
  windowSeconds: number
  maxRequests: number
  prefix: string
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
}

export async function rateLimit(
  config: RateLimitConfig,
  identifier: string,
): Promise<RateLimitResult> {
  // If Redis is not configured, allow all requests (graceful degradation)
  if (!redis) {
    console.warn(
      '[rate-limit] Redis not available, allowing request. Configure Upstash Redis for rate limiting.',
    )
    return { allowed: true, remaining: config.maxRequests }
  }

  const key = `${config.prefix}:${identifier}`
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  try {
    // First, clean up old entries and count current hits
    const pipeline1 = redis.multi()
    pipeline1.zremrangebyscore(key, 0, now - windowMs)
    pipeline1.zcard(key)
    const [zremResult, countResult] = (await pipeline1.exec()) as [
      any,
      [string, number],
    ]

    const hitsBefore = (countResult[1] as number) || 0
    // Check if we can add one more (before adding)
    const allowed = hitsBefore < config.maxRequests

    // Only add the request if allowed
    if (allowed) {
      const pipeline2 = redis.multi()
      pipeline2.zadd(key, { score: now, member: `${now}` })
      pipeline2.expire(key, config.windowSeconds)
      await pipeline2.exec()
    }

    const remaining = Math.max(0, config.maxRequests - hitsBefore - 1)

    return { allowed, remaining }
  } catch (error) {
    console.error('[rate-limit] Redis error:', error)
    // On Redis error, allow the request (fail open)
    return { allowed: true, remaining: config.maxRequests }
  }
}

