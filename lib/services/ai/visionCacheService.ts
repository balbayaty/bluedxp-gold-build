/**
 * Vision Analysis Cache Service
 * Caches analysis results for performance optimization
 * Supports intelligent cache invalidation and similarity-based caching
 */

import { VisionAnalysisResult } from "./visionService";
import { EnhancedVisionAnalysis } from "./enhancedVisionService";

// ============================================================================
// TYPES
// ============================================================================

export interface CacheEntry {
  key: string;
  result: VisionAnalysisResult | EnhancedVisionAnalysis;
  timestamp: number;
  imageHash?: string;
  context?: string;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache entries
  ttl: number; // Time to live in milliseconds
  enableSimilarityCache: boolean; // Cache based on image similarity
  similarityThreshold: number; // 0-1, similarity threshold for cache hits
}

// ============================================================================
// VISION CACHE SERVICE
// ============================================================================

class VisionCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultConfig: CacheConfig = {
    maxSize: 1000,
    ttl: 3600000, // 1 hour
    enableSimilarityCache: true,
    similarityThreshold: 0.95,
  };

  /**
   * Get cached result
   */
  get(
    imageHash: string,
    context?: string,
    config?: Partial<CacheConfig>,
  ): (VisionAnalysisResult | EnhancedVisionAnalysis) | null {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // Direct cache lookup
    const key = this.generateCacheKey(imageHash, context);
    const entry = this.cache.get(key);

    if (entry && this.isValid(entry, mergedConfig)) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      return entry.result;
    }

    // Similarity-based cache lookup
    if (mergedConfig.enableSimilarityCache) {
      const similarEntry = this.findSimilarEntry(imageHash, mergedConfig);
      if (similarEntry && this.isValid(similarEntry, mergedConfig)) {
        similarEntry.accessCount++;
        similarEntry.lastAccessed = Date.now();
        return similarEntry.result;
      }
    }

    return null;
  }

  /**
   * Set cache entry
   */
  set(
    imageHash: string,
    result: VisionAnalysisResult | EnhancedVisionAnalysis,
    context?: string,
    config?: Partial<CacheConfig>,
  ): void {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // Check cache size
    if (this.cache.size >= mergedConfig.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const key = this.generateCacheKey(imageHash, context);
    const entry: CacheEntry = {
      key,
      result,
      timestamp: Date.now(),
      imageHash,
      context,
      expiresAt: Date.now() + mergedConfig.ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(imageHash: string, context?: string): string {
    const contextHash = context ? this.hashString(context) : "";
    return `vision:${imageHash}:${contextHash}`;
  }

  /**
   * Hash string for cache key
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry, config: CacheConfig): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * Find similar cache entry
   */
  private findSimilarEntry(
    imageHash: string,
    config: CacheConfig,
  ): CacheEntry | null {
    // In production, would use image similarity comparison
    // For now, return null (would use perceptual hashing or embeddings)
    return null;
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldest: { key: string; lastAccessed: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = { key, lastAccessed: entry.lastAccessed };
      }
    }

    if (oldest) {
      this.cache.delete(oldest.key);
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.defaultConfig.maxSize,
      hitRate: 0, // Would track hits/misses
      oldestEntry:
        entries.length > 0
          ? Math.min(...entries.map((e) => e.timestamp))
          : null,
      newestEntry:
        entries.length > 0
          ? Math.max(...entries.map((e) => e.timestamp))
          : null,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const visionCacheService = new VisionCacheService();
export default visionCacheService;
