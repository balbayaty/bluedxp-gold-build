/**
 * Cache Strategy Service
 * Intelligent caching with different strategies
 */

import { redisCacheService } from "./redisCache";
import { metricsService } from "@/lib/services/observability/metrics";

export enum CacheStrategy {
  NO_CACHE = "no_cache",
  CACHE_FIRST = "cache_first",
  NETWORK_FIRST = "network_first",
  STALE_WHILE_REVALIDATE = "stale_while_revalidate",
}

export interface CacheConfig {
  strategy: CacheStrategy;
  ttl?: number;
  tags?: string[];
  maxAge?: number;
  staleAge?: number;
}

class CacheStrategyService {
  /**
   * Get with cache strategy
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = { strategy: CacheStrategy.CACHE_FIRST, ttl: 3600 },
  ): Promise<T> {
    const startTime = Date.now();

    switch (config.strategy) {
      case CacheStrategy.NO_CACHE:
        return await fetcher();

      case CacheStrategy.CACHE_FIRST:
        return await this.cacheFirst(key, fetcher, config);

      case CacheStrategy.NETWORK_FIRST:
        return await this.networkFirst(key, fetcher, config);

      case CacheStrategy.STALE_WHILE_REVALIDATE:
        return await this.staleWhileRevalidate(key, fetcher, config);

      default:
        return await this.cacheFirst(key, fetcher, config);
    }
  }

  /**
   * Cache first strategy
   */
  private async cacheFirst<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig,
  ): Promise<T> {
    // Try cache first
    const cached = await redisCacheService.get<T>(key);
    if (cached !== null) {
      metricsService.incrementCounter("cache_hits_total", { cache_key: key });
      return cached;
    }

    // Cache miss - fetch and cache
    metricsService.incrementCounter("cache_misses_total", { cache_key: key });
    const value = await fetcher();
    await redisCacheService.set(key, value, {
      ttl: config.ttl,
      tags: config.tags,
    });
    return value;
  }

  /**
   * Network first strategy
   */
  private async networkFirst<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig,
  ): Promise<T> {
    try {
      // Try network first
      const value = await fetcher();
      await redisCacheService.set(key, value, {
        ttl: config.ttl,
        tags: config.tags,
      });
      return value;
    } catch (error) {
      // Network failed - try cache
      const cached = await redisCacheService.get<T>(key);
      if (cached !== null) {
        metricsService.incrementCounter("cache_hits_total", { cache_key: key });
        return cached;
      }
      throw error;
    }
  }

  /**
   * Stale while revalidate strategy
   */
  private async staleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig,
  ): Promise<T> {
    // Get from cache (even if stale)
    const cached = await redisCacheService.get<T>(key);
    if (cached !== null) {
      // Revalidate in background
      fetcher()
        .then((value) =>
          redisCacheService.set(key, value, {
            ttl: config.ttl,
            tags: config.tags,
          }),
        )
        .catch(console.error);
      return cached;
    }

    // No cache - fetch and cache
    const value = await fetcher();
    await redisCacheService.set(key, value, {
      ttl: config.ttl,
      tags: config.tags,
    });
    return value;
  }

  /**
   * Invalidate cache
   */
  async invalidate(key: string): Promise<void> {
    await redisCacheService.delete(key);
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    await redisCacheService.invalidateByTags(tags);
  }
}

export const cacheStrategyService = new CacheStrategyService();
