/**
 * Open Data Cache Service
 * Cache open data results to reduce API calls and improve performance
 */

import { DatabaseClient } from "@/lib/database/client";
import { OpenDataCacheSchema } from "@/lib/database/schema";

export class OpenDataCacheService {
  private db: DatabaseClient;
  private memoryCache: Map<string, { data: any; expiresAt: Date }> = new Map();
  private cacheTTL: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(db?: DatabaseClient) {
    // Will be initialized with database client
    this.db = db as any;
  }

  /**
   * Set database client
   */
  setDatabaseClient(db: DatabaseClient): void {
    this.db = db;
  }

  /**
   * Get cached data
   */
  async get(key: string): Promise<any | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expiresAt > new Date()) {
      return memoryEntry.data;
    }

    // Check database cache
    if (this.db) {
      try {
        const query = `
          SELECT * FROM open_data_cache
          WHERE (cas_number = $1 OR chemical_name = $1)
          AND expires_at > NOW()
          ORDER BY cached_at DESC
          LIMIT 1
        `;
        const result = await this.db.query<OpenDataCacheSchema>(query, [key]);

        if (result.length > 0) {
          const cached = result[0];
          // Store in memory cache
          this.memoryCache.set(key, {
            data: cached.data,
            expiresAt: new Date(cached.expiresAt),
          });
          return cached.data;
        }
      } catch (error) {
        console.error("Cache read error:", error);
      }
    }

    return null;
  }

  /**
   * Set cached data
   */
  async set(
    key: string,
    data: any,
    source: string,
    confidence: number = 85,
    ttl?: number,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + (ttl || this.cacheTTL));

    // Store in memory cache
    this.memoryCache.set(key, {
      data,
      expiresAt,
    });

    // Store in database cache
    if (this.db) {
      try {
        const cacheId = `cache-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const isCAS = /^\d+-\d+-\d+$/.test(key);

        const query = `
          INSERT INTO open_data_cache (
            id, cas_number, chemical_name, source, data, confidence, expires_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `;

        await this.db.query(query, [
          cacheId,
          isCAS ? key : null,
          !isCAS ? key : null,
          source,
          JSON.stringify(data),
          confidence,
          expiresAt,
          JSON.stringify({ cachedAt: new Date() }),
        ]);
      } catch (error) {
        console.error("Cache write error:", error);
      }
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<number> {
    let cleared = 0;

    // Clear memory cache
    const now = new Date();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
        cleared++;
      }
    }

    // Clear database cache
    if (this.db) {
      try {
        const query = "DELETE FROM open_data_cache WHERE expires_at <= NOW()";
        await this.db.execute(query);
      } catch (error) {
        console.error("Cache cleanup error:", error);
      }
    }

    return cleared;
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();

    if (this.db) {
      try {
        const query = "DELETE FROM open_data_cache";
        await this.db.execute(query);
      } catch (error) {
        console.error("Cache clear error:", error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryEntries: number;
    databaseEntries?: number;
    totalSize?: number;
  }> {
    const stats = {
      memoryEntries: this.memoryCache.size,
    };

    if (this.db) {
      try {
        const countQuery =
          "SELECT COUNT(*) as total FROM open_data_cache WHERE expires_at > NOW()";
        const countResult = await this.db.query<{ total: number }>(countQuery);
        stats.databaseEntries = countResult[0]?.total || 0;
      } catch (error) {
        console.error("Cache stats error:", error);
      }
    }

    return stats;
  }
}

export const openDataCacheService = new OpenDataCacheService();
