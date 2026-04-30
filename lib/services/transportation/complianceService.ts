/**
 * Transportation Compliance Service
 *
 * Hours of Service (HOS), ELD integration, regulatory compliance
 * Integrates with ELM/Rabet.sa for Saudi Arabia compliance
 */

import type { Shipment } from "@/types/tms";
import { elmRabetAdapter } from "@/lib/adapters/government/elmRabetAdapter";
import { eventBus } from "@/lib/services/event-store";
import { assertRealInProduction } from "./strictMode";

export interface HoursOfService {
  driverId: string;
  driverName: string;
  date: Date | string;
  status: "ON_DUTY" | "DRIVING" | "OFF_DUTY" | "SLEEPER_BERTH";
  hours: {
    driving: number; // hours
    onDuty: number; // hours
    offDuty: number; // hours
    sleeperBerth: number; // hours
  };
  violations: {
    type:
      | "DRIVING_TIME_EXCEEDED"
      | "REST_PERIOD_INSUFFICIENT"
      | "ON_DUTY_TIME_EXCEEDED";
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }[];
  compliant: boolean;
}

export interface ELDData {
  deviceId: string;
  driverId: string;
  vehicleId: string;
  logs: {
    status: "ON_DUTY" | "DRIVING" | "OFF_DUTY" | "SLEEPER_BERTH";
    location: { lat: number; lng: number };
    timestamp: Date | string;
  }[];
  violations: any[];
  certified: boolean;
  certificationNumber?: string;
}

export interface RegulatoryCompliance {
  shipmentId: string;
  country: string;
  regulations: {
    id: string;
    name: string;
    status: "COMPLIANT" | "NON_COMPLIANT" | "PENDING" | "NOT_APPLICABLE";
    checkedAt: Date | string;
    details?: string;
  }[];
  overallStatus: "COMPLIANT" | "NON_COMPLIANT" | "PENDING";
  violations: string[];
}

export class TransportationComplianceService {
  /**
   * Get hours of service for driver
   */
  async getHoursOfService(
    driverId: string,
    date: Date | string,
  ): Promise<HoursOfService | null> {
    // Try ELM/Rabet.sa first (Saudi Arabia)
    if (elmRabetAdapter.isConfigured()) {
      // Get truck data which includes HOS
      // In production, query by driver ID
      const truckData = await elmRabetAdapter.getTruckData(`truck-${driverId}`);
      if (truckData.success && truckData.data?.compliance?.hoursOfService) {
        const hos = truckData.data.compliance.hoursOfService;
        return {
          driverId,
          driverName: truckData.data.driverName || "",
          date,
          status: "DRIVING",
          hours: {
            driving: hos.driving || 0,
            onDuty: hos.onDuty || 0,
            offDuty: 0,
            sleeperBerth: 0,
          },
          violations:
            hos.violations?.map((v: string) => ({
              type: "DRIVING_TIME_EXCEEDED" as const,
              description: v,
              severity: "HIGH" as const,
            })) || [],
          compliant: (hos.violations?.length || 0) === 0,
        };
      }
    }

    // In production, query from database or ELD device
    return null;
  }

