/**
 * Intelligent Route Planning Service
 *
 * Comprehensive route planning that considers:
 * - Truck bans and vehicle restrictions
 * - Facility opening hours
 * - Government agency operating hours (customs, environment, health, etc.)
 * - Touchpoint processing times
 * - Compliance program benefits (AEO, Golden List, TIR, etc.)
 * - Real-time constraints and conditions
 *
 * 4IR & 5IR Aligned - AI-Powered Intelligent Routing
 * Vision 2024 - Industry-Leading Route Intelligence
 */

import type { Location, Route, TransportMode, ShipmentType } from "@/types/tms";
import type {
  Touchpoint,
  TouchpointType,
  OperatingHours,
  TouchpointStatus,
} from "@/types/touchpoint";
import { touchpointService } from "@/lib/services/customs/touchpointService";
import { tradeProgramAdvisorService } from "@/lib/services/trade-compliance/tradeProgramAdvisorService";
import { eventBus, createEvent } from "@/lib/services/event-store";

// Types are defined below, no need to re-export from self

// ============================================================================
// TYPES
// ============================================================================

export interface RouteConstraint {
  id: string;
  type:
    | "TRUCK_BAN"
    | "OPENING_HOURS"
    | "GOVERNMENT_AGENCY_HOURS"
    | "PROCESSING_TIME"
    | "CAPACITY"
    | "RESTRICTION";
  location: {
    coordinates: { lat: number; lng: number };
    radius?: number; // km
    address?: string;
  };
  description: string;

  // Time-based constraints
  timeRestrictions?: {
    days?: string[]; // ['MONDAY', 'TUESDAY', ...]
    timeRange?: { start: string; end: string }; // HH:mm format
    dates?: { from: Date; to: Date }[];
    timezone: string;
  };

  // Vehicle restrictions
  vehicleRestrictions?: {
    vehicleTypes?: string[]; // ['TRUCK', 'TRAILER', 'CONTAINER']
    weightLimit?: number; // kg
    heightLimit?: number; // meters
    lengthLimit?: number; // meters
    axleLoadLimit?: number; // tons
    hazmatAllowed?: boolean;
    temperatureControlled?: boolean;
  };

  // Impact on transit time
  impactOnTransitTime?: {
    additionalHours?: number;
    delayProbability?: number; // 0-1
    alternativeRouteRequired?: boolean;
  };

  // Compliance program benefits
  complianceProgramBenefits?: {
    programId?: string; // AEO, Golden List, TIR, etc.
    benefitType?:
      | "FAST_TRACK"
      | "REDUCED_PROCESSING"
      | "WAIVED_RESTRICTION"
      | "PRIORITY_PROCESSING";
    timeReduction?: number; // hours
    probabilityReduction?: number; // 0-1
  }[];

  // Authority/agency
  authority?: {
    name: string;
    type:
      | "CUSTOMS"
      | "ENVIRONMENT"
      | "HEALTH"
      | "TRANSPORT"
      | "TRADE"
      | "SECURITY"
      | "OTHER";
    code?: string;
    contact?: {
      phone?: string;
      email?: string;
      website?: string;
    };
  };

  // Metadata
  source:
    | "GOVERNMENT"
    | "FACILITY"
    | "TOUCHPOINT"
    | "REAL_TIME"
    | "HISTORICAL"
    | "MANUAL";
  confidence: number; // 0-1
  lastUpdated: Date;
  validUntil?: Date;
}

export interface IntelligentRoutePlan {
  id: string;
  origin: Location;
  destination: Location;
  waypoints: Location[];
  mode: TransportMode;
  type: ShipmentType;

  // Route segments with constraints
  segments: RouteSegment[];

  // Calculated transit time (considering all constraints)
  transitTime: {
    base: number; // hours (without constraints)
    withConstraints: number; // hours (with all constraints)
    breakdown: {
      driving: number;
      waiting: number; // waiting for opening hours, bans to lift, etc.
      processing: number; // touchpoint processing times
      customs: number;
      other: number;
    };
    confidence: number; // 0-1
  };

  // Constraints affecting this route
  constraints: RouteConstraint[];
  constraintImpact: {
    totalDelay: number; // hours
    criticalConstraints: RouteConstraint[];
    warnings: string[];
    recommendations: string[];
  };

  // Compliance program recommendations
  complianceProgramRecommendations: {
    programId: string;
    programName: string;
    benefit: string;
    timeReduction: number; // hours
    costReduction?: number;
    eligibility: boolean;
    applicationRequired: boolean;
  }[];

  // Alternative routes (if constraints make route infeasible)
  alternativeRoutes?: IntelligentRoutePlan[];

