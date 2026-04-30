/**
 * Service Guard Utility
 * 
 * Prevents services from being imported in client components.
 * This ensures Prisma and other server-only code stays on the server.
 */

/**
 * Throws an error if code is running on the client
 * Use this at the top of service files to prevent client-side usage
 */
export function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'This service can only be used on the server. ' +
      'Use server actions or API routes instead.'
    )
  }
}

/**
 * Type guard to check if code is running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Wraps a service method to ensure it only runs on server
 */
export function serverOnly<T extends (...args: any[]) => any>(
  fn: T
): T {
  return ((...args: Parameters<T>) => {
    assertServerOnly()
    return fn(...args)
  }) as T
}





