/**
 * Unified SLA/KPI Service - Main Export
 *
 * Central export for all SLA/KPI services
 * Single source of truth for all modules
 */

// Core unified service
export { unifiedSlaKpiService } from "./unifiedSlaKpiService";
export type {
  SLAComplianceStatus,
  KPIMeasurement,
  UnifiedSLADashboard,
  UnifiedKPIDashboard,
} from "./unifiedSlaKpiService";

// Module adapters
export { transportationSlaKpiAdapter } from "./moduleAdapters/transportationAdapter";
export { wmsSlaKpiAdapter } from "./moduleAdapters/wmsAdapter";
export { geofenceSlaKpiAdapter } from "./moduleAdapters/geofenceAdapter";

// Migration service
export { slaKpiMigrationService } from "./migrationService";

// Initialization
export {
  initializeUnifiedSlaKpi,
  initializeUnifiedSlaKpiForTenants,
  isInitialized,
  getInitializedTenants,
} from "./initialization";

// Utilities
export * from "./utils";

// Re-export types from main framework
export type {
  SupplyChainSLA,
  SupplyChainKPI,
  SupplyChainSLAComplianceResult,
  SupplyChainKPIResult,
  SupplyChainSLATemplate,
  SupplyChainKPITemplate,
  SupplyChainPartyType,
  SupplyChainServiceCategory,
  TransactionContext,
} from "@/types/supplyChainSLA";
