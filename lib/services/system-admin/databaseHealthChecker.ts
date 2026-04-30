/**
 * Database Health Checker
 *
 * Comprehensive database connection and health monitoring
 * Checks Prisma connection, query performance, and database status
 *
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import {
  dataSourceTracker,
  determineDataSource,
  determineFreshness,
  calculateReliability,
} from "./dataSourceTracker";

export interface DatabaseHealthStatus {
  connected: boolean;
  connectionTime?: number;
  queryPerformance?: {
    avgResponseTime: number;
    testQueryTime: number;
  };
  poolStatus?: {
    active: number;
    idle: number;
    total: number;
  };
  databaseInfo?: {
    name?: string;
    version?: string;
    size?: string;
  };
  error?: string;
  lastChecked: Date;
}

let cachedHealth: DatabaseHealthStatus | null = null;
let lastCheckTime: Date | null = null;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Check database health with caching
 */
export async function checkDatabaseHealth(
  forceRefresh = false,
): Promise<DatabaseHealthStatus> {
  // Return cached result if still valid
  if (
    !forceRefresh &&
    cachedHealth &&
    lastCheckTime &&
    Date.now() - lastCheckTime.getTime() < CACHE_DURATION
  ) {
    return cachedHealth;
  }

  const startTime = Date.now();
  const health: DatabaseHealthStatus = {
    connected: false,
    lastChecked: new Date(),
  };

  try {
    // Dynamic import to avoid issues if Prisma isn't available
    let prisma: any = null;
    try {
      const imported = await import("@/lib/services/database/prismaClient");
      prisma = imported.prisma || imported.default;
    } catch (error) {
      health.error = "Prisma client not available";
      cachedHealth = health;
      lastCheckTime = new Date();
      return health;
    }

    if (!prisma) {
      health.error = "Prisma client is null";
      cachedHealth = health;
      lastCheckTime = new Date();
      return health;
    }

    // Test connection with a simple query
    const connectionStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.connected = true;
      health.connectionTime = Date.now() - connectionStart;
    } catch (error) {
      health.connected = false;
      health.error =
        error instanceof Error ? error.message : "Connection failed";
      cachedHealth = health;
      lastCheckTime = new Date();
      return health;
    }

    // Test query performance
    const queryStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT NOW()`;
      const queryTime = Date.now() - queryStart;
      health.queryPerformance = {
        avgResponseTime: queryTime,
        testQueryTime: queryTime,
      };
    } catch (error) {
      // Query failed but connection might still be ok
      console.warn("Query performance test failed:", error);
    }

    // Try to get database info
    try {
      // PostgreSQL specific
      const dbInfo = await prisma.$queryRaw<
        Array<{ current_database: string; version: string }>
      >`
        SELECT current_database(), version()
      `;
      if (dbInfo && dbInfo.length > 0) {
        health.databaseInfo = {
          name: dbInfo[0].current_database,
          version: dbInfo[0].version,
        };
      }
    } catch (error) {
      // Not PostgreSQL or query failed - that's ok
      console.debug("Database info query not available:", error);
    }

    // Try to get connection pool status (if available)
    try {
      // This is Prisma-specific and may not be available
      const poolStatus = (prisma as any).$metrics?.pool;
      if (poolStatus) {
        health.poolStatus = {
          active: poolStatus.active || 0,
          idle: poolStatus.idle || 0,
          total: (poolStatus.active || 0) + (poolStatus.idle || 0),
        };
      }
    } catch (error) {
      // Pool status not available - that's ok
    }

    const totalTime = Date.now() - startTime;
    health.connectionTime = totalTime;

    // Register service status
    dataSourceTracker.registerService("database", health.connected);

    // Track database health metric
    const isDemoMode =
      process.env.NODE_ENV === "development" ||
      process.env.ENABLE_DEMO_DATA === "true";
    dataSourceTracker.trackMetric("database.health", {
      source: determineDataSource(isDemoMode, health.connected, true),
      freshness: determineFreshness(health.lastChecked),
      lastUpdated: health.lastChecked,
      reliability: calculateReliability(
        determineDataSource(isDemoMode, health.connected, true),
        determineFreshness(health.lastChecked),
        health.connected,
      ),
      notes: health.connected
        ? "Database connected and responding"
        : "Database connection failed",
    });

    cachedHealth = health;
    lastCheckTime = new Date();
    return health;
  } catch (error) {
    health.connected = false;
    health.error = error instanceof Error ? error.message : "Unknown error";
    health.connectionTime = Date.now() - startTime;

    dataSourceTracker.registerService("database", false);
    dataSourceTracker.trackMetric("database.health", {
      source: "fallback",
      freshness: "unknown",
      reliability: 0,
      notes: health.error,
    });

    cachedHealth = health;
    lastCheckTime = new Date();
    return health;
  }
}

/**
 * Get quick database status (cached)
 */
export async function getDatabaseStatus(): Promise<{
  connected: boolean;
  error?: string;
}> {
  const health = await checkDatabaseHealth();
  return {
    connected: health.connected,
    error: health.error,
  };
}

/**
 * Clear health check cache
 */
export function clearHealthCache(): void {
  cachedHealth = null;
  lastCheckTime = null;
}
