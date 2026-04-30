/**
 * Enhanced Transit Time Calculator
 *
 * Calculates actual transit time considering:
 * - Base driving/flying/sailing time
 * - Truck bans and waiting periods
 * - Facility opening hours
 * - Government agency hours
 * - Touchpoint processing times
 * - Compliance program benefits
 * - Real-time conditions (traffic, weather, congestion)
 *
 * 4IR & 5IR Aligned - AI-Powered Transit Time Intelligence
 */

import type { Location, TransportMode } from "@/types/tms";
import type { Touchpoint } from "@/types/touchpoint";
import {
  intelligentRoutePlanningService,
  type RouteConstraint,
} from "./intelligentRoutePlanningService";
import { transitTimePredictionService } from "./transitTimePredictionService";
import { assertRealInProduction } from "./strictMode";

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedTransitTimeCalculation {
  id: string;
  origin: Location;
  destination: Location;
  mode: TransportMode;

  // Base calculation
  baseTransitTime: number; // hours (pure driving/flying/sailing time)

  // Actual transit time with all constraints
  actualTransitTime: {
    total: number; // hours
    breakdown: {
      driving: number;
      waiting: number; // waiting for bans to lift, opening hours, etc.
      processing: number; // touchpoint processing
      customs: number;
      other: number;
    };
    confidence: number; // 0-1
  };

  // Constraints affecting transit time
  constraints: {
    truckBans: ConstraintImpact[];
    openingHours: ConstraintImpact[];
    governmentAgencyHours: ConstraintImpact[];
    processingTimes: ConstraintImpact[];
    capacity: ConstraintImpact[];
  };

  // Compliance program impact
  complianceProgramImpact?: {
    programs: string[];
    timeReduction: number; // hours
    breakdown: {
      waitingReduction: number;
      processingReduction: number;
      customsReduction: number;
    };
  };

  // Real-time conditions
  realTimeConditions?: {
    traffic: "LIGHT" | "MODERATE" | "HEAVY" | "SEVERE";
    weather: "CLEAR" | "MINOR" | "MODERATE" | "SEVERE";
    congestion: "LOW" | "MEDIUM" | "HIGH";
    impact: number; // hours
  };

  // Predictions
  predictions: {
    optimistic: number; // hours (best case)
    realistic: number; // hours (most likely)
    pessimistic: number; // hours (worst case)
    confidence: number; // 0-1
  };

  // Recommendations
  recommendations: string[];
  warnings: string[];

  // Metadata
  calculatedAt: Date;
  validUntil: Date;
  tenantId: string;
}

export interface ConstraintImpact {
  constraint: RouteConstraint;
  impact: {
    additionalHours: number;
    delayProbability: number;
    canBeMitigated: boolean;
    mitigationPrograms?: string[];
  };
}

export interface TransitTimeCalculationRequest {
  origin: Location;
  destination: Location;
  waypoints?: Location[];
  mode: TransportMode;

