/**
 * Redis Cache Service
 * High-performance caching with Redis using ioredis
 * Falls back to in-memory cache if ioredis is not available
 */

let Redis: any = null;
try {
  Redis = require("ioredis");
} catch (e) {
  // ioredis not installed, will use fallback cache only
  console.log("⚠️ ioredis not installed, using in-memory cache fallback");
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export class RedisService {
  private client: any = null;
  private enabled: boolean = false;
  private fallbackCache: Map<string, { value: any; expiresAt: number }> =
    new Map();

  /**
   * Initialize Redis client
   */
  async initialize(
    redisUrl?: string,
    options?: { strict?: boolean },
  ): Promise<void> {
    if (!Redis) {
      console.log("⚠️ Redis: ioredis not available, using in-memory fallback");
      this.enabled = false;
      if (options?.strict) {
        throw new Error(
          "Redis strict mode: ioredis is required but not available.",
        );
      }
      return;
    }

    try {
      const url = redisUrl || process.env.REDIS_URL || "redis://localhost:6379";

      this.client = new Redis(url, {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      // Handle connection events
      this.client.on("connect", () => {
        console.log("✅ Redis: Connected");
        this.enabled = true;
      });

      this.client.on("ready", () => {
        console.log("✅ Redis: Ready");
        this.enabled = true;
      });

      this.client.on("error", (error: unknown) => {
        console.error("❌ Redis: Connection error", error);
        this.enabled = false;
      });

      this.client.on("close", () => {
        console.warn("⚠️ Redis: Connection closed");
        this.enabled = false;
      });

      // Connect to Redis (ioredis v4+ uses connect, v5+ uses ping directly)
      if (typeof this.client.connect === "function") {
        await this.client.connect();
      }
      await this.client.ping();

      this.enabled = true;
      console.log("✅ Redis: Initialized and connected");
    } catch (error) {
      console.error("❌ Error initializing Redis:", error);
      this.enabled = false;
      this.client = null;
      console.log("⚠️ Redis: Using in-memory fallback");
      if (options?.strict) {
        throw new Error("Redis strict mode: failed to connect to Redis.");
      }
    }
  }

  /**
   * Returns whether Redis is connected and enabled.
   */
  isEnabled(): boolean {
    return !!this.enabled && !!this.client;
  }

  /**
   * Raw Redis client (ioredis). Use sparingly for atomic operations.
   */
  getClient(): any | null {
    return this.client;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.enabled && this.client) {
      try {
        const value = await this.client.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      } catch (error) {
        console.error("Redis get error:", error);
        // Fall through to fallback
      }
    }

    // Fallback to in-memory cache
    const cached = this.fallbackCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
    if (cached) {
      this.fallbackCache.delete(key);
    }
    return null;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    const serialized = JSON.stringify(value);

    // Try Redis first
    if (this.enabled && this.client) {
      try {
        if (options?.ttl) {
          await this.client.setex(key, options.ttl, serialized);
        } else {
          await this.client.set(key, serialized);
        }

        // Store tags if provided
        if (options?.tags && options.tags.length > 0) {
          for (const tag of options.tags) {
            await this.client.sadd(`tag:${tag}`, key);
            if (options.ttl) {
              await this.client.expire(`tag:${tag}`, options.ttl);
            }
          }
        }

        // Also store in fallback for redundancy
        this.fallbackCache.set(key, {
          value,
          expiresAt: options?.ttl
            ? Date.now() + options.ttl * 1000
            : Date.now() + 3600000, // Default 1 hour
        });

        return true;
      } catch (error) {
        console.error("Redis set error:", error);
        // Fall through to fallback
      }
    }

    // Fallback to in-memory cache
    this.fallbackCache.set(key, {
      value,
      expiresAt: options?.ttl
        ? Date.now() + options.ttl * 1000
        : Date.now() + 3600000,
    });
    return true;
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    // Try Redis first
    if (this.enabled && this.client) {
      try {
        await this.client.del(key);
        this.fallbackCache.delete(key);
        return true;
      } catch (error) {
        console.error("Redis delete error:", error);
        // Fall through to fallback
      }
    }

    // Fallback
    this.fallbackCache.delete(key);
    return true;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let count = 0;

    if (this.enabled && this.client) {
      try {
        for (const tag of tags) {
          const tagKey = `tag:${tag}`;
          const keys = await this.client.smembers(tagKey);

          if (keys.length > 0) {
            await this.client.del(...keys);
            await this.client.del(tagKey);
            count += keys.length;

            // Also remove from fallback
            keys.forEach((key: string) => this.fallbackCache.delete(key));
          }
        }
        return count;
      } catch (error) {
        console.error("Redis invalidate error:", error);
      }
    }

    return count;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    if (this.enabled && this.client) {
      try {
        await this.client.flushdb();
        this.fallbackCache.clear();
        return true;
      } catch (error) {
        console.error("Redis clear error:", error);
        return false;
      }
    }

    this.fallbackCache.clear();
    return true;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: number;
    hits: number;
    misses: number;
  }> {
    if (this.enabled && this.client) {
      try {
        const info = await this.client.info("stats");
        const memoryInfo = await this.client.info("memory");
        const dbSize = await this.client.dbsize();

        // Parse Redis INFO output
        const hitsMatch = info.match(/keyspace_hits:(\d+)/);
        const missesMatch = info.match(/keyspace_misses:(\d+)/);
        const memoryMatch = memoryInfo.match(/used_memory:(\d+)/);

        return {
          keys: dbSize,
          memory: memoryMatch ? parseInt(memoryMatch[1]) : 0,
          hits: hitsMatch ? parseInt(hitsMatch[1]) : 0,
          misses: missesMatch ? parseInt(missesMatch[1]) : 0,
        };
      } catch (error) {
        console.error("Redis stats error:", error);
      }
    }

    return {
      keys: this.fallbackCache.size,
      memory: 0,
      hits: 0,
      misses: 0,
    };
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.enabled = false;
    }
  }
}

export const redisService = new RedisService();
