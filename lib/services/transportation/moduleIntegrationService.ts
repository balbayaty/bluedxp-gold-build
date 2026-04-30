/**
 * Transportation Module Integration Service
 *
 * Integrates transportation module with:
 * - Compliance Module
 * - SLA Module
 * - WMS Module
 * - ISO-IMS Module
 * - Trade Compliance Module
 * - Other platform modules
 *
 * 4IR & 5IR Aligned - Complete Ecosystem Integration
 */

import type { Shipment, Location } from "@/types/tms";
import type { IntelligentRoutePlan } from "./intelligentRoutePlanningService";
import type { EnhancedTransitTimeCalculation } from "./enhancedTransitTimeCalculator";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";
import { transportationDatabaseAdapterInstance } from "./database/transportationDatabaseAdapter";

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceIntegration {
  // Validate shipment compliance
  validateCompliance(shipment: Shipment): Promise<ComplianceValidation>;

  // Get compliance requirements for route
  getRouteComplianceRequirements(
    routePlan: IntelligentRoutePlan,
  ): Promise<ComplianceRequirement[]>;

  // Check regulatory compliance
  checkRegulatoryCompliance(
    shipment: Shipment,
    routePlan: IntelligentRoutePlan,
  ): Promise<RegulatoryCompliance>;
}

export interface SLAIntegration {
  // Get SLA requirements for shipment
  getSLARequirements(shipmentId: string): Promise<SLARequirement[]>;

  // Check SLA compliance
  checkSLACompliance(
    shipmentId: string,
    transitTime: EnhancedTransitTimeCalculation,
  ): Promise<SLAComplianceStatus>;

  // Calculate SLA risk
  calculateSLARisk(
    shipmentId: string,
    routePlan: IntelligentRoutePlan,
  ): Promise<SLARisk>;
}

export interface WMSIntegration {
  // Get warehouse availability
  getWarehouseAvailability(
    warehouseId: string,
    date: Date,
  ): Promise<WarehouseAvailability>;

  // Reserve warehouse slot
  reserveWarehouseSlot(
    warehouseId: string,
    shipmentId: string,
    date: Date,
  ): Promise<boolean>;

  // Get warehouse constraints
  getWarehouseConstraints(warehouseId: string): Promise<WarehouseConstraint[]>;
}

export interface ISOIMSIntegration {
  // Create NCR from transportation issue
  createNCRFromTransportationIssue(issue: TransportationIssue): Promise<string>; // NCR ID

  // Link shipment to quality record
  linkShipmentToQualityRecord(
    shipmentId: string,
    qualityRecordId: string,
  ): Promise<void>;

  // Get quality requirements
  getQualityRequirements(shipmentId: string): Promise<QualityRequirement[]>;
}

export interface TradeComplianceIntegration {
  // Validate trade compliance
  validateTradeCompliance(
    shipment: Shipment,
    routePlan: IntelligentRoutePlan,
  ): Promise<TradeComplianceStatus>;

  // Get trade program recommendations
  getTradeProgramRecommendations(
    shipment: Shipment,
  ): Promise<TradeProgramRecommendation[]>;