  // Cargo details
  cargo?: {
    weight?: number;
    volume?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: "CM" | "M";
    };
    hazmat?: boolean;
    temperatureControlled?: boolean;
    vehicleType?: string;
  };

  // Timing
  departureTime?: Date;
  arrivalWindow?: { earliest: Date; latest: Date };

  // Compliance programs
  compliancePrograms?: string[];

  // Preferences
  preferences?: {
    considerRealTimeConditions?: boolean;
    considerCompliancePrograms?: boolean;
    includePredictions?: boolean;
  };

  tenantId?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class EnhancedTransitTimeCalculator {
  /**
   * Calculate enhanced transit time
   */
  async calculateTransitTime(
    request: TransitTimeCalculationRequest,
  ): Promise<EnhancedTransitTimeCalculation> {
    const {
      origin,
      destination,
      waypoints = [],
      mode,
      cargo,
      departureTime = new Date(),
      arrivalWindow,
      compliancePrograms = [],
      preferences = {},
      tenantId = "default",
    } = request;

    // 1. Get intelligent route plan
    const routePlan =
      await intelligentRoutePlanningService.planIntelligentRoute({
        origin,
        destination,
        waypoints,
        mode,
        type: "FTL",
        cargo,
        timing: {
          earliestDeparture: departureTime,
          latestArrival: arrivalWindow?.latest,
        },
        compliancePrograms,
        preferences: {
          considerCompliancePrograms:
            preferences.considerCompliancePrograms !== false,
        },
        tenantId,
      });

    // 2. Get base transit time
    const baseTransitTime = routePlan.transitTime.base;

    // 3. Calculate actual transit time with constraints
    const actualTransitTime = routePlan.transitTime;

    // 4. Categorize constraints
    const constraints = this.categorizeConstraints(routePlan.constraints);

    // 5. Calculate compliance program impact
    const complianceProgramImpact = this.calculateComplianceProgramImpact(
      routePlan.complianceProgramRecommendations,
      routePlan.constraints,
      compliancePrograms,
    );

    // 6. Get real-time conditions (if enabled)
    const realTimeConditions =
      preferences.considerRealTimeConditions !== false
        ? await this.getRealTimeConditions(
            origin,
            destination,
            mode,
            departureTime,
          )
        : undefined;

    // 7. Get predictions
    const predictions =
      preferences.includePredictions !== false
        ? await this.getPredictions(
            origin,
            destination,
            mode,
            waypoints,
            realTimeConditions,
          )
        : {
            optimistic: actualTransitTime.withConstraints * 0.9,
            realistic: actualTransitTime.withConstraints,
            pessimistic: actualTransitTime.withConstraints * 1.3,
            confidence: actualTransitTime.confidence,
          };

    // 8. Generate recommendations and warnings
    const { recommendations, warnings } = this.generateRecommendations(
      routePlan,
      constraints,
      complianceProgramImpact,
      realTimeConditions,
    );

    return {
      id: `transit-time-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      origin,
      destination,
      mode,
      baseTransitTime,
      actualTransitTime: {
        total: actualTransitTime.withConstraints,
        breakdown: actualTransitTime.breakdown,
        confidence: actualTransitTime.confidence,
      },
      constraints,
      complianceProgramImpact,
      realTimeConditions,
      predictions,
      recommendations,
      warnings,
      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
      tenantId,
    };
  }

  /**
   * Categorize constraints by type
   */
  private categorizeConstraints(
    constraints: RouteConstraint[],
  ): EnhancedTransitTimeCalculation["constraints"] {
    const truckBans: ConstraintImpact[] = [];
    const openingHours: ConstraintImpact[] = [];
    const governmentAgencyHours: ConstraintImpact[] = [];
    const processingTimes: ConstraintImpact[] = [];
    const capacity: ConstraintImpact[] = [];

    for (const constraint of constraints) {
      const impact: ConstraintImpact = {
        constraint,
        impact: {
          additionalHours: constraint.impactOnTransitTime?.additionalHours || 0,
          delayProbability:
            constraint.impactOnTransitTime?.delayProbability || 0,
          canBeMitigated:
            (constraint.complianceProgramBenefits?.length || 0) > 0,
          mitigationPrograms: constraint.complianceProgramBenefits?.map(
            (b) => b.programId || "",
          ),
        },
      };

      switch (constraint.type) {
        case "TRUCK_BAN":
          truckBans.push(impact);
          break;
        case "OPENING_HOURS":
          openingHours.push(impact);
          break;
        case "GOVERNMENT_AGENCY_HOURS":
          governmentAgencyHours.push(impact);
          break;
        case "PROCESSING_TIME":
          processingTimes.push(impact);
          break;
        case "CAPACITY":
          capacity.push(impact);
          break;
      }
    }

    return {
      truckBans,
      openingHours,
      governmentAgencyHours,
      processingTimes,
      capacity,
    };
  }

  /**
   * Calculate compliance program impact
   */
  private calculateComplianceProgramImpact(
    recommendations: IntelligentRoutePlanningService["complianceProgramRecommendations"],
    constraints: RouteConstraint[],
    enrolledPrograms: string[],
  ): EnhancedTransitTimeCalculation["complianceProgramImpact"] | undefined {
    if (recommendations.length === 0 && enrolledPrograms.length === 0) {
      return undefined;
    }

    let waitingReduction = 0;
    let processingReduction = 0;
    let customsReduction = 0;

    // Calculate impact from enrolled programs
    for (const constraint of constraints) {
      if (constraint.complianceProgramBenefits) {
        for (const benefit of constraint.complianceProgramBenefits) {
          if (enrolledPrograms.includes(benefit.programId || "")) {
            if (
              benefit.benefitType === "FAST_TRACK" ||
              benefit.benefitType === "REDUCED_PROCESSING"
            ) {
              processingReduction += benefit.timeReduction || 0;
            }
            if (benefit.benefitType === "WAIVED_RESTRICTION") {
              waitingReduction += benefit.timeReduction || 0;
            }
            if (constraint.authority?.type === "CUSTOMS") {
              customsReduction += benefit.timeReduction || 0;
            }
          }
        }
      }
    }

    // Calculate potential impact from recommended programs
    for (const rec of recommendations) {
      if (rec.eligibility && !rec.applicationRequired) {
        // Already enrolled, impact already calculated above
        continue;
      }
      // Would add potential impact if enrolled
    }

    const totalReduction =
      waitingReduction + processingReduction + customsReduction;

    if (totalReduction === 0) {
      return undefined;
    }

    return {
      programs: enrolledPrograms,
      timeReduction: totalReduction,
      breakdown: {
        waitingReduction,
        processingReduction,
        customsReduction,
      },
    };
  }

  /**
   * Get real-time conditions
   */
  private async getRealTimeConditions(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    departureTime: Date,
  ): Promise<EnhancedTransitTimeCalculation["realTimeConditions"]> {
    // In production, integrate with:
    // - Traffic APIs (Google Maps, Waze, etc.)
    // - Weather APIs
    // - Port/airport congestion APIs
    // - Real-time sensor data

    // For now, return mock data
    assertRealInProduction(
      "tms.transitTime.realTimeConditions",
      "Real-time conditions are currently mocked. Configure traffic/weather/congestion data sources for production.",
    );
    return {
      traffic: mode === "LAND" ? "MODERATE" : undefined,
      weather: "CLEAR",
      congestion: "LOW",
      impact: 0.5, // hours
    };
  }

  /**
   * Get predictions
   */
  private async getPredictions(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    waypoints: Location[],
    realTimeConditions?: EnhancedTransitTimeCalculation["realTimeConditions"],
  ): Promise<EnhancedTransitTimeCalculation["predictions"]> {
    // Use transit time prediction service
    const prediction = await transitTimePredictionService.predictTransitTime({
      origin,
      destination,
      mode,
      waypoints,
    });

    // Adjust based on real-time conditions
    if (realTimeConditions) {
      const adjustment = realTimeConditions.impact;
      return {
        optimistic: prediction.predictions.optimistic + adjustment * 0.5,
        realistic: prediction.predictions.realistic + adjustment,
        pessimistic: prediction.predictions.pessimistic + adjustment * 1.5,
        confidence: prediction.predictions.confidence * 0.9, // Slightly lower confidence with real-time
      };
    }

    return prediction.predictions;
  }

  /**
   * Generate recommendations and warnings
   */
  private generateRecommendations(
    routePlan: Awaited<
      ReturnType<typeof intelligentRoutePlanningService.planIntelligentRoute>
    >,
    constraints: EnhancedTransitTimeCalculation["constraints"],
    complianceProgramImpact: EnhancedTransitTimeCalculation["complianceProgramImpact"],
    realTimeConditions?: EnhancedTransitTimeCalculation["realTimeConditions"],
  ): { recommendations: string[]; warnings: string[] } {
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Warnings
    if (constraints.truckBans.length > 0) {
      warnings.push(
        `${constraints.truckBans.length} truck ban(s) may cause delays`,
      );
    }
    if (constraints.capacity.length > 0) {
      warnings.push(
        `${constraints.capacity.length} location(s) at high capacity`,
      );
    }
    if (realTimeConditions && realTimeConditions.traffic === "SEVERE") {
      warnings.push("Severe traffic conditions expected");
    }
    if (realTimeConditions && realTimeConditions.weather === "SEVERE") {
      warnings.push("Severe weather conditions may cause delays");
    }

    // Recommendations
    if (complianceProgramImpact && complianceProgramImpact.timeReduction > 0) {
      recommendations.push(
        `Enrolled compliance programs reduce transit time by ${complianceProgramImpact.timeReduction.toFixed(1)} hours`,
      );
    }

    if (routePlan.complianceProgramRecommendations.length > 0) {
      const topRec = routePlan.complianceProgramRecommendations[0];
      if (topRec.eligibility && topRec.applicationRequired) {
        recommendations.push(
          `Apply for ${topRec.programName} to reduce transit time by ${topRec.timeReduction.toFixed(1)} hours`,
        );
      }
    }

    if (constraints.truckBans.length > 0) {
      recommendations.push(
        "Consider adjusting departure time to avoid truck bans",
      );
    }

    if (realTimeConditions && realTimeConditions.traffic === "HEAVY") {
      recommendations.push(
        "Consider alternative route or departure time to avoid heavy traffic",
      );
    }

    return { recommendations, warnings };
  }
}

export const enhancedTransitTimeCalculator =
  new EnhancedTransitTimeCalculator();
