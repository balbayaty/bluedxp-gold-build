/**
 * Advanced Rate Limiting Service
 *
 * Enterprise-grade rate limiting with:
 * - Multiple strategies (sliding window, token bucket, fixed window)
 * - Redis-backed for distributed systems
 * - In-memory fallback for single-instance deployments
 * - Configurable limits per user, IP, endpoint
 * - Automatic blocking and unblocking
 * - Threat detection and anomaly detection
 *
 * Industry Standard: OWASP Rate Limiting Best Practices
 */

import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDuration?: number; // Block duration in milliseconds (optional)
  strategy?: "sliding" | "fixed" | "token-bucket";
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // Seconds until retry allowed
  blocked?: boolean;
  reason?: string;
}

export interface RateLimitRule {
  id: string;
  name: string;
  pattern: string; // URL pattern or endpoint
  config: RateLimitConfig;
  enabled: boolean;
  priority: number; // Higher priority rules checked first
}

export interface ThreatDetection {
  suspicious: boolean;
  riskScore: number; // 0-100
  indicators: string[];
  recommendedAction: "allow" | "warn" | "block" | "challenge";
}

// ============================================================================
// RATE LIMITER SERVICE
// ============================================================================

class RateLimiterService {
  private rules: Map<string, RateLimitRule> = new Map();
  private inMemoryStore: Map<
    string,
    { count: number; resetTime: number; blockedUntil?: number }
  > = new Map();
  private redisClient: any = null;
  private threatPatterns: Map<string, { count: number; firstSeen: number }> =
    new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeRedis();
  }

  /**
   * Initialize default rate limiting rules
   */
  private initializeDefaultRules(): void {
    // Login endpoint - strict limits
    this.addRule({
      id: "login-endpoint",
      name: "Login Endpoint Protection",
      pattern: "/api/auth/login",
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts per 15 minutes
        blockDuration: 15 * 60 * 1000, // Block for 15 minutes
        strategy: "sliding",
      },
      enabled: true,
      priority: 100,
    });

    // Registration endpoint
    this.addRule({
      id: "register-endpoint",
      name: "Registration Endpoint Protection",
      pattern: "/api/auth/register",
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3, // 3 registrations per hour
        blockDuration: 60 * 60 * 1000,
        strategy: "sliding",
      },
      enabled: true,
      priority: 90,
    });

    // Password reset endpoint
    this.addRule({
      id: "password-reset-endpoint",
      name: "Password Reset Protection",
      pattern: "/api/auth/password/reset",
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3, // 3 requests per hour
        blockDuration: 60 * 60 * 1000,
        strategy: "sliding",
      },
      enabled: true,
      priority: 90,
    });

    // General API endpoints
    this.addRule({
      id: "general-api",
      name: "General API Rate Limit",
      pattern: "/api/*",
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 requests per minute
        strategy: "sliding",
      },
      enabled: true,
      priority: 10,
    });
  }

  /**
   * Initialize Redis connection (if available)
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Check if Redis is configured
      if (process.env.REDIS_URL) {
        const Redis = require("ioredis");
        this.redisClient = new Redis(process.env.REDIS_URL, {
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });

        this.redisClient.on("error", (err: Error) => {
          console.warn(
            "Redis connection error, falling back to in-memory:",
            err.message,
          );
          this.redisClient = null;
        });

        this.redisClient.on("connect", () => {
          console.log(
            "✅ Rate limiter using Redis for distributed rate limiting",
          );
        });
      }
    } catch (error) {
      console.warn(
        "Redis not available, using in-memory rate limiting:",
        error,
      );
      this.redisClient = null;
    }
  }

  /**
   * Add or update a rate limit rule
   */
  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
    // Sort by priority (higher first)
    const sortedRules = Array.from(this.rules.values()).sort(
      (a, b) => b.priority - a.priority,
    );
    this.rules.clear();
    sortedRules.forEach((r) => this.rules.set(r.id, r));
  }

  /**
   * Remove a rate limit rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    identifier: string, // User ID, IP address, or API key
    endpoint: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<RateLimitResult> {
    // Find matching rule
    const rule = this.findMatchingRule(endpoint);
    if (!rule || !rule.enabled) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(Date.now() + 60000),
      };
    }

    // Check if currently blocked
    const blockKey = `block:${identifier}`;
    const blockedUntil = await this.getBlockedUntil(blockKey);

    if (blockedUntil && blockedUntil > Date.now()) {
      const retryAfter = Math.ceil((blockedUntil - Date.now()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(blockedUntil),
        retryAfter,
        blocked: true,
        reason: "Rate limit exceeded - account temporarily blocked",
      };
    }

    // Perform threat detection
    const threat = await this.detectThreat(
      identifier,
      endpoint,
      userId,
      ipAddress,
    );
    if (threat.recommendedAction === "block") {
      await this.blockIdentifier(
        blockKey,
        rule.config.blockDuration || 15 * 60 * 1000,
      );
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(
          Date.now() + (rule.config.blockDuration || 15 * 60 * 1000),
        ),
        retryAfter: Math.ceil(
          (rule.config.blockDuration || 15 * 60 * 1000) / 1000,
        ),
        blocked: true,
        reason: "Suspicious activity detected - account blocked",
      };
    }

    // Check rate limit based on strategy
    const key = `${rule.id}:${identifier}`;
    const result = await this.checkLimit(key, rule.config);

    // If limit exceeded, block if configured
    if (!result.allowed && rule.config.blockDuration) {
      await this.blockIdentifier(blockKey, rule.config.blockDuration);
      result.blocked = true;
      result.retryAfter = Math.ceil(rule.config.blockDuration / 1000);
    }

    return result;
  }

  /**
   * Find matching rule for endpoint
   */
  private findMatchingRule(endpoint: string): RateLimitRule | null {
    for (const rule of this.rules.values()) {
      if (this.matchesPattern(endpoint, rule.pattern)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Check if endpoint matches pattern
   */
  private matchesPattern(endpoint: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(endpoint);
  }

  /**
   * Check limit using configured strategy
   */
  private async checkLimit(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const strategy = config.strategy || "sliding";

    switch (strategy) {
      case "sliding":
        return await this.slidingWindow(key, config);
      case "fixed":
        return await this.fixedWindow(key, config);
      case "token-bucket":
        return await this.tokenBucket(key, config);
      default:
        return await this.slidingWindow(key, config);
    }
  }

  /**
   * Sliding window rate limiting
   */
  private async slidingWindow(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (this.redisClient) {
      // Redis implementation
      const pipeline = this.redisClient.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);
      pipeline.zadd(
        key,
        now,
        `${now}-${crypto.randomBytes(8).toString("hex")}`,
      );
      pipeline.expire(key, Math.ceil(config.windowMs / 1000));
      const results = await pipeline.exec();

      const currentCount = results[1][1] as number;
      const allowed = currentCount < config.maxRequests;

      if (allowed) {
        // Request was added, so count is now currentCount + 1
        const newCount = currentCount + 1;
        return {
          allowed: true,
          remaining: Math.max(0, config.maxRequests - newCount),
          resetTime: new Date(now + config.windowMs),
        };
      } else {
        // Get oldest request to calculate reset time
        const oldest = await this.redisClient.zrange(key, 0, 0, "WITHSCORES");
        const resetTime =
          oldest.length > 0
            ? new Date(parseInt(oldest[1]) + config.windowMs)
            : new Date(now + config.windowMs);

        return {
          allowed: false,
          remaining: 0,
          resetTime,
        };
      }
    } else {
      // In-memory implementation
      const entry = this.inMemoryStore.get(key) || {
        count: 0,
        resetTime: now + config.windowMs,
      };

      // Reset if window expired
      if (entry.resetTime < now) {
        entry.count = 0;
        entry.resetTime = now + config.windowMs;
      }

      const allowed = entry.count < config.maxRequests;

      if (allowed) {
        entry.count++;
        this.inMemoryStore.set(key, entry);

        // Cleanup old entries periodically
        if (Math.random() < 0.01) {
          // 1% chance
          this.cleanupInMemoryStore();
        }
      }

      return {
        allowed,
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetTime: new Date(entry.resetTime),
      };
    }
  }

  /**
   * Fixed window rate limiting
   */
  private async fixedWindow(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const windowKey = `${key}:${windowStart}`;

    if (this.redisClient) {
      const count = await this.redisClient.incr(windowKey);
      if (count === 1) {
        await this.redisClient.expire(
          windowKey,
          Math.ceil(config.windowMs / 1000),
        );
      }

      return {
        allowed: count <= config.maxRequests,
        remaining: Math.max(0, config.maxRequests - count),
        resetTime: new Date(windowStart + config.windowMs),
      };
    } else {
      const entry = this.inMemoryStore.get(windowKey) || {
        count: 0,
        resetTime: windowStart + config.windowMs,
      };
      entry.count++;
      this.inMemoryStore.set(windowKey, entry);

      return {
        allowed: entry.count <= config.maxRequests,
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetTime: new Date(entry.resetTime),
      };
    }
  }

  /**
   * Token bucket rate limiting
   */
  private async tokenBucket(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const bucketKey = `${key}:bucket`;

    if (this.redisClient) {
      // Redis Lua script for atomic token bucket
      const lua = `
        local key = KEYS[1]
        local maxTokens = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local windowMs = tonumber(ARGV[4])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
        local tokens = tonumber(bucket[1]) or maxTokens
        local lastRefill = tonumber(bucket[2]) or now
        
        -- Refill tokens
        local elapsed = (now - lastRefill) / 1000
        local tokensToAdd = math.floor(elapsed * refillRate)
        tokens = math.min(maxTokens, tokens + tokensToAdd)
        lastRefill = now
        
        -- Consume token if available
        local allowed = tokens >= 1
        if allowed then
          tokens = tokens - 1
        end
        
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
        redis.call('EXPIRE', key, math.ceil(windowMs / 1000))
        
        return {allowed and 1 or 0, tokens}
      `;

      const refillRate = config.maxRequests / (config.windowMs / 1000); // tokens per second
      const result = (await this.redisClient.eval(
        lua,
        1,
        bucketKey,
        config.maxRequests,
        refillRate,
        now,
        config.windowMs,
      )) as [number, number];

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        resetTime: new Date(now + config.windowMs),
      };
    } else {
      // In-memory token bucket
      const entry = this.inMemoryStore.get(bucketKey) || {
        count: config.maxRequests,
        resetTime: now + config.windowMs,
        lastRefill: now,
      };

      const elapsed = (now - entry.lastRefill) / 1000;
      const refillRate = config.maxRequests / (config.windowMs / 1000);
      const tokensToAdd = Math.floor(elapsed * refillRate);
      entry.count = Math.min(config.maxRequests, entry.count + tokensToAdd);
      entry.lastRefill = now;

      const allowed = entry.count >= 1;
      if (allowed) {
        entry.count--;
      }

      this.inMemoryStore.set(bucketKey, entry);

      return {
        allowed,
        remaining: entry.count,
        resetTime: new Date(entry.resetTime),
      };
    }
  }

  /**
   * Detect threats and suspicious activity
   */
  private async detectThreat(
    identifier: string,
    endpoint: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<ThreatDetection> {
    const indicators: string[] = [];
    let riskScore = 0;

    // Check for rapid-fire requests
    const rapidKey = `rapid:${identifier}`;
    const rapidCount = await this.getThreatCount(rapidKey);
    if (rapidCount > 10) {
      indicators.push("Rapid-fire requests detected");
      riskScore += 30;
    }

    // Check for multiple failed login attempts
    if (endpoint.includes("/login")) {
      const failedKey = `failed:${identifier}`;
      const failedCount = await this.getThreatCount(failedKey);
      if (failedCount > 3) {
        indicators.push("Multiple failed login attempts");
        riskScore += 40;
      }
    }

    // Check for IP reputation (if IP provided)
    if (ipAddress) {
      const ipKey = `ip:${ipAddress}`;
      const ipThreats = await this.getThreatCount(ipKey);
      if (ipThreats > 5) {
        indicators.push("IP address associated with suspicious activity");
        riskScore += 20;
      }
    }

    // Check for account enumeration patterns
    if (
      endpoint.includes("/register") ||
      endpoint.includes("/password/reset")
    ) {
      const enumKey = `enum:${identifier}`;
      const enumCount = await this.getThreatCount(enumKey);
      if (enumCount > 5) {
        indicators.push("Possible account enumeration attempt");
        riskScore += 25;
      }
    }

    // Determine recommended action
    let recommendedAction: "allow" | "warn" | "block" | "challenge" = "allow";
    if (riskScore >= 70) {
      recommendedAction = "block";
    } else if (riskScore >= 50) {
      recommendedAction = "challenge";
    } else if (riskScore >= 30) {
      recommendedAction = "warn";
    }

    return {
      suspicious: riskScore > 30,
      riskScore,
      indicators,
      recommendedAction,
    };
  }

  /**
   * Get threat count for identifier
   */
  private async getThreatCount(key: string): Promise<number> {
    if (this.redisClient) {
      return parseInt((await this.redisClient.get(key)) || "0");
    } else {
      const entry = this.threatPatterns.get(key);
      return entry ? entry.count : 0;
    }
  }

  /**
   * Increment threat count
   */
  async incrementThreatCount(key: string, ttl: number = 3600): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.incr(key);
      await this.redisClient.expire(key, ttl);
    } else {
      const entry = this.threatPatterns.get(key) || {
        count: 0,
        firstSeen: Date.now(),
      };
      entry.count++;
      this.threatPatterns.set(key, entry);

      // Cleanup old entries
      if (Math.random() < 0.01) {
        this.cleanupThreatPatterns();
      }
    }
  }

  /**
   * Block an identifier
   */
  private async blockIdentifier(key: string, duration: number): Promise<void> {
    const blockedUntil = Date.now() + duration;

    if (this.redisClient) {
      await this.redisClient.setex(
        key,
        Math.ceil(duration / 1000),
        blockedUntil.toString(),
      );
    } else {
      const entry = this.inMemoryStore.get(key) || { count: 0, resetTime: 0 };
      entry.blockedUntil = blockedUntil;
      this.inMemoryStore.set(key, entry);
    }
  }

  /**
   * Get blocked until timestamp
   */
  private async getBlockedUntil(key: string): Promise<number | null> {
    if (this.redisClient) {
      const value = await this.redisClient.get(key);
      return value ? parseInt(value) : null;
    } else {
      const entry = this.inMemoryStore.get(key);
      return entry?.blockedUntil && entry.blockedUntil > Date.now()
        ? entry.blockedUntil
        : null;
    }
  }

  /**
   * Cleanup in-memory store
   */
  private cleanupInMemoryStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (
        entry.resetTime < now &&
        (!entry.blockedUntil || entry.blockedUntil < now)
      ) {
        this.inMemoryStore.delete(key);
      }
    }
  }

  /**
   * Cleanup threat patterns
   */
  private cleanupThreatPatterns(): void {
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, entry] of this.threatPatterns.entries()) {
      if (entry.firstSeen < oneHourAgo) {
        this.threatPatterns.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for identifier (admin function)
   */
  async resetRateLimit(identifier: string, endpoint?: string): Promise<void> {
    if (endpoint) {
      const rule = this.findMatchingRule(endpoint);
      if (rule) {
        const key = `${rule.id}:${identifier}`;
        if (this.redisClient) {
          await this.redisClient.del(key);
        } else {
          this.inMemoryStore.delete(key);
        }
      }
    } else {
      // Reset all limits for identifier
      for (const rule of this.rules.values()) {
        const key = `${rule.id}:${identifier}`;
        if (this.redisClient) {
          await this.redisClient.del(key);
        } else {
          this.inMemoryStore.delete(key);
        }
      }
    }
  }

  /**
   * Get rate limit statistics
   */
  async getStatistics(identifier: string): Promise<{
    rules: Array<{
      ruleId: string;
      currentCount: number;
      limit: number;
      resetTime: Date;
    }>;
    blocked: boolean;
    blockedUntil?: Date;
  }> {
    const stats: any = {
      rules: [],
      blocked: false,
    };

    for (const rule of this.rules.values()) {
      const key = `${rule.id}:${identifier}`;
      let currentCount = 0;

      if (this.redisClient) {
        currentCount = await this.redisClient.zcard(key);
      } else {
        const entry = this.inMemoryStore.get(key);
        currentCount = entry?.count || 0;
      }

      stats.rules.push({
        ruleId: rule.id,
        currentCount,
        limit: rule.config.maxRequests,
        resetTime: new Date(Date.now() + rule.config.windowMs),
      });
    }

    const blockKey = `block:${identifier}`;
    const blockedUntil = await this.getBlockedUntil(blockKey);
    if (blockedUntil) {
      stats.blocked = true;
      stats.blockedUntil = new Date(blockedUntil);
    }

    return stats;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiterService();
