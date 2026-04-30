/**
 * Redis Usage Examples
 * How to use Redis caching in BlueDXP Platform
 */

import { redisService } from '@/lib/services/cache/redisService'

// Example: Cache a value
export async function cacheValueExample() {
  try {
    // Initialize Redis
    await redisService.initialize()

    // Cache a value with TTL
    await redisService.set(
      'user:123:profile',
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
      },
      {
        ttl: 3600, // 1 hour
        tags: ['user', 'profile', 'tenant_456'],
      }
    )

    console.log('✅ Value cached')
  } catch (error) {
    console.error('❌ Error caching value:', error)
  }
}

// Example: Retrieve cached value
export async function getCachedValueExample(key: string) {
  try {
    const value = await redisService.get(key)
    if (value) {
      console.log('✅ Cache hit:', value)
      return value
    } else {
      console.log('❌ Cache miss')
      return null
    }
  } catch (error) {
    console.error('❌ Error retrieving cache:', error)
    return null
  }
}

// Example: Invalidate cache by tags
export async function invalidateCacheExample() {
  try {
    // Invalidate all user-related cache
    const count = await redisService.invalidateByTags(['user'])
    console.log(`✅ Invalidated ${count} cache entries`)
  } catch (error) {
    console.error('❌ Error invalidating cache:', error)
  }
}

// Example: Get cache statistics
export async function getCacheStatsExample() {
  try {
    const stats = await redisService.getStats()
    console.log('📊 Cache Statistics:', stats)
    return stats
  } catch (error) {
    console.error('❌ Error getting stats:', error)
    return null
  }
}