  // Check customs requirements
  getCustomsRequirements(
    origin: Location,
    destination: Location,
  ): Promise<CustomsRequirement[]>;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface ComplianceValidation {
  compliant: boolean;
  violations: ComplianceViolation[];
  requirements: ComplianceRequirement[];
  recommendations: string[];
}

export interface ComplianceViolation {
  type: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  resolution: string;
}

export interface ComplianceRequirement {
  type: "DOCUMENT" | "PERMIT" | "CERTIFICATE" | "INSPECTION" | "PAYMENT";
  description: string;
  required: boolean;
  status: "MISSING" | "PENDING" | "COMPLETE";
  authority: string;
}

export interface RegulatoryCompliance {
  compliant: boolean;
  regulations: Array<{
    authority: string;
    regulation: string;
    compliant: boolean;
    notes?: string;
  }>;
}

export interface SLARequirement {
  id: string;
  name: string;
  targetDuration: number; // hours
  warningThreshold: number; // percentage
  criticalThreshold: number; // percentage
  metric: "TRANSIT_TIME" | "PROCESSING_TIME" | "DELIVERY_TIME";
}

export interface SLAComplianceStatus {
  compliant: boolean;
  requirements: Array<{
    requirement: SLARequirement;
    status: "COMPLIANT" | "WARNING" | "CRITICAL" | "VIOLATED";
    actualValue: number;
    targetValue: number;
    remainingTime?: number; // minutes
  }>;
  overallStatus: "COMPLIANT" | "AT_RISK" | "VIOLATED";
}

export interface SLARisk {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactors: string[];
  probability: number; // 0-1
  recommendations: string[];
}

export interface WarehouseAvailability {
  available: boolean;
  availableSlots: number;
  earliestAvailableDate?: Date;
  constraints: WarehouseConstraint[];
}

export interface WarehouseConstraint {
  type: "CAPACITY" | "OPERATING_HOURS" | "RESTRICTION";
  description: string;
  impact: string;
}

export interface TransportationIssue {
  type: "DELAY" | "DAMAGE" | "LOSS" | "COMPLIANCE" | "OTHER";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  shipmentId: string;
  location?: Location;
}

export interface QualityRequirement {
  type: string;
  description: string;
  required: boolean;
}

export interface TradeComplianceStatus {
  compliant: boolean;
  violations: string[];
  requirements: CustomsRequirement[];
}

export interface TradeProgramRecommendation {
  programId: string;
  programName: string;
  benefit: string;
  eligibility: boolean;
}

export interface CustomsRequirement {
  type: "DOCUMENT" | "DECLARATION" | "INSPECTION" | "PAYMENT";
  description: string;
  required: boolean;
  authority: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class ModuleIntegrationService {
  /**
   * Integrate with Compliance Module
   */
  async integrateWithCompliance(
    shipment: Shipment,
    routePlan: IntelligentRoutePlan,
  ): Promise<ComplianceIntegration> {
    return {
      async validateCompliance(
        shipment: Shipment,
      ): Promise<ComplianceValidation> {
        // In production, would call compliance service
        return {
          compliant: true,
          violations: [],
          requirements: [],
          recommendations: [],
        };
      },

      async getRouteComplianceRequirements(
        routePlan: IntelligentRoutePlan,
      ): Promise<ComplianceRequirement[]> {
        const requirements: ComplianceRequirement[] = [];

        // Extract requirements from constraints
        for (const constraint of routePlan.constraints) {
          if (constraint.authority) {
            requirements.push({
              type: "PERMIT",
              description: `${constraint.authority.name} requirement: ${constraint.description}`,
              required: true,
              status: "PENDING",
              authority: constraint.authority.name,
            });
          }
        }

        return requirements;
      },

      async checkRegulatoryCompliance(
        shipment: Shipment,
        routePlan: IntelligentRoutePlan,
      ): Promise<RegulatoryCompliance> {
        // In production, would call compliance service
        return {
          compliant: true,
          regulations: [],
        };
      },
    };
  }

  /**
   * Integrate with SLA Module
   * Now uses unified SLA/KPI service via adapter
   */
  async integrateWithSLA(
    shipmentId: string,
    routePlan: IntelligentRoutePlan,
    transitTime: EnhancedTransitTimeCalculation,
    tenantId: string = "default",
  ): Promise<SLAIntegration> {
    // Import unified service adapter
    const { transportationSlaKpiAdapter } =
      await import("@/lib/services/sla-kpi");

    // Get shipment to extract carrier ID
    const shipment = await this.getShipment(shipmentId, tenantId).catch(
      () => null,
    );
    const carrierId = shipment?.carrierId || "unknown";

    return {
      async getSLARequirements(shipmentId: string): Promise<SLARequirement[]> {
        // Use unified service via adapter
        const slas = await transportationSlaKpiAdapter.getSLARequirements(
          shipmentId,
          carrierId,
          tenantId,
        );

        // Convert to legacy format for backward compatibility
        return slas.map((sla) => ({
          id: sla.id,
          name: sla.name,
          targetDuration: sla.targetDuration / 3600, // Convert seconds to hours
          warningThreshold: sla.warningThreshold,
          criticalThreshold: sla.criticalThreshold,
          metric:
            sla.serviceType === "On-Time Delivery"
              ? "TRANSIT_TIME"
              : ("PROCESSING_TIME" as any),
        }));
      },

      async checkSLACompliance(
        shipmentId: string,
        transitTime: EnhancedTransitTimeCalculation,
      ): Promise<SLAComplianceStatus> {
        // Use unified service via adapter
        const compliance = await transportationSlaKpiAdapter.checkSLACompliance(
          shipmentId,
          carrierId,
          {
            actual: transitTime.actualTransitTime.total,
            target: transitTime.predictions.realistic, // Use realistic prediction as target
          },
          tenantId,
        );

        // Convert to legacy format
        const requirements: SLAComplianceStatus["requirements"] = [
          {
            requirement: {
              id: "unified-sla",
              name: "Transit Time SLA",
              targetDuration: compliance.targetDuration / 3600,
              warningThreshold: 80,
              criticalThreshold: 100,
              metric: "TRANSIT_TIME",
            },
            status:
              compliance.status === "MET"
                ? "COMPLIANT"
                : compliance.status === "WARNING"
                  ? "WARNING"
                  : compliance.status === "CRITICAL"
                    ? "CRITICAL"
                    : "VIOLATED",
            actualValue: compliance.actualDuration / 3600,
            targetValue: compliance.targetDuration / 3600,
            remainingTime: compliance.remainingTime,
          },
        ];

        return {
          compliant: compliance.compliant,
          requirements,
          overallStatus:
            compliance.status === "MET"
              ? "COMPLIANT"
              : compliance.status === "WARNING"
                ? "AT_RISK"
                : compliance.status === "CRITICAL"
                  ? "AT_RISK"
                  : "VIOLATED",
        };
      },

      async calculateSLARisk(
        shipmentId: string,
        routePlan: IntelligentRoutePlan,
      ): Promise<SLARisk> {
        // Use unified service via adapter
        const risk = await transportationSlaKpiAdapter.calculateSLARisk(
          shipmentId,
          carrierId,
          routePlan.transitTime.withConstraints,
          tenantId,
        );

        const riskFactors: string[] = [];

        // Add constraint risks
        if (routePlan.constraintImpact.criticalConstraints.length > 0) {
          riskFactors.push(
            `${routePlan.constraintImpact.criticalConstraints.length} critical constraint(s)`,
          );
        }

        const recommendations: string[] = [...risk.recommendations];
        if (routePlan.complianceProgramRecommendations.length > 0) {
          recommendations.push(
            "Enroll in compliance programs to reduce transit time",
          );
        }
        if (routePlan.constraintImpact.recommendations.length > 0) {
          recommendations.push(...routePlan.constraintImpact.recommendations);
        }

        return {
          riskLevel: risk.riskLevel,
          riskFactors: [...riskFactors, ...risk.recommendations],
          probability: risk.probability,
          recommendations,
        };
      },
    };
  }

  /**
   * Get shipment (helper method)
   */
  private async getShipment(
    shipmentId: string,
    tenantId: string,
  ): Promise<Shipment | null> {
    try {
      return await transportationDatabaseAdapterInstance.getShipment(
        tenantId,
        shipmentId,
      );
    } catch (error) {
      console.error("Error retrieving shipment:", error);
      return null;
    }
  }

  /**
   * Integrate with WMS Module
   */
  async integrateWithWMS(warehouseId: string): Promise<WMSIntegration> {
    return {
      async getWarehouseAvailability(
        warehouseId: string,
        date: Date,
      ): Promise<WarehouseAvailability> {
        // In production, would call WMS service
        return {
          available: true,
          availableSlots: 10,
          constraints: [],
        };
      },

      async reserveWarehouseSlot(
        warehouseId: string,
        shipmentId: string,
        date: Date,
      ): Promise<boolean> {
        // In production, would call WMS service
        return true;
      },

      async getWarehouseConstraints(
        warehouseId: string,
      ): Promise<WarehouseConstraint[]> {
        // In production, would call WMS service
        return [];
      },
    };
  }

  /**
   * Integrate with ISO-IMS Module
   */
  async integrateWithISOIMS(tenantId: string): Promise<ISOIMSIntegration> {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for ISO-IMS integration (multi-tenant day 1)",
      );
    }