  // Route score
  score: {
    overall: number; // 0-100
    feasibility: number; // 0-100 (can this route be completed?)
    efficiency: number; // 0-100 (how efficient is this route?)
    reliability: number; // 0-100 (how reliable is this route?)
    cost: number; // 0-100 (cost efficiency)
  };

  // Metadata
  generatedAt: Date;
  validUntil: Date;
  tenantId: string;
}

export interface RouteSegment {
  id: string;
  from: Location;
  to: Location;
  distance: number; // km
  estimatedDrivingTime: number; // hours

  // Constraints on this segment
  constraints: RouteConstraint[];

  // Touchpoints on this segment
  touchpoints: {
    touchpoint: Touchpoint;
    estimatedArrival: Date;
    estimatedDeparture: Date;
    processingTime: number; // hours
    constraints: RouteConstraint[];
  }[];

  // Calculated time for this segment
  segmentTime: {
    driving: number;
    waiting: number;
    processing: number;
    total: number;
  };
}

export interface IntelligentRoutePlanningRequest {
  origin: Location;
  destination: Location;
  waypoints?: Location[];
  mode: TransportMode;
  type: ShipmentType;

  // Cargo details
  cargo?: {
    weight?: number; // kg
    volume?: number; // m³
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

  // Timing preferences
  timing?: {
    earliestDeparture?: Date;
    latestArrival?: Date;
    preferredDeparture?: Date;
    preferredArrival?: Date;
  };

  // Compliance programs (if applicable)
  compliancePrograms?: string[]; // ['AEO', 'GOLDEN_LIST', 'TIR', etc.]

  // Preferences
  preferences?: {
    avoidTruckBans?: boolean;
    prioritizeFastest?: boolean;
    minimizeCost?: boolean;
    maximizeReliability?: boolean;
    considerCompliancePrograms?: boolean;
  };

  tenantId?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class IntelligentRoutePlanningService {
  private constraintCache: Map<string, RouteConstraint[]> = new Map();
  private cacheExpiry: Map<string, Date> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Plan intelligent route considering all constraints
   */
  async planIntelligentRoute(
    request: IntelligentRoutePlanningRequest,
  ): Promise<IntelligentRoutePlan> {
    const {
      origin,
      destination,
      waypoints = [],
      mode,
      type,
      cargo,
      timing,
      compliancePrograms = [],
      preferences = {},
      tenantId = "default",
    } = request;

    // 1. Get all constraints along the route
    const constraints = await this.getRouteConstraints(
      origin,
      destination,
      waypoints,
      mode,
      cargo,
      tenantId,
    );

    // 2. Identify touchpoints along the route
    const touchpoints = await this.identifyTouchpoints(
      origin,
      destination,
      waypoints,
      mode,
      tenantId,
    );

    // 3. Build route segments with constraints
    const segments = await this.buildRouteSegments(
      origin,
      destination,
      waypoints,
      mode,
      constraints,
      touchpoints,
      timing,
      tenantId,
    );

    // 4. Calculate transit time considering all constraints
    const transitTime = this.calculateTransitTimeWithConstraints(
      segments,
      constraints,
      timing,
      compliancePrograms,
    );

    // 5. Get compliance program recommendations
    const complianceProgramRecommendations =
      await this.getComplianceProgramRecommendations(
        origin,
        destination,
        constraints,
        cargo,
        tenantId,
      );

    // 6. Calculate route score
    const score = this.calculateRouteScore(
      segments,
      constraints,
      transitTime,
      complianceProgramRecommendations,
    );

    // 7. Generate recommendations and warnings
    const constraintImpact = this.analyzeConstraintImpact(
      constraints,
      transitTime,
      complianceProgramRecommendations,
    );

    // 8. Check if route is feasible, generate alternatives if needed
    const alternativeRoutes = await this.generateAlternativeRoutesIfNeeded(
      request,
      constraints,
      score,
    );

    const plan: IntelligentRoutePlan = {
      id: `route-plan-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      origin,
      destination,
      waypoints,
      mode,
      type,
      segments,
      transitTime,
      constraints,
      constraintImpact,
      complianceProgramRecommendations,
      alternativeRoutes,
      score,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
      tenantId,
    };

    // Publish event
    await eventBus.publish(
      createEvent(
        "IntelligentRoutePlanGenerated",
        plan.id,
        "RoutePlan",
        {
          origin: origin.name || origin.address.city,
          destination: destination.name || destination.address.city,
          mode,
          transitTime: transitTime.withConstraints,
          constraintsCount: constraints.length,
          score: score.overall,
        },
        1,
        {
          tenantId,
          correlationId: `route-plan-${Date.now()}`,
          userId: "intelligent-route-planning-service",
        },
      ),
    );

    return plan;
  }

  /**
   * Get all constraints along the route
   */
  private async getRouteConstraints(
    origin: Location,
    destination: Location,
    waypoints: Location[],
    mode: TransportMode,
    cargo?: IntelligentRoutePlanningRequest["cargo"],
    tenantId: string = "default",
  ): Promise<RouteConstraint[]> {
    const constraints: RouteConstraint[] = [];
    const routePoints = [origin, ...waypoints, destination];

    // Check cache
    const cacheKey = this.getCacheKey(routePoints, mode, cargo);
    const cached = this.getCachedConstraints(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Get truck bans and vehicle restrictions
    const truckBans = await this.getTruckBans(
      routePoints,
      mode,
      cargo,
      tenantId,
    );
    constraints.push(...truckBans);

    // 2. Get facility opening hours
    const facilityHours = await this.getFacilityOpeningHours(
      routePoints,
      tenantId,
    );
    constraints.push(...facilityHours);

    // 3. Get government agency hours
    const governmentHours = await this.getGovernmentAgencyHours(
      routePoints,
      tenantId,
    );
    constraints.push(...governmentHours);

    // 4. Get processing time constraints from touchpoints
    const processingConstraints = await this.getProcessingTimeConstraints(
      routePoints,
      tenantId,
    );
    constraints.push(...processingConstraints);

    // 5. Get capacity constraints
    const capacityConstraints = await this.getCapacityConstraints(
      routePoints,
      tenantId,
    );
    constraints.push(...capacityConstraints);

    // Cache constraints
    this.cacheConstraints(cacheKey, constraints);

    return constraints;
  }

  /**
   * Get truck bans and vehicle restrictions
   */
  private async getTruckBans(
    routePoints: Location[],
    mode: TransportMode,
    cargo?: IntelligentRoutePlanningRequest["cargo"],
    tenantId: string = "default",
  ): Promise<RouteConstraint[]> {
    const bans: RouteConstraint[] = [];

    // In production, integrate with:
    // - Government transport authority APIs (TGA, MOT)
    // - Real-time traffic management systems
    // - Historical ban data
    // - City/region specific restrictions

    for (const point of routePoints) {
      if (!point.coordinates) continue;

      // Example: Check for truck bans in city centers during certain hours
      // This would integrate with real government APIs
      const cityCenterBans = this.getCityCenterTruckBans(point, cargo);
      bans.push(...cityCenterBans);

      // Check for weight/height restrictions on specific roads
      const roadRestrictions = this.getRoadRestrictions(point, cargo);
      bans.push(...roadRestrictions);
    }

    return bans;
  }

  /**
   * Get facility opening hours
   */
  private async getFacilityOpeningHours(
    routePoints: Location[],
    tenantId: string = "default",
  ): Promise<RouteConstraint[]> {
    const constraints: RouteConstraint[] = [];

    for (const point of routePoints) {
      // Get touchpoint if it's a facility
      try {
        const touchpoints = await touchpointService.findTouchpoints({
          nearLocation: point.coordinates
            ? {
                coordinates: point.coordinates,
                radius: 5, // 5km radius
              }
            : undefined,
        });

        for (const touchpoint of touchpoints) {
          if (
            touchpoint.type === "FACILITY" ||
            touchpoint.type === "BONDED_WAREHOUSE"
          ) {
            constraints.push({
              id: `facility-hours-${touchpoint.id}`,
              type: "OPENING_HOURS",
              location: {
                coordinates: touchpoint.coordinates,
                address: touchpoint.address.street,
              },
              description: `${touchpoint.name} operating hours`,
              timeRestrictions: {
                days: this.getOperatingDays(touchpoint.operatingHours),
                timezone: touchpoint.timezone,
              },
              impactOnTransitTime: {
                additionalHours: this.calculateWaitTime(
                  touchpoint.operatingHours,
                ),
                delayProbability: 0.3,
              },
              authority: {
                name: touchpoint.name,
                type: "OTHER",
              },
              source: "TOUCHPOINT",
              confidence: 0.9,
              lastUpdated: touchpoint.lastUpdated,
            });
          }
        }
      } catch (error) {
        console.warn(`Error getting facility hours for ${point.name}:`, error);
      }
    }

    return constraints;
  }

  /**
   * Get government agency operating hours
   */
  private async getGovernmentAgencyHours(
    routePoints: Location[],
    tenantId: string = "default",
  ): Promise<RouteConstraint[]> {
    const constraints: RouteConstraint[] = [];

    for (const point of routePoints) {
      // Get regulatory offices and customs offices
      try {
        const touchpoints = await touchpointService.findTouchpoints({
          nearLocation: point.coordinates
            ? {
                coordinates: point.coordinates,
                radius: 10, // 10km radius
              }
            : undefined,
          type: "REGULATORY_OFFICE",
        });

        for (const touchpoint of touchpoints) {
          if (touchpoint.type === "REGULATORY_OFFICE") {
            // Map touchpoint to government agency
            const agencyType = this.mapTouchpointToAgency(touchpoint);

            constraints.push({
              id: `gov-agency-hours-${touchpoint.id}`,
              type: "GOVERNMENT_AGENCY_HOURS",
              location: {
                coordinates: touchpoint.coordinates,
                address: touchpoint.address.street,
              },
              description: `${touchpoint.name} (${agencyType.name}) operating hours`,
              timeRestrictions: {
                days: this.getOperatingDays(touchpoint.operatingHours),
                timezone: touchpoint.timezone,
              },
              impactOnTransitTime: {
                additionalHours: this.calculateWaitTime(
                  touchpoint.operatingHours,
                ),
                delayProbability: 0.4, // Government agencies often have delays
              },
              authority: {
                name: touchpoint.name,
                type: agencyType.type,
                code: touchpoint.customsOfficeCode,
                contact: {
                  phone: touchpoint.phone,
                  email: touchpoint.email,
                  website: touchpoint.website,
                },
              },
              source: "GOVERNMENT",
              confidence: 0.95,
              lastUpdated: touchpoint.lastUpdated,
            });
          }
        }
      } catch (error) {
        console.warn(
          `Error getting government agency hours for ${point.name}:`,
          error,
        );
      }
    }

    return constraints;
  }

  /**
   * Get processing time constraints from touchpoints
   */
  private async getProcessingTimeConstraints(
    routePoints: Location[],
    tenantId: string = "default",
  ): Promise<RouteConstraint[]> {
    const constraints: RouteConstraint[] = [];

    for (const point of routePoints) {
      try {
        const touchpoints = await touchpointService.findTouchpoints({
          nearLocation: point.coordinates
            ? {
                coordinates: point.coordinates,
                radius: 5,
              }
            : undefined,
        });

        for (const touchpoint of touchpoints) {
          if (touchpoint.averageProcessingTime) {
            constraints.push({
              id: `processing-time-${touchpoint.id}`,
              type: "PROCESSING_TIME",
              location: {
                coordinates: touchpoint.coordinates,
                address: touchpoint.address.street,
              },
              description: `${touchpoint.name} processing time`,
              impactOnTransitTime: {
                additionalHours: touchpoint.averageProcessingTime.average,
                delayProbability:
                  touchpoint.congestionLevel === "HIGH" ? 0.6 : 0.3,
              },
              authority: {
                name: touchpoint.name,
                type: "CUSTOMS",
              },
              source: "TOUCHPOINT",
              confidence: 0.85,
              lastUpdated: touchpoint.lastUpdated,
            });
          }
        }
      } catch (error) {
        console.warn(
          `Error getting processing time constraints for ${point.name}:`,
          error,
        );
      }
    }

    return constraints;
  }

  /**
   * Get capacity constraints
   */
  private async getCapacityConstraints(
    routePoints: Location[],
    tenantId: string = "default",
  ): Promise<RouteConstraint[]> {
    const constraints: RouteConstraint[] = [];

    for (const point of routePoints) {
      try {
        const touchpoints = await touchpointService.findTouchpoints({
          nearLocation: point.coordinates
            ? {
                coordinates: point.coordinates,
                radius: 5,
              }
            : undefined,
        });

        for (const touchpoint of touchpoints) {
          if (touchpoint.currentUtilization > 90) {
            constraints.push({
              id: `capacity-${touchpoint.id}`,
              type: "CAPACITY",
              location: {
                coordinates: touchpoint.coordinates,
                address: touchpoint.address.street,
              },
              description: `${touchpoint.name} is at ${touchpoint.currentUtilization}% capacity`,
              impactOnTransitTime: {
                additionalHours: touchpoint.currentUtilization > 95 ? 4 : 2,
                delayProbability: touchpoint.currentUtilization / 100,
              },
              source: "REAL_TIME",
              confidence: 0.9,
              lastUpdated: new Date(),
            });
          }
        }
      } catch (error) {
        console.warn(
          `Error getting capacity constraints for ${point.name}:`,
          error,
        );
      }
    }

    return constraints;
  }

  /**
   * Identify touchpoints along the route
   */
  private async identifyTouchpoints(
    origin: Location,
    destination: Location,
    waypoints: Location[],
    mode: TransportMode,
    tenantId: string = "default",
  ): Promise<Touchpoint[]> {
    const touchpoints: Touchpoint[] = [];
    const routePoints = [origin, ...waypoints, destination];

    for (const point of routePoints) {
      if (!point.coordinates) continue;

      try {
        const nearby = await touchpointService.findTouchpoints({
          nearLocation: {
            coordinates: point.coordinates,
            radius: 10, // 10km radius
          },
          transportMode: mode,
        });

        touchpoints.push(...nearby);
      } catch (error) {
        console.warn(`Error identifying touchpoints for ${point.name}:`, error);
      }
    }

    return touchpoints;
  }

  /**
   * Build route segments with constraints
   */
  private async buildRouteSegments(
    origin: Location,
    destination: Location,
    waypoints: Location[],
    mode: TransportMode,
    constraints: RouteConstraint[],
    touchpoints: Touchpoint[],
    timing?: IntelligentRoutePlanningRequest["timing"],
    tenantId: string = "default",
  ): Promise<RouteSegment[]> {
    const segments: RouteSegment[] = [];
    const routePoints = [origin, ...waypoints, destination];

    for (let i = 0; i < routePoints.length - 1; i++) {
      const from = routePoints[i];
      const to = routePoints[i + 1];

      // Calculate distance and driving time
      const distance = this.calculateDistance(from, to);
      const estimatedDrivingTime = this.estimateDrivingTime(distance, mode);

      // Get constraints affecting this segment
      const segmentConstraints = this.getConstraintsForSegment(
        from,
        to,
        constraints,
      );

      // Get touchpoints on this segment
      const segmentTouchpoints = this.getTouchpointsForSegment(
        from,
        to,
        touchpoints,
      );

      // Calculate segment time
      const segmentTime = this.calculateSegmentTime(
        estimatedDrivingTime,
        segmentConstraints,
        segmentTouchpoints,
        timing,
      );

      segments.push({
        id: `segment-${i}-${Date.now()}`,
        from,
        to,
        distance,
        estimatedDrivingTime,
        constraints: segmentConstraints,
        touchpoints: segmentTouchpoints,
        segmentTime,
      });
    }

    return segments;
  }

  /**
   * Calculate transit time considering all constraints
   */
  private calculateTransitTimeWithConstraints(
    segments: RouteSegment[],
    constraints: RouteConstraint[],
    timing?: IntelligentRoutePlanningRequest["timing"],
    compliancePrograms: string[] = [],
  ): IntelligentRoutePlan["transitTime"] {
    let totalDriving = 0;
    let totalWaiting = 0;
    let totalProcessing = 0;
    let totalCustoms = 0;
    let totalOther = 0;

    for (const segment of segments) {
      totalDriving += segment.segmentTime.driving;
      totalWaiting += segment.segmentTime.waiting;
      totalProcessing += segment.segmentTime.processing;

      // Add customs time if applicable
      for (const tp of segment.touchpoints) {
        if (
          tp.touchpoint.type === "BORDER" ||
          tp.touchpoint.type === "CUSTOMS_OFFICE"
        ) {
          totalCustoms += tp.processingTime;
        } else {
          totalOther += tp.processingTime;
        }
      }
    }

    // Apply compliance program benefits
    const complianceBenefits = this.calculateComplianceBenefits(
      constraints,
      compliancePrograms,
    );

    totalWaiting = Math.max(
      0,
      totalWaiting - complianceBenefits.waitingReduction,
    );
    totalProcessing = Math.max(
      0,
      totalProcessing - complianceBenefits.processingReduction,
    );
    totalCustoms = Math.max(
      0,
      totalCustoms - complianceBenefits.customsReduction,
    );

    const base = totalDriving;
    const withConstraints =
      totalDriving + totalWaiting + totalProcessing + totalCustoms + totalOther;

    // Calculate confidence based on constraint confidence
    const avgConfidence =
      constraints.length > 0
        ? constraints.reduce((sum, c) => sum + c.confidence, 0) /
          constraints.length
        : 0.9;

    return {
      base,
      withConstraints,
      breakdown: {
        driving: totalDriving,
        waiting: totalWaiting,
        processing: totalProcessing,
        customs: totalCustoms,
        other: totalOther,
      },
      confidence: avgConfidence,
    };
  }

  /**
   * Get compliance program recommendations
   */
  private async getComplianceProgramRecommendations(
    origin: Location,
    destination: Location,
    constraints: RouteConstraint[],
    cargo?: IntelligentRoutePlanningRequest["cargo"],
    tenantId: string = "default",
  ): Promise<IntelligentRoutePlan["complianceProgramRecommendations"]> {
    const recommendations: IntelligentRoutePlan["complianceProgramRecommendations"] =
      [];

    // Check which constraints could be mitigated by compliance programs
    const customsConstraints = constraints.filter(
      (c) => c.authority?.type === "CUSTOMS" || c.type === "PROCESSING_TIME",
    );

    if (customsConstraints.length > 0) {
      // Get AEO recommendations
      try {
        // Note: tradeProgramAdvisorService.recommendPrograms may have different signature
        // This is a simplified implementation - adjust based on actual service interface
        const aeoRecommendation =
          await tradeProgramAdvisorService.recommendPrograms({
            originCountry: origin.address.countryCode,
            destinationCountry: destination.address.countryCode,
            shipmentType: cargo?.hazmat ? "HAZMAT" : "GENERAL",
            volume: cargo?.volume || 0,
            frequency: "REGULAR",
          } as any);

        for (const program of aeoRecommendation.recommendations || []) {
          if (
            program.program?.type === "AEO" ||
            program.program?.type === "GOLDEN_LIST"
          ) {
            const timeReduction = customsConstraints.reduce((sum, c) => {
              const benefit = c.complianceProgramBenefits?.find(
                (b) => b.programId === program.program?.id,
              );
              return sum + (benefit?.timeReduction || 0);
            }, 0);

            if (timeReduction > 0) {
              recommendations.push({
                programId: program.program.id,
                programName: program.program.name,
                benefit: `Reduces processing time by ${timeReduction.toFixed(1)} hours`,
                timeReduction,
                eligibility: program.eligibility?.isEligible || false,
                applicationRequired: !program.eligibility?.isEnrolled,
              });
            }
          }
        }
      } catch (error) {
        console.warn(
          "Error getting compliance program recommendations:",
          error,
        );
      }
    }

    return recommendations;
  }

  /**
   * Calculate route score
   */
  private calculateRouteScore(
    segments: RouteSegment[],
    constraints: RouteConstraint[],
    transitTime: IntelligentRoutePlan["transitTime"],
    complianceProgramRecommendations: IntelligentRoutePlan["complianceProgramRecommendations"],
  ): IntelligentRoutePlan["score"] {
    // Feasibility: Can this route be completed?
    const criticalConstraints = constraints.filter(
      (c) => c.impactOnTransitTime?.alternativeRouteRequired === true,
    );
    const feasibility = criticalConstraints.length === 0 ? 100 : 0;

    // Efficiency: How efficient is this route?
    const efficiencyRatio = transitTime.base / transitTime.withConstraints;
    const efficiency = Math.min(100, efficiencyRatio * 100);

    // Reliability: How reliable is this route?
    const avgDelayProbability =
      constraints.length > 0
        ? constraints.reduce(
            (sum, c) => sum + (c.impactOnTransitTime?.delayProbability || 0),
            0,
          ) / constraints.length
        : 0;
    const reliability = Math.max(0, 100 - avgDelayProbability * 100);

    // Cost: Simplified - lower transit time = lower cost (in reality, would consider actual costs)
    const cost = Math.max(0, 100 - transitTime.withConstraints / 100);

    // Overall score (weighted average)
    const overall =
      feasibility * 0.3 + efficiency * 0.25 + reliability * 0.25 + cost * 0.2;

    return {
      overall: Math.round(overall),
      feasibility: Math.round(feasibility),
      efficiency: Math.round(efficiency),
      reliability: Math.round(reliability),
      cost: Math.round(cost),
    };
  }

  /**
   * Analyze constraint impact
   */
  private analyzeConstraintImpact(
    constraints: RouteConstraint[],
    transitTime: IntelligentRoutePlan["transitTime"],
    complianceProgramRecommendations: IntelligentRoutePlan["complianceProgramRecommendations"],
  ): IntelligentRoutePlan["constraintImpact"] {
    const totalDelay = transitTime.withConstraints - transitTime.base;
    const criticalConstraints = constraints.filter(
      (c) =>
        c.impactOnTransitTime?.delayProbability &&
        c.impactOnTransitTime.delayProbability > 0.7,
    );

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Generate warnings
    if (totalDelay > 24) {
      warnings.push(
        `Route has significant delays: ${totalDelay.toFixed(1)} hours`,
      );
    }
    if (criticalConstraints.length > 0) {
      warnings.push(
        `${criticalConstraints.length} critical constraints may cause delays`,
      );
    }

    // Generate recommendations
    if (complianceProgramRecommendations.length > 0) {
      const topProgram = complianceProgramRecommendations[0];
      if (topProgram.eligibility && !topProgram.applicationRequired) {
        recommendations.push(
          `Enroll in ${topProgram.programName} to reduce transit time by ${topProgram.timeReduction.toFixed(1)} hours`,
        );
      } else if (topProgram.eligibility && topProgram.applicationRequired) {
        recommendations.push(
          `Apply for ${topProgram.programName} to reduce transit time by ${topProgram.timeReduction.toFixed(1)} hours`,
        );
      }
    }

    return {
      totalDelay,
      criticalConstraints,
      warnings,
      recommendations,
    };
  }

  /**
   * Generate alternative routes if needed
   */
  private async generateAlternativeRoutesIfNeeded(
    request: IntelligentRoutePlanningRequest,
    constraints: RouteConstraint[],
    score: IntelligentRoutePlan["score"],
  ): Promise<IntelligentRoutePlan[] | undefined> {
    // If route is not feasible or score is too low, generate alternatives
    if (score.feasibility === 0 || score.overall < 50) {
      // In production, would use route optimization algorithms
      // For now, return undefined (would implement actual alternative generation)
      return undefined;
    }

    return undefined;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getCacheKey(
    routePoints: Location[],
    mode: TransportMode,
    cargo?: IntelligentRoutePlanningRequest["cargo"],
  ): string {
    const points = routePoints
      .map((p) =>
        p.coordinates
          ? `${p.coordinates.lat},${p.coordinates.lng}`
          : p.address.city,
      )
      .join("|");
    const cargoKey = cargo ? `${cargo.weight}-${cargo.volume}` : "none";
    return `${points}|${mode}|${cargoKey}`;
  }

  private getCachedConstraints(key: string): RouteConstraint[] | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && expiry > new Date()) {
      return this.constraintCache.get(key) || null;
    }
    return null;
  }

  private cacheConstraints(key: string, constraints: RouteConstraint[]): void {
    this.constraintCache.set(key, constraints);
    this.cacheExpiry.set(key, new Date(Date.now() + this.CACHE_TTL));
  }

  private getCityCenterTruckBans(
    point: Location,
    cargo?: IntelligentRoutePlanningRequest["cargo"],
  ): RouteConstraint[] {
    // In production, integrate with real government APIs
    // This is a simplified example
    const bans: RouteConstraint[] = [];

    // Example: Riyadh city center truck ban (6 AM - 10 PM)
    if (point.address.city === "Riyadh" && point.address.countryCode === "SA") {
      bans.push({
        id: `truck-ban-riyadh-${Date.now()}`,
        type: "TRUCK_BAN",
        location: {
          coordinates: point.coordinates || { lat: 24.7136, lng: 46.6753 },
          radius: 10,
          address: "Riyadh City Center",
        },
        description: "Riyadh city center truck ban",
        timeRestrictions: {
          days: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
          ],
          timeRange: { start: "06:00", end: "22:00" },
          timezone: "Asia/Riyadh",
        },
        vehicleRestrictions: {
          vehicleTypes: ["TRUCK", "TRAILER"],
        },
        impactOnTransitTime: {
          additionalHours: 2,
          delayProbability: 0.8,
        },
        authority: {
          name: "Riyadh Municipality",
          type: "TRANSPORT",
        },
        source: "GOVERNMENT",
        confidence: 0.95,
        lastUpdated: new Date(),
      });
    }

    return bans;
  }

  private getRoadRestrictions(
    point: Location,
    cargo?: IntelligentRoutePlanningRequest["cargo"],
  ): RouteConstraint[] {
    const restrictions: RouteConstraint[] = [];

    // Example: Weight restrictions on certain roads
    if (cargo && cargo.weight && cargo.weight > 40000) {
      // 40 tons
      restrictions.push({
        id: `weight-restriction-${Date.now()}`,
        type: "RESTRICTION",
        location: {
          coordinates: point.coordinates || { lat: 0, lng: 0 },
          radius: 5,
        },
        description: "Weight restriction on route",
        vehicleRestrictions: {
          weightLimit: 40000,
        },
        impactOnTransitTime: {
          additionalHours: 1,
          delayProbability: 0.5,
          alternativeRouteRequired: true,
        },
        source: "GOVERNMENT",
        confidence: 0.9,
        lastUpdated: new Date(),
      });
    }

    return restrictions;
  }

  private getOperatingDays(operatingHours: OperatingHours): string[] {
    const days: string[] = [];
    if (operatingHours.monday && !operatingHours.monday.closed)
      days.push("MONDAY");
    if (operatingHours.tuesday && !operatingHours.tuesday.closed)
      days.push("TUESDAY");
    if (operatingHours.wednesday && !operatingHours.wednesday.closed)
      days.push("WEDNESDAY");
    if (operatingHours.thursday && !operatingHours.thursday.closed)
      days.push("THURSDAY");
    if (operatingHours.friday && !operatingHours.friday.closed)
      days.push("FRIDAY");
    if (operatingHours.saturday && !operatingHours.saturday.closed)
      days.push("SATURDAY");
    if (operatingHours.sunday && !operatingHours.sunday.closed)
      days.push("SUNDAY");
    return days;
  }

  private calculateWaitTime(operatingHours: OperatingHours): number {
    // Simplified: assume average wait time of 2 hours if arriving outside hours
    // In production, would calculate actual wait time based on arrival time
    return 2;
  }

  private mapTouchpointToAgency(touchpoint: Touchpoint): {
    name: string;
    type: RouteConstraint["authority"]["type"];
  } {
    // Map touchpoint to government agency type
    if (touchpoint.name.toLowerCase().includes("customs")) {
      return { name: "Customs Authority", type: "CUSTOMS" };
    }
    if (touchpoint.name.toLowerCase().includes("environment")) {
      return { name: "Environment Agency", type: "ENVIRONMENT" };
    }
    if (touchpoint.name.toLowerCase().includes("health")) {
      return { name: "Health Authority", type: "HEALTH" };
    }
    return { name: touchpoint.name, type: "OTHER" };
  }

  private calculateDistance(from: Location, to: Location): number {
    if (!from.coordinates || !to.coordinates) return 0;

    const R = 6371; // Earth's radius in km
    const lat1 = from.coordinates.lat;
    const lon1 = from.coordinates.lng;
    const lat2 = to.coordinates.lat;
    const lon2 = to.coordinates.lng;

    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private estimateDrivingTime(distance: number, mode: TransportMode): number {
    const speeds: Record<TransportMode, number> = {
      AIR: 800,
      SEA: 30,
      LAND: 80,
      RAIL: 60,
      MULTIMODAL: 50,
      EXPRESS: 100,
      COURIER: 60,
    };

    const speed = speeds[mode] || 50;
    return distance / speed;
  }

  private getConstraintsForSegment(
    from: Location,
    to: Location,
    constraints: RouteConstraint[],
  ): RouteConstraint[] {
    // Return constraints that affect this segment
    // In production, would use spatial analysis
    return constraints.filter((c) => {
      if (!c.location.coordinates) return false;
      // Simplified: check if constraint is between from and to
      return true; // Would implement actual spatial check
    });
  }

  private getTouchpointsForSegment(
    from: Location,
    to: Location,
    touchpoints: Touchpoint[],
  ): RouteSegment["touchpoints"] {
    // Return touchpoints on this segment
    // In production, would use spatial analysis
    return touchpoints
      .filter((tp) => {
        // Simplified: check if touchpoint is between from and to
        return true; // Would implement actual spatial check
      })
      .map((tp) => ({
        touchpoint: tp,
        estimatedArrival: new Date(),
        estimatedDeparture: new Date(),
        processingTime: tp.averageProcessingTime?.average || 2,
        constraints: [],
      }));
  }

  private calculateSegmentTime(
    drivingTime: number,
    constraints: RouteConstraint[],
    touchpoints: RouteSegment["touchpoints"],
    timing?: IntelligentRoutePlanningRequest["timing"],
  ): RouteSegment["segmentTime"] {
    let waiting = 0;
    let processing = 0;

    // Calculate waiting time from constraints
    for (const constraint of constraints) {
      if (constraint.impactOnTransitTime?.additionalHours) {
        waiting += constraint.impactOnTransitTime.additionalHours;
      }
    }

    // Calculate processing time from touchpoints
    for (const tp of touchpoints) {
      processing += tp.processingTime;
    }

    return {
      driving: drivingTime,
      waiting,
      processing,
      total: drivingTime + waiting + processing,
    };
  }

  private calculateComplianceBenefits(
    constraints: RouteConstraint[],
    compliancePrograms: string[],
  ): {
    waitingReduction: number;
    processingReduction: number;
    customsReduction: number;
  } {
    let waitingReduction = 0;
    let processingReduction = 0;
    let customsReduction = 0;

    for (const constraint of constraints) {
      if (constraint.complianceProgramBenefits) {
        for (const benefit of constraint.complianceProgramBenefits) {
          if (compliancePrograms.includes(benefit.programId || "")) {
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

    return { waitingReduction, processingReduction, customsReduction };
  }
}

export const intelligentRoutePlanningService =
  new IntelligentRoutePlanningService();
