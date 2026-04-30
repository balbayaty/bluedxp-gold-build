/**
 * Geofence Module Adapter for Unified SLA/KPI Service
 *
 * Connects Geofence module to unified SLA/KPI service
 * Migrates from geofenceSlaKpiService to unified service
 */

import { unifiedSlaKpiService } from "../unifiedSlaKpiService";
import type {
  GeofenceEvent,
  GeofenceZone,
} from "@/lib/services/geofence/types";
import type {
  SupplyChainSLA,
  SLAComplianceStatus,
} from "../unifiedSlaKpiService";

// ============================================================================
// GEOFENCE SLA/KPI ADAPTER
// ============================================================================

export class GeofenceSlaKpiAdapter {
  /**
   * Check SLA compliance for geofence event
   */
  async checkSLACompliance(
    event: GeofenceEvent,
    zone: GeofenceZone,
    tenantId: string,
  ): Promise<SLAComplianceStatus[]> {
    // Get SLAs for this zone/party
    const zoneMetadata = zone.metadata as any;
    const partyId = zoneMetadata?.partyId || zone.id;
    const partyType = this.mapZoneTypeToPartyType(zone.type);

    const slas = await unifiedSlaKpiService.getSLAsByParty(
      partyType,
      partyId,
      tenantId,
    );
    const results: SLAComplianceStatus[] = [];

    for (const sla of slas) {
      if (
        sla.serviceCategory === "TRANSPORTATION" &&
        (sla.serviceType === "Dwell Time" || sla.name.includes("Dwell"))
      ) {
        const compliance = await unifiedSlaKpiService.calculateSLACompliance(
          sla,
          {
            id: event.shipmentId || event.id,
            startTime: event.timestamp,
            endTime: event.dwellTime
              ? new Date(
                  event.timestamp.getTime() + event.dwellTime * 60 * 1000,
                )
              : new Date(),
          },
          tenantId,
        );

        results.push({
          compliant: compliance.status === "MET",
          status: compliance.status,
          compliancePercentage: compliance.compliancePercentage,
          actualDuration: compliance.actualDuration,
          targetDuration: compliance.targetDuration,
          variance: compliance.actualDuration - compliance.targetDuration,
          variancePercentage:
            ((compliance.actualDuration - compliance.targetDuration) /
              compliance.targetDuration) *
            100,
          remainingTime: Math.max(
            0,
            (compliance.targetDuration - compliance.actualDuration) / 60,
          ),
          riskLevel:
            compliance.status === "BREACH"
              ? "CRITICAL"
              : compliance.status === "CRITICAL"
                ? "HIGH"
                : compliance.status === "WARNING"
                  ? "MEDIUM"
                  : "LOW",
          breachProbability:
            compliance.status === "BREACH"
              ? 1.0
              : compliance.status === "CRITICAL"
                ? 0.8
                : compliance.status === "WARNING"
                  ? 0.5
                  : 0.2,
          recommendations: [],
        });
      }
    }

    return results;
  }

  /**
   * Map geofence zone type to party type
   */
  private mapZoneTypeToPartyType(
    zoneType: GeofenceZone["type"],
  ): "CARRIER" | "WAREHOUSE" | "CUSTOMS_BROKER" {
    switch (zoneType) {
      case "BORDER_ENTRY_POINT":
      case "BORDER_EXIT_POINT":
      case "BORDER_CROSSING_COMPLEX":
      case "CUSTOMS_CLEARANCE_FACILITY":
        return "CUSTOMS_BROKER";
      case "WAREHOUSE":
      case "DRY_PORT":
      case "LOGISTICS_HUB":
        return "WAREHOUSE";
      default:
        return "CARRIER";
    }
  }
}

export const geofenceSlaKpiAdapter = new GeofenceSlaKpiAdapter();
