/**
 * 🚀 REDIS CACHE SERVICE
 *
 * High-performance caching layer for permissions and user data
 * Sub-100ms permission checks with Redis
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { createClient, RedisClientType } from "redis";

// ============================================================================
// TYPES
// ============================================================================

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// ============================================================================
// REDIS CACHE SERVICE
// ============================================================================

class RedisCacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly NAMESPACE = "bluedxp";

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        this.client = createClient({ url: redisUrl }) as RedisClientType;

        this.client.on("error", (err) => {
          console.error("[RedisCache] Redis error:", err);
          this.isConnected = false;
        });

        this.client.on("connect", () => {
          console.log("[RedisCache] Redis connected");
          this.isConnected = true;
        });

        this.client.on("disconnect", () => {
          console.log("[RedisCache] Redis disconnected");
          this.isConnected = false;
        });

        await this.client.connect();
        this.isConnected = true;
      } catch (error) {
        console.error("[RedisCache] Failed to connect to Redis:", error);
        this.isConnected = false;
        // Fallback to in-memory cache if Redis unavailable
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();

      if (!this.client || !this.isConnected) {
        return null;
      }

      const fullKey = this.getFullKey(key);
      const value = await this.client.get(fullKey);

      if (!value) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(value);

      // Check if expired
      if (entry.expiresAt < Date.now()) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error("[RedisCache] Error getting from cache:", error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      await this.ensureConnection();

      if (!this.client || !this.isConnected) {
        return;
      }

      const fullKey = this.getFullKey(key);
      const ttl = options?.ttl || this.DEFAULT_TTL;
      const expiresAt = Date.now() + ttl * 1000;

      const entry: CacheEntry<T> = {
        data: value,
        expiresAt,
      };

      await this.client.setEx(fullKey, ttl, JSON.stringify(entry));
    } catch (error) {
      console.error("[RedisCache] Error setting cache:", error);
    }
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.ensureConnection();

      if (!this.client || !this.isConnected) {
        return;
      }

      const fullKey = this.getFullKey(key);
      await this.client.del(fullKey);
    } catch (error) {
      console.error("[RedisCache] Error deleting from cache:", error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      await this.ensureConnection();

      if (!this.client || !this.isConnected) {
        return;
      }

      const fullPattern = this.getFullKey(pattern);
      const keys = await this.client.keys(fullPattern);

      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error("[RedisCache] Error deleting by pattern:", error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();

      if (!this.client || !this.isConnected) {
        return false;
      }

      const fullKey = this.getFullKey(key);
      const result = await this.client.exists(fullKey);
      return result > 0;
    } catch (error) {
      console.error("[RedisCache] Error checking existence:", error);
      return false;
    }
  }

  /**
   * Increment value
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      await this.ensureConnection();

      if (!this.client || !this.isConnected) {
        return 0;
      }

      const fullKey = this.getFullKey(key);
      return await this.client.incrBy(fullKey, by);
    } catch (error) {
      console.error("[RedisCache] Error incrementing:", error);
      return 0;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate user-related cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.deleteByPattern(`user:${userId}:*`);
    await this.deleteByPattern(`permissions:${userId}:*`);
  }

  /**
   * Invalidate tenant cache
   */
  async invalidateTenantCache(tenantId: string): Promise<void> {
    await this.deleteByPattern(`tenant:${tenantId}:*`);
  }

  /**
   * Warmup cache for user
   */
  async warmupUserCache(
    userId: string,
    data: {
      user?: any;
      permissions?: any[];
      roles?: any[];
    },
  ): Promise<void> {
    if (data.user) {
      await this.set(`user:${userId}`, data.user, { ttl: 1800 }); // 30 minutes
    }
    if (data.permissions) {
      await this.set(`permissions:${userId}`, data.permissions, { ttl: 600 }); // 10 minutes
    }
    if (data.roles) {
      await this.set(`roles:${userId}`, data.roles, { ttl: 1800 }); // 30 minutes
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string;
  }> {
    try {
      await this.ensureConnection();

      if (!this.client || !this.isConnected) {
        return {
          connected: false,
          keys: 0,
          memory: "0B",
        };
      }

      const info = await this.client.info("memory");
      const keyspace = await this.client.info("keyspace");

      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : "0B";

      // Parse keys count
      const dbMatch = keyspace.match(/keys=(\d+)/);
      const keys = dbMatch ? parseInt(dbMatch[1]) : 0;

      return {
        connected: true,
        keys,
        memory,
      };
    } catch (error) {
      console.error("[RedisCache] Error getting stats:", error);
      return {
        connected: false,
        keys: 0,
        memory: "0B",
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  private getFullKey(key: string): string {
    const namespace = process.env.REDIS_NAMESPACE || this.NAMESPACE;
    return `${namespace}:${key}`;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const redisCache = new RedisCacheService();

// Initialize on module load
if (typeof window === "undefined") {
  redisCache.connect().catch(console.error);
}
