/**
 * Unified Cache Service
 * Multi-layer caching with memory and Redis
 */

import { redisService } from "./redisService";

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
  tags?: string[];
}

export class CacheService {
  private memoryCache: Map<string, MemoryCacheEntry> = new Map();
  private maxMemorySize: number = 1000; // Max entries in memory cache

  /**
   * Initialize cache service
   */
  async initialize(redisUrl?: string): Promise<void> {
    await redisService.initialize(redisUrl);
  }

  /**
   * Get value from cache (checks memory first, then Redis)
   */
  async get<T = any>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (memoryEntry.expiresAt > Date.now()) {
        return memoryEntry.value as T;
      } else {
        // Expired, remove from memory
        this.memoryCache.delete(key);
      }
    }

    // Check Redis cache
    const redisValue = await redisService.get<T>(key);
    if (redisValue) {
      // Store in memory cache for faster access
      this.memoryCache.set(key, {
        value: redisValue,
        expiresAt: Date.now() + 60000, // 1 minute in memory
      });
      return redisValue;
    }

    return null;
  }

  /**
   * Set value in cache (stores in both memory and Redis)
   */
  async set(
    key: string,
    value: any,
    ttl?: number,
    tags?: string[],
  ): Promise<boolean> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : Date.now() + 3600000; // Default 1 hour

    // Store in memory cache
    if (this.memoryCache.size >= this.maxMemorySize) {
      // Remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, {
      value,
      expiresAt,
      tags,
    });

    // Store in Redis
    await redisService.set(key, value, { ttl, tags });

    return true;
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    this.memoryCache.delete(key);
    await redisService.delete(key);
    return true;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let count = 0;

    // Invalidate memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags && entry.tags.some((tag) => tags.includes(tag))) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // Invalidate Redis cache
    const redisCount = await redisService.invalidateByTags(tags);
    count += redisCount;

    return count;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    this.memoryCache.clear();
    await redisService.clear();
    return true;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memory: { entries: number; size: number };
    redis: { keys: number; memory: number; hits: number; misses: number };
  }> {
    const redisStats = await redisService.getStats();

    return {
      memory: {
        entries: this.memoryCache.size,
        size: this.maxMemorySize,
      },
      redis: redisStats,
    };
  }

  /**
   * Clean expired entries from memory cache
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

export const cacheService = new CacheService();
