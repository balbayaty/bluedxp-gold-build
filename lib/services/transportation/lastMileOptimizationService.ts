/**
 * Last-Mile Optimization Service
 *
 * Route optimization for last-mile delivery
 * Delivery time windows, customer communication
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import { routeComparisonService } from "./routeComparisonService";
import { transitTimePredictionService } from "./transitTimePredictionService";
import type { Shipment } from "@/types/tms";

export interface DeliveryStop {
  id: string;
  shipmentId: string;
  sequence: number;
  location: {
    address: {
      street: string;
      city: string;
      state?: string;
      country: string;
      countryCode: string;
      postalCode?: string;
    };
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  timeWindow: {
    earliest: Date;
    latest: Date;
    preferred?: Date;
  };
  serviceTime: number; // minutes
  requirements: {
    signatureRequired: boolean;
    proofOfDelivery: boolean;
    specialInstructions?: string;
    contactPerson?: string;
    contactPhone?: string;
  };
  status:
    | "PENDING"
    | "IN_TRANSIT"
    | "ARRIVED"
    | "DELIVERED"
    | "FAILED"
    | "RESCHEDULED";
  estimatedArrival?: Date;
  actualArrival?: Date;
  actualDelivery?: Date;
  notes?: string;
}

export interface DeliveryRoute {
  id: string;
  driverId?: string;
  vehicleId?: string;
  stops: DeliveryStop[];
  startLocation: DeliveryStop["location"];
  endLocation?: DeliveryStop["location"];
  startTime: Date;
  estimatedEndTime: Date;
  actualEndTime?: Date;
  totalDistance: number; // km
  totalTime: number; // minutes
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  createdBy: string;
}

export interface LastMileOptimizationRequest {
  stops: Omit<DeliveryStop, "id" | "status" | "estimatedArrival">[];
  vehicle: {
    id: string;
    capacity: {
      weight: number;
      volume: number;
    };
    currentLocation: DeliveryStop["location"];
  };
  driver?: {
    id: string;
    workingHours: {
      start: string; // HH:mm
      end: string; // HH:mm
    };
    maxWorkingHours: number;
  };
  objectives: (
    | "MINIMIZE_DISTANCE"
    | "MINIMIZE_TIME"
    | "MAXIMIZE_ON_TIME"
    | "MINIMIZE_COST"
  )[];
  constraints?: {
    maxRouteTime?: number; // minutes
    maxStops?: number;
    timeWindowPriority?: boolean;
    breakTime?: number; // minutes
  };
  createdBy: string;
}

export interface LastMileOptimizationResult {
  route: DeliveryRoute;
  alternatives?: DeliveryRoute[];
  metrics: LastMileMetrics;
  recommendations: string[];
  warnings: string[];
  generatedAt: Date;
}

export interface LastMileMetrics {
  totalDistance: number; // km
  totalTime: number; // minutes
  drivingTime: number; // minutes
  serviceTime: number; // minutes
  waitingTime: number; // minutes
  onTimeRate: number; // 0-100
  timeWindowCompliance: number; // 0-100
  routeEfficiency: number; // 0-100
  stopsCount: number;
  completedStops: number;
  failedStops: number;
  averageStopTime: number; // minutes
  cost: number;
}

export interface CustomerNotification {
  shipmentId: string;
  stopId: string;
  type:
    | "SCHEDULED"
    | "IN_TRANSIT"
    | "ARRIVING_SOON"
    | "ARRIVED"
    | "DELIVERED"
    | "DELAYED"
    | "RESCHEDULED";
  message: string;
  estimatedArrival?: Date;
  trackingUrl?: string;
  sentAt: Date;
  channel: "SMS" | "EMAIL" | "PUSH" | "WHATSAPP";
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED";
}

export class LastMileOptimizationService {
  private routes: Map<string, DeliveryRoute> = new Map();
  private notifications: Map<string, CustomerNotification> = new Map();

  /**
   * Optimize last-mile delivery route
   */
  async optimizeRoute(
    request: LastMileOptimizationRequest,
  ): Promise<LastMileOptimizationResult> {
    // Validate request
    this.validateOptimizationRequest(request);

    // Run optimization algorithm
    const optimizedRoute = await this.optimizeRouteSequence(
      request.stops,
      request.vehicle,
      request.driver,
      request.objectives,
      request.constraints,
    );

    // Calculate metrics
    const metrics = this.calculateLastMileMetrics(optimizedRoute);

    // Generate recommendations and warnings
    const recommendations = this.generateRecommendations(
      optimizedRoute,
      metrics,
      request,
    );
    const warnings = this.generateWarnings(optimizedRoute, metrics, request);

    // Store route
    this.routes.set(optimizedRoute.id, optimizedRoute);

    // Publish event
    await eventBus.publish("transportation.last-mile.route.optimized", {
      routeId: optimizedRoute.id,
      stopsCount: optimizedRoute.stops.length,
      totalDistance: metrics.totalDistance,
      timestamp: new Date().toISOString(),
    });

    return {
      route: optimizedRoute,
      metrics,
      recommendations,
      warnings,
      generatedAt: new Date(),
    };
  }

  /**
   * Optimize route sequence
   */
  private async optimizeRouteSequence(
    stops: LastMileOptimizationRequest["stops"],
    vehicle: LastMileOptimizationRequest["vehicle"],
    driver: LastMileOptimizationRequest["driver"],
    objectives: LastMileOptimizationRequest["objectives"],
    constraints?: LastMileOptimizationRequest["constraints"],
  ): Promise<DeliveryRoute> {
    // Use nearest neighbor algorithm with time window constraints
    const optimizedStops: DeliveryStop[] = [];
    const unvisited = [...stops];
    let currentLocation = vehicle.currentLocation;
    let currentTime = new Date();
    let sequence = 1;

    // Sort stops by priority (time window, distance, etc.)
    while (unvisited.length > 0) {
      // Find next best stop
      let bestStop: (typeof stops)[0] | null = null;
      let bestScore = -Infinity;
      let bestIndex = -1;

      for (let i = 0; i < unvisited.length; i++) {
        const stop = unvisited[i];
        const score = this.scoreStop(
          stop,
          currentLocation,
          currentTime,
          objectives,
          constraints,
        );

        if (score > bestScore) {
          bestScore = score;
          bestStop = stop;
          bestIndex = i;
        }
      }

      if (bestStop && bestIndex >= 0) {
        // Calculate travel time and distance
        const distance = this.calculateDistance(
          currentLocation,
          bestStop.location,
        );
        const travelTime = this.calculateTravelTime(distance, "URBAN"); // Assume urban delivery
        const arrivalTime = new Date(
          currentTime.getTime() + travelTime * 60000,
        );

        // Check time window
        const withinWindow =
          arrivalTime >= bestStop.timeWindow.earliest &&
          arrivalTime <= bestStop.timeWindow.latest;

        if (withinWindow || !constraints?.timeWindowPriority) {
          const deliveryStop: DeliveryStop = {
            ...bestStop,
            id: `stop-${Date.now()}-${sequence}`,
            sequence,
            status: "PENDING",
            estimatedArrival: arrivalTime,
          };

          optimizedStops.push(deliveryStop);
          currentLocation = bestStop.location;
          currentTime = new Date(
            arrivalTime.getTime() + bestStop.serviceTime * 60000,
          );
          sequence++;

          unvisited.splice(bestIndex, 1);
        } else {
          // Skip if time window cannot be met (or handle rescheduling)
          unvisited.splice(bestIndex, 1);
        }
      } else {
        break;
      }
    }

    // Calculate total distance and time
    const totalDistance = this.calculateTotalDistance(
      optimizedStops,
      vehicle.currentLocation,
    );
    const totalTime = this.calculateTotalTime(
      optimizedStops,
      vehicle.currentLocation,
    );

    const route: DeliveryRoute = {
      id: `route-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      stops: optimizedStops,
      startLocation: vehicle.currentLocation,
      startTime: new Date(),
      estimatedEndTime: new Date(Date.now() + totalTime * 60000),
      totalDistance,
      totalTime,
      status: "PLANNED",
      createdAt: new Date(),
      createdBy: "system",
    };

    return route;
  }

  /**
   * Score stop for selection
   */
  private scoreStop(
    stop: LastMileOptimizationRequest["stops"][0],
    currentLocation: DeliveryStop["location"],
    currentTime: Date,
    objectives: LastMileOptimizationRequest["objectives"],
    constraints?: LastMileOptimizationRequest["constraints"],
  ): number {
    let score = 0;

    // Distance score (closer is better)
    if (objectives.includes("MINIMIZE_DISTANCE")) {
      const distance = this.calculateDistance(currentLocation, stop.location);
      score += (1000 / (distance + 1)) * 0.4;
    }

    // Time window score (earlier in window is better)
    if (objectives.includes("MAXIMIZE_ON_TIME")) {
      const distance = this.calculateDistance(currentLocation, stop.location);
      const travelTime = this.calculateTravelTime(distance, "URBAN");
      const arrivalTime = new Date(currentTime.getTime() + travelTime * 60000);

      if (
        arrivalTime >= stop.timeWindow.earliest &&
        arrivalTime <= stop.timeWindow.latest
      ) {
        const windowStart = stop.timeWindow.earliest.getTime();
        const windowEnd = stop.timeWindow.latest.getTime();
        const arrival = arrivalTime.getTime();
        const positionInWindow =
          (arrival - windowStart) / (windowEnd - windowStart);
        score += (1 - positionInWindow) * 100 * 0.3; // Prefer earlier in window
      } else {
        score -= 100; // Penalty for missing window
      }
    }

    // Time score (faster is better)
    if (objectives.includes("MINIMIZE_TIME")) {
      const distance = this.calculateDistance(currentLocation, stop.location);
      const travelTime = this.calculateTravelTime(distance, "URBAN");
      score += (1000 / (travelTime + 1)) * 0.3;
    }

    return score;
  }

  /**
   * Calculate distance between locations
   */
  private calculateDistance(
    loc1: DeliveryStop["location"],
    loc2: DeliveryStop["location"],
  ): number {
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat =
      ((loc2.coordinates.lat - loc1.coordinates.lat) * Math.PI) / 180;
    const dLon =
      ((loc2.coordinates.lng - loc1.coordinates.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.coordinates.lat * Math.PI) / 180) *
        Math.cos((loc2.coordinates.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate travel time
   */
  private calculateTravelTime(
    distance: number,
    roadType: "URBAN" | "HIGHWAY" | "MIXED",
  ): number {
    // Average speeds (km/h)
    const speeds = {
      URBAN: 30,
      HIGHWAY: 80,
      MIXED: 50,
    };

    const speed = speeds[roadType];
    return (distance / speed) * 60; // Convert to minutes
  }

  /**
   * Calculate total distance
   */
  private calculateTotalDistance(
    stops: DeliveryStop[],
    startLocation: DeliveryStop["location"],
  ): number {
    let total = 0;
    let currentLocation = startLocation;

    for (const stop of stops) {
      total += this.calculateDistance(currentLocation, stop.location);
      currentLocation = stop.location;
    }

    return total;
  }

  /**
   * Calculate total time
   */
  private calculateTotalTime(
    stops: DeliveryStop[],
    startLocation: DeliveryStop["location"],
  ): number {
    let total = 0;
    let currentLocation = startLocation;

    for (const stop of stops) {
      const distance = this.calculateDistance(currentLocation, stop.location);
      total += this.calculateTravelTime(distance, "URBAN");
      total += stop.serviceTime;
      currentLocation = stop.location;
    }

    return total;
  }

  /**
   * Calculate last-mile metrics
   */
  private calculateLastMileMetrics(route: DeliveryRoute): LastMileMetrics {
    const drivingTime =
      route.totalTime - route.stops.reduce((sum, s) => sum + s.serviceTime, 0);
    const serviceTime = route.stops.reduce((sum, s) => sum + s.serviceTime, 0);
    const waitingTime = 0; // Would calculate from time windows

    // Calculate on-time rate (would be from historical data)
    const onTimeRate = 95;

    // Calculate time window compliance
    const compliantStops = route.stops.filter((stop) => {
      if (!stop.estimatedArrival) return false;
      return (
        stop.estimatedArrival >= stop.timeWindow.earliest &&
        stop.estimatedArrival <= stop.timeWindow.latest
      );
    }).length;

    const timeWindowCompliance =
      route.stops.length > 0 ? (compliantStops / route.stops.length) * 100 : 0;

    // Calculate route efficiency
    const routeEfficiency = this.calculateRouteEfficiency(route);

    const completedStops = route.stops.filter(
      (s) => s.status === "DELIVERED",
    ).length;
    const failedStops = route.stops.filter((s) => s.status === "FAILED").length;
    const averageStopTime =
      route.stops.length > 0 ? serviceTime / route.stops.length : 0;

    // Estimate cost (would be more sophisticated)
    const cost = route.totalDistance * 2 + route.stops.length * 5; // Simplified

    return {
      totalDistance: route.totalDistance,
      totalTime: route.totalTime,
      drivingTime,
      serviceTime,
      waitingTime,
      onTimeRate,
      timeWindowCompliance,
      routeEfficiency,
      stopsCount: route.stops.length,
      completedStops,
      failedStops,
      averageStopTime,
      cost,
    };
  }

  /**
   * Calculate route efficiency
   */
  private calculateRouteEfficiency(route: DeliveryRoute): number {
    // Simplified efficiency calculation
    // In production, compare against optimal route
    if (route.stops.length < 2) return 100;

    // Calculate straight-line distance (as the crow flies)
    const straightLineDistance = this.calculateDistance(
      route.startLocation,
      route.stops[route.stops.length - 1].location,
    );

    // Efficiency = straight line / actual route
    const efficiency =
      straightLineDistance > 0
        ? (straightLineDistance / route.totalDistance) * 100
        : 100;

    return Math.min(100, efficiency);
  }

  /**
   * Send customer notification
   */
  async sendCustomerNotification(
    shipmentId: string,
    stopId: string,
    type: CustomerNotification["type"],
    estimatedArrival?: Date,
  ): Promise<string> {
    const notification: CustomerNotification = {
      shipmentId,
      stopId,
      type,
      message: this.generateNotificationMessage(type, estimatedArrival),
      estimatedArrival,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tracking/${shipmentId}`,
      sentAt: new Date(),
      channel: "SMS", // Default, would be configurable
      status: "PENDING",
    };

    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.notifications.set(notificationId, notification);

    // In production, send via SMS/Email/WhatsApp service
    // For now, just publish event
    await eventBus.publish("transportation.last-mile.notification.sent", {
      notificationId,
      shipmentId,
      stopId,
      type,
      timestamp: new Date().toISOString(),
    });

    return notificationId;
  }

  /**
   * Generate notification message
   */
  private generateNotificationMessage(
    type: CustomerNotification["type"],
    estimatedArrival?: Date,
  ): string {
    switch (type) {
      case "SCHEDULED":
        return `Your delivery is scheduled for ${estimatedArrival?.toLocaleString()}`;
      case "IN_TRANSIT":
        return "Your delivery is on the way";
      case "ARRIVING_SOON":
        return `Your delivery will arrive in approximately ${estimatedArrival ? Math.round((estimatedArrival.getTime() - Date.now()) / 60000) : 30} minutes`;
      case "ARRIVED":
        return "Your delivery has arrived";
      case "DELIVERED":
        return "Your delivery has been completed";
      case "DELAYED":
        return `Your delivery has been delayed. New estimated time: ${estimatedArrival?.toLocaleString()}`;
      case "RESCHEDULED":
        return `Your delivery has been rescheduled to ${estimatedArrival?.toLocaleString()}`;
      default:
        return "Delivery update";
    }
  }

  /**
   * Update stop status
   */
  async updateStopStatus(
    routeId: string,
    stopId: string,
    status: DeliveryStop["status"],
    notes?: string,
  ): Promise<void> {
    const route = this.routes.get(routeId);
    if (!route) {
      throw new Error("Route not found");
    }

    const stop = route.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new Error("Stop not found");
    }

    stop.status = status;
    if (status === "ARRIVED") {
      stop.actualArrival = new Date();
    } else if (status === "DELIVERED") {
      stop.actualDelivery = new Date();
    }
    if (notes) {
      stop.notes = notes;
    }

    this.routes.set(routeId, route);

    // Send customer notification
    if (status === "IN_TRANSIT") {
      await this.sendCustomerNotification(
        route.stops[0].shipmentId,
        stopId,
        "IN_TRANSIT",
      );
    } else if (status === "ARRIVED") {
      await this.sendCustomerNotification(
        route.stops[0].shipmentId,
        stopId,
        "ARRIVED",
      );
    } else if (status === "DELIVERED") {
      await this.sendCustomerNotification(
        route.stops[0].shipmentId,
        stopId,
        "DELIVERED",
      );
    }

    await eventBus.publish("transportation.last-mile.stop.updated", {
      routeId,
      stopId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Validate optimization request
   */
  private validateOptimizationRequest(
    request: LastMileOptimizationRequest,
  ): void {
    if (!request.stops || request.stops.length === 0) {
      throw new Error("No stops provided for optimization");
    }

    if (!request.vehicle) {
      throw new Error("No vehicle provided");
    }

    if (!request.objectives || request.objectives.length === 0) {
      throw new Error("No objectives specified");
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    route: DeliveryRoute,
    metrics: LastMileMetrics,
    request: LastMileOptimizationRequest,
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.timeWindowCompliance < 90) {
      recommendations.push(
        "Time window compliance is low - consider adjusting time windows or adding vehicles",
      );
    }

    if (metrics.routeEfficiency < 70) {
      recommendations.push(
        "Route efficiency is below optimal - consider re-optimizing with different objectives",
      );
    }

    if (metrics.totalTime > (request.constraints?.maxRouteTime || 480)) {
      recommendations.push(
        "Route time exceeds limit - consider splitting into multiple routes",
      );
    }

    if (request.stops.length > (request.constraints?.maxStops || 20)) {
      recommendations.push(
        "Number of stops is high - consider using multiple vehicles or drivers",
      );
    }

    return recommendations;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    route: DeliveryRoute,
    metrics: LastMileMetrics,
    request: LastMileOptimizationRequest,
  ): string[] {
    const warnings: string[] = [];

    if (metrics.timeWindowCompliance < 50) {
      warnings.push("CRITICAL: Many stops may miss time windows");
    }

    if (metrics.routeEfficiency < 50) {
      warnings.push(
        "Route is highly inefficient - significant optimization needed",
      );
    }

    if (
      request.driver &&
      metrics.totalTime > request.driver.maxWorkingHours * 60
    ) {
      warnings.push("Route time exceeds driver working hours limit");
    }

    return warnings;
  }

  /**
   * Get route by ID
   */
  getRoute(routeId: string): DeliveryRoute | undefined {
    return this.routes.get(routeId);
  }

  /**
   * List all routes
   */
  listRoutes(): DeliveryRoute[] {
    return Array.from(this.routes.values());
  }
}

export const lastMileOptimizationService = new LastMileOptimizationService();
