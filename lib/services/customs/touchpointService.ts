/**
 * Touchpoint Intelligence Service
 *
 * Manages borders, facilities, bonded warehouses, and regulatory offices:
 * - Touchpoint registry and queries
 * - Real-time status updates
 * - Capacity management
 * - Route optimization with touchpoints
 * - Processing time prediction
 */

import type {
  Touchpoint,
  BorderCrossingPoint,
  Facility,
  BondedWarehouse,
  RegulatoryOffice,
  TouchpointStatus,
  CountryCode,
  TouchpointType,
  BorderType,
  TransportMode,
  GeoCoordinates,
  TouchpointQuery,
  TouchpointRecommendation,
} from "@/types/touchpoint";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface TouchpointServiceConfig {
  enableRealTimeUpdates: boolean;
  updateInterval: number; // milliseconds
  cacheTimeout: number; // milliseconds
  maxRecommendations: number;
}

export interface RouteOptimizationRequest {
  origin: GeoCoordinates;
  destination: GeoCoordinates;
  transportMode: TransportMode;
  countries: CountryCode[];
  preferences?: {
    avoidCongestion?: boolean;
    preferFastest?: boolean;
    preferCheapest?: boolean;
    avoidRestrictions?: string[];
  };
}

export interface RouteOptimizationResult {
  route: RouteSegment[];
  totalDistance: number; // kilometers
  estimatedTime: number; // hours
  estimatedCost?: number;
  touchpoints: Touchpoint[];
  warnings: string[];
}

export interface RouteSegment {
  from: GeoCoordinates;
  to: GeoCoordinates;
  distance: number; // kilometers
  estimatedTime: number; // hours
  touchpoint?: Touchpoint;
  borderCrossing?: BorderCrossingPoint;
}

// ============================================================================
// TOUCHPOINT SERVICE
// ============================================================================

export class TouchpointService {
  private touchpoints: Map<string, Touchpoint> = new Map();
  private borders: Map<string, BorderCrossingPoint> = new Map();
  private facilities: Map<string, Facility> = new Map();
  private bondedWarehouses: Map<string, BondedWarehouse> = new Map();
  private regulatoryOffices: Map<string, RegulatoryOffice> = new Map();
  private config: TouchpointServiceConfig;
  private statusUpdateInterval?: NodeJS.Timeout;

  constructor(config?: Partial<TouchpointServiceConfig>) {
    this.config = {
      // In dev, Next.js Hot Reload can re-evaluate modules multiple times.
      // If we start intervals automatically, we can end up with MANY intervals running
      // concurrently (and spamming logs / slowing the dev server).
      // Default to enabled in production, opt-in elsewhere.
      enableRealTimeUpdates: process.env.NODE_ENV === "production",
      updateInterval: 60000, // 1 minute
      cacheTimeout: 300000, // 5 minutes
      maxRecommendations: 10,
      ...config,
    };

    if (this.config.enableRealTimeUpdates) {
      this.startStatusUpdates();
    }
  }

  // ========================================================================
  // TOUCHPOINT REGISTRY
  // ========================================================================

  /**
   * Register touchpoint
   */
  registerTouchpoint(touchpoint: Touchpoint): void {
    this.touchpoints.set(touchpoint.id, touchpoint);

    // Also register in specific maps
    switch (touchpoint.type) {
      case "BORDER":
        this.borders.set(touchpoint.id, touchpoint as BorderCrossingPoint);
        break;
      case "FACILITY":
        this.facilities.set(touchpoint.id, touchpoint as Facility);
        break;
      case "BONDED_WAREHOUSE":
        this.bondedWarehouses.set(touchpoint.id, touchpoint as BondedWarehouse);
        break;
      case "REGULATORY_OFFICE":
        this.regulatoryOffices.set(
          touchpoint.id,
          touchpoint as RegulatoryOffice,
        );
        break;
    }

    this.log(
      "info",
      `Touchpoint registered: ${touchpoint.id} (${touchpoint.type})`,
    );
  }

