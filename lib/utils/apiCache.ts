/**
 * API Caching Utility
 * 
 * Provides request deduplication and caching to reduce redundant API calls
 * and improve performance.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()
  private defaultTTL = 60000 // 1 minute default

  /**
   * Get cached data or fetch if not cached/expired
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.cache.get(key)
    const now = Date.now()

    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data
    }

    // If request is already pending, return the same promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Create new request
    const promise = fetcher()
      .then((data) => {
        // Cache the result
        this.cache.set(key, {
          data,
          timestamp: now,
        })
        // Remove from pending
        this.pendingRequests.delete(key)
        return data
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Cached fetch wrapper
   */
  async fetch(
    url: string,
    options?: RequestInit,
    ttl: number = this.defaultTTL
  ): Promise<any> {
    const cacheKey = `${url}:${JSON.stringify(options)}`
    
    return this.get(
      cacheKey,
      async () => {
        const response = await fetch(url, options)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      },
      ttl
    )
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Singleton instance
export const apiCache = new APICache()

/**
 * Cached fetch function
 */
export async function cachedFetch(
  url: string,
  options?: RequestInit,
  ttl?: number
): Promise<any> {
  return apiCache.fetch(url, options, ttl)
}

/**
 * React hook for cached API calls
 */
export function useCachedFetch<T>(
  url: string | null,
  options?: RequestInit,
  ttl?: number
) {
  const cacheKey = url ? `${url}:${JSON.stringify(options)}` : null

  if (!cacheKey) {
    return { data: null, loading: false, error: null }
  }

  return apiCache.get(
    cacheKey,
    async () => {
      if (!url) throw new Error('URL is required')
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json() as Promise<T>
    },
    ttl
  )
}













