/**
 * QHSE Rate Limiter
 * Prevents abuse and ensures fair usage
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Configure rate limit for a key
   */
  configure(key: string, maxRequests: number, windowMs: number): void {
    this.configs.set(key, { maxRequests, windowMs });
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const config = this.configs.get(key) || {
      maxRequests: 100,
      windowMs: 60000,
    }; // Default: 100 req/min
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetTime) {
      // Reset or create new entry
      const resetTime = now + config.windowMs;
      this.limits.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime,
      };
    }

    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Get current rate limit status
   */
  getStatus(
    key: string,
  ): { count: number; maxRequests: number; resetTime: number } | null {
    const config = this.configs.get(key) || {
      maxRequests: 100,
      windowMs: 60000,
    };
    const entry = this.limits.get(key);

    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      maxRequests: config.maxRequests,
      resetTime: entry.resetTime,
    };
  }
}

export const qhseRateLimiter = new RateLimiter();

// Configure default rate limits
qhseRateLimiter.configure("api:food-safety", 100, 60000); // 100 req/min
qhseRateLimiter.configure("api:pharmaceutical", 100, 60000); // 100 req/min
qhseRateLimiter.configure("api:oil-gas", 100, 60000); // 100 req/min
qhseRateLimiter.configure("api:business-continuity", 100, 60000); // 100 req/min
qhseRateLimiter.configure("api:ai-predictions", 50, 60000); // 50 req/min (more expensive)
qhseRateLimiter.configure("api:digital-twin", 50, 60000); // 50 req/min
qhseRateLimiter.configure("api:standards", 200, 60000); // 200 req/min (read-only)
