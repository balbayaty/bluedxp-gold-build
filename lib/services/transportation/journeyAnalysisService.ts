/**
 * Journey Analysis Service
 *
 * Dynamic journey analysis based on loading points, destinations, and touchpoints
 * Multi-modal support (Europe to Middle East)
 * Industry-standard terminology
 * Integrated with Journey Workflow and Root Cause Analysis
 * Fully integrated with ecosystem - no duplication
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-store";
import { rootCauseIntegrationService } from "./rootCauseIntegrationService";
import { routeComparisonService } from "./routeComparisonService";
import { transitTimePredictionService } from "./transitTimePredictionService";
import { schrodingersTruckService } from "@/lib/services/schrodingers-truck";
import type { Shipment, Location, Route } from "@/types/tms";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// INDUSTRY-STANDARD TERMINOLOGY
// ============================================================================

export type TouchpointType =
  | "ORIGIN_FACILITY" // Point of loading (POL)
  | "CUSTOMS_EXPORT" // Export customs clearance
  | "PORT_OF_LOADING" // POL (Port of Loading)
  | "AIRPORT_OF_DEPARTURE" // AOD
  | "INLAND_DEPOT" // Inland container depot
  | "CONTAINER_FREIGHT_STATION" // CFS
  | "TRANSIT_HUB" // Intermediate hub
  | "PORT_OF_TRANSIT" // Intermediate port
  | "AIRPORT_OF_TRANSIT" // Intermediate airport
  | "CUSTOMS_TRANSIT" // Transit customs
  | "PORT_OF_DISCHARGE" // POD (Port of Discharge)
  | "AIRPORT_OF_ARRIVAL" // AOA
  | "CUSTOMS_IMPORT" // Import customs clearance
  | "FREE_ZONE" // Free trade zone
  | "BONDED_WAREHOUSE" // Bonded storage
  | "DESTINATION_FACILITY" // Final destination (POD - Point of Delivery)
  | "DEHUB" // Deconsolidation hub
  | "LAST_MILE_DEPOT"; // Last-mile distribution center

export type TransportLegMode =
  | "ROAD"
  | "RAIL"
  | "SEA"
  | "AIR"
  | "BARGING"
  | "PIPELINE";

export interface Touchpoint {
  id: string;
  sequence: number;
  type: TouchpointType;
  name: string;
  location: Location;
  estimatedArrival: Date;
  estimatedDeparture: Date;
  actualArrival?: Date; // IN: When cargo arrives at touchpoint
  actualDeparture?: Date; // OUT: When cargo departs from touchpoint
  // Explicit IN/OUT tracking
  inTimestamp?: Date; // IN: Explicit arrival timestamp
  outTimestamp?: Date; // OUT: Explicit departure timestamp
  inStatus?: "PENDING" | "ARRIVED" | "CONFIRMED"; // IN status tracking
  outStatus?: "PENDING" | "DEPARTED" | "CONFIRMED"; // OUT status tracking
  status:
    | "PENDING"
    | "IN_TRANSIT"
    | "ARRIVED"
    | "PROCESSING"
    | "COMPLETED"
    | "DELAYED"
    | "EXCEPTION";
  processingTime?: number; // hours
  dwellTime?: number; // hours (time cargo spends at touchpoint) - auto-calculated from IN to OUT
  handlingType?:
    | "LOADING"
    | "UNLOADING"
    | "TRANSLOADING"
    | "CROSS_DOCK"
    | "STORAGE"
    | "CUSTOMS"
    | "INSPECTION";
  documents?: TouchpointDocument[];
  customsStatus?:
    | "NOT_REQUIRED"
    | "PENDING"
    | "IN_PROGRESS"
    | "CLEARED"
    | "HELD"
    | "REJECTED";
  exceptions?: TouchpointException[];
  metadata?: Record<string, any>;
}

export interface TouchpointDocument {
  id: string;
  type:
    | "COMMERCIAL_INVOICE"
    | "PACKING_LIST"
    | "CERTIFICATE_OF_ORIGIN"
    | "BILL_OF_LADING"
    | "AIR_WAYBILL"
    | "CMR"
    | "CUSTOMS_DECLARATION"
    | "EXPORT_LICENSE"
    | "IMPORT_LICENSE"
    | "PHYTOSANITARY"
    | "HEALTH_CERTIFICATE"
    | "CERTIFICATE_OF_ANALYSIS"
    | "MSDS"
    | "INSURANCE"
    | "OTHER";
  name: string;
  status: "REQUIRED" | "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";
  submittedAt?: Date;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface TouchpointException {
  id: string;
  type:
    | "DELAY"
    | "DAMAGE"
    | "LOSS"
    | "DOCUMENTATION"
    | "CUSTOMS"
    | "WEATHER"
    | "STRIKE"
    | "SECURITY"
    | "OTHER";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  impact: {
    delayHours?: number;
    costImpact?: number;
    serviceImpact?: string;
  };
}

export interface TransportLeg {
  id: string;
  sequence: number;
  mode: TransportLegMode;
  fromTouchpointId: string;
  toTouchpointId: string;
  carrier?: {
    id: string;
    name: string;
    service: string;
  };
  vessel?: {
    name: string;
    voyageNumber?: string;
    imoNumber?: string;
  };
  flight?: {
    number: string;
    airline: string;
  };
  container?: {
    number: string;
    type: string;
    sealNumber?: string;
  };
  estimatedDeparture: Date;
  estimatedArrival: Date;
  actualDeparture?: Date;
  actualArrival?: Date;
  distance: number; // km
  estimatedDuration: number; // hours
  actualDuration?: number; // hours
  status: "PLANNED" | "IN_TRANSIT" | "COMPLETED" | "DELAYED" | "EXCEPTION";
  tracking?: {
    lastUpdate: Date;
    location?: Location;
    status?: string;
  };
}

export interface JourneyAnalysis {
  id: string;
  shipmentId: string;
  journeyName: string;
  origin: Location; // Point of Loading (POL)
  destination: Location; // Point of Delivery (POD)
  touchpoints: Touchpoint[];
  transportLegs: TransportLeg[];
  totalDistance: number; // km
  estimatedTotalDuration: number; // hours
  actualTotalDuration?: number; // hours
  totalCost?: number;
  carbonFootprint?: number; // kg CO2e
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "EXCEPTION";
  currentTouchpoint?: Touchpoint;
  currentLeg?: TransportLeg;
  bottlenecks?: JourneyBottleneck[];
  rootCauseAnalysis?: any; // Root cause analysis from journey workflow
  insights?: JourneyInsight[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JourneyBottleneck {
  touchpointId: string;
  touchpointName: string;
  type: "DELAY" | "COST" | "RISK" | "CAPACITY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  avgDelayHours: number;
  frequency: number;
  costImpact: number;
  recommendations: string[];
}

export interface JourneyInsight {
  id: string;
  type: "OPTIMIZATION" | "RISK" | "COST" | "TIME" | "COMPLIANCE";
  title: string;
  description: string;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number; // 0-100
  recommendations: string[];
  estimatedSavings?: {
    time?: number; // hours
    cost?: number;
    co2?: number; // kg
  };
}

export interface JourneyAnalysisRequest {
  shipment: Shipment;
  includeRootCauseAnalysis?: boolean;
  includeOptimization?: boolean;
  includePredictions?: boolean;
  /**
   * Optional request context for platform-wide integration:
   * - tenantId: multi-tenant isolation for events/projections
   * - userId: attribution/audit for actions
   * - correlationId: cross-service tracing (shipmentId, etc.)
   */
  context?: {
    tenantId?: string;
    userId?: string;
    correlationId?: string;
  };
}