  /**
   * Register multiple touchpoints
   */
  registerTouchpoints(touchpoints: Touchpoint[]): void {
    for (const touchpoint of touchpoints) {
      this.registerTouchpoint(touchpoint);
    }
  }

  /**
   * Get touchpoint by ID
   */
  getTouchpoint(id: string): Touchpoint | undefined {
    return this.touchpoints.get(id);
  }

  /**
   * Get touchpoint by code
   */
  getTouchpointByCode(code: string): Touchpoint | undefined {
    for (const touchpoint of this.touchpoints.values()) {
      if (touchpoint.code === code) {
        return touchpoint;
      }
    }
    return undefined;
  }

  /**
   * Query touchpoints
   */
  queryTouchpoints(query: TouchpointQuery): Touchpoint[] {
    let results = Array.from(this.touchpoints.values());

    // Filter by country
    if (query.country) {
      results = results.filter((t) => t.country === query.country);
    }

    // Filter by type
    if (query.type) {
      results = results.filter((t) => t.type === query.type);
    }

    // Filter by border type
    if (query.borderType && query.type === "BORDER") {
      results = results.filter((t) => {
        const border = t as BorderCrossingPoint;
        return border.borderType === query.borderType;
      });
    }

    // Filter by transport mode
    if (query.transportMode) {
      results = results.filter((t) =>
        t.supportedTransportModes.includes(query.transportMode!),
      );
    }

    // Filter by status
    if (query.status) {
      results = results.filter((t) => t.status === query.status);
    }

    // Filter by location (near)
    if (query.nearLocation) {
      results = results.filter((t) => {
        const distance = this.calculateDistance(
          t.coordinates,
          query.nearLocation!.coordinates,
        );
        return distance <= query.nearLocation!.radius;
      });
    }

    // Filter by capacity
    if (query.minCapacity) {
      results = results.filter((t) => {
        const capacity =
          t.capacity.dailyVehicles || t.capacity.dailyContainers || 0;
        return capacity >= query.minCapacity!;
      });
    }

    // Filter by utilization
    if (query.maxUtilization !== undefined) {
      results = results.filter(
        (t) => t.currentUtilization <= query.maxUtilization!,
      );
    }

    return results;
  }

  /**
   * Get touchpoints by country
   */
  getTouchpointsByCountry(country: CountryCode): Touchpoint[] {
    return this.queryTouchpoints({ country });
  }

  /**
   * Get borders by country
   */
  getBordersByCountry(country: CountryCode): BorderCrossingPoint[] {
    return Array.from(this.borders.values()).filter(
      (b) => b.country === country,
    );
  }

  /**
   * Get facilities by country
   */
  getFacilitiesByCountry(country: CountryCode): Facility[] {
    return Array.from(this.facilities.values()).filter(
      (f) => f.country === country,
    );
  }

  // ========================================================================
  // REAL-TIME STATUS
  // ========================================================================

  /**
   * Update touchpoint status
   */
  async updateTouchpointStatus(
    touchpointId: string,
    status: TouchpointStatus,
    data?: Partial<Touchpoint>,
  ): Promise<void> {
    const touchpoint = this.getTouchpoint(touchpointId);
    if (!touchpoint) {
      throw new Error(`Touchpoint not found: ${touchpointId}`);
    }

    const updated: Touchpoint = {
      ...touchpoint,
      status,
      ...data,
      lastUpdated: new Date(),
    };

    this.touchpoints.set(touchpointId, updated);

    // Update specific map
    if (touchpoint.type === "BORDER") {
      this.borders.set(touchpointId, updated as BorderCrossingPoint);
    } else if (touchpoint.type === "FACILITY") {
      this.facilities.set(touchpointId, updated as Facility);
    } else if (touchpoint.type === "BONDED_WAREHOUSE") {
      this.bondedWarehouses.set(touchpointId, updated as BondedWarehouse);
    } else if (touchpoint.type === "REGULATORY_OFFICE") {
      this.regulatoryOffices.set(touchpointId, updated as RegulatoryOffice);
    }

    // Publish event
    await this.publishEvent("customs.touchpoint.status.changed", {
      touchpointId,
      touchpointCode: touchpoint.code,
      status,
      previousStatus: touchpoint.status,
    });

    this.log("info", `Touchpoint status updated: ${touchpointId} → ${status}`);
  }