    return {
      async createNCRFromTransportationIssue(
        issue: TransportationIssue,
      ): Promise<string> {
        // In production, would call ISO-IMS service
        // Publish event for ISO-IMS to handle
        await eventBus.publish(
          createEvent(
            "TransportationIssueDetected",
            issue.shipmentId,
            "Shipment",
            {
              issueType: issue.type,
              severity: issue.severity,
              description: issue.description,
            },
            1,
            {
              tenantId,
              correlationId: `transportation-issue-${Date.now()}`,
              userId: "module-integration-service",
            },
          ),
        );

        return `ncr-${Date.now()}`;
      },

      async linkShipmentToQualityRecord(
        shipmentId: string,
        qualityRecordId: string,
      ): Promise<void> {
        // In production, would call ISO-IMS service
        await eventBus.publish(
          createEvent(
            "ShipmentLinkedToQualityRecord",
            shipmentId,
            "Shipment",
            {
              qualityRecordId,
            },
            1,
            {
              tenantId,
              correlationId: `shipment-quality-link-${Date.now()}`,
              userId: "module-integration-service",
            },
          ),
        );
      },

      async getQualityRequirements(
        shipmentId: string,
      ): Promise<QualityRequirement[]> {
        // In production, would call ISO-IMS service
        return [];
      },
    };
  }

