/**
 * Prisma Client Mock for Client-Side
 * This file is used to replace @prisma/client in client bundles
 * It exports mock objects to satisfy module resolution
 */

// Mock PrismaClient class that can be instantiated
class MockPrismaClient {
  constructor() {
    // Return a proxy that returns empty objects for any property access
    return new Proxy(this, {
      get: () => {
        return () => Promise.resolve(null)
      }
    })
  }
}

// Pure ES module - no CommonJS
export default MockPrismaClient

// Export mock class for named import
export const PrismaClient = MockPrismaClient

// Export empty object for Prisma namespace
export const Prisma = {}

// Export all Prisma types as empty objects (for type-only imports)
export const PrismaClientKnownRequestError = class {}
export const PrismaClientUnknownRequestError = class {}
export const PrismaClientValidationError = class {}
export const PrismaClientInitializationError = class {}