  /**
   * Start real-time status updates
   */
  private startStatusUpdates(): void {
    this.statusUpdateInterval = setInterval(async () => {
      await this.updateAllStatuses();
    }, this.config.updateInterval);
  }

  /**
   * Stop real-time status updates
   */
  stopStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = undefined;
    }
  }

  /**
   * Update all touchpoint statuses
   */
  private async updateAllStatuses(): Promise<void> {
    // This would typically fetch from external APIs
    // For now, we'll just log
    this.log(
      "info",
      `Updating statuses for ${this.touchpoints.size} touchpoints`,
    );
  }

  // ========================================================================
  // CAPACITY MANAGEMENT
  // ========================================================================

  /**
   * Get available capacity for touchpoint
   */
  getAvailableCapacity(touchpointId: string): {
    available: number;
    used: number;
    total: number;
    utilization: number;
  } {
    const touchpoint = this.getTouchpoint(touchpointId);
    if (!touchpoint) {
      throw new Error(`Touchpoint not found: ${touchpointId}`);
    }

    const total =
      touchpoint.capacity.dailyVehicles ||
      touchpoint.capacity.dailyContainers ||
      touchpoint.capacity.storageCapacity ||
      0;

    const used = touchpoint.capacity.currentLoad || 0;
    const available = Math.max(0, total - used);
    const utilization = total > 0 ? (used / total) * 100 : 0;

    return {
      available,
      used,
      total,
      utilization,
    };
  }

  /**
   * Check if touchpoint has capacity
   */
  hasCapacity(touchpointId: string, required: number): boolean {
    const capacity = this.getAvailableCapacity(touchpointId);
    return capacity.available >= required;
  }

  // ========================================================================
  // ROUTE OPTIMIZATION
  // ========================================================================

  /**
   * Optimize route with touchpoints
   */
  async optimizeRoute(
    request: RouteOptimizationRequest,
  ): Promise<RouteOptimizationResult> {
    this.log(
      "info",
      `Optimizing route: ${request.origin} → ${request.destination}`,
    );

    // Find relevant touchpoints along the route
    const relevantTouchpoints = this.findRelevantTouchpoints(request);

    // Build route segments
    const segments: RouteSegment[] = [];
    let totalDistance = 0;
    let totalTime = 0;

    // Simple route building (would be enhanced with actual routing algorithm)
    for (let i = 0; i < relevantTouchpoints.length - 1; i++) {
      const from = relevantTouchpoints[i].coordinates;
      const to = relevantTouchpoints[i + 1].coordinates;
      const distance = this.calculateDistance(from, to);
      const time = this.estimateTravelTime(distance, request.transportMode);

      segments.push({
        from,
        to,
        distance,
        estimatedTime: time,
        touchpoint: relevantTouchpoints[i],
        borderCrossing:
          relevantTouchpoints[i].type === "BORDER"
            ? (relevantTouchpoints[i] as BorderCrossingPoint)
            : undefined,
      });

      totalDistance += distance;
      totalTime += time;

      // Add processing time at touchpoint
      if (relevantTouchpoints[i].averageProcessingTime) {
        totalTime += relevantTouchpoints[i].averageProcessingTime.average;
      }
    }

    return {
      route: segments,
      totalDistance,
      estimatedTime: totalTime,
      touchpoints: relevantTouchpoints,
      warnings: [],
    };
  }

  /**
   * Find relevant touchpoints for route
   */
  private findRelevantTouchpoints(
    request: RouteOptimizationRequest,
  ): Touchpoint[] {
    // Find touchpoints in countries along the route
    const touchpoints: Touchpoint[] = [];

    for (const country of request.countries) {
      const countryTouchpoints = this.getTouchpointsByCountry(country)
        .filter((t) =>
          t.supportedTransportModes.includes(request.transportMode),
        )
        .filter((t) => t.status === "OPERATIONAL");

      touchpoints.push(...countryTouchpoints);
    }

    // Sort by distance from origin
    touchpoints.sort((a, b) => {
      const distA = this.calculateDistance(request.origin, a.coordinates);
      const distB = this.calculateDistance(request.origin, b.coordinates);
      return distA - distB;
    });

    return touchpoints.slice(0, this.config.maxRecommendations);
  }

  /**
   * Get touchpoint recommendations
   */
  getRecommendations(query: TouchpointQuery): TouchpointRecommendation[] {
    const touchpoints = this.queryTouchpoints(query);
    const recommendations: TouchpointRecommendation[] = [];

    for (const touchpoint of touchpoints) {
      let score = 100;

      // Deduct points for congestion
      if (touchpoint.congestionLevel === "HIGH") score -= 20;
      if (touchpoint.congestionLevel === "CRITICAL") score -= 40;

      // Deduct points for high utilization
      if (touchpoint.currentUtilization > 80) score -= 15;
      if (touchpoint.currentUtilization > 90) score -= 25;

      // Deduct points for low reliability
      score -= (100 - touchpoint.reliabilityScore) / 2;

      // Add reasons
      const reasons: string[] = [];
      if (touchpoint.congestionLevel === "LOW") reasons.push("Low congestion");
      if (touchpoint.currentUtilization < 50) reasons.push("Good capacity");
      if (touchpoint.reliabilityScore > 90) reasons.push("High reliability");

      recommendations.push({
        touchpoint,
        score: Math.max(0, score),
        reasons,
        estimatedProcessingTime: touchpoint.averageProcessingTime?.average || 0,
      });
    }

    // Sort by score (highest first)
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, this.config.maxRecommendations);
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(from: GeoCoordinates, to: GeoCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.latitude)) *
        Math.cos(this.toRadians(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate travel time
   */
  private estimateTravelTime(distance: number, mode: TransportMode): number {
    // Average speeds in km/h
    const speeds: Record<TransportMode, number> = {
      ROAD: 80,
      SEA: 25,
      AIR: 800,
      RAIL: 100,
      MULTIMODAL: 60,
    };

    const speed = speeds[mode] || 60;
    return distance / speed;
  }

  // ========================================================================
  // EVENT PUBLISHING
  // ========================================================================

  private async publishEvent(
    eventType: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await eventBus.publish({
        id: `evt-${Date.now()}`,
        type: eventType,
        aggregateId: data.touchpointId || "touchpoint",
        aggregateType: "touchpoint",
        data,
        metadata: {
          timestamp: new Date(),
          source: "touchpoint-service",
        },
      });
    } catch (error) {
      this.log("error", `Failed to publish event: ${eventType}`, error);
    }
  }

  // ========================================================================
  // LOGGING
  // ========================================================================

  private log(
    level: "info" | "warn" | "error",
    message: string,
    data?: any,
  ): void {
    const prefix = "[TouchpointService]";
    switch (level) {
      case "info":
        console.log(prefix, message, data || "");
        break;
      case "warn":
        console.warn(prefix, message, data || "");
        break;
      case "error":
        console.error(prefix, message, data || "");
        break;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Hot-reload-safe singleton.
 * In dev, Next.js can re-run module initialization; we reuse the same instance
 * to avoid duplicated intervals and resource leaks.
 */
const globalForTouchpointService = globalThis as unknown as {
  __bluedxp_touchpointService?: TouchpointService;
};

export const touchpointService =
  globalForTouchpointService.__bluedxp_touchpointService ??
  (globalForTouchpointService.__bluedxp_touchpointService =
    new TouchpointService());