  /**
   * Integrate with Trade Compliance Module
   */
  async integrateWithTradeCompliance(): Promise<TradeComplianceIntegration> {
    return {
      async validateTradeCompliance(
        shipment: Shipment,
        routePlan: IntelligentRoutePlan,
      ): Promise<TradeComplianceStatus> {
        // In production, would call trade compliance service
        return {
          compliant: true,
          violations: [],
          requirements: [],
        };
      },

      async getTradeProgramRecommendations(
        shipment: Shipment,
      ): Promise<TradeProgramRecommendation[]> {
        // In production, would call trade compliance service
        // For now, would get from route plan if available
        // This is a simplified implementation
        return [];
      },

      async getCustomsRequirements(
        origin: Location,
        destination: Location,
      ): Promise<CustomsRequirement[]> {
        // In production, would call trade compliance service
        return [];
      },
    };
  }

  /**
   * Publish transportation event for other modules
   */
  async publishTransportationEvent(
    eventType: string,
    shipmentId: string,
    data: Record<string, any>,
    tenantId: string,
  ): Promise<void> {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for publishing transportation events (multi-tenant day 1)",
      );
    }
    await eventBus.publish(
      createEvent(eventType, shipmentId, "Shipment", data, 1, {
        tenantId,
        correlationId: `transportation-${eventType}-${Date.now()}`,
        userId: "module-integration-service",
      }),
    );
  }

  /**
   * Subscribe to events from other modules
   */
  async subscribeToModuleEvents(tenantId: string): Promise<void> {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for subscribing to module events (multi-tenant day 1)",
      );
    }
    // Subscribe to compliance events
    eventBus.subscribe("compliance.*", async (event: any) => {
      // Handle compliance events
      console.log("Compliance event received:", event.type);
    });

    // Subscribe to SLA events
    eventBus.subscribe("sla.*", async (event: any) => {
      // Handle SLA events
      console.log("SLA event received:", event.type);
    });

    // Subscribe to WMS events
    eventBus.subscribe("wms.*", async (event: any) => {
      // Handle WMS events
      console.log("WMS event received:", event.type);
    });

    // Subscribe to ISO-IMS events
    eventBus.subscribe("iso-ims.*", async (event: any) => {
      // Handle ISO-IMS events
      console.log("ISO-IMS event received:", event.type);
    });
  }
}

export const moduleIntegrationService = new ModuleIntegrationService();
