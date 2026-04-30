/**
 * Intelligent Touchpoint Analysis Service
 *
 * Comprehensive touchpoint analysis considering:
 * - All constraints and requirements
 * - Processing times and capacity
 * - Compliance program benefits
 * - Real-time conditions
 * - Optimization opportunities
 *
 * 4IR & 5IR Aligned - AI-Powered Touchpoint Intelligence
 */

import type {
  Touchpoint,
  TouchpointType,
  OperatingHours,
  TouchpointStatus,
} from "@/types/touchpoint";
import type { Location, TransportMode, ShipmentType } from "@/types/tms";
import { touchpointService } from "@/lib/services/customs/touchpointService";
import {
  intelligentRoutePlanningService,
  type RouteConstraint,
} from "./intelligentRoutePlanningService";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface TouchpointAnalysis {
  touchpoint: Touchpoint;
  analysis: {
    // Processing time analysis
    processingTime: {
      estimated: number; // hours
      min: number;
      max: number;
      average: number;
      confidence: number; // 0-1
      factors: string[];
    };

    // Capacity analysis
    capacity: {
      currentUtilization: number; // percentage
      availableCapacity: number; // percentage
      peakHours: string[];
      recommendedArrivalTime?: Date;
      waitTimeEstimate: number; // hours
    };

    // Constraint analysis
    constraints: {
      operatingHours: OperatingHoursConstraint;
      restrictions: RestrictionConstraint[];
      requirements: RequirementConstraint[];
      complianceProgramBenefits: ComplianceProgramBenefit[];
    };

    // Optimization opportunities
    optimizations: {
      timeReduction: number; // hours
      costReduction?: number;
      recommendations: string[];
      compliancePrograms?: string[];
    };

    // Risk assessment
    risks: {
      delayProbability: number; // 0-1
      riskFactors: string[];
      mitigationStrategies: string[];
    };

    // Score
    score: {
      overall: number; // 0-100
      efficiency: number; // 0-100
      reliability: number; // 0-100
      cost: number; // 0-100
    };
  };

  // Metadata
  analyzedAt: Date;
  validUntil: Date;
  tenantId: string;
}

export interface OperatingHoursConstraint {
  constraint: RouteConstraint;
  nextOpenTime?: Date;
  nextCloseTime?: Date;
  waitTimeIfArrivingNow: number; // hours
  recommendedArrivalWindow?: { start: Date; end: Date };
}

export interface RestrictionConstraint {
  constraint: RouteConstraint;
  applies: boolean;
  impact: {
    blocksTransit: boolean;
    requiresAlternative: boolean;
    additionalTime: number; // hours
  };
}

export interface RequirementConstraint {
  type:
    | "DOCUMENT"
    | "PERMIT"
    | "CERTIFICATE"
    | "INSPECTION"
    | "PAYMENT"
    | "OTHER";
  description: string;
  required: boolean;
  status: "MISSING" | "PENDING" | "COMPLETE";
  impact: {
    blocksTransit: boolean;
    additionalTime: number; // hours
  };
}

export interface ComplianceProgramBenefit {
  programId: string;
  programName: string;
  benefit: string;
  timeReduction: number; // hours
  costReduction?: number;
  eligibility: boolean;
}

