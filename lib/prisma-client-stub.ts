/**
 * Client-side stub for @prisma/client
 * This file replaces @prisma/client imports in client-side bundles.
 * 
 * IMPORTANT: This file should NEVER be used on the server side.
 * Server-side code should import from @prisma/client directly.
 * 
 * This stub prevents webpack from trying to bundle Prisma for the browser,
 * which would fail because Prisma uses Node.js-only modules.
 */

// Pure ES module - no CommonJS require() calls
// Export empty object to satisfy module resolution
// TypeScript types are still available at compile time
export default {}

// Re-export common Prisma types that might be used in type-only imports
// These are compile-time only and won't be in the bundle
export type PrismaClient = never
export type Prisma = never

// Export empty object for default import compatibility
export const PrismaClient = null as any

