/**
 * Rate Limiter - Simple in-memory rate limiting
 * In production, use Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  /**
   * Check if request is allowed
   */
  static check(
    key: string,
    config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 },
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, newEntry);
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: newEntry.resetTime,
      };
    }

    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetTime,
    };
  }

  /**
   * Clear rate limit for key
   */
  static clear(key: string): void {
    rateLimitStore.delete(key);
  }

  /**
   * Clear all rate limits
   */
  static clearAll(): void {
    rateLimitStore.clear();
  }
}
