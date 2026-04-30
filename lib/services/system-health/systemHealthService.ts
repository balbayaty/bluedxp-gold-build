/**
 * System Health Service
 *
 * Comprehensive system health monitoring and diagnostics
 * - Infrastructure monitoring (Database, Redis, Docker, etc.)
 * - Module health tracking
 * - Service status checks
 * - Auto-updating health metrics
 * - Integration with Module Manager and Event Bus
 *
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { moduleRegistry } from "@/lib/modules/registry";
import { moduleManager } from "@/lib/modules/manager";
import { createClient as createRedisClient } from "redis";
import { getDatabaseClient } from "@/lib/database/client";
import { eventBus } from "@/lib/services/event-bus";

// ============================================================================
// TYPES
// ============================================================================

export type HealthStatus = "ok" | "degraded" | "down" | "not_configured";

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  details?: string;
  port?: number;
  url?: string;
  lastChecked: Date;
  responseTime?: number;
}

export interface DockerContainer {
  name: string;
  status: string;
  ports: string;
  healthy: boolean;
  uptime?: string;
}

export interface ModuleHealthInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  version: string;
  routes: number;
  components: number;
  dependencies: string[];
  standalone: boolean;
  health?: {
    status: "healthy" | "degraded" | "unhealthy" | "unknown";
    uptime: number;
    lastHealthCheck: Date;
    issues: string[];
    metrics: {
      responseTime: number;
      errorRate: number;
      requestCount: number;
    };
  };
}

export interface SystemHealthStatus {
  timestamp: Date;
  environment: string;
  overallStatus: HealthStatus;
  services: ServiceHealth[];
  modules: ModuleHealthInfo[];
  docker: DockerContainer[];
  environment_vars: Record<string, boolean>;
  summary: {
    totalServices: number;
    healthyServices: number;
    totalModules: number;
    enabledModules: number;
    healthyModules: number;
    totalContainers: number;
    healthyContainers: number;
  };
}

// ============================================================================
// SYSTEM HEALTH SERVICE
// ============================================================================

class SystemHealthService {
  private healthCache: SystemHealthStatus | null = null;
  private cacheExpiry: number = 5000; // 5 seconds cache
  private lastUpdate: number = 0;
  private updateInterval: number = 30000; // 30 seconds default
  private updateTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize auto-updating health monitoring
   */
  async initialize(
    autoUpdate: boolean = true,
    interval: number = 30000,
  ): Promise<void> {
    this.updateInterval = interval;

    if (autoUpdate && typeof window === "undefined") {
      // Server-side auto-update
      this.startAutoUpdate();
    }

    // Initial health check
    await this.getHealthStatus();
  }

  /**
   * Start auto-updating health status
   */
  private startAutoUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      try {
        await this.getHealthStatus(true); // Force refresh
      } catch (error) {
        console.error("[SystemHealth] Auto-update error:", error);
      }
    }, this.updateInterval);
  }

  /**
   * Stop auto-updating
   */
  stopAutoUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      return {
        name: "PostgreSQL Database",
        status: "ok",
        port: 5432,
        url:
          process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@") ||
          "not configured",
        lastChecked: new Date(),
        responseTime,
      };
    } catch (error) {
      return {
        name: "PostgreSQL Database",
        status: "down",
        details: error instanceof Error ? error.message : String(error),
        port: 5432,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<ServiceHealth> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return {
        name: "Redis Cache",
        status: "not_configured",
        details: "REDIS_URL not set",
        lastChecked: new Date(),
      };
    }

    const startTime = Date.now();
    try {
      const client = createRedisClient({ url: redisUrl });
      await client.connect();
      await client.ping();
      const responseTime = Date.now() - startTime;
      await client.disconnect();

      return {
        name: "Redis Cache",
        status: "ok",
        port: 6379,
        url: redisUrl.replace(/:[^:@]+@/, ":****@"),
        lastChecked: new Date(),
        responseTime,
      };
    } catch (error) {
      return {
        name: "Redis Cache",
        status: "down",
        details: error instanceof Error ? error.message : String(error),
        port: 6379,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Check Docker containers
   */
  private async checkDockerContainers(): Promise<DockerContainer[]> {
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      try {
        const { stdout } = await execAsync(
          'docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}"',
          { timeout: 5000 },
        );
        const containers = stdout
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line: string) => {
            const [name, status, ports] = line.split("|");
            return {
              name: name || "unknown",
              status: status || "unknown",
              ports: ports || "none",
              healthy: status?.includes("healthy") || status?.includes("Up"),
              uptime: status?.match(/Up\s+([^)]+)/)?.[1] || undefined,
            };
          })
          .filter((c: any) => c.name.includes("bluedxp"));

        return containers;
      } catch {
        return [];
      }
    } catch {
      return [];
    }
  }

  /**
   * Get module health information
   */
  private async getModuleHealth(): Promise<ModuleHealthInfo[]> {
    try {
      const allModules = moduleRegistry.getAllModules();
      const enabledModules = moduleRegistry.getEnabledModules();

      const moduleHealthPromises = allModules.map(async (module) => {
        let health;
        try {
          health = await moduleManager.getModuleHealth(module.id);
        } catch {
          // Module health check failed, use defaults
          health = undefined;
        }

        return {
          id: module.id,
          name: module.name,
          description: module.description,
          enabled: enabledModules.some((m) => m.id === module.id),
          category: module.category || "other",
          version: module.version || "1.0.0",
          routes: (module.routes || []).length,
          components: (module.components || []).length,
          dependencies: module.dependencies || [],
          standalone: module.standalone ?? true,
          health: health
            ? {
                status: health.status,
                uptime: health.uptime,
                lastHealthCheck: health.lastHealthCheck,
                issues: health.issues,
                metrics: health.metrics,
              }
            : undefined,
        };
      });

      return Promise.all(moduleHealthPromises);
    } catch (error) {
      console.error("[SystemHealth] Error getting module health:", error);
      return [];
    }
  }

  /**
   * Get comprehensive system health status
   */
  async getHealthStatus(
    forceRefresh: boolean = false,
  ): Promise<SystemHealthStatus> {
    const now = Date.now();

    // Return cached if still valid and not forcing refresh
    if (
      !forceRefresh &&
      this.healthCache &&
      now - this.lastUpdate < this.cacheExpiry
    ) {
      return this.healthCache;
    }

    // Check all services in parallel
    const [database, redis, docker, modules] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDockerContainers(),
      this.getModuleHealth(),
    ]);

    const services: ServiceHealth[] = [database, redis];

    // Calculate overall status
    const serviceStatuses = services.map((s) => s.status);
    const hasDown = serviceStatuses.includes("down");
    const hasDegraded =
      serviceStatuses.includes("degraded") ||
      serviceStatuses.includes("not_configured");
    const overallStatus: HealthStatus = hasDown
      ? "down"
      : hasDegraded
        ? "degraded"
        : "ok";

    // Calculate summary
    const enabledModules = modules.filter((m) => m.enabled);
    const healthyModules = modules.filter(
      (m) => m.health?.status === "healthy" || !m.health,
    );
    const healthyServices = services.filter((s) => s.status === "ok").length;
    const healthyContainers = docker.filter((c) => c.healthy).length;

    const status: SystemHealthStatus = {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || "development",
      overallStatus,
      services,
      modules,
      docker,
      environment_vars: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        REDIS_URL: !!process.env.REDIS_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        OPENAI_API_KEY:
          !!process.env.OPENAI_API_KEY ||
          !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        ANTHROPIC_API_KEY:
          !!process.env.ANTHROPIC_API_KEY ||
          !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
        NODE_ENV: !!process.env.NODE_ENV,
        BOOTSTRAP_TENANT_ID: !!process.env.BOOTSTRAP_TENANT_ID,
      },
      summary: {
        totalServices: services.length,
        healthyServices,
        totalModules: modules.length,
        enabledModules: enabledModules.length,
        healthyModules: healthyModules.length,
        totalContainers: docker.length,
        healthyContainers,
      },
    };

    // Cache the result
    this.healthCache = status;
    this.lastUpdate = now;

    // Publish health status event
    if (eventBus) {
      eventBus
        .publish("system.health.updated", {
          status: overallStatus,
          timestamp: status.timestamp,
          summary: status.summary,
        })
        .catch(() => {
          // Ignore event bus errors
        });
    }

    return status;
  }

  /**
   * Get health status for a specific service
   */
  async getServiceHealth(serviceName: string): Promise<ServiceHealth | null> {
    const status = await this.getHealthStatus();
    return status.services.find((s) => s.name === serviceName) || null;
  }

  /**
   * Get health status for a specific module
   */
  async getModuleHealthStatus(
    moduleId: string,
  ): Promise<ModuleHealthInfo | null> {
    const status = await this.getHealthStatus();
    return status.modules.find((m) => m.id === moduleId) || null;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const systemHealthService = new SystemHealthService();

// Initialize on server-side
if (typeof window === "undefined") {
  systemHealthService.initialize(true, 30000).catch(() => {
    // Ignore initialization errors
  });
}
