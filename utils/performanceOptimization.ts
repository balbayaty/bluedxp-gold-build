/**
 * Performance Optimization Utilities
 * 
 * Provides utilities for:
 * - Debouncing
 * - Throttling
 * - Memoization
 * - Virtual scrolling
 * - Lazy loading helpers
 */

// ============================================================================
// DEBOUNCING & THROTTLING
// ============================================================================

/**
 * Debounce function - delays execution until after wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function - limits execution to once per wait time
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, wait)
    }
  }
}

// ============================================================================
// MEMOIZATION
// ============================================================================

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Memoize async function results
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number // Time to live in milliseconds
): T {
  const cache = new Map<string, { result: ReturnType<T>; expires: number }>()

  return ((...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args)

    const cached = cache.get(key)
    if (cached && (!ttl || cached.expires > Date.now())) {
      return cached.result
    }

    const result = func(...args)
    const expires = ttl ? Date.now() + ttl : Infinity
    cache.set(key, { result, expires })

    // Cleanup expired entries periodically
    if (ttl) {
      setTimeout(() => {
        for (const [k, v] of cache.entries()) {
          if (v.expires <= Date.now()) {
            cache.delete(k)
          }
        }
      }, ttl)
    }

    return result
  }) as T
}

// ============================================================================
// VIRTUAL SCROLLING
// ============================================================================

export interface VirtualScrollConfig {
  itemHeight: number
  containerHeight: number
  overscan?: number // Number of items to render outside visible area
}

export interface VirtualScrollResult {
  startIndex: number
  endIndex: number
  totalHeight: number
  offsetY: number
  visibleItems: number[]
}

/**
 * Calculate virtual scroll indices
 */
export function calculateVirtualScroll(
  scrollTop: number,
  totalItems: number,
  config: VirtualScrollConfig
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 3 } = config

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2)

  const totalHeight = totalItems * itemHeight
  const offsetY = startIndex * itemHeight

  const visibleItems: number[] = []
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(i)
  }

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    visibleItems,
  }
}

// ============================================================================
// LAZY LOADING HELPERS
// ============================================================================

/**
 * Intersection Observer for lazy loading
 */
export function createLazyLoader(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): {
  observe: (element: Element) => void
  unobserve: (element: Element) => void
  disconnect: () => void
} {
  if (typeof window === 'undefined') {
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(callback)
  }, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  })

  return {
    observe: (element) => observer.observe(element),
    unobserve: (element) => observer.unobserve(element),
    disconnect: () => observer.disconnect(),
  }
}

/**
 * Load image lazily
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  placeholder?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (placeholder) {
      img.src = placeholder
    }

    const imageLoader = new Image()
    imageLoader.onload = () => {
      img.src = src
      resolve()
    }
    imageLoader.onerror = reject
    imageLoader.src = src
  })
}

// ============================================================================
// CODE SPLITTING HELPERS
// ============================================================================

/**
 * Dynamic import with loading state
 */
export async function dynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent?: React.ComponentType
): Promise<T> {
  try {
    const importedModule = await importFn()
    return importedModule.default
  } catch (error) {
    console.error('Dynamic import failed:', error)
    throw error
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Simple cache with TTL
 */
export class Cache<T> {
  private cache = new Map<string, { value: T; expires: number }>()

  set(key: string, value: T, ttl: number = 60000): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    })
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined

    if (item.expires < Date.now()) {
      this.cache.delete(key)
      return undefined
    }

    return item.value
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        this.cache.delete(key)
      }
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const PerformanceUtils = {
  debounce,
  throttle,
  memoize,
  memoizeAsync,
  calculateVirtualScroll,
  createLazyLoader,
  lazyLoadImage,
  dynamicImport,
  Cache,
}

export default PerformanceUtils


