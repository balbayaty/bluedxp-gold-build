/**
 * 🚀 TENANT-SCOPED QUERY HELPERS
 *
 * Utilities for ensuring all database queries are tenant-scoped
 * Prevents accidental cross-tenant data access
 *
 * Features:
 * - Automatic tenantId injection
 * - Query validation
 * - Safe query building
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import type { Prisma } from "@prisma/client";

// ============================================================================
// TYPES
// ============================================================================

export type TenantScopedWhere<T = any> = T & {
  tenantId: string;
};

// ============================================================================
// TENANT QUERY HELPERS
// ============================================================================

/**
 * Create tenant-scoped where clause
 */
export function tenantScopedWhere<T = any>(
  tenantId: string,
  additionalWhere?: T,
): TenantScopedWhere<T> {
  if (!tenantId || typeof tenantId !== "string") {
    throw new Error("Valid tenantId is required");
  }

  return {
    tenantId,
    ...(additionalWhere || {}),
  } as TenantScopedWhere<T>;
}

/**
 * Ensure tenant isolation in Prisma query
 */
export function tenantScopedQuery<T = any>(
  tenantId: string,
  baseQuery: {
    where?: T;
    [key: string]: any;
  },
): {
  where: TenantScopedWhere<T>;
  [key: string]: any;
} {
  if (!tenantId || typeof tenantId !== "string") {
    throw new Error("Valid tenantId is required for tenant-scoped queries");
  }

  return {
    ...baseQuery,
    where: tenantScopedWhere(tenantId, baseQuery.where),
  };
}

/**
 * Create tenant-scoped findMany query
 */
export function tenantFindMany<T = any>(
  tenantId: string,
  model: any,
  options?: {
    where?: T;
    include?: any;
    select?: any;
    orderBy?: any;
    take?: number;
    skip?: number;
  },
) {
  return model.findMany(tenantScopedQuery(tenantId, options || {}));
}

/**
 * Create tenant-scoped findUnique query
 */
export function tenantFindUnique<T = any>(
  tenantId: string,
  model: any,
  options: {
    where: T & { id: string };
    include?: any;
    select?: any;
  },
) {
  return model.findFirst({
    ...options,
    where: tenantScopedWhere(tenantId, options.where),
  });
}

/**
 * Create tenant-scoped create query
 */
export function tenantCreate<T = any>(tenantId: string, model: any, data: T) {
  return model.create({
    data: {
      ...data,
      tenantId,
    },
  });
}

/**
 * Create tenant-scoped update query
 */
export function tenantUpdate<T = any>(
  tenantId: string,
  model: any,
  options: {
    where: T & { id: string };
    data: any;
  },
) {
  return model.updateMany({
    where: tenantScopedWhere(tenantId, options.where),
    data: options.data,
  });
}

/**
 * Create tenant-scoped delete query
 */
export function tenantDelete<T = any>(
  tenantId: string,
  model: any,
  where: T & { id: string },
) {
  return model.deleteMany({
    where: tenantScopedWhere(tenantId, where),
  });
}

/**
 * Validate tenant ID matches in query result
 */
export function validateTenantMatch<T extends { tenantId?: string }>(
  result: T | T[] | null,
  expectedTenantId: string,
): boolean {
  if (!result) return true; // Null is valid (not found)

  const items = Array.isArray(result) ? result : [result];

  for (const item of items) {
    if (item.tenantId && item.tenantId !== expectedTenantId) {
      return false;
    }
  }

  return true;
}

/**
 * Filter results by tenant (client-side safety check)
 */
export function filterByTenant<T extends { tenantId?: string }>(
  results: T[],
  tenantId: string,
): T[] {
  return results.filter((item) => !item.tenantId || item.tenantId === tenantId);
}
