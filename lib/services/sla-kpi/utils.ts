/**
 * Unified SLA/KPI Service Utilities
 *
 * Helper functions for common operations
 */

import { unifiedSlaKpiService } from "./unifiedSlaKpiService";
import type {
  SupplyChainSLA,
  SupplyChainKPI,
  SupplyChainPartyType,
  SupplyChainServiceCategory,
} from "@/types/supplyChainSLA";

// ============================================================================
// SLA UTILITIES
// ============================================================================

/**
 * Get all active SLAs for a party
 */
export async function getActiveSLAsForParty(
  partyType: SupplyChainPartyType,
  partyId: string,
  tenantId: string,
): Promise<SupplyChainSLA[]> {
  const slas = await unifiedSlaKpiService.getSLAsByParty(
    partyType,
    partyId,
    tenantId,
  );
  return slas.filter((sla) => sla.isActive);
}

/**
 * Get SLAs by service category
 */
export async function getSLAsByCategory(
  category: SupplyChainServiceCategory,
  tenantId: string,
): Promise<SupplyChainSLA[]> {
  return await unifiedSlaKpiService.getSLAsByServiceCategory(
    category,
    tenantId,
  );
}

/**
 * Check if SLA is compliant
 */
export function isSLACompliant(status: string): boolean {
  return status === "MET";
}

/**
 * Get SLA status color
 */
export function getSLAStatusColor(status: string): string {
  switch (status) {
    case "MET":
      return "green";
    case "WARNING":
      return "yellow";
    case "CRITICAL":
      return "orange";
    case "BREACH":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Format duration in seconds to human-readable
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  } else if (seconds < 86400) {
    return `${Math.round(seconds / 3600)}h`;
  } else {
    return `${Math.round(seconds / 86400)}d`;
  }
}

/**
 * Calculate compliance percentage
 */
export function calculateCompliancePercentage(
  actualDuration: number,
  targetDuration: number,
): number {
  if (targetDuration === 0) return 100;
  return Math.min(100, (targetDuration / actualDuration) * 100);
}

// ============================================================================
// KPI UTILITIES
// ============================================================================

/**
 * Get all active KPIs for a party
 */
export async function getActiveKPIsForParty(
  partyType: SupplyChainPartyType,
  partyId: string,
  tenantId: string,
): Promise<SupplyChainKPI[]> {
  const allKPIs = Array.from(
    (unifiedSlaKpiService as any).kpiCache?.values() || [],
  );
  return allKPIs.filter(
    (kpi) =>
      kpi.partyType === partyType && kpi.partyId === partyId && kpi.isActive,
  );
}

/**
 * Check if KPI is on target
 */
export function isKPIOnTarget(status: string): boolean {
  return status === "MET";
}

/**
 * Get KPI status color
 */
export function getKPIStatusColor(status: string): string {
  switch (status) {
    case "MET":
      return "green";
    case "WARNING":
      return "yellow";
    case "CRITICAL":
      return "orange";
    case "BELOW_TARGET":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Calculate KPI performance vs target
 */
export function calculateKPIPerformance(
  value: number,
  target: number,
): {
  percentage: number;
  status: "MET" | "WARNING" | "CRITICAL" | "BELOW_TARGET";
} {
  if (target === 0) {
    return { percentage: 0, status: "BELOW_TARGET" };
  }

  const percentage = (value / target) * 100;

  let status: "MET" | "WARNING" | "CRITICAL" | "BELOW_TARGET" = "MET";
  if (percentage < 90) {
    status = "CRITICAL";
  } else if (percentage < 95) {
    status = "WARNING";
  } else if (percentage < 100) {
    status = "BELOW_TARGET";
  }

  return { percentage, status };
}

/**
 * Format KPI value with unit
 */
export function formatKPIValue(value: number, unit: string): string {
  if (unit === "percentage") {
    return `${value.toFixed(2)}%`;
  } else if (unit === "currency") {
    return `$${value.toFixed(2)}`;
  } else if (unit === "count") {
    return Math.round(value).toString();
  } else {
    return `${value.toFixed(2)} ${unit}`;
  }
}

// ============================================================================
// DASHBOARD UTILITIES
// ============================================================================

/**
 * Get overall compliance rate
 */
export async function getOverallComplianceRate(
  tenantId: string,
): Promise<number> {
  const dashboard = await unifiedSlaKpiService.getSLADashboard(tenantId);
  return dashboard.overallCompliance;
}

/**
 * Get overall KPI performance
 */
export async function getOverallKPIPerformance(
  tenantId: string,
): Promise<number> {
  const dashboard = await unifiedSlaKpiService.getKPIDashboard(tenantId);
  return dashboard.overallPerformance;
}

/**
 * Get breach count
 */
export async function getBreachCount(tenantId: string): Promise<number> {
  const dashboard = await unifiedSlaKpiService.getSLADashboard(tenantId);
  return dashboard.breachedSLAs;
}

/**
 * Get at-risk SLA count
 */
export async function getAtRiskCount(tenantId: string): Promise<number> {
  const dashboard = await unifiedSlaKpiService.getSLADashboard(tenantId);
  return dashboard.atRiskSLAs;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate SLA data
 */
export function validateSLAData(sla: Partial<SupplyChainSLA>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!sla.name || sla.name.trim().length === 0) {
    errors.push("SLA name is required");
  }

  if (!sla.partyType) {
    errors.push("Party type is required");
  }

  if (!sla.partyId) {
    errors.push("Party ID is required");
  }

  if (!sla.serviceCategory) {
    errors.push("Service category is required");
  }

  if (sla.targetDuration === undefined || sla.targetDuration <= 0) {
    errors.push("Target duration must be greater than 0");
  }

  if (
    sla.warningThreshold === undefined ||
    sla.warningThreshold < 0 ||
    sla.warningThreshold > 100
  ) {
    errors.push("Warning threshold must be between 0 and 100");
  }

  if (
    sla.criticalThreshold === undefined ||
    sla.criticalThreshold < 0 ||
    sla.criticalThreshold > 100
  ) {
    errors.push("Critical threshold must be between 0 and 100");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate KPI data
 */
export function validateKPIData(kpi: Partial<SupplyChainKPI>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!kpi.name || kpi.name.trim().length === 0) {
    errors.push("KPI name is required");
  }

  if (!kpi.partyType) {
    errors.push("Party type is required");
  }

  if (!kpi.partyId) {
    errors.push("Party ID is required");
  }

  if (!kpi.formula || kpi.formula.trim().length === 0) {
    errors.push("Formula is required");
  }

  if (kpi.target === undefined || kpi.target <= 0) {
    errors.push("Target must be greater than 0");
  }

  if (!kpi.unit || kpi.unit.trim().length === 0) {
    errors.push("Unit is required");
  }

  if (!kpi.category) {
    errors.push("Category is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
