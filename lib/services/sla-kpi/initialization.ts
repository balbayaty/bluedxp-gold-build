/**
 * Unified SLA/KPI Service Initialization
 *
 * Call this during app startup to initialize the unified service
 *
 * Usage:
 *   import { initializeUnifiedSlaKpi } from '@/lib/services/sla-kpi/initialization'
 *   await initializeUnifiedSlaKpi(tenantId)
 */

import { unifiedSlaKpiService } from "./unifiedSlaKpiService";
import { slaKpiMigrationService } from "./migrationService";

let initialized = false;
const initializedTenants = new Set<string>();

/**
 * Initialize unified SLA/KPI service for a tenant
 *
 * @param tenantId - Tenant ID to initialize for
 * @param options - Initialization options
 */
export async function initializeUnifiedSlaKpi(
  tenantId: string = "default",
  options: {
    autoMigrate?: boolean;
    skipMigration?: boolean;
  } = {},
): Promise<void> {
  // Skip if already initialized for this tenant
  if (initializedTenants.has(tenantId)) {
    return;
  }

  try {
    console.log(
      `🔧 Initializing Unified SLA/KPI Service for tenant: ${tenantId}`,
    );

    // Initialize the service
    await unifiedSlaKpiService.initialize(tenantId);

    // Auto-migrate if requested (default: true)
    if (options.autoMigrate !== false && !options.skipMigration) {
      try {
        console.log(`📦 Migrating existing SLAs/KPIs for tenant: ${tenantId}`);
        const migrationResult =
          await slaKpiMigrationService.migrateAll(tenantId);

        if (migrationResult.errors.length > 0) {
          console.warn(
            `⚠️ Migration completed with ${migrationResult.errors.length} errors:`,
            migrationResult.errors,
          );
        } else {
          console.log(
            `✅ Migration completed: ${migrationResult.slasMigrated} SLAs, ${migrationResult.kpisMigrated} KPIs`,
          );
        }
      } catch (error) {
        console.error("❌ Migration failed:", error);
        // Don't throw - service can still work without migration
      }
    }

    initializedTenants.add(tenantId);
    console.log(
      `✅ Unified SLA/KPI Service initialized for tenant: ${tenantId}`,
    );
  } catch (error) {
    console.error(
      `❌ Failed to initialize Unified SLA/KPI Service for tenant ${tenantId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Initialize for multiple tenants
 */
export async function initializeUnifiedSlaKpiForTenants(
  tenantIds: string[],
  options?: Parameters<typeof initializeUnifiedSlaKpi>[1],
): Promise<void> {
  await Promise.all(
    tenantIds.map((tenantId) => initializeUnifiedSlaKpi(tenantId, options)),
  );
}

/**
 * Check if service is initialized for a tenant
 */
export function isInitialized(tenantId: string): boolean {
  return initializedTenants.has(tenantId);
}

/**
 * Get all initialized tenants
 */
export function getInitializedTenants(): string[] {
  return Array.from(initializedTenants);
}
