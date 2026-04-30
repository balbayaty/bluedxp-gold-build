/**
 * Mock Data & Services
 * Centralized mocks for testing
 */

import { PrismaClient } from '@prisma/client'

/**
 * Mock Prisma Client
 */
export const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  tenant: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  warehouse: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  inventory: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  shipment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaClient

/**
 * Mock Redis Client
 */
export const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
} as any

/**
 * Mock Event Bus
 */
export const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
} as any

/**
 * Mock AI Client
 */
export const mockAIClient = {
  chat: jest.fn(),
  vision: jest.fn(),
  embeddings: jest.fn(),
} as any

/**
 * Setup mocks before each test
 */
export function setupMocks() {
  jest.clearAllMocks()
  
  // Default mock implementations
  mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null)
  mockPrisma.tenant.findUnique = jest.fn().mockResolvedValue(null)
  mockRedis.get = jest.fn().mockResolvedValue(null)
  mockRedis.set = jest.fn().mockResolvedValue('OK')
  mockEventBus.publish = jest.fn().mockResolvedValue(undefined)
  mockAIClient.chat = jest.fn().mockResolvedValue({ content: 'Mock response' })
}