// ============================================================================
// MULTI-MODAL ROUTE PATTERNS (Europe to Middle East)
// ============================================================================

const MULTI_MODAL_PATTERNS = {
  // Europe to Saudi Arabia via Sea
  EUROPE_SAUDI_SEA: {
    touchpoints: [
      "ORIGIN_FACILITY",
      "CUSTOMS_EXPORT",
      "PORT_OF_LOADING",
      "PORT_OF_TRANSIT", // Optional (e.g., Jebel Ali, Port Said)
      "PORT_OF_DISCHARGE", // Jeddah, Dammam, etc.
      "CUSTOMS_IMPORT",
      "DESTINATION_FACILITY",
    ],
    legs: ["ROAD", "SEA", "ROAD"],
  },
  // Europe to UAE via Air
  EUROPE_UAE_AIR: {
    touchpoints: [
      "ORIGIN_FACILITY",
      "CUSTOMS_EXPORT",
      "AIRPORT_OF_DEPARTURE",
      "AIRPORT_OF_TRANSIT", // Optional (e.g., Istanbul, Doha)
      "AIRPORT_OF_ARRIVAL", // Dubai, Abu Dhabi
      "CUSTOMS_IMPORT",
      "DESTINATION_FACILITY",
    ],
    legs: ["ROAD", "AIR", "ROAD"],
  },
  // Europe to Middle East Multi-Modal (Road + Sea + Road)
  EUROPE_ME_MULTIMODAL: {
    touchpoints: [
      "ORIGIN_FACILITY",
      "CUSTOMS_EXPORT",
      "INLAND_DEPOT",
      "PORT_OF_LOADING",
      "PORT_OF_DISCHARGE",
      "CUSTOMS_IMPORT",
      "BONDED_WAREHOUSE", // Optional
      "DESTINATION_FACILITY",
    ],
    legs: ["ROAD", "SEA", "ROAD"],
  },
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class JourneyAnalysisService {
  // private analyses: Map<string, JourneyAnalysis> = new Map() // REMOVED

  /**
   * Analyze journey dynamically based on origin, destination, and mode
   */
  async analyzeJourney(
    request: JourneyAnalysisRequest,
  ): Promise<JourneyAnalysis> {
    const { shipment } = request;

    // Determine touchpoint pattern based on route
    const pattern = this.determineTouchpointPattern(shipment);

    // Generate touchpoints dynamically
    const touchpoints = await this.generateTouchpoints(shipment, pattern);

    // Generate transport legs
    const transportLegs = await this.generateTransportLegs(
      touchpoints,
      shipment,
    );

    // Calculate journey metrics
    const totalDistance = this.calculateTotalDistance(transportLegs);
    const estimatedTotalDuration = this.calculateEstimatedDuration(
      touchpoints,
      transportLegs,
    );

    // Identify bottlenecks
    const bottlenecks = await this.identifyBottlenecks(touchpoints, shipment);

    // Generate insights
    const insights = await this.generateInsights(
      touchpoints,
      transportLegs,
      shipment,
    );

    // Root cause analysis if requested
    let rootCauseAnalysis;
    if (request.includeRootCauseAnalysis) {
      // Collect exceptions from touchpoints
      const exceptions = touchpoints
        .filter((tp) => tp.exceptions && tp.exceptions.length > 0)
        .flatMap((tp) =>
          tp.exceptions!.map((ex) => ({
            id: ex.id,
            type: ex.type,
            severity: ex.severity,
            description: ex.description,
            detectedAt: ex.detectedAt.toISOString(),
            resolvedAt: ex.resolvedAt?.toISOString(),
            resolvedBy: undefined,
            resolution: undefined,
            metadata: {},
          })),
        );

      if (exceptions.length > 0) {
        // Create a temporary shipment object for root cause analysis
        const tempShipment = {
          ...shipment,
          exceptions: exceptions as any,
        } as any;

        try {
          const rcaResult =
            await rootCauseIntegrationService.getRootCauseAnalysis(
              tempShipment,
            );
          if (rcaResult) {
            rootCauseAnalysis = {
              primaryCauses: rcaResult.rootCauses,
              recommendations: rcaResult.recommendations,
              exceptions: rcaResult.exceptions,
            };
          }
        } catch (error) {
          console.warn("Root cause analysis failed:", error);
          // Continue without root cause analysis
        }
      }
    }

    // ... logic above remains same ...

    // Create in database
    const created = await prisma.journeyAnalysis.create({
      data: {
        shipmentId: shipment.id,
        journeyName: this.generateJourneyName(shipment),
        origin: shipment.origin as any,
        destination: shipment.destination as any,
        totalDistance,
        estimatedTotalDuration,
        status: this.determineJourneyStatus(touchpoints),
        tenantId: request.context?.tenantId, // ✅ Multi-tenant: Store tenantId for isolation
        touchpoints: {
          create: touchpoints.map((tp) => ({
            sequence: tp.sequence,
            type: tp.type,
            name: tp.name,
            location: tp.location as any,
            estimatedArrival: tp.estimatedArrival,
            estimatedDeparture: tp.estimatedDeparture,
            status: tp.status,
          })),
        },
        legs: {
          create: transportLegs.map((leg) => ({
            sequence: leg.sequence,
            mode: leg.mode,
            fromTouchpointId: leg.fromTouchpointId,
            toTouchpointId: leg.toTouchpointId,
            distance: leg.distance,
            estimatedDuration: leg.estimatedDuration,
            status: leg.status,
          })),
        },
      },
      include: {
        touchpoints: true,
        legs: true,
      },
    });

    const analysis = this.mapToJourneyAnalysis(created);
    // Add computed/transient fields back if needed (bottlenecks, insights, rca)
    analysis.bottlenecks = bottlenecks;
    analysis.insights = insights;
    analysis.rootCauseAnalysis = rootCauseAnalysis;

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "transportation.journey.analyzed",
      aggregateId: analysis.id,
      aggregateType: "journey",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        journeyId: analysis.id,
        shipmentId: shipment.id,
        touchpointsCount: touchpoints.length,
        status: analysis.status,
      },
      metadata: {
        correlationId: request.context?.correlationId || shipment.id,
        tenantId: request.context?.tenantId,
        userId: request.context?.userId,
        schemaVersion: 1,
      },
    } as any);

    return analysis;
  }

  /**
   * Determine touchpoint pattern based on shipment characteristics
   */
  private determineTouchpointPattern(shipment: Shipment): string[] {
    const originCountry = shipment.origin.address.countryCode;
    const destCountry = shipment.destination.address.countryCode;
    const mode = shipment.mode;

    // Europe to Middle East patterns
    const isEurope = [
      "DE",
      "FR",
      "GB",
      "IT",
      "ES",
      "NL",
      "BE",
      "PL",
      "AT",
      "CH",
    ].includes(originCountry);
    const isMiddleEast = [
      "SA",
      "AE",
      "KW",
      "QA",
      "OM",
      "BH",
      "JO",
      "IQ",
      "IR",
    ].includes(destCountry);

    if (isEurope && isMiddleEast) {
      if (mode === "SEA" || mode === "MULTIMODAL") {
        return MULTI_MODAL_PATTERNS.EUROPE_ME_MULTIMODAL.touchpoints;
      } else if (mode === "AIR") {
        return MULTI_MODAL_PATTERNS.EUROPE_UAE_AIR.touchpoints;
      }
    }

    // Default pattern based on mode
    if (mode === "SEA") {
      return [
        "ORIGIN_FACILITY",
        "CUSTOMS_EXPORT",
        "PORT_OF_LOADING",
        "PORT_OF_DISCHARGE",
        "CUSTOMS_IMPORT",
        "DESTINATION_FACILITY",
      ];
    } else if (mode === "AIR") {
      return [
        "ORIGIN_FACILITY",
        "CUSTOMS_EXPORT",
        "AIRPORT_OF_DEPARTURE",
        "AIRPORT_OF_ARRIVAL",
        "CUSTOMS_IMPORT",
        "DESTINATION_FACILITY",
      ];
    } else if (mode === "MULTIMODAL") {
      return MULTI_MODAL_PATTERNS.EUROPE_ME_MULTIMODAL.touchpoints;
    }

    // Road/Rail default
    return [
      "ORIGIN_FACILITY",
      "CUSTOMS_EXPORT",
      "CUSTOMS_TRANSIT", // If crossing borders
      "CUSTOMS_IMPORT",
      "DESTINATION_FACILITY",
    ];
  }

  /**
   * Generate touchpoints dynamically
   */
  private async generateTouchpoints(
    shipment: Shipment,
    pattern: string[],
  ): Promise<Touchpoint[]> {
    const touchpoints: Touchpoint[] = [];
    let sequence = 1;

    // Origin facility (Point of Loading)
    touchpoints.push({
      id: `tp-${shipment.id}-origin`,
      sequence: sequence++,
      type: "ORIGIN_FACILITY",
      name: `${shipment.origin.name || shipment.origin.address.city} (POL)`,
      location: shipment.origin,
      estimatedArrival: shipment.pickupDate
        ? new Date(shipment.pickupDate)
        : new Date(),
      estimatedDeparture: shipment.pickupDate
        ? new Date(new Date(shipment.pickupDate).getTime() + 2 * 60 * 60 * 1000) // +2 hours for loading
        : new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: "PENDING",
      handlingType: "LOADING",
    });

    // Generate intermediate touchpoints based on pattern
    for (let i = 1; i < pattern.length - 1; i++) {
      const type = pattern[i] as TouchpointType;
      const touchpoint = await this.createTouchpoint(
        shipment,
        type,
        sequence++,
        i,
        pattern.length,
      );
      touchpoints.push(touchpoint);
    }

    // Destination facility (Point of Delivery)
    touchpoints.push({
      id: `tp-${shipment.id}-destination`,
      sequence: sequence++,
      type: "DESTINATION_FACILITY",
      name: `${shipment.destination.name || shipment.destination.address.city} (POD)`,
      location: shipment.destination,
      estimatedArrival: shipment.estimatedDelivery
        ? new Date(shipment.estimatedDelivery)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default +7 days
      estimatedDeparture: shipment.estimatedDelivery
        ? new Date(
            new Date(shipment.estimatedDelivery).getTime() + 1 * 60 * 60 * 1000,
          ) // +1 hour for unloading
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
      status: "PENDING",
      handlingType: "UNLOADING",
    });

    // Add waypoints if specified
    if (shipment.route?.waypoints) {
      for (const waypoint of shipment.route.waypoints) {
        touchpoints.splice(touchpoints.length - 1, 0, {
          id: `tp-${shipment.id}-waypoint-${waypoint.id}`,
          sequence: sequence++,
          type: this.determineWaypointType(waypoint),
          name: waypoint.name || waypoint.address.city,
          location: waypoint,
          estimatedArrival: new Date(),
          estimatedDeparture: new Date(),
          status: "PENDING",
        });
      }
    }

    // Re-sequence
    touchpoints.forEach((tp, idx) => {
      tp.sequence = idx + 1;
    });

    return touchpoints;
  }

  /**
   * Create a touchpoint based on type
   */
  private async createTouchpoint(
    shipment: Shipment,
    type: TouchpointType,
    sequence: number,
    position: number,
    total: number,
  ): Promise<Touchpoint> {
    const baseTime = shipment.pickupDate
      ? new Date(shipment.pickupDate)
      : new Date();
    const hoursPerLeg = 24; // Default
    const estimatedArrival = new Date(
      baseTime.getTime() + position * hoursPerLeg * 60 * 60 * 1000,
    );
    const processingTime = this.getProcessingTime(type);
    const estimatedDeparture = new Date(
      estimatedArrival.getTime() + processingTime * 60 * 60 * 1000,
    );

    const location = this.getLocationForTouchpoint(shipment, type, position);

    return {
      id: `tp-${shipment.id}-${type}-${sequence}`,
      sequence,
      type,
      name: this.getTouchpointName(type, location),
      location,
      estimatedArrival,
      estimatedDeparture,
      status: "PENDING",
      processingTime,
      handlingType: this.getHandlingType(type),
      customsStatus: type.includes("CUSTOMS") ? "PENDING" : undefined,
      documents: this.getRequiredDocuments(type, shipment),
    };
  }

  /**
   * Generate transport legs between touchpoints
   */
  private async generateTransportLegs(
    touchpoints: Touchpoint[],
    shipment: Shipment,
  ): Promise<TransportLeg[]> {
    const legs: TransportLeg[] = [];

    for (let i = 0; i < touchpoints.length - 1; i++) {
      const from = touchpoints[i];
      const to = touchpoints[i + 1];

      const mode = this.determineLegMode(from, to, shipment);
      const distance = this.calculateLegDistance(from.location, to.location);
      const estimatedDuration = await this.estimateLegDuration(
        mode,
        distance,
        from,
        to,
      );

      legs.push({
        id: `leg-${shipment.id}-${i + 1}`,
        sequence: i + 1,
        mode,
        fromTouchpointId: from.id,
        toTouchpointId: to.id,
        estimatedDeparture: from.estimatedDeparture,
        estimatedArrival: to.estimatedArrival,
        distance,
        estimatedDuration,
        status: "PLANNED",
      });
    }

    return legs;
  }

  /**
   * Determine transport mode for leg
   */
  private determineLegMode(
    from: Touchpoint,
    to: Touchpoint,
    shipment: Shipment,
  ): TransportLegMode {
    // If touchpoint is port/airport, use sea/air
    if (from.type.includes("PORT")) return "SEA";
    if (from.type.includes("AIRPORT")) return "AIR";
    if (to.type.includes("PORT")) return "SEA";
    if (to.type.includes("AIRPORT")) return "AIR";

    // Check if route crosses water (simplified)
    const countries = [
      from.location.address.countryCode,
      to.location.address.countryCode,
    ];
    if (countries[0] !== countries[1]) {
      // Cross-border: could be road, rail, or sea/air
      if (shipment.mode === "SEA" || shipment.mode === "MULTIMODAL")
        return "SEA";
      if (shipment.mode === "AIR") return "AIR";
      return "ROAD"; // Default for cross-border
    }

    // Domestic: road or rail
    return shipment.mode === "RAIL" ? "RAIL" : "ROAD";
  }

  /**
   * Calculate distance between locations
   */
  private calculateLegDistance(from: Location, to: Location): number {
    if (from.coordinates && to.coordinates) {
      // Haversine formula (simplified)
      const R = 6371; // Earth radius in km
      const dLat = this.toRad(to.coordinates.lat - from.coordinates.lat);
      const dLon = this.toRad(to.coordinates.lng - from.coordinates.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRad(from.coordinates.lat)) *
          Math.cos(this.toRad(to.coordinates.lat)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    // Fallback: estimate based on countries
    return 1000; // Default 1000 km
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Estimate leg duration
   */
  private async estimateLegDuration(
    mode: TransportLegMode,
    distance: number,
    from: Touchpoint,
    to: Touchpoint,
  ): Promise<number> {
    // Use transit time prediction service if available
    try {
      const prediction = await transitTimePredictionService.predictTransitTime({
        origin: from.location,
        destination: to.location,
        mode: mode === "SEA" ? "SEA" : mode === "AIR" ? "AIR" : "LAND",
        waypoints: [],
        cargo: { weight: 1000, volume: 1 },
        date: from.estimatedDeparture,
      });
      return prediction.predictions.realistic;
    } catch {
      // Fallback: use average speeds
      const speeds: Record<TransportLegMode, number> = {
        ROAD: 60, // km/h
        RAIL: 80,
        SEA: 25,
        AIR: 800,
        BARGING: 15,
        PIPELINE: 10,
      };
      return distance / (speeds[mode] || 60);
    }
  }

  /**
   * Get location for touchpoint
   */
  private getLocationForTouchpoint(
    shipment: Shipment,
    type: TouchpointType,
    position: number,
  ): Location {
    // Use waypoints if available
    if (
      shipment.route?.waypoints &&
      shipment.route.waypoints.length > position - 1
    ) {
      return shipment.route.waypoints[position - 1];
    }

    // Use intermediate stops
    if (shipment.intermediateStops && shipment.intermediateStops.length > 0) {
      return shipment.intermediateStops[position - 1] || shipment.destination;
    }

    // Generate based on type
    if (type.includes("PORT")) {
      return {
        id: `port-${type}`,
        name: "Port",
        type: "PORT",
        address: {
          street: "",
          city: shipment.origin.address.city,
          country: shipment.origin.address.country,
          countryCode: shipment.origin.address.countryCode,
          postalCode: "",
        },
        coordinates: shipment.origin.coordinates,
      };
    }

    if (type.includes("AIRPORT")) {
      return {
        id: `airport-${type}`,
        name: "Airport",
        type: "AIRPORT",
        address: {
          street: "",
          city: shipment.origin.address.city,
          country: shipment.origin.address.country,
          countryCode: shipment.origin.address.countryCode,
          postalCode: "",
        },
        coordinates: shipment.origin.coordinates,
      };
    }

    // Default to origin or destination
    return position < 3 ? shipment.origin : shipment.destination;
  }

  /**
   * Get touchpoint name
   */
  private getTouchpointName(type: TouchpointType, location: Location): string {
    const names: Record<TouchpointType, string> = {
      ORIGIN_FACILITY: `${location.address.city} - Point of Loading (POL)`,
      CUSTOMS_EXPORT: `${location.address.city} - Export Customs`,
      PORT_OF_LOADING: `${location.address.city} - Port of Loading (POL)`,
      AIRPORT_OF_DEPARTURE: `${location.address.city} - Airport of Departure (AOD)`,
      INLAND_DEPOT: `${location.address.city} - Inland Depot`,
      CONTAINER_FREIGHT_STATION: `${location.address.city} - Container Freight Station (CFS)`,
      TRANSIT_HUB: `${location.address.city} - Transit Hub`,
      PORT_OF_TRANSIT: `${location.address.city} - Port of Transit`,
      AIRPORT_OF_TRANSIT: `${location.address.city} - Airport of Transit`,
      CUSTOMS_TRANSIT: `${location.address.city} - Transit Customs`,
      PORT_OF_DISCHARGE: `${location.address.city} - Port of Discharge (POD)`,
      AIRPORT_OF_ARRIVAL: `${location.address.city} - Airport of Arrival (AOA)`,
      CUSTOMS_IMPORT: `${location.address.city} - Import Customs`,
      FREE_ZONE: `${location.address.city} - Free Trade Zone`,
      BONDED_WAREHOUSE: `${location.address.city} - Bonded Warehouse`,
      DESTINATION_FACILITY: `${location.address.city} - Point of Delivery (POD)`,
      DEHUB: `${location.address.city} - Deconsolidation Hub`,
      LAST_MILE_DEPOT: `${location.address.city} - Last-Mile Depot`,
    };
    return names[type] || `${location.address.city} - ${type}`;
  }

  /**
   * Get processing time for touchpoint type
   */
  private getProcessingTime(type: TouchpointType): number {
    const times: Record<TouchpointType, number> = {
      ORIGIN_FACILITY: 2, // hours
      CUSTOMS_EXPORT: 24,
      PORT_OF_LOADING: 12,
      AIRPORT_OF_DEPARTURE: 6,
      INLAND_DEPOT: 8,
      CONTAINER_FREIGHT_STATION: 6,
      TRANSIT_HUB: 4,
      PORT_OF_TRANSIT: 8,
      AIRPORT_OF_TRANSIT: 4,
      CUSTOMS_TRANSIT: 12,
      PORT_OF_DISCHARGE: 12,
      AIRPORT_OF_ARRIVAL: 6,
      CUSTOMS_IMPORT: 48, // Can be longer
      FREE_ZONE: 4,
      BONDED_WAREHOUSE: 24,
      DESTINATION_FACILITY: 2,
      DEHUB: 6,
      LAST_MILE_DEPOT: 4,
    };
    return times[type] || 4;
  }

  /**
   * Get handling type
   */
  private getHandlingType(type: TouchpointType): Touchpoint["handlingType"] {
    if (type === "ORIGIN_FACILITY") return "LOADING";
    if (type === "DESTINATION_FACILITY") return "UNLOADING";
    if (type.includes("CUSTOMS")) return "CUSTOMS";
    if (type.includes("PORT") || type.includes("AIRPORT"))
      return "TRANSLOADING";
    return "STORAGE";
  }

  /**
   * Get required documents
   */
  private getRequiredDocuments(
    type: TouchpointType,
    shipment: Shipment,
  ): TouchpointDocument[] {
    const documents: TouchpointDocument[] = [];

    if (type.includes("CUSTOMS")) {
      documents.push({
        id: `doc-${type}-commercial-invoice`,
        type: "COMMERCIAL_INVOICE",
        name: "Commercial Invoice",
        status: "REQUIRED",
      });
      documents.push({
        id: `doc-${type}-packing-list`,
        type: "PACKING_LIST",
        name: "Packing List",
        status: "REQUIRED",
      });
      if (type === "CUSTOMS_EXPORT") {
        documents.push({
          id: `doc-${type}-export-license`,
          type: "EXPORT_LICENSE",
          name: "Export License",
          status: "REQUIRED",
        });
      }
      if (type === "CUSTOMS_IMPORT") {
        documents.push({
          id: `doc-${type}-import-license`,
          type: "IMPORT_LICENSE",
          name: "Import License",
          status: "REQUIRED",
        });
      }
    }

    if (type.includes("PORT") || type.includes("AIRPORT")) {
      if (shipment.mode === "SEA") {
        documents.push({
          id: `doc-${type}-billoflading`,
          type: "BILL_OF_LADING",
          name: "Bill of Lading",
          status: "REQUIRED",
        });
      } else if (shipment.mode === "AIR") {
        documents.push({
          id: `doc-${type}-airwaybill`,
          type: "AIR_WAYBILL",
          name: "Air Waybill",
          status: "REQUIRED",
        });
      }
    }

    return documents;
  }

  /**
   * Determine waypoint type
   */
  private determineWaypointType(waypoint: Location): TouchpointType {
    if (waypoint.type === "PORT") return "PORT_OF_TRANSIT";
    if (waypoint.type === "AIRPORT") return "AIRPORT_OF_TRANSIT";
    if (waypoint.type === "WAREHOUSE") return "TRANSIT_HUB";
    return "TRANSIT_HUB";
  }

  /**
   * Calculate total distance
   */
  private calculateTotalDistance(legs: TransportLeg[]): number {
    return legs.reduce((sum, leg) => sum + leg.distance, 0);
  }

  /**
   * Calculate estimated duration
   */
  private calculateEstimatedDuration(
    touchpoints: Touchpoint[],
    legs: TransportLeg[],
  ): number {
    const transitTime = legs.reduce(
      (sum, leg) => sum + leg.estimatedDuration,
      0,
    );
    const processingTime = touchpoints.reduce(
      (sum, tp) => sum + (tp.processingTime || 0),
      0,
    );
    return transitTime + processingTime;
  }

  /**
   * Identify bottlenecks
   */
  private async identifyBottlenecks(
    touchpoints: Touchpoint[],
    shipment: Shipment,
  ): Promise<JourneyBottleneck[]> {
    const bottlenecks: JourneyBottleneck[] = [];

    // Check customs touchpoints (common bottlenecks)
    const customsTouchpoints = touchpoints.filter((tp) =>
      tp.type.includes("CUSTOMS"),
    );
    for (const tp of customsTouchpoints) {
      bottlenecks.push({
        touchpointId: tp.id,
        touchpointName: tp.name,
        type: "DELAY",
        severity: "HIGH",
        avgDelayHours: 24,
        frequency: 0.3,
        costImpact: 1000,
        recommendations: [
          "Pre-submit documentation before arrival",
          "Use trusted trader programs",
          "Consider bonded warehouse for faster clearance",
        ],
      });
    }

    return bottlenecks;
  }

  /**
   * Generate insights
   */
  private async generateInsights(
    touchpoints: Touchpoint[],
    legs: TransportLeg[],
    shipment: Shipment,
  ): Promise<JourneyInsight[]> {
    const insights: JourneyInsight[] = [];

    // Optimization insight
    if (legs.length > 3) {
      insights.push({
        id: "insight-1",
        type: "OPTIMIZATION",
        title: "Multi-Modal Route Optimization Opportunity",
        description:
          "Consider consolidating touchpoints to reduce transit time",
        impact: "MEDIUM",
        confidence: 75,
        recommendations: [
          "Review transit hubs",
          "Consider direct routes",
          "Optimize customs clearance",
        ],
        estimatedSavings: {
          time: 24,
          cost: 500,
        },
      });
    }

    return insights;
  }

  /**
   * Determine journey status
   */
  private determineJourneyStatus(
    touchpoints: Touchpoint[],
  ): JourneyAnalysis["status"] {
    const hasCompleted = touchpoints.some((tp) => tp.status === "COMPLETED");
    const hasInProgress = touchpoints.some(
      (tp) => tp.status === "IN_TRANSIT" || tp.status === "PROCESSING",
    );
    const hasException = touchpoints.some(
      (tp) => tp.status === "EXCEPTION" || tp.status === "DELAYED",
    );

    if (hasException) return "EXCEPTION";
    if (hasInProgress) return "IN_PROGRESS";
    if (hasCompleted && touchpoints.every((tp) => tp.status === "COMPLETED"))
      return "COMPLETED";
    return "PLANNED";
  }

  /**
   * Get current touchpoint
   */
  private getCurrentTouchpoint(
    touchpoints: Touchpoint[],
  ): Touchpoint | undefined {
    return touchpoints.find(
      (tp) =>
        tp.status === "IN_TRANSIT" ||
        tp.status === "PROCESSING" ||
        tp.status === "ARRIVED",
    );
  }

  /**
   * Get current leg
   */
  private getCurrentLeg(legs: TransportLeg[]): TransportLeg | undefined {
    return legs.find((leg) => leg.status === "IN_TRANSIT");
  }

  /**
   * Generate journey name
   */
  private generateJourneyName(shipment: Shipment): string {
    const origin = shipment.origin.address.city;
    const destination = shipment.destination.address.city;
    return `${origin} → ${destination} (${shipment.mode})`;
  }

  /**
   * Get journey analysis by ID
   */
  async getJourneyAnalysis(journeyId: string): Promise<JourneyAnalysis | null> {
    const record = await prisma.journeyAnalysis.findUnique({
      where: { id: journeyId },
      include: {
        touchpoints: { orderBy: { sequence: "asc" } },
        legs: { orderBy: { sequence: "asc" } },
      },
    });

    if (!record) return null;
    return this.mapToJourneyAnalysis(record);
  }

  /**
   * Get journey analysis by shipment ID
   */
  async getJourneyByShipmentId(
    shipmentId: string,
  ): Promise<JourneyAnalysis | null> {
    const record = await prisma.journeyAnalysis.findFirst({
      where: { shipmentId },
      orderBy: { createdAt: "desc" },
      include: {
        touchpoints: { orderBy: { sequence: "asc" } },
        legs: { orderBy: { sequence: "asc" } },
      },
    });

    if (!record) return null;
    return this.mapToJourneyAnalysis(record);
  }

  /**
   * List journeys with optional filters
   * ✅ Multi-tenant: tenantId is required for tenant isolation
   */
  async listJourneys(filters?: {
    mode?: string;
    status?: string;
    limit?: number;
    shipmentId?: string;
    tenantId?: string; // ✅ Multi-tenant isolation
  }): Promise<JourneyAnalysis[]> {
    const where: any = {};

    // ✅ CRITICAL: Multi-tenant isolation - filter by tenantId
    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }

    // Filter by mode if specified (this requires checking the shipment or legs)
    // Since 'mode' isn't directly on JourneyAnalysis model, we might need to filter
    // based on the shipment's mode if we stored it, or inferred from legs.
    // For now, let's assume we can filter by the journey name or by joining with legs.
    // A simpler approach for V1:
    if (filters?.shipmentId) {
      where.shipmentId = filters.shipmentId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    // Prisma query
    const records = await prisma.journeyAnalysis.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 50,
      include: {
        touchpoints: { orderBy: { sequence: "asc" } },
        legs: { orderBy: { sequence: "asc" } },
      },
    });

    // Map all records
    const results = records.map((record) => this.mapToJourneyAnalysis(record));

    // Post-query filter for mode if needed (since it's not on the main table)
    if (filters?.mode) {
      // We can infer mode from the journey name or legs
      // Or if we updated the schema to include 'mode'.
      // For now, let's filter purely by legs checking
      return results.filter(
        (j) =>
          j.transportLegs.some((l) => l.mode === filters.mode) ||
          (filters.mode === "MULTIMODAL" && j.transportLegs.length > 1),
      );
    }

    return results;
  }

  /**
   * Update touchpoint status
   */
  /**
   * Record touchpoint IN (arrival) event
   */
  async recordTouchpointIn(
    journeyId: string,
    touchpointId: string,
    timestamp?: Date,
    context?: { tenantId?: string; userId?: string; correlationId?: string },
  ): Promise<void> {
    const inTime = timestamp || new Date();

    // Get current touchpoint to calculate dwell time later
    const journey = await prisma.journeyAnalysis.findUnique({
      where: { id: journeyId },
      include: { touchpoints: true },
    });

    if (!journey) throw new Error(`Journey ${journeyId} not found`);

    const touchpoint = journey.touchpoints.find((tp) => tp.id === touchpointId);
    if (!touchpoint) throw new Error(`Touchpoint ${touchpointId} not found`);

    // Update touchpoint with IN timestamp
    await prisma.journeyTouchpoint.update({
      where: { id: touchpointId },
      data: {
        actualArrival: inTime,
        status: "ARRIVED",
        // Store IN timestamp in metadata (we'll add explicit fields to schema later)
        metadata: {
          ...((touchpoint.metadata as any) || {}),
          inTimestamp: inTime.toISOString(),
          inStatus: "ARRIVED",
          inRecordedAt: new Date().toISOString(),
          inRecordedBy: context?.userId,
        },
      },
    });

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "transportation.journey.touchpoint.in",
      aggregateId: journeyId,
      aggregateType: "journey",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        journeyId,
        touchpointId,
        inTimestamp: inTime.toISOString(),
        shipmentId: journey.shipmentId,
      },
      metadata: {
        correlationId: context?.correlationId || journeyId,
        tenantId: context?.tenantId,
        userId: context?.userId,
        schemaVersion: 1,
      },
    } as any);
  }

  /**
   * Record touchpoint OUT (departure) event
   */
  async recordTouchpointOut(
    journeyId: string,
    touchpointId: string,
    timestamp?: Date,
    context?: { tenantId?: string; userId?: string; correlationId?: string },
  ): Promise<void> {
    const outTime = timestamp || new Date();

    // Get current touchpoint to calculate dwell time
    const journey = await prisma.journeyAnalysis.findUnique({
      where: { id: journeyId },
      include: { touchpoints: true },
    });

    if (!journey) throw new Error(`Journey ${journeyId} not found`);

    const touchpoint = journey.touchpoints.find((tp) => tp.id === touchpointId);
    if (!touchpoint) throw new Error(`Touchpoint ${touchpointId} not found`);

    // Calculate dwell time from IN to OUT
    const metadata = (touchpoint.metadata as any) || {};
    const inTimestamp =
      touchpoint.actualArrival ||
      (metadata.inTimestamp ? new Date(metadata.inTimestamp) : null);
    let dwellTime: number | undefined;

    if (inTimestamp) {
      const dwellMs = outTime.getTime() - inTimestamp.getTime();
      dwellTime = dwellMs / (1000 * 60 * 60); // Convert to hours
    }

    // Update touchpoint with OUT timestamp and calculated dwell time
    await prisma.journeyTouchpoint.update({
      where: { id: touchpointId },
      data: {
        actualDeparture: outTime,
        status: "COMPLETED",
        // Store OUT timestamp and dwell time in metadata
        metadata: {
          ...metadata,
          outTimestamp: outTime.toISOString(),
          outStatus: "DEPARTED",
          outRecordedAt: new Date().toISOString(),
          outRecordedBy: context?.userId,
          dwellTimeHours: dwellTime,
          // Calculate delay if applicable
          delayHours: touchpoint.estimatedDeparture
            ? (outTime.getTime() -
                new Date(touchpoint.estimatedDeparture).getTime()) /
              (1000 * 60 * 60)
            : undefined,
        },
      },
    });

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "transportation.journey.touchpoint.out",
      aggregateId: journeyId,
      aggregateType: "journey",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        journeyId,
        touchpointId,
        outTimestamp: outTime.toISOString(),
        dwellTimeHours: dwellTime,
        shipmentId: journey.shipmentId,
      },
      metadata: {
        correlationId: context?.correlationId || journeyId,
        tenantId: context?.tenantId,
        userId: context?.userId,
        schemaVersion: 1,
      },
    } as any);

    // Update journey status
    await this.recalculateJourneyStatus(journeyId);
  }

  /**
   * Update touchpoint status (legacy method - now uses IN/OUT methods)
   */
  async updateTouchpointStatus(
    journeyId: string,
    touchpointId: string,
    status: Touchpoint["status"],
    actualArrival?: Date,
    actualDeparture?: Date,
    context?: { tenantId?: string; userId?: string; correlationId?: string },
  ): Promise<void> {
    // If status is ARRIVED and we have actualArrival, record IN
    if (status === "ARRIVED" && actualArrival) {
      await this.recordTouchpointIn(
        journeyId,
        touchpointId,
        actualArrival,
        context,
      );
      return;
    }

    // If status is COMPLETED and we have actualDeparture, record OUT
    if (status === "COMPLETED" && actualDeparture) {
      await this.recordTouchpointOut(
        journeyId,
        touchpointId,
        actualDeparture,
        context,
      );
      return;
    }

    // Fallback to direct update for other statuses
    const journey = await prisma.journeyAnalysis.findUnique({
      where: { id: journeyId },
      include: { touchpoints: true },
    });

    if (!journey) throw new Error(`Journey ${journeyId} not found`);

    await prisma.journeyTouchpoint.update({
      where: { id: touchpointId },
      data: {
        status,
        actualArrival,
        actualDeparture,
      },
    });

    // Recalculate journey status
    await this.recalculateJourneyStatus(journeyId);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "transportation.journey.touchpoint.updated",
      aggregateId: journeyId,
      aggregateType: "journey",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        journeyId,
        touchpointId,
        status,
        shipmentId: journey.shipmentId,
      },
      metadata: {
        correlationId: context?.correlationId || journeyId,
        tenantId: context?.tenantId,
        userId: context?.userId,
        schemaVersion: 1,
      },
    } as any);

    // Integrate with Schrödinger's Truck
    if (status === "ARRIVED" || status === "COMPLETED") {
      try {
        const shipmentId = journey.shipmentId;
        if (shipmentId) {
          // fetch touchpoint details for the event
          const tpDetails = journey.touchpoints.find(
            (t) => t.id === touchpointId,
          );
          await schrodingersTruckService.updateQuantumState(
            shipmentId,
            "JOURNEY_TOUCHPOINT",
            {
              touchpointId,
              touchpointType: tpDetails?.type || "UNKNOWN",
              touchpointName: tpDetails?.name || "Unknown",
              status,
              actualArrival: actualArrival?.toISOString(),
              actualDeparture: actualDeparture?.toISOString(),
            },
          );
        }
      } catch (error) {
        console.warn("Failed to update quantum state for touchpoint:", error);
      }
    }
  }

  /**
   * Recalculate journey status based on touchpoint statuses
   */
  private async recalculateJourneyStatus(journeyId: string): Promise<void> {
    const journey = await prisma.journeyAnalysis.findUnique({
      where: { id: journeyId },
      include: { touchpoints: true },
    });

    if (!journey) return;

    const tps = journey.touchpoints;
    let newStatus = "PLANNED";
    if (tps.some((t) => t.status === "EXCEPTION")) newStatus = "EXCEPTION";
    else if (
      tps.some(
        (t) =>
          t.status === "IN_TRANSIT" ||
          t.status === "ARRIVED" ||
          t.status === "PROCESSING",
      )
    )
      newStatus = "IN_PROGRESS";
    else if (tps.every((t) => t.status === "COMPLETED"))
      newStatus = "COMPLETED";

    await prisma.journeyAnalysis.update({
      where: { id: journeyId },
      data: { status: newStatus },
    });
  }

  private mapToJourneyAnalysis(record: any): JourneyAnalysis {
    const touchpoints = (record.touchpoints || [])
      .map((tp: any) => ({
        id: tp.id,
        sequence: tp.sequence,
        type: tp.type as TouchpointType,
        name: tp.name,
        location: tp.location as unknown as Location, // Cast Json to Location
        estimatedArrival: tp.estimatedArrival,
        estimatedDeparture: tp.estimatedDeparture,
        actualArrival: tp.actualArrival,
        actualDeparture: tp.actualDeparture,
        status: tp.status as any,
        // Default values for fields not in DB
        processingTime: 4,
        handlingType: "STORAGE",
      }))
      .sort((a: any, b: any) => a.sequence - b.sequence);

    const transportLegs = (record.legs || [])
      .map((leg: any) => ({
        id: leg.id,
        sequence: leg.sequence,
        mode: leg.mode as TransportLegMode,
        fromTouchpointId: leg.fromTouchpointId,
        toTouchpointId: leg.toTouchpointId,
        distance: leg.distance,
        estimatedDuration: leg.estimatedDuration,
        status: leg.status as any,
        estimatedDeparture: new Date(), // placeholders if not stored
        estimatedArrival: new Date(),
      }))
      .sort((a: any, b: any) => a.sequence - b.sequence);

    return {
      id: record.id,
      shipmentId: record.shipmentId,
      journeyName: record.journeyName,
      origin: record.origin as unknown as Location,
      destination: record.destination as unknown as Location,
      touchpoints,
      transportLegs,
      totalDistance: record.totalDistance,
      estimatedTotalDuration: record.estimatedTotalDuration,
      status: record.status as any,
      currentTouchpoint: this.getCurrentTouchpoint(touchpoints),
      currentLeg: this.getCurrentLeg(transportLegs),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      // Enriched fields would optionally be populated after this if we had data
    };
  }
}

export const journeyAnalysisService = new JourneyAnalysisService();