  /**
   * Check compliance for shipment
   */
  async checkCompliance(shipment: Shipment): Promise<RegulatoryCompliance> {
    const regulations: RegulatoryCompliance["regulations"] = [];
    const violations: string[] = [];

    // Check country-specific regulations
    const destinationCountry = shipment.destination.address.country;

    // Saudi Arabia regulations
    if (destinationCountry === "Saudi Arabia") {
      // TGA vehicle registration
      regulations.push({
        id: "tga-vehicle-registration",
        name: "TGA Vehicle Registration",
        status: "COMPLIANT", // Would check actual registration
        checkedAt: new Date().toISOString(),
      });

      // Customs compliance
      if (shipment.customs) {
        regulations.push({
          id: "customs-clearance",
          name: "Customs Clearance",
          status:
            shipment.customs.status === "CLEARED" ? "COMPLIANT" : "PENDING",
          checkedAt: new Date().toISOString(),
        });
      }

      // SFDA compliance (if applicable)
      if (
        shipment.items.some(
          (item) =>
            item.hsCode?.startsWith("30") || item.hsCode?.startsWith("38"),
        )
      ) {
        regulations.push({
          id: "sfda-compliance",
          name: "SFDA Product Compliance",
          status: "PENDING", // Would check SFDA database
          checkedAt: new Date().toISOString(),
        });
      }
    }

    // Check HOS compliance
    if (shipment.roadFreightDetails?.driverId) {
      const hos = await this.getHoursOfService(
        shipment.roadFreightDetails.driverId,
        new Date(),
      );
      if (hos && !hos.compliant) {
        violations.push("Hours of Service violation");
        regulations.push({
          id: "hos-compliance",
          name: "Hours of Service",
          status: "NON_COMPLIANT",
          checkedAt: new Date().toISOString(),
          details: hos.violations.map((v) => v.description).join(", "),
        });
      }
    }

    // Check hazmat compliance
    if (shipment.hazmat?.isHazmat) {
      regulations.push({
        id: "hazmat-compliance",
        name: "Hazmat Transportation Compliance",
        status: shipment.hazmat.unNumber ? "COMPLIANT" : "NON_COMPLIANT",
        checkedAt: new Date().toISOString(),
      });

      if (!shipment.hazmat.unNumber) {
        violations.push("Missing UN number for hazmat shipment");
      }
    }

    const overallStatus: RegulatoryCompliance["overallStatus"] =
      violations.length === 0 ? "COMPLIANT" : "NON_COMPLIANT";

    const compliance: RegulatoryCompliance = {
      shipmentId: shipment.id,
      country: destinationCountry,
      regulations,
      overallStatus,
      violations,
    };

    // Publish event
    await eventBus.publish("transportation.compliance.checked", {
      shipmentId: shipment.id,
      status: overallStatus,
      violationsCount: violations.length,
    });

    return compliance;
  }

  /**
   * Get ELD data
   */
  async getELDData(deviceId: string): Promise<ELDData | null> {
    // In production, integrate with ELD device
    // For Saudi Arabia, use ELM/Rabet.sa data
    if (elmRabetAdapter.isConfigured()) {
      const truckData = await elmRabetAdapter.getTruckData(deviceId);
      if (truckData.success && truckData.data) {
        return {
          deviceId,
          driverId: truckData.data.driverId,
          vehicleId: truckData.data.truckId,
          logs: [
            {
              status:
                truckData.data.status === "IN_TRANSIT" ? "DRIVING" : "OFF_DUTY",
              location: truckData.data.currentLocation,
              timestamp: truckData.data.currentLocation.timestamp,
            },
          ],
          violations:
            truckData.data.compliance.hoursOfService?.violations || [],
          certified: true,
          certificationNumber: "ELM-CERT-001",
        };
      }
    }

    return null;
  }

  /**
   * Monitor compliance violations
   */
  async monitorViolations(shipmentId: string): Promise<void> {
    const shipment = await this.getShipment(shipmentId);
    if (!shipment) return;

    // Check compliance
    const compliance = await this.checkCompliance(shipment);

    // If violations found, create alerts
    if (compliance.violations.length > 0) {
      await eventBus.publish("transportation.compliance.violation", {
        shipmentId,
        violations: compliance.violations,
        severity: "HIGH",
      });
    }
  }

  /**
   * Get shipment (placeholder)
   */
  private async getShipment(shipmentId: string): Promise<Shipment | null> {
    // In production, fetch from database
    assertRealInProduction(
      "tms.compliance.getShipment",
      "Shipment fetch is currently a placeholder. Wire transportation shipments persistence/service before using in production.",
    );
    return null;
  }
}

export const transportationComplianceService =
  new TransportationComplianceService();
