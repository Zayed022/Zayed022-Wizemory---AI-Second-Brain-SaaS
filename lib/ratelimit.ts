import { Redis } from '@upstash/redis'

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Sliding-window rate limiter.
 * @param key      – unique identifier (e.g. `ratelimit:user:${userId}:chat`)
 * @param limit    – max requests in the window
 * @param windowMs – window size in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now     = Date.now()
  const windowStart = now - windowMs

  // Remove old entries outside the window
  await redis.zremrangebyscore(key, '-inf', windowStart)

  // Count current requests in the window
  const count = await redis.zcard(key)

  if (count >= limit) {
    // Find earliest entry to calculate reset time
    const oldest = await redis.zrange(key, 0, 0, { withScores: true })
    const oldestScore = oldest.length > 0 ? (oldest[0] as any).score ?? now : now
    return {
      allowed:   false,
      remaining: 0,
      resetAt:   Math.ceil((oldestScore + windowMs) / 1000),
    }
  }

  // Add current request
  await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` })
  // Set expiry on the key so it auto-cleans
  await redis.expire(key, Math.ceil(windowMs / 1000))

  return {
    allowed:   true,
    remaining: limit - count - 1,
    resetAt:   Math.ceil((now + windowMs) / 1000),
  }
}

// Convenience wrappers
export async function rateLimitAiChat(userId: string, plan: string): Promise<RateLimitResult> {
  if (plan !== 'FREE') {
    return { allowed: true, remaining: 9999, resetAt: 0 }
  }
  // Free: 10 AI queries per 30-day period
  return rateLimit(`ratelimit:aichat:${userId}`, 10, 30 * 24 * 60 * 60 * 1000)
}

export async function rateLimitItemCreate(userId: string): Promise<RateLimitResult> {
  // All users: max 60 items per hour (anti-abuse)
  return rateLimit(`ratelimit:itemcreate:${userId}`, 60, 60 * 60 * 1000)
}

export async function rateLimitApi(ip: string): Promise<RateLimitResult> {
  // Global: 200 requests / minute per IP
  return rateLimit(`ratelimit:api:${ip}`, 200, 60 * 1000)
}
