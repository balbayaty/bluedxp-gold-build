/**
 * Rate Limiting Service
 * Implements token bucket algorithm for rate limiting
 */

import { APIKey } from "@/types/userManagement";
import { redisService } from "@/lib/services/cache/redisService";

interface RateLimitStore {
  [key: string]: {
    requests: number[];
    lastReset: number;
  };
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

interface RateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: Date;
  reason?: string;
}

type RateLimitScope = "minute" | "hour" | "day";

function getWindowMs(window: RateLimitScope): number {
  return { minute: 60_000, hour: 3_600_000, day: 86_400_000 }[window];
}

function getLimit(
  config: RateLimitConfig,
  window: RateLimitScope,
): number | undefined {
  return {
    minute: config.requestsPerMinute,
    hour: config.requestsPerHour,
    day: config.requestsPerDay,
  }[window];
}

function getUserDefaultRateLimit(): RateLimitConfig {
  const perMinute = Number(process.env.RATE_LIMIT_USER_PER_MINUTE || "");
  const perHour = Number(process.env.RATE_LIMIT_USER_PER_HOUR || "");
  const perDay = Number(process.env.RATE_LIMIT_USER_PER_DAY || "");

  return {
    requestsPerMinute:
      Number.isFinite(perMinute) && perMinute > 0 ? perMinute : 120,
    requestsPerHour: Number.isFinite(perHour) && perHour > 0 ? perHour : 2000,
    requestsPerDay: Number.isFinite(perDay) && perDay > 0 ? perDay : 20000,
  };
}

async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig,
  window: RateLimitScope,
): Promise<RateLimitResult> {
  const limit = getLimit(config, window);
  if (!limit) return { allowed: true };

  const client = redisService.getClient();
  if (!redisService.isEnabled() || !client) {
    // In production strict mode we should never reach this.
    return { allowed: true };
  }

  const now = Date.now();
  const windowMs = getWindowMs(window);
  const bucket = Math.floor(now / windowMs);
  const key = `rl:${identifier}:${window}:${bucket}`;

  // Atomic increment + expire (expire slightly longer than window)
  const ttlSeconds = Math.ceil(windowMs / 1000) + 5;
  const multi = client.multi();
  multi.incr(key);
  multi.expire(key, ttlSeconds);
  const res = await multi.exec();

  // ioredis returns [[err, value], ...]
  const count = Number(res?.[0]?.[1] ?? 0);

  if (count > limit) {
    const resetAt = new Date((bucket + 1) * windowMs);
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      reason: `Rate limit exceeded: ${limit} requests per ${window}`,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(limit - count, 0),
    resetAt: new Date((bucket + 1) * windowMs),
  };
}

/**
 * Clean old entries from rate limit store
 */
function cleanRateLimitStore() {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  for (const key in rateLimitStore) {
    const entry = rateLimitStore[key];
    // Remove requests older than 1 day
    entry.requests = entry.requests.filter(
      (timestamp) => timestamp > oneDayAgo,
    );

    // Remove entry if empty
    if (entry.requests.length === 0) {
      delete rateLimitStore[key];
    }
  }
}

// Clean store every hour
if (typeof setInterval !== "undefined") {
  setInterval(cleanRateLimitStore, 60 * 60 * 1000);
}

/**
 * Check rate limit for API key
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  window: "minute" | "hour" | "day" = "minute",
): RateLimitResult {
  const now = Date.now();
  const windowMs = getWindowMs(window);

  const limit = getLimit(config, window);

  if (!limit) {
    return { allowed: true };
  }

  // Initialize or get entry
  if (!rateLimitStore[identifier]) {
    rateLimitStore[identifier] = {
      requests: [],
      lastReset: now,
    };
  }

  const entry = rateLimitStore[identifier];

  // Remove old requests outside window
  const cutoff = now - windowMs;
  entry.requests = entry.requests.filter((timestamp) => timestamp > cutoff);

  // Check if limit exceeded
  if (entry.requests.length >= limit) {
    const oldestRequest = entry.requests[0];
    const resetAt = new Date(oldestRequest + windowMs);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      reason: `Rate limit exceeded: ${limit} requests per ${window}`,
    };
  }

  // Add current request
  entry.requests.push(now);

  return {
    allowed: true,
    remaining: limit - entry.requests.length,
    resetAt: new Date(now + windowMs),
  };
}

/**
 * Check all rate limits for API key
 */
export function checkAllRateLimits(
  identifier: string,
  apiKey: APIKey,
): RateLimitResult {
  if (!apiKey.rateLimit) {
    return { allowed: true };
  }

  const { requestsPerMinute, requestsPerHour, requestsPerDay } =
    apiKey.rateLimit;

  // Check minute limit
  if (requestsPerMinute) {
    const minuteCheck = checkRateLimit(identifier, apiKey.rateLimit, "minute");
    if (!minuteCheck.allowed) {
      return minuteCheck;
    }
  }

  // Check hour limit
  if (requestsPerHour) {
    const hourCheck = checkRateLimit(
      `${identifier}:hour`,
      apiKey.rateLimit,
      "hour",
    );
    if (!hourCheck.allowed) {
      return hourCheck;
    }
  }

  // Check day limit
  if (requestsPerDay) {
    const dayCheck = checkRateLimit(
      `${identifier}:day`,
      apiKey.rateLimit,
      "day",
    );
    if (!dayCheck.allowed) {
      return dayCheck;
    }
  }

  return { allowed: true };
}

/**
 * Check rate limits for a normal authenticated user (JWT/session).
 * Uses Redis if available; otherwise falls back to in-memory (dev only).
 */
export async function checkUserRateLimits(
  identifier: string,
  config?: RateLimitConfig,
): Promise<RateLimitResult> {
  const effective = config || getUserDefaultRateLimit();

  // Prefer Redis if initialized
  if (redisService.isEnabled() && redisService.getClient()) {
    // minute
    const m = await checkRateLimitRedis(identifier, effective, "minute");
    if (!m.allowed) return m;
    // hour
    const h = await checkRateLimitRedis(
      `${identifier}:hour`,
      effective,
      "hour",
    );
    if (!h.allowed) return h;
    // day
    const d = await checkRateLimitRedis(`${identifier}:day`, effective, "day");
    if (!d.allowed) return d;
    return d.allowed ? m : d;
  }

  // Fallback (in-memory)
  const minuteCheck = checkRateLimit(identifier, effective, "minute");
  if (!minuteCheck.allowed) return minuteCheck;
  const hourCheck = checkRateLimit(`${identifier}:hour`, effective, "hour");
  if (!hourCheck.allowed) return hourCheck;
  const dayCheck = checkRateLimit(`${identifier}:day`, effective, "day");
  return dayCheck;
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (result.remaining !== undefined) {
    headers["X-RateLimit-Remaining"] = result.remaining.toString();
  }

  if (result.resetAt) {
    headers["X-RateLimit-Reset"] = Math.floor(
      result.resetAt.getTime() / 1000,
    ).toString();
  }

  return headers;
}
