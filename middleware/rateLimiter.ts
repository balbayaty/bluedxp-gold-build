/**
 * API Rate Limiting Middleware
 * Prevents API abuse with configurable rate limits
 */

import { NextRequest, NextResponse } from 'next/server'
import { redisService } from '@/lib/services/cache/redisService'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
}

/**
 * Rate limiting middleware
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; response?: NextResponse; remaining?: number; reset?: number }> {
  try {
    // Generate rate limit key
    const keyGenerator = config.keyGenerator || ((req) => {
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
      return `rate_limit:${ip}`
    })

    const key = keyGenerator(request)

    // Get current count from Redis
    const current = await redisService.get<number>(key) || 0

    if (current >= config.maxRequests) {
      const resetTime = Math.ceil(config.windowMs / 1000) + Math.floor(Date.now() / 1000)
      return {
        allowed: false,
        response: NextResponse.json(
          {
            success: false,
            errors: [{ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }],
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTime.toString(),
              'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            },
          }
        ),
        remaining: 0,
        reset: resetTime,
      }
    }

    // Increment counter
    await redisService.set(key, current + 1, { ttl: Math.ceil(config.windowMs / 1000) })

    const resetTime = Math.ceil(config.windowMs / 1000) + Math.floor(Date.now() / 1000)
    return {
      allowed: true,
      remaining: config.maxRequests - current - 1,
      reset: resetTime,
    }
  } catch (error) {
    // On error, allow the request (fail open)
    console.error('Rate limit error:', error)
    return { allowed: true }
  }
}

/**
 * Create rate limit middleware with custom config
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (request: NextRequest) => rateLimitMiddleware(request, config)
}

