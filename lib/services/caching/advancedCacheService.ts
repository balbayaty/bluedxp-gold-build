/**
 * Advanced Caching Service
 *
 * Multi-layer caching with:
 * - L1: In-memory cache
 * - L2: Redis cache
 * - L3: CDN cache
 * - Cache warming
 * - Intelligent invalidation
 */

import Redis from "ioredis";
import { cdnService } from "../cdn/cdnService";

export interface CacheConfig {
  ttl: number; // seconds
  layer: "l1" | "l2" | "l3" | "all";
  invalidation: "time" | "event" | "manual";
  warming?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  evictions: number;
}

class AdvancedCacheService {
  private l1Cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private redis: Redis | null = null;
  private stats: Map<string, CacheStats> = new Map();

  /**
   * Initialize cache
   */
  async initialize(): Promise<void> {
    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        await this.redis.ping();
        console.log("✅ Redis cache (L2) initialized");
      } catch (error) {
        console.warn("⚠️ Redis not available, using L1 cache only");
      }
    }
  }

  /**
   * Get from cache (multi-layer)
   */
  async get<T>(key: string): Promise<T | null> {
    // L1: In-memory cache
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && l1Entry.expiresAt > Date.now()) {
      this.recordHit(key, "l1");
      return l1Entry.value as T;
    }

    // Remove expired L1 entry
    if (l1Entry) {
      this.l1Cache.delete(key);
    }

    // L2: Redis cache
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          const parsed = JSON.parse(value);
          // Also store in L1 for faster access
          this.l1Cache.set(key, {
            value: parsed,
            expiresAt: Date.now() + 60000, // 1 minute L1 TTL
          });
          this.recordHit(key, "l2");
          return parsed as T;
        }
      } catch (error) {
        console.warn("Redis get error:", error);
      }
    }

    this.recordMiss(key);
    return null;
  }

  /**
   * Set cache (multi-layer)
   */
  async set(key: string, value: any, config: CacheConfig): Promise<void> {
    const expiresAt = Date.now() + config.ttl * 1000;

    // L1: In-memory cache
    if (config.layer === "l1" || config.layer === "all") {
      this.l1Cache.set(key, { value, expiresAt });
    }

    // L2: Redis cache
    if ((config.layer === "l2" || config.layer === "all") && this.redis) {
      try {
        await this.redis.setex(key, config.ttl, JSON.stringify(value));
      } catch (error) {
        console.warn("Redis set error:", error);
      }
    }

    // L3: CDN cache
    if (
      (config.layer === "l3" || config.layer === "all") &&
      typeof key === "string" &&
      key.startsWith("/")
    ) {
      await cdnService.cacheAtEdge(key, config.ttl);
    }
  }

  /**
   * Invalidate cache
   */
  async invalidate(
    key: string,
    layer?: "l1" | "l2" | "l3" | "all",
  ): Promise<void> {
    const targetLayer = layer || "all";

    // L1
    if (targetLayer === "l1" || targetLayer === "all") {
      this.l1Cache.delete(key);
    }

    // L2
    if ((targetLayer === "l2" || targetLayer === "all") && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.warn("Redis del error:", error);
      }
    }

    // L3
    if (
      (targetLayer === "l3" || targetLayer === "all") &&
      typeof key === "string" &&
      key.startsWith("/")
    ) {
      await cdnService.invalidateCache([key]);
    }
  }

  /**
   * Warm cache
   */
  async warmCache(
    keys: string[],
    fetcher: (key: string) => Promise<any>,
    config: CacheConfig,
  ): Promise<void> {
    for (const key of keys) {
      try {
        const value = await fetcher(key);
        await this.set(key, value, config);
      } catch (error) {
        console.warn(`Failed to warm cache for ${key}:`, error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(key?: string): CacheStats | Record<string, CacheStats> {
    if (key) {
      return (
        this.stats.get(key) || {
          hits: 0,
          misses: 0,
          hitRate: 0,
          size: 0,
          evictions: 0,
        }
      );
    }

    const allStats: Record<string, CacheStats> = {};
    for (const [k, stats] of this.stats.entries()) {
      allStats[k] = stats;
    }
    return allStats;
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    this.l1Cache.clear();

    if (this.redis) {
      try {
        await this.redis.flushdb();
      } catch (error) {
        console.warn("Redis flush error:", error);
      }
    }

    await cdnService.purgeAllCache();
  }

  // Private helper methods

  private recordHit(key: string, layer: "l1" | "l2" | "l3"): void {
    const stats = this.stats.get(key) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      evictions: 0,
    };
    stats.hits++;
    stats.hitRate = stats.hits / (stats.hits + stats.misses);
    this.stats.set(key, stats);
  }

  private recordMiss(key: string): void {
    const stats = this.stats.get(key) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      evictions: 0,
    };
    stats.misses++;
    stats.hitRate = stats.hits / (stats.hits + stats.misses);
    this.stats.set(key, stats);
  }
}

export const advancedCacheService = new AdvancedCacheService();

// Initialize on startup
if (typeof window === "undefined") {
  advancedCacheService.initialize();
}