export interface TouchpointAnalysisRequest {
  touchpoint: Touchpoint | string; // ID or full touchpoint
  shipment?: {
    mode: TransportMode;
    type: ShipmentType;
    cargo?: {
      weight?: number;
      volume?: number;
      hazmat?: boolean;
      temperatureControlled?: boolean;
    };
  };
  arrivalTime?: Date;
  compliancePrograms?: string[];
  preferences?: {
    minimizeWaitTime?: boolean;
    minimizeCost?: boolean;
    maximizeReliability?: boolean;
  };
  tenantId?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class IntelligentTouchpointAnalysisService {
  private analysisCache: Map<string, TouchpointAnalysis> = new Map();
  private cacheExpiry: Map<string, Date> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Analyze touchpoint with all constraints and requirements
   */
  async analyzeTouchpoint(
    request: TouchpointAnalysisRequest,
  ): Promise<TouchpointAnalysis> {
    const {
      touchpoint: touchpointInput,
      shipment,
      arrivalTime = new Date(),
      compliancePrograms = [],
      preferences = {},
      tenantId = "default",
    } = request;

    // Get touchpoint (if ID provided, fetch it)
    const touchpoint =
      typeof touchpointInput === "string"
        ? await this.getTouchpointById(touchpointInput)
        : touchpointInput;

    if (!touchpoint) {
      throw new Error("Touchpoint not found");
    }

    // Check cache
    const cacheKey = this.getCacheKey(
      touchpoint.id,
      arrivalTime,
      compliancePrograms,
    );
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Analyze processing time
    const processingTime = await this.analyzeProcessingTime(
      touchpoint,
      shipment,
      arrivalTime,
    );

    // 2. Analyze capacity
    const capacity = await this.analyzeCapacity(touchpoint, arrivalTime);

    // 3. Analyze constraints
    const constraints = await this.analyzeConstraints(
      touchpoint,
      arrivalTime,
      shipment,
    );

    // 4. Find optimization opportunities
    const optimizations = await this.findOptimizations(
      touchpoint,
      constraints,
      compliancePrograms,
      shipment,
    );

    // 5. Assess risks
    const risks = await this.assessRisks(
      touchpoint,
      processingTime,
      capacity,
      constraints,
    );

    // 6. Calculate score
    const score = this.calculateScore(
      processingTime,
      capacity,
      constraints,
      optimizations,
      risks,
    );

    const analysis: TouchpointAnalysis = {
      touchpoint,
      analysis: {
        processingTime,
        capacity,
        constraints,
        optimizations,
        risks,
        score,
      },
      analyzedAt: new Date(),
      validUntil: new Date(Date.now() + this.CACHE_TTL),
      tenantId,
    };

    // Cache analysis
    this.cacheAnalysis(cacheKey, analysis);

    // Publish event
    await eventBus.publish(
      createEvent(
        "TouchpointAnalyzed",
        touchpoint.id,
        "Touchpoint",
        {
          touchpointId: touchpoint.id,
          touchpointName: touchpoint.name,
          score: score.overall,
          processingTime: processingTime.estimated,
          risks: risks.riskFactors.length,
        },
        1,
        {
          tenantId,
          correlationId: `touchpoint-analysis-${Date.now()}`,
          userId: "intelligent-touchpoint-analysis-service",
        },
      ),
    );

    return analysis;
  }

  /**
   * Analyze multiple touchpoints
   */
  async analyzeTouchpoints(
    requests: TouchpointAnalysisRequest[],
  ): Promise<TouchpointAnalysis[]> {
    return Promise.all(requests.map((req) => this.analyzeTouchpoint(req)));
  }

  /**
   * Compare touchpoints
   */
  async compareTouchpoints(
    touchpoints: (Touchpoint | string)[],
    shipment?: TouchpointAnalysisRequest["shipment"],
    arrivalTime?: Date,
    compliancePrograms?: string[],
    tenantId: string = "default",
  ): Promise<{
    touchpoints: TouchpointAnalysis[];
    recommended: TouchpointAnalysis | null;
    comparison: {
      fastest: TouchpointAnalysis | null;
      cheapest: TouchpointAnalysis | null;
      mostReliable: TouchpointAnalysis | null;
      bestOverall: TouchpointAnalysis | null;
    };
  }> {
    const analyses = await this.analyzeTouchpoints(
      touchpoints.map((tp) => ({
        touchpoint: tp,
        shipment,
        arrivalTime,
        compliancePrograms,
        tenantId,
      })),
    );

    const fastest = analyses.reduce(
      (best, current) =>
        current.analysis.processingTime.estimated <
        best.analysis.processingTime.estimated
          ? current
          : best,
      analyses[0],
    );

    const mostReliable = analyses.reduce(
      (best, current) =>
        current.analysis.score.reliability > best.analysis.score.reliability
          ? current
          : best,
      analyses[0],
    );

    const bestOverall = analyses.reduce(
      (best, current) =>
        current.analysis.score.overall > best.analysis.score.overall
          ? current
          : best,
      analyses[0],
    );

    return {
      touchpoints: analyses,
      recommended: bestOverall,
      comparison: {
        fastest,
        cheapest: fastest, // Simplified - would calculate cost
        mostReliable,
        bestOverall,
      },
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async getTouchpointById(id: string): Promise<Touchpoint | null> {
    try {
      return touchpointService.getTouchpoint(id) || null;
    } catch (error) {
      console.warn(`Error getting touchpoint ${id}:`, error);
      return null;
    }
  }

  private async analyzeProcessingTime(
    touchpoint: Touchpoint,
    shipment?: TouchpointAnalysisRequest["shipment"],
    arrivalTime: Date = new Date(),
  ): Promise<TouchpointAnalysis["analysis"]["processingTime"]> {
    const baseTime = touchpoint.averageProcessingTime?.average || 2; // hours
    const minTime = touchpoint.averageProcessingTime?.min || baseTime * 0.7;
    const maxTime = touchpoint.averageProcessingTime?.max || baseTime * 1.5;

    // Adjust based on current utilization
    let adjustment = 1.0;
    if (touchpoint.currentUtilization > 90) {
      adjustment = 1.5; // 50% longer at high capacity
    } else if (touchpoint.currentUtilization > 75) {
      adjustment = 1.2; // 20% longer
    }

    // Adjust based on congestion level
    const congestionAdjustment: Record<string, number> = {
      LOW: 1.0,
      MEDIUM: 1.1,
      HIGH: 1.3,
      CRITICAL: 1.5,
    };
    adjustment *= congestionAdjustment[touchpoint.congestionLevel] || 1.0;

    // Adjust based on shipment type
    if (shipment?.cargo?.hazmat) {
      adjustment *= 1.2; // Hazmat takes longer
    }
    if (shipment?.cargo?.temperatureControlled) {
      adjustment *= 1.1; // Temperature-controlled needs special handling
    }

    const estimated = baseTime * adjustment;
    const factors: string[] = [];

    if (touchpoint.currentUtilization > 75) {
      factors.push(`High utilization (${touchpoint.currentUtilization}%)`);
    }
    if (touchpoint.congestionLevel !== "LOW") {
      factors.push(`Congestion level: ${touchpoint.congestionLevel}`);
    }
    if (shipment?.cargo?.hazmat) {
      factors.push("Hazmat cargo requires additional processing");
    }

    // Confidence based on data quality
    let confidence = 0.8;
    if (touchpoint.currentProcessingTime) {
      confidence = 0.9; // Real-time data available
    }
    if (touchpoint.utilizationHistory.length < 10) {
      confidence *= 0.8; // Limited historical data
    }

    return {
      estimated: Math.round(estimated * 10) / 10,
      min: Math.round(minTime * adjustment * 10) / 10,
      max: Math.round(maxTime * adjustment * 10) / 10,
      average: baseTime,
      confidence: Math.round(confidence * 100) / 100,
      factors,
    };
  }

  private async analyzeCapacity(
    touchpoint: Touchpoint,
    arrivalTime: Date = new Date(),
  ): Promise<TouchpointAnalysis["analysis"]["capacity"]> {
    const currentUtilization = touchpoint.currentUtilization || 0;
    const availableCapacity = Math.max(0, 100 - currentUtilization);

    // Estimate wait time based on utilization
    let waitTimeEstimate = 0;
    if (currentUtilization > 95) {
      waitTimeEstimate = 4; // hours
    } else if (currentUtilization > 85) {
      waitTimeEstimate = 2;
    } else if (currentUtilization > 75) {
      waitTimeEstimate = 1;
    }

    // Find peak hours
    const peakHours =
      touchpoint.peakHours?.map((ph) => `${ph.day} ${ph.start}-${ph.end}`) ||
      [];

    // Recommend arrival time (avoid peak hours if possible)
    let recommendedArrivalTime: Date | undefined;
    if (touchpoint.peakHours && touchpoint.peakHours.length > 0) {
      // Find a time outside peak hours
      const now = new Date(arrivalTime);
      const hour = now.getHours();
      const day = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ][now.getDay()];

      const peakForDay = touchpoint.peakHours.find((ph) => ph.day === day);
      if (peakForDay) {
        const peakStart = parseInt(peakForDay.start.split(":")[0]);
        const peakEnd = parseInt(peakForDay.end.split(":")[0]);

        if (hour >= peakStart && hour < peakEnd) {
          // Currently in peak, recommend after peak
          recommendedArrivalTime = new Date(now);
          recommendedArrivalTime.setHours(peakEnd, 0, 0, 0);
        }
      }
    }

    return {
      currentUtilization,
      availableCapacity,
      peakHours,
      recommendedArrivalTime,
      waitTimeEstimate,
    };
  }

  private async analyzeConstraints(
    touchpoint: Touchpoint,
    arrivalTime: Date,
    shipment?: TouchpointAnalysisRequest["shipment"],
  ): Promise<TouchpointAnalysis["analysis"]["constraints"]> {
    // Get constraints from route planning service
    const location: Location = {
      id: touchpoint.id,
      name: touchpoint.name,
      address: touchpoint.address,
      coordinates: touchpoint.coordinates,
      type: "CUSTOMS",
    };

    const constraints = await intelligentRoutePlanningService[
      "getRouteConstraints"
    ](
      location,
      location,
      [],
      shipment?.mode || "LAND",
      shipment?.cargo,
      "default",
    );

    // Analyze operating hours
    const operatingHoursConstraint = this.analyzeOperatingHours(
      touchpoint,
      arrivalTime,
      constraints,
    );

    // Analyze restrictions
    const restrictions = this.analyzeRestrictions(
      touchpoint,
      constraints,
      shipment,
    );

    // Analyze requirements
    const requirements = this.analyzeRequirements(touchpoint, shipment);

    // Find compliance program benefits
    const complianceProgramBenefits = this.findComplianceProgramBenefits(
      touchpoint,
      constraints,
    );

    return {
      operatingHours: operatingHoursConstraint,
      restrictions,
      requirements,
      complianceProgramBenefits,
    };
  }

  private analyzeOperatingHours(
    touchpoint: Touchpoint,
    arrivalTime: Date,
    constraints: RouteConstraint[],
  ): OperatingHoursConstraint {
    const hoursConstraint = constraints.find(
      (c) => c.type === "OPENING_HOURS" || c.type === "GOVERNMENT_AGENCY_HOURS",
    );

    if (!hoursConstraint || !touchpoint.operatingHours) {
      return {
        constraint: hoursConstraint || ({} as RouteConstraint),
        waitTimeIfArrivingNow: 0,
      };
    }

    // Calculate wait time if arriving now
    const now = new Date(arrivalTime);
    const day = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][now.getDay()];
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;

    let waitTime = 0;
    let nextOpenTime: Date | undefined;
    let nextCloseTime: Date | undefined;

    const dayHours =
      touchpoint.operatingHours[day.toLowerCase() as keyof OperatingHours];
    if (dayHours && !dayHours.closed) {
      const openTime = this.parseTime(dayHours.open);
      const closeTime = this.parseTime(dayHours.close);

      if (currentTime < openTime) {
        // Before opening
        waitTime = (openTime - currentTime) / 60; // hours
        nextOpenTime = new Date(now);
        nextOpenTime.setHours(Math.floor(openTime / 60), openTime % 60, 0, 0);
      } else if (currentTime >= closeTime) {
        // After closing - wait until next day
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayName = [
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
        ][nextDay.getDay()];
        const nextDayHours =
          touchpoint.operatingHours[
            nextDayName.toLowerCase() as keyof OperatingHours
          ];

        if (nextDayHours && !nextDayHours.closed) {
          const nextOpen = this.parseTime(nextDayHours.open);
          waitTime = (24 * 60 - currentTime + nextOpen) / 60; // hours
          nextOpenTime = new Date(nextDay);
          nextOpenTime.setHours(Math.floor(nextOpen / 60), nextOpen % 60, 0, 0);
        }
      }

      nextCloseTime = new Date(now);
      nextCloseTime.setHours(Math.floor(closeTime / 60), closeTime % 60, 0, 0);
    }

    // Recommended arrival window (during operating hours)
    let recommendedArrivalWindow: { start: Date; end: Date } | undefined;
    if (dayHours && !dayHours.closed) {
      const openTime = this.parseTime(dayHours.open);
      const closeTime = this.parseTime(dayHours.close);

      recommendedArrivalWindow = {
        start: new Date(now),
      };
      recommendedArrivalWindow.start.setHours(
        Math.floor(openTime / 60),
        openTime % 60,
        0,
        0,
      );

      recommendedArrivalWindow.end = new Date(now);
      recommendedArrivalWindow.end.setHours(
        Math.floor(closeTime / 60),
        closeTime % 60,
        0,
        0,
      );
    }

    return {
      constraint: hoursConstraint,
      nextOpenTime,
      nextCloseTime,
      waitTimeIfArrivingNow: waitTime,
      recommendedArrivalWindow,
    };
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private analyzeRestrictions(
    touchpoint: Touchpoint,
    constraints: RouteConstraint[],
    shipment?: TouchpointAnalysisRequest["shipment"],
  ): RestrictionConstraint[] {
    return constraints
      .filter((c) => c.type === "TRUCK_BAN" || c.type === "RESTRICTION")
      .map((constraint) => {
        const applies = this.constraintApplies(constraint, shipment);

        return {
          constraint,
          applies,
          impact: {
            blocksTransit:
              applies &&
              (constraint.impactOnTransitTime?.alternativeRouteRequired ||
                false),
            requiresAlternative:
              applies &&
              (constraint.impactOnTransitTime?.alternativeRouteRequired ||
                false),
            additionalTime: applies
              ? constraint.impactOnTransitTime?.additionalHours || 0
              : 0,
          },
        };
      });
  }

  private constraintApplies(
    constraint: RouteConstraint,
    shipment?: TouchpointAnalysisRequest["shipment"],
  ): boolean {
    // Check vehicle restrictions
    if (constraint.vehicleRestrictions) {
      if (
        shipment?.cargo?.weight &&
        constraint.vehicleRestrictions.weightLimit
      ) {
        if (
          shipment.cargo.weight > constraint.vehicleRestrictions.weightLimit
        ) {
          return true;
        }
      }
      if (
        shipment?.cargo?.hazmat &&
        constraint.vehicleRestrictions.hazmatAllowed === false
      ) {
        return true;
      }
    }

    // Check time restrictions
    if (constraint.timeRestrictions) {
      const now = new Date();
      const day = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ][now.getDay()];

      if (constraint.timeRestrictions.days?.includes(day)) {
        if (constraint.timeRestrictions.timeRange) {
          const hour = now.getHours();
          const minute = now.getMinutes();
          const currentTime = hour * 60 + minute;
          const startTime = this.parseTime(
            constraint.timeRestrictions.timeRange.start,
          );
          const endTime = this.parseTime(
            constraint.timeRestrictions.timeRange.end,
          );

          if (currentTime >= startTime && currentTime < endTime) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private analyzeRequirements(
    touchpoint: Touchpoint,
    shipment?: TouchpointAnalysisRequest["shipment"],
  ): RequirementConstraint[] {
    const requirements: RequirementConstraint[] = [];

    // Document requirements
    if (touchpoint.requiredDocuments) {
      for (const doc of touchpoint.requiredDocuments) {
        requirements.push({
          type: "DOCUMENT",
          description: `${doc.type} - ${doc.name}`,
          required: doc.required || false,
          status: "MISSING", // Would check actual status
          impact: {
            blocksTransit: doc.required || false,
            additionalTime: doc.required ? 2 : 0, // hours to obtain
          },
        });
      }
    }

    // Special requirements
    if (touchpoint.specialRequirements) {
      for (const req of touchpoint.specialRequirements) {
        requirements.push({
          type: "OTHER",
          description: req,
          required: true,
          status: "PENDING",
          impact: {
            blocksTransit: false,
            additionalTime: 0.5,
          },
        });
      }
    }

    return requirements;
  }

  private findComplianceProgramBenefits(
    touchpoint: Touchpoint,
    constraints: RouteConstraint[],
  ): ComplianceProgramBenefit[] {
    const benefits: ComplianceProgramBenefit[] = [];

    for (const constraint of constraints) {
      if (constraint.complianceProgramBenefits) {
        for (const benefit of constraint.complianceProgramBenefits) {
          if (benefit.programId) {
            benefits.push({
              programId: benefit.programId,
              programName: benefit.programId, // Would get full name
              benefit: benefit.benefitType?.replace("_", " ") || "",
              timeReduction: benefit.timeReduction || 0,
              eligibility: true, // Would check actual eligibility
            });
          }
        }
      }
    }

    // Remove duplicates
    const uniqueBenefits = new Map<string, ComplianceProgramBenefit>();
    for (const benefit of benefits) {
      if (!uniqueBenefits.has(benefit.programId)) {
        uniqueBenefits.set(benefit.programId, benefit);
      } else {
        const existing = uniqueBenefits.get(benefit.programId)!;
        existing.timeReduction += benefit.timeReduction;
      }
    }

    return Array.from(uniqueBenefits.values());
  }

  private async findOptimizations(
    touchpoint: Touchpoint,
    constraints: TouchpointAnalysis["analysis"]["constraints"],
    compliancePrograms: string[],
    shipment?: TouchpointAnalysisRequest["shipment"],
  ): Promise<TouchpointAnalysis["analysis"]["optimizations"]> {
    const recommendations: string[] = [];
    let timeReduction = 0;

    // Compliance program optimizations
    for (const benefit of constraints.complianceProgramBenefits) {
      if (compliancePrograms.includes(benefit.programId)) {
        timeReduction += benefit.timeReduction;
        recommendations.push(
          `Enrolled in ${benefit.programName} saves ${benefit.timeReduction.toFixed(1)} hours`,
        );
      } else if (benefit.eligibility) {
        recommendations.push(
          `Apply for ${benefit.programName} to save ${benefit.timeReduction.toFixed(1)} hours`,
        );
      }
    }

    // Arrival time optimization
    if (constraints.operatingHours.recommendedArrivalWindow) {
      recommendations.push("Arrive during operating hours to avoid waiting");
    }

    // Capacity optimization
    if (touchpoint.currentUtilization > 85) {
      recommendations.push(
        "High capacity - consider arriving during off-peak hours",
      );
    }

    return {
      timeReduction,
      recommendations,
      compliancePrograms: constraints.complianceProgramBenefits
        .filter(
          (b) => b.eligibility && !compliancePrograms.includes(b.programId),
        )
        .map((b) => b.programId),
    };
  }

  private async assessRisks(
    touchpoint: Touchpoint,
    processingTime: TouchpointAnalysis["analysis"]["processingTime"],
    capacity: TouchpointAnalysis["analysis"]["capacity"],
    constraints: TouchpointAnalysis["analysis"]["constraints"],
  ): Promise<TouchpointAnalysis["analysis"]["risks"]> {
    const riskFactors: string[] = [];
    let delayProbability = 0.3; // Base probability

    // High utilization risk
    if (capacity.currentUtilization > 90) {
      delayProbability += 0.3;
      riskFactors.push("Very high utilization (>90%)");
    } else if (capacity.currentUtilization > 75) {
      delayProbability += 0.2;
      riskFactors.push("High utilization (>75%)");
    }

    // Congestion risk
    if (touchpoint.congestionLevel === "CRITICAL") {
      delayProbability += 0.3;
      riskFactors.push("Critical congestion level");
    } else if (touchpoint.congestionLevel === "HIGH") {
      delayProbability += 0.2;
      riskFactors.push("High congestion level");
    }

    // Operating hours risk
    if (constraints.operatingHours.waitTimeIfArrivingNow > 2) {
      delayProbability += 0.2;
      riskFactors.push("Arriving outside operating hours");
    }

    // Restriction risk
    const blockingRestrictions = constraints.restrictions.filter(
      (r) => r.impact.blocksTransit,
    );
    if (blockingRestrictions.length > 0) {
      delayProbability += 0.3;
      riskFactors.push(
        `${blockingRestrictions.length} blocking restriction(s)`,
      );
    }

    // Missing requirements risk
    const missingRequirements = constraints.requirements.filter(
      (r) => r.status === "MISSING" && r.required,
    );
    if (missingRequirements.length > 0) {
      delayProbability += 0.2;
      riskFactors.push(
        `${missingRequirements.length} missing required document(s)`,
      );
    }

    delayProbability = Math.min(delayProbability, 0.95); // Cap at 95%

    // Mitigation strategies
    const mitigationStrategies: string[] = [];
    if (capacity.recommendedArrivalTime) {
      mitigationStrategies.push(
        `Arrive at ${capacity.recommendedArrivalTime.toLocaleTimeString()} to avoid peak hours`,
      );
    }
    if (constraints.complianceProgramBenefits.length > 0) {
      mitigationStrategies.push(
        "Enroll in compliance programs to reduce processing time",
      );
    }
    if (missingRequirements.length > 0) {
      mitigationStrategies.push(
        "Ensure all required documents are prepared in advance",
      );
    }

    return {
      delayProbability: Math.round(delayProbability * 100) / 100,
      riskFactors,
      mitigationStrategies,
    };
  }

  private calculateScore(
    processingTime: TouchpointAnalysis["analysis"]["processingTime"],
    capacity: TouchpointAnalysis["analysis"]["capacity"],
    constraints: TouchpointAnalysis["analysis"]["constraints"],
    optimizations: TouchpointAnalysis["analysis"]["optimizations"],
    risks: TouchpointAnalysis["analysis"]["risks"],
  ): TouchpointAnalysis["analysis"]["score"] {
    // Efficiency score (lower processing time = higher score)
    const efficiency = Math.max(0, 100 - (processingTime.estimated / 10) * 100);

    // Reliability score (lower risk = higher score)
    const reliability = Math.max(0, 100 - risks.delayProbability * 100);

    // Cost score (simplified - would consider actual costs)
    const cost = 80; // Default

    // Overall score (weighted average)
    const overall = efficiency * 0.4 + reliability * 0.4 + cost * 0.2;

    return {
      overall: Math.round(overall),
      efficiency: Math.round(efficiency),
      reliability: Math.round(reliability),
      cost: Math.round(cost),
    };
  }

  private getCacheKey(
    touchpointId: string,
    arrivalTime: Date,
    compliancePrograms: string[],
  ): string {
    return `${touchpointId}-${arrivalTime.getTime()}-${compliancePrograms.join(",")}`;
  }

  private getCachedAnalysis(key: string): TouchpointAnalysis | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && expiry > new Date()) {
      return this.analysisCache.get(key) || null;
    }
    return null;
  }

  private cacheAnalysis(key: string, analysis: TouchpointAnalysis): void {
    this.analysisCache.set(key, analysis);
    this.cacheExpiry.set(key, new Date(Date.now() + this.CACHE_TTL));
  }
}

export const intelligentTouchpointAnalysisService =
  new IntelligentTouchpointAnalysisService();
