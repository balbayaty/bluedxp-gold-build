/**
 * SLA/KPI Migration Service
 *
 * Migrates existing module-specific SLA/KPI services to unified service
 * Removes duplications and consolidates to single source of truth
 */

import { unifiedSlaKpiService } from "./unifiedSlaKpiService";
import { geofenceSlaKpiService } from "@/lib/services/geofence/sla-kpi/geofenceSlaKpiService";
import { wmsSlaKpiService } from "@/lib/services/process-lifecycle/wms/wmsSlaKpiService";
import type { SupplyChainSLA, SupplyChainKPI } from "@/types/supplyChainSLA";

// ============================================================================
// MIGRATION SERVICE
// ============================================================================

export class SlaKpiMigrationService {
  /**
   * Migrate all existing SLAs/KPIs to unified service
   */
  async migrateAll(tenantId: string): Promise<{
    slasMigrated: number;
    kpisMigrated: number;
    errors: Array<{ source: string; error: string }>;
  }> {
    const errors: Array<{ source: string; error: string }> = [];
    let slasMigrated = 0;
    let kpisMigrated = 0;

    // Migrate Geofence SLAs/KPIs
    try {
      const geofenceResult = await this.migrateGeofence(tenantId);
      slasMigrated += geofenceResult.slas;
      kpisMigrated += geofenceResult.kpis;
    } catch (error) {
      errors.push({
        source: "geofence",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Migrate WMS SLAs/KPIs
    try {
      const wmsResult = await this.migrateWMS(tenantId);
      slasMigrated += wmsResult.slas;
      kpisMigrated += wmsResult.kpis;
    } catch (error) {
      errors.push({
        source: "wms",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // TODO: Migrate other modules as needed

    return {
      slasMigrated,
      kpisMigrated,
      errors,
    };
  }

  /**
   * Migrate Geofence SLAs/KPIs
   */
  private async migrateGeofence(
    tenantId: string,
  ): Promise<{ slas: number; kpis: number }> {
    let slas = 0;
    let kpis = 0;

    // Get existing geofence SLAs
    const geofenceSLAs = (geofenceSlaKpiService as any).slas || new Map();

    for (const [slaId, geofenceSLA] of geofenceSLAs.entries()) {
      try {
        // Convert to unified SLA format
        const unifiedSLA: Omit<
          SupplyChainSLA,
          "id" | "createdAt" | "updatedAt"
        > = {
          name: geofenceSLA.name,
          description: geofenceSLA.description,
          partyType: "CARRIER", // Geofence zones are typically for carriers
          partyId: geofenceSLA.zoneId || "unknown",
          partyName: geofenceSLA.name,
          partyRole: "PROVIDER",
          serviceCategory: "TRANSPORTATION",
          serviceType: this.mapGeofenceZoneTypeToServiceType(
            geofenceSLA.zoneType,
          ),
          targetDuration: geofenceSLA.targetDwellTime || 0,
          warningThreshold: 80,
          criticalThreshold: 100,
          metric: "duration",
          responsibleParty: "CARRIER",
          responsiblePartyId: geofenceSLA.zoneId || "unknown",
          isActive: geofenceSLA.isActive !== false,
          isTemplate: false,
        };

        await unifiedSlaKpiService.createSLA(unifiedSLA, tenantId);
        slas++;
      } catch (error) {
        console.warn(`Failed to migrate geofence SLA ${slaId}:`, error);
      }
    }

    // Get existing geofence KPIs
    const geofenceKPIs = (geofenceSlaKpiService as any).kpis || new Map();

    for (const [kpiId, geofenceKPI] of geofenceKPIs.entries()) {
      try {
        const unifiedKPI: Omit<
          SupplyChainKPI,
          "id" | "createdAt" | "updatedAt"
        > = {
          name: geofenceKPI.name,
          description: geofenceKPI.description,
          partyType: "CARRIER",
          partyId: geofenceKPI.zoneId || "unknown",
          partyName: geofenceKPI.name,
          partyRole: "PROVIDER",
          formula: geofenceKPI.formula,
          target: Number(geofenceKPI.target),
          unit: geofenceKPI.unit,
          category: this.mapGeofenceKPICategory(geofenceKPI.category),
          calculationMethod: "REAL_TIME",
          responsibleParty: "CARRIER",
          responsiblePartyId: geofenceKPI.zoneId || "unknown",
          isActive: geofenceKPI.isActive !== false,
          isTemplate: false,
        };

        await unifiedSlaKpiService.createKPI(unifiedKPI, tenantId);
        kpis++;
      } catch (error) {
        console.warn(`Failed to migrate geofence KPI ${kpiId}:`, error);
      }
    }

    return { slas, kpis };
  }

  /**
   * Migrate WMS SLAs/KPIs
   */
  private async migrateWMS(
    tenantId: string,
  ): Promise<{ slas: number; kpis: number }> {
    let slas = 0;
    let kpis = 0;

    // WMS uses lifecycle-based SLAs, convert to unified format
    // TODO: Get WMS SLA metrics and convert

    // Get WMS KPIs
    try {
      const wmsKPIs = await wmsSlaKpiService.getKpis();

      for (const wmsKPI of wmsKPIs) {
        try {
          const unifiedKPI: Omit<
            SupplyChainKPI,
            "id" | "createdAt" | "updatedAt"
          > = {
            name: wmsKPI.name,
            description: wmsKPI.description || "",
            partyType: "WAREHOUSE",
            partyId: "default", // TODO: Get actual warehouse ID
            partyName: "Warehouse",
            partyRole: "PROVIDER",
            formula: this.mapWMSKPIFormula(wmsKPI.id),
            target: wmsKPI.target,
            unit: wmsKPI.unit,
            category: this.mapWMSKPICategory(wmsKPI.category),
            calculationMethod: "BATCH",
            calculationFrequency: wmsKPI.period.toUpperCase(),
            responsibleParty: "WAREHOUSE",
            responsiblePartyId: "default",
            isActive: wmsKPI.status !== "below_target",
            isTemplate: false,
          };

          await unifiedSlaKpiService.createKPI(unifiedKPI, tenantId);
          kpis++;
        } catch (error) {
          console.warn(`Failed to migrate WMS KPI ${wmsKPI.id}:`, error);
        }
      }
    } catch (error) {
      console.warn("Error migrating WMS KPIs:", error);
    }

    return { slas, kpis };
  }

  /**
   * Map geofence zone type to service type
   */
  private mapGeofenceZoneTypeToServiceType(zoneType: string): string {
    switch (zoneType) {
      case "BORDER_ENTRY_POINT":
      case "BORDER_EXIT_POINT":
      case "BORDER_CROSSING_COMPLEX":
        return "Border Crossing Time";
      case "CUSTOMS_CLEARANCE_FACILITY":
        return "Customs Clearance Time";
      default:
        return "Dwell Time";
    }
  }

  /**
   * Map geofence KPI category
   */
  private mapGeofenceKPICategory(
    category: string,
  ):
    | "performance"
    | "efficiency"
    | "compliance"
    | "quality"
    | "cost"
    | "sustainability"
    | "custom" {
    switch (category.toLowerCase()) {
      case "performance":
        return "performance";
      case "efficiency":
        return "efficiency";
      case "compliance":
        return "compliance";
      case "quality":
        return "quality";
      case "cost":
        return "cost";
      default:
        return "custom";
    }
  }

  /**
   * Map WMS KPI formula
   */
  private mapWMSKPIFormula(kpiId: string): string {
    const formulas: Record<string, string> = {
      picking_efficiency: "(correctPicks / totalPicks) * 100",
      putaway_efficiency: "(successfulPutaways / totalPutaways) * 100",
      asn_processing_time: "AVG(processingTime)",
      picking_accuracy: "(correctPicks / totalPicks) * 100",
      cycle_count_accuracy: "(accurateCounts / totalCounts) * 100",
    };
    return formulas[kpiId] || "count(events)";
  }

  /**
   * Map WMS KPI category
   */
  private mapWMSKPICategory(
    category: string,
  ):
    | "performance"
    | "efficiency"
    | "compliance"
    | "quality"
    | "cost"
    | "sustainability"
    | "custom" {
    switch (category.toLowerCase()) {
      case "efficiency":
        return "efficiency";
      case "accuracy":
        return "quality";
      case "speed":
        return "performance";
      case "quality":
        return "quality";
      case "cost":
        return "cost";
      default:
        return "performance";
    }
  }
}

export const slaKpiMigrationService = new SlaKpiMigrationService();
