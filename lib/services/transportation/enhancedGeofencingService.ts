/**
 * Enhanced Geofencing Service with Constraint Awareness
 *
 * Intelligent geofencing that considers:
 * - Route constraints (truck bans, opening hours)
 * - Touchpoint requirements
 * - Compliance program benefits
 * - Real-time conditions
 * - SLA requirements
 *
 * 4IR & 5IR Aligned - Intelligent Zone Management
 */

import type { Location, TransportMode } from "@/types/tms";
import type { Touchpoint } from "@/types/touchpoint";
import type {
  GeofenceZone,
  GeofenceEvent,
} from "@/lib/services/geofence/types";
import { geofenceZoneService } from "@/lib/services/geofence";
import {
  intelligentRoutePlanningService,
  type RouteConstraint,
} from "./intelligentRoutePlanningService";
import { intelligentTouchpointAnalysisService } from "./intelligentTouchpointAnalysisService";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface ConstraintAwareGeofenceZone extends GeofenceZone {
  // Constraint awareness
  constraints?: {
    truckBans?: RouteConstraint[];
    operatingHours?: RouteConstraint[];
    restrictions?: RouteConstraint[];
  };

  // Touchpoint integration
  touchpoint?: Touchpoint;

  // Compliance program benefits
  complianceProgramBenefits?: {
    programId: string;
    timeReduction: number;
    costReduction?: number;
  }[];

  // SLA requirements
  slaRequirements?: {
    maxDwellTime?: number; // minutes
    targetProcessingTime?: number; // minutes
    alertThreshold?: number; // percentage
  };
}

export interface EnhancedGeofenceEvent extends GeofenceEvent {
  // Constraint information
  constraints?: {
    active: RouteConstraint[];
    impact: {
      additionalTime: number; // hours
      blocksTransit: boolean;
    };
  };

  // Touchpoint information
  touchpoint?: {
    touchpoint: Touchpoint;
    processingTime: number; // hours
    capacity: number; // percentage
    recommendations: string[];
  };

  // Compliance program impact
  complianceProgramImpact?: {
    programs: string[];
    timeReduction: number; // hours
  };

  // SLA status
  slaStatus?: {
    compliant: boolean;
    remainingTime: number; // minutes
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };
}

export interface GeofenceEntryAnalysis {
  event: EnhancedGeofenceEvent;
  analysis: {
    // Constraint analysis
    constraints: {
      active: RouteConstraint[];
      totalImpact: number; // hours
      canProceed: boolean;
      recommendations: string[];
    };

    // Processing analysis
    processing: {
      estimatedTime: number; // hours
      capacityAvailable: boolean;
      waitTime: number; // hours
    };

    // Compliance program benefits
    complianceBenefits: {
      timeReduction: number; // hours
      programs: string[];
    };

    // SLA compliance
    sla: {
      compliant: boolean;
      riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      recommendations: string[];
    };
  };

  // Recommendations
  recommendations: string[];
  warnings: string[];
}

export interface GeofenceEntryRequest {
  location: { lat: number; lng: number };
  shipmentId: string;
  vehicleId: string;
  zoneId?: string;
  shipment?: {
    mode: TransportMode;
    cargo?: {
      weight?: number;
      volume?: number;
      hazmat?: boolean;
    };
  };
  compliancePrograms?: string[];
  slaId?: string;
  tenantId?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class EnhancedGeofencingService {
  /**
   * Detect zone entry with constraint awareness
   */
  async detectZoneEntry(
    request: GeofenceEntryRequest,
  ): Promise<GeofenceEntryAnalysis | null> {
    const {
      location,
      shipmentId,
      vehicleId,
      zoneId,
      shipment,
      compliancePrograms = [],
      slaId,
      tenantId = "default",
    } = request;

    // 1. Detect zone entry using base geofence service
    const baseEvent = await geofenceZoneService.detectZoneEvent(
      location,
      shipmentId,
      vehicleId,
      tenantId,
    );

    if (!baseEvent || baseEvent.eventType !== "ZONE_ENTRY") {
      return null;
    }

    // 2. Get zone details
    const zone = await geofenceZoneService.getZone(baseEvent.zoneId, tenantId);

    if (!zone) {
      return null;
    }

    // 3. Enhance zone with constraint awareness
    const enhancedZone = await this.enhanceZoneWithConstraints(
      zone,
      location,
      shipment,
      tenantId,
    );

    // 4. Analyze constraints at this location
    const constraints = await this.analyzeConstraintsAtLocation(
      location,
      shipment,
      tenantId,
    );

    // 5. Analyze touchpoint if zone has associated touchpoint
    const touchpointAnalysis = enhancedZone.touchpoint
      ? await intelligentTouchpointAnalysisService.analyzeTouchpoint({
          touchpoint: enhancedZone.touchpoint,
          shipment,
          compliancePrograms,
          tenantId,
        })
      : null;

    // 6. Calculate compliance program impact
    const complianceImpact = this.calculateComplianceImpact(
      constraints,
      enhancedZone.complianceProgramBenefits || [],
      compliancePrograms,
    );

    // 7. Check SLA compliance
    const slaStatus = slaId
      ? await this.checkSLACompliance(
          shipmentId,
          slaId,
          touchpointAnalysis,
          tenantId,
        )
      : undefined;

    // 8. Build enhanced event
    const enhancedEvent: EnhancedGeofenceEvent = {
      ...baseEvent,
      constraints: {
        active: constraints,
        impact: {
          additionalTime: constraints.reduce(
            (sum, c) => sum + (c.impactOnTransitTime?.additionalHours || 0),
            0,
          ),
          blocksTransit: constraints.some(
            (c) => c.impactOnTransitTime?.alternativeRouteRequired === true,
          ),
        },
      },
      touchpoint: touchpointAnalysis
        ? {
            touchpoint: enhancedZone.touchpoint!,
            processingTime:
              touchpointAnalysis.analysis.processingTime.estimated,
            capacity: touchpointAnalysis.analysis.capacity.currentUtilization,
            recommendations:
              touchpointAnalysis.analysis.optimizations.recommendations,
          }
        : undefined,
      complianceProgramImpact:
        complianceImpact.timeReduction > 0 ? complianceImpact : undefined,
      slaStatus,
    };

    // 9. Generate analysis
    const analysis: GeofenceEntryAnalysis = {
      event: enhancedEvent,
      analysis: {
        constraints: {
          active: constraints,
          totalImpact: enhancedEvent.constraints!.impact.additionalTime,
          canProceed: !enhancedEvent.constraints!.impact.blocksTransit,
          recommendations: this.generateConstraintRecommendations(
            constraints,
            compliancePrograms,
          ),
        },
        processing: touchpointAnalysis
          ? {
              estimatedTime:
                touchpointAnalysis.analysis.processingTime.estimated,
              capacityAvailable:
                touchpointAnalysis.analysis.capacity.availableCapacity > 10,
              waitTime: touchpointAnalysis.analysis.capacity.waitTimeEstimate,
            }
          : {
              estimatedTime: 0,
              capacityAvailable: true,
              waitTime: 0,
            },
        complianceBenefits: complianceImpact,
        sla: slaStatus
          ? {
              compliant: slaStatus.compliant,
              riskLevel: slaStatus.riskLevel,
              recommendations: this.generateSLARecommendations(slaStatus),
            }
          : {
              compliant: true,
              riskLevel: "LOW",
              recommendations: [],
            },
      },
      recommendations: this.generateRecommendations(
        enhancedEvent,
        touchpointAnalysis,
        slaStatus,
      ),
      warnings: this.generateWarnings(
        enhancedEvent,
        touchpointAnalysis,
        slaStatus,
      ),
    };

    // 10. Publish event
    await eventBus.publish(
      createEvent(
        "EnhancedGeofenceEntry",
        shipmentId,
        "Shipment",
        {
          zoneId: baseEvent.zoneId,
          zoneName: zone.name,
          constraintsCount: constraints.length,
          canProceed: analysis.analysis.constraints.canProceed,
          slaCompliant: slaStatus?.compliant,
        },
        1,
        {
          tenantId,
          correlationId: `geofence-entry-${Date.now()}`,
          userId: "enhanced-geofencing-service",
        },
      ),
    );

    return analysis;
  }

  /**
   * Enhance zone with constraint awareness
   */
  private async enhanceZoneWithConstraints(
    zone: GeofenceZone,
    location: { lat: number; lng: number },
    shipment?: GeofenceEntryRequest["shipment"],
    tenantId: string = "default",
  ): Promise<ConstraintAwareGeofenceZone> {
    const enhancedZone: ConstraintAwareGeofenceZone = {
      ...zone,
      constraints: {},
      complianceProgramBenefits: [],
    };

    // Get constraints at this location
    const locationObj: Location = {
      id: "temp",
      name: zone.name,
      address: {
        street: "",
        city: "",
        country: "",
        countryCode: "SA",
        postalCode: "",
      },
      coordinates: location,
      type: "CUSTOMS",
    };

    const constraints = await intelligentRoutePlanningService[
      "getRouteConstraints"
    ](
      locationObj,
      locationObj,
      [],
      shipment?.mode || "LAND",
      shipment?.cargo,
      tenantId,
    );

    enhancedZone.constraints = {
      truckBans: constraints.filter((c) => c.type === "TRUCK_BAN"),
      operatingHours: constraints.filter(
        (c) =>
          c.type === "OPENING_HOURS" || c.type === "GOVERNMENT_AGENCY_HOURS",
      ),
      restrictions: constraints.filter((c) => c.type === "RESTRICTION"),
    };

    // Extract compliance program benefits from constraints
    for (const constraint of constraints) {
      if (constraint.complianceProgramBenefits) {
        for (const benefit of constraint.complianceProgramBenefits) {
          if (benefit.programId) {
            enhancedZone.complianceProgramBenefits!.push({
              programId: benefit.programId,
              timeReduction: benefit.timeReduction || 0,
              costReduction: 0, // Would calculate
            });
          }
        }
      }
    }

    return enhancedZone;
  }

  /**
   * Analyze constraints at location
   */
  private async analyzeConstraintsAtLocation(
    location: { lat: number; lng: number },
    shipment?: GeofenceEntryRequest["shipment"],
    tenantId: string = "default",
  ): Promise<RouteConstraint[]> {
    const locationObj: Location = {
      id: "temp",
      name: "Location",
      address: {
        street: "",
        city: "",
        country: "",
        countryCode: "SA",
        postalCode: "",
      },
      coordinates: location,
      type: "CUSTOMS",
    };

    return intelligentRoutePlanningService["getRouteConstraints"](
      locationObj,
      locationObj,
      [],
      shipment?.mode || "LAND",
      shipment?.cargo,
      tenantId,
    );
  }

  /**
   * Calculate compliance program impact
   */
  private calculateComplianceImpact(
    constraints: RouteConstraint[],
    zoneBenefits: ConstraintAwareGeofenceZone["complianceProgramBenefits"],
    enrolledPrograms: string[],
  ): { timeReduction: number; programs: string[] } {
    let timeReduction = 0;
    const programs: string[] = [];

    // From zone benefits
    for (const benefit of zoneBenefits || []) {
      if (enrolledPrograms.includes(benefit.programId)) {
        timeReduction += benefit.timeReduction;
        programs.push(benefit.programId);
      }
    }

    // From constraints
    for (const constraint of constraints) {
      if (constraint.complianceProgramBenefits) {
        for (const benefit of constraint.complianceProgramBenefits) {
          if (
            benefit.programId &&
            enrolledPrograms.includes(benefit.programId)
          ) {
            timeReduction += benefit.timeReduction || 0;
            if (!programs.includes(benefit.programId)) {
              programs.push(benefit.programId);
            }
          }
        }
      }
    }

    return { timeReduction, programs };
  }

  /**
   * Check SLA compliance
   */
  private async checkSLACompliance(
    shipmentId: string,
    slaId: string,
    touchpointAnalysis: Awaited<
      ReturnType<typeof intelligentTouchpointAnalysisService.analyzeTouchpoint>
    > | null,
    tenantId: string,
  ): Promise<EnhancedGeofenceEvent["slaStatus"]> {
    // In production, would fetch SLA from SLA service
    // For now, use touchpoint analysis if available

    if (!touchpointAnalysis) {
      return {
        compliant: true,
        remainingTime: Infinity,
        riskLevel: "LOW",
      };
    }

    const processingTime = touchpointAnalysis.analysis.processingTime.estimated;
    const delayProbability = touchpointAnalysis.analysis.risks.delayProbability;

    // Simplified SLA check
    const maxProcessingTime = 4; // hours (would come from SLA)
    const compliant = processingTime <= maxProcessingTime;
    const remainingTime = Math.max(
      0,
      (maxProcessingTime - processingTime) * 60,
    ); // minutes

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (delayProbability > 0.7 || processingTime > maxProcessingTime * 1.2) {
      riskLevel = "CRITICAL";
    } else if (delayProbability > 0.5 || processingTime > maxProcessingTime) {
      riskLevel = "HIGH";
    } else if (delayProbability > 0.3) {
      riskLevel = "MEDIUM";
    }

    return {
      compliant,
      remainingTime,
      riskLevel,
    };
  }

  /**
   * Generate constraint recommendations
   */
  private generateConstraintRecommendations(
    constraints: RouteConstraint[],
    compliancePrograms: string[],
  ): string[] {
    const recommendations: string[] = [];

    const blockingConstraints = constraints.filter(
      (c) => c.impactOnTransitTime?.alternativeRouteRequired === true,
    );

    if (blockingConstraints.length > 0) {
      recommendations.push(
        `${blockingConstraints.length} blocking constraint(s) - alternative route required`,
      );
    }

    const mitigatableConstraints = constraints.filter(
      (c) =>
        c.complianceProgramBenefits && c.complianceProgramBenefits.length > 0,
    );

    for (const constraint of mitigatableConstraints) {
      if (constraint.complianceProgramBenefits) {
        for (const benefit of constraint.complianceProgramBenefits) {
          if (
            benefit.programId &&
            !compliancePrograms.includes(benefit.programId)
          ) {
            recommendations.push(
              `Enroll in ${benefit.programId} to reduce ${benefit.timeReduction?.toFixed(1)} hours`,
            );
          }
        }
      }
    }

    return recommendations;
  }

  /**
   * Generate SLA recommendations
   */
  private generateSLARecommendations(
    slaStatus: EnhancedGeofenceEvent["slaStatus"],
  ): string[] {
    if (!slaStatus) return [];

    const recommendations: string[] = [];

    if (!slaStatus.compliant) {
      recommendations.push("SLA violation risk - expedite processing");
    }

    if (slaStatus.riskLevel === "CRITICAL") {
      recommendations.push("Critical SLA risk - immediate action required");
    } else if (slaStatus.riskLevel === "HIGH") {
      recommendations.push("High SLA risk - monitor closely");
    }

    if (slaStatus.remainingTime < 60) {
      recommendations.push(
        `Only ${slaStatus.remainingTime.toFixed(0)} minutes remaining before SLA violation`,
      );
    }

    return recommendations;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    event: EnhancedGeofenceEvent,
    touchpointAnalysis: Awaited<
      ReturnType<typeof intelligentTouchpointAnalysisService.analyzeTouchpoint>
    > | null,
    slaStatus?: EnhancedGeofenceEvent["slaStatus"],
  ): string[] {
    const recommendations: string[] = [];

    if (
      event.complianceProgramImpact &&
      event.complianceProgramImpact.timeReduction > 0
    ) {
      recommendations.push(
        `Compliance programs saving ${event.complianceProgramImpact.timeReduction.toFixed(1)} hours`,
      );
    }

    if (touchpointAnalysis) {
      recommendations.push(
        ...touchpointAnalysis.analysis.optimizations.recommendations,
      );
    }

    if (slaStatus) {
      recommendations.push(...this.generateSLARecommendations(slaStatus));
    }

    return recommendations;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    event: EnhancedGeofenceEvent,
    touchpointAnalysis: Awaited<
      ReturnType<typeof intelligentTouchpointAnalysisService.analyzeTouchpoint>
    > | null,
    slaStatus?: EnhancedGeofenceEvent["slaStatus"],
  ): string[] {
    const warnings: string[] = [];

    if (event.constraints?.impact.blocksTransit) {
      warnings.push(
        "Route blocked by constraints - alternative route required",
      );
    }

    if (event.touchpoint && event.touchpoint.capacity > 90) {
      warnings.push(
        `High capacity at touchpoint (${event.touchpoint.capacity}%)`,
      );
    }

    if (slaStatus && !slaStatus.compliant) {
      warnings.push("SLA violation risk");
    }

    if (touchpointAnalysis) {
      warnings.push(...touchpointAnalysis.analysis.risks.riskFactors);
    }

    return warnings;
  }
}

export const enhancedGeofencingService = new EnhancedGeofencingService();
