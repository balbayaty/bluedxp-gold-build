/**
 * Prisma Client Instance
 * Singleton pattern for database connection management
 * Prevents multiple instances in development with hot reload
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Performance optimizations
    // Disable query logging in production for better performance
    // Connection pooling is handled by the database connection string
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma









