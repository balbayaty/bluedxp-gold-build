/**
 * Test Helpers
 * Utilities for testing across the platform
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { redisCacheService } from "@/lib/services/cache/redisCache";
import { eventBus } from "@/lib/services/event-bus";

/**
 * Clear all test data
 */
export async function clearTestData(): Promise<void> {
  // Clear database (in test environment)
  if (process.env.NODE_ENV === "test") {
    // Would truncate tables or use transactions
    // await prisma.$executeRaw`TRUNCATE TABLE "Event" CASCADE`
  }

  // Clear cache
  await redisCacheService.clear();
}

/**
 * Create test tenant
 */
export async function createTestTenant(
  tenantId: string = "test-tenant",
): Promise<void> {
  // Would create test tenant data
}

/**
 * Mock event bus
 */
export function mockEventBus(): {
  publishedEvents: any[];
  subscribe: (pattern: string, handler: (event: any) => void) => void;
  publish: (event: any) => Promise<void>;
} {
  const publishedEvents: any[] = [];
  const subscribers: Map<string, Array<(event: any) => void>> = new Map();

  return {
    publishedEvents,
    subscribe: (pattern: string, handler: (event: any) => void) => {
      if (!subscribers.has(pattern)) {
        subscribers.set(pattern, []);
      }
      subscribers.get(pattern)!.push(handler);
    },
    publish: async (event: any) => {
      publishedEvents.push(event);
      // Notify subscribers
      for (const [pattern, handlers] of subscribers.entries()) {
        if (
          pattern === "*" ||
          event.type.startsWith(pattern.replace("*", ""))
        ) {
          handlers.forEach((handler) => handler(event));
        }
      }
    },
  };
}

/**
 * Wait for async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create test user
 */
export function createTestUser(overrides?: any): any {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "ADMIN",
    tenantId: "test-tenant",
    ...overrides,
  };
}
