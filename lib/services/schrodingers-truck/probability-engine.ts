/**
 * Probability Calculation Engine
 *
 * Calculates quantum state probabilities based on 8 factors
 * Integrates with Event Store, Knowledge Base, and existing services
 *
 * @module schrodingers-truck
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type { Shipment } from "@/types/tms";
import type {
  ShipmentQuantumState,
  QuantumState,
  CollapseEvent,
  CollapseTrigger,
  DriverInfo,
  RouteInfo,
  CargoInfo,
  WeatherForecast,
  TrafficCondition,
  CustomerInfo,
  VehicleInfo,
  DEFAULT_FACTOR_WEIGHTS,
  normalizeProbabilities,
  validateProbabilities,
  STATE_DEFINITIONS,
} from "./types";

// ============================================================================
// PROBABILITY ENGINE
// ============================================================================

export class ProbabilityEngine {
  private factorWeightsCache: Map<
    string,
    ShipmentQuantumState["factorWeights"]
  > = new Map();

  /**
   * Calculate initial probabilities at booking time
   * Integrates with existing shipment data and services
   */
  async calculateInitialProbabilities(
    shipment: Shipment,
    driver?: DriverInfo,
    route?: RouteInfo,
    cargo?: CargoInfo,
  ): Promise<ShipmentQuantumState> {
    const correlationId = `quantum-init-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // 1. Calculate each of the 8 factors
    const factors = {
      driverReliability: await this.calculateDriverReliability(
        driver,
        shipment.tenantId,
      ),
      routeComplexity: await this.calculateRouteComplexity(
        route || this.extractRouteFromShipment(shipment),
        shipment.tenantId,
      ),
      weatherRisk: await this.getWeatherRisk(
        route || this.extractRouteFromShipment(shipment),
        shipment.estimatedDelivery
          ? new Date(shipment.estimatedDelivery)
          : new Date(),
      ),
      trafficRisk: await this.getTrafficRisk(
        route || this.extractRouteFromShipment(shipment),
        shipment.pickupDate ? new Date(shipment.pickupDate) : new Date(),
      ),
      customerRisk: await this.calculateCustomerRisk(
        shipment.customerId || shipment.customerReference || "",
        shipment.tenantId,
      ),
      cargoSensitivity: this.calculateCargoSensitivity(
        cargo || this.extractCargoFromShipment(shipment),
      ),
      vehicleCondition: await this.getVehicleCondition(
        driver?.vehicleId,
        shipment.tenantId,
      ),
      timeOfDay: this.calculateTimeOfDayRisk(
        shipment.pickupDate ? new Date(shipment.pickupDate) : new Date(),
      ),
    };

    // 2. Get learned weights (or defaults)
    const weights = await this.getFactorWeights(shipment.tenantId || "default");

    // 3. Calculate weighted probability
    const weightedSum = Object.keys(factors).reduce((sum, key) => {
      const factorKey = key as keyof typeof factors;
      const weightKey = key as keyof typeof weights;
      return sum + factors[factorKey] * weights[weightKey];
    }, 0);

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const onTimeProbability = totalWeight > 0 ? weightedSum / totalWeight : 0.5;

    // 4. Calculate derived probabilities
    const delayedProbability = (1 - onTimeProbability) * 0.7; // 70% of "not on time" is delayed
    const noShowProbability = (1 - onTimeProbability) * 0.3; // 30% of "not on time" is no-show

    // Normalize to ensure sum = 1.0
    const probabilities = normalizeProbabilities({
      onTime: onTimeProbability,
      delayed: delayedProbability,
      noShow: noShowProbability,
    });

    // 5. Determine initial state
    const currentState = this.determineState(probabilities.onTime);

    // 6. Get AI insights from Knowledge Base
    const aiInsights = await this.getAIInsights(
      shipment,
      currentState,
      factors,
    );

    // 7. Create quantum state
    const quantumState: ShipmentQuantumState = {
      id: `quantum-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      shipmentId: shipment.id,
      tenantId: shipment.tenantId || "default",
      currentState,
      probabilities,
      factors,
      factorWeights: weights,
      collapseHistory: [],
      collapsed: false,
      collapsedState: null,
      collapsedAt: null,
      collapseTrigger: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      overallConfidence: 0.6, // Initial confidence
      lastObservation: new Date(),
      observationCount: 1,
      journeyId: shipment.journeyId,
      lifecycleId: shipment.lifecycleId,
      rootCauseAnalysisId: shipment.rootCauseAnalysisId,
      aiInsights,
    };

    // 8. Publish event to Event Store
    await eventStore.append([
      createEvent(
        "ShipmentQuantumStateInitialized",
        shipment.id,
        "Shipment",
        quantumState,
        1,
        {
          tenantId: shipment.tenantId,
          correlationId,
          userId: shipment.createdBy || "system",
        },
      ),
    ]);

    // 9. Store learning signal in Knowledge Base
    await this.storeLearningSignal(shipment.tenantId || "default", {
      type: "quantum_state_initialized",
      shipmentId: shipment.id,
      state: currentState,
      probabilities,
      factors,
      confidence: quantumState.overallConfidence,
    });

    return quantumState;
  }

  /**
   * Calculate driver reliability from historical data
   * Integrates with existing transportation services
   */
  private async calculateDriverReliability(
    driver: DriverInfo | undefined,
    tenantId: string,
  ): Promise<number> {
    if (!driver) {
      return 0.5; // Unknown driver, neutral score
    }

    // Use historical stats if available
    if (driver.historicalStats) {
      const stats = driver.historicalStats;
      if (stats.totalDeliveries === 0) {
        return 0.5;
      }

      const onTimeRate = stats.onTimeDeliveries / stats.totalDeliveries;
      const recentWeight = 0.7; // Recent performance weighted more
      const recentOnTimeRate = stats.recentOnTimeRate || onTimeRate;

      return onTimeRate * (1 - recentWeight) + recentOnTimeRate * recentWeight;
    }

    // Try to get from Event Store (historical events)
    try {
      const events = await eventStore.getEventsByType(
        "ShipmentDelivered",
        0,
        100,
      );
      const driverEvents = events.filter(
        (e) =>
          e.payload?.driverId === driver.id ||
          e.payload?.driverPhone === driver.phone,
      );

      if (driverEvents.length === 0) {
        return 0.5;
      }

      const onTimeEvents = driverEvents.filter((e) => {
        const estimated = e.payload?.estimatedDelivery;
        const actual = e.payload?.actualDelivery;
        if (!estimated || !actual) return false;
        const delay =
          new Date(actual).getTime() - new Date(estimated).getTime();
        return delay <= 30 * 60 * 1000; // Within 30 minutes = on time
      });

      return onTimeEvents.length / driverEvents.length;
    } catch (error) {
      console.warn("Error calculating driver reliability from events:", error);
      return 0.5;
    }
  }

  /**
   * Calculate route complexity
   * Integrates with Journey Analysis service
   */
  private async calculateRouteComplexity(
    route: RouteInfo,
    tenantId: string,
  ): Promise<number> {
    let complexity = 0;

    // Base complexity from distance (longer = more complex)
    complexity += Math.min(route.distanceKm / 1000, 0.3); // Max 0.3 for distance

    // Border crossings add significant complexity
    complexity += (route.borderCrossings || 0) * 0.2; // Each border adds 0.2

    // Checkpoints add complexity
    complexity += (route.checkpoints || 0) * 0.05; // Each checkpoint adds 0.05

    // Toll booths add minor complexity
    complexity += (route.tollBooths || 0) * 0.02;

    // Historical delay rate on this route
    if (route.historicalStats) {
      complexity += (1 - route.historicalStats.onTimeRate) * 0.3;
    } else if (route.id) {
      // Try to get from Knowledge Base
      try {
        const knowledge = await knowledgeBaseService.search({
          query: `route ${route.id} on-time delivery rate`,
          tenantId,
          limit: 1,
        });
        if (knowledge.length > 0 && knowledge[0].entry.metadata?.onTimeRate) {
          complexity += (1 - knowledge[0].entry.metadata.onTimeRate) * 0.3;
        }
      } catch (error) {
        console.warn("Error getting route history from knowledge base:", error);
      }
    }

    // Invert: high complexity = low reliability factor
    return Math.max(0, Math.min(1, 1 - complexity));
  }

  /**
   * Get weather risk from external API or Knowledge Base
   */
  private async getWeatherRisk(route: RouteInfo, date: Date): Promise<number> {
    // In production, this would call a weather API
    // For now, use a simple heuristic based on route and date

    // Check Knowledge Base for historical weather patterns
    try {
      const knowledge = await knowledgeBaseService.search({
        query: `weather forecast ${route.waypoints?.[0]?.lat} ${route.waypoints?.[0]?.lng} ${date.toISOString()}`,
        limit: 1,
      });
      if (knowledge.length > 0 && knowledge[0].entry.metadata?.weatherRisk) {
        return knowledge[0].entry.metadata.weatherRisk;
      }
    } catch (error) {
      console.warn("Error getting weather from knowledge base:", error);
    }

    // Default: assume moderate weather risk
    // In production, integrate with weather API
    return 0.7; // 70% reliability (30% weather risk)
  }

  /**
   * Get traffic risk from real-time data or Knowledge Base
   */
  private async getTrafficRisk(route: RouteInfo, date: Date): Promise<number> {
    // In production, this would call a traffic API
    // For now, use time-based heuristics

    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Rush hour traffic (7-9 AM, 5-7 PM)
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 0.6; // 60% reliability (40% traffic risk)
    }

    // Weekend traffic
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 0.8; // 80% reliability (20% traffic risk)
    }

    // Check Knowledge Base for historical traffic patterns
    try {
      const knowledge = await knowledgeBaseService.search({
        query: `traffic conditions ${route.waypoints?.[0]?.lat} ${route.waypoints?.[0]?.lng} ${hour}`,
        limit: 1,
      });
      if (knowledge.length > 0 && knowledge[0].entry.metadata?.trafficRisk) {
        return knowledge[0].entry.metadata.trafficRisk;
      }
    } catch (error) {
      console.warn("Error getting traffic from knowledge base:", error);
    }

    // Default: assume moderate traffic
    return 0.75; // 75% reliability (25% traffic risk)
  }

  /**
   * Calculate customer risk (receiving reliability)
   */
  private async calculateCustomerRisk(
    customerId: string,
    tenantId: string,
  ): Promise<number> {
    if (!customerId) {
      return 0.7; // Unknown customer, moderate reliability
    }

    // Try to get from Knowledge Base
    try {
      const knowledge = await knowledgeBaseService.search({
        query: `customer ${customerId} receiving reliability`,
        tenantId,
        limit: 1,
      });
      if (
        knowledge.length > 0 &&
        knowledge[0].entry.metadata?.reliabilityScore
      ) {
        return knowledge[0].entry.metadata.reliabilityScore;
      }
    } catch (error) {
      console.warn(
        "Error getting customer reliability from knowledge base:",
        error,
      );
    }

    // Try to get from Event Store
    try {
      const events = await eventStore.getEventsByType(
        "ShipmentDelivered",
        0,
        100,
      );
      const customerEvents = events.filter(
        (e) => e.payload?.customerId === customerId,
      );

      if (customerEvents.length === 0) {
        return 0.7;
      }

      const onTimeReceipts = customerEvents.filter((e) => {
        const estimated = e.payload?.estimatedDelivery;
        const actual = e.payload?.actualDelivery;
        if (!estimated || !actual) return false;
        const delay =
          new Date(actual).getTime() - new Date(estimated).getTime();
        return delay <= 60 * 60 * 1000; // Within 1 hour = on time
      });

      return onTimeReceipts.length / customerEvents.length;
    } catch (error) {
      console.warn("Error calculating customer risk from events:", error);
      return 0.7;
    }
  }

  /**
   * Calculate cargo sensitivity
   */
  private calculateCargoSensitivity(cargo: CargoInfo): number {
    let sensitivity = 1.0; // Start with perfect reliability

    // Temperature sensitive = higher risk
    if (cargo.temperatureSensitive) {
      sensitivity *= 0.8;
    }

    // Time sensitive = higher risk
    if (cargo.timeSensitive) {
      sensitivity *= 0.85;
    }

    // Perishable = higher risk
    if (cargo.perishable) {
      sensitivity *= 0.75;
    }

    // Fragile = higher risk
    if (cargo.fragile) {
      sensitivity *= 0.9;
    }

    // Hazardous = higher risk (but also more careful handling)
    if (cargo.hazardous) {
      sensitivity *= 0.85;
    }

    return Math.max(0.5, sensitivity); // Minimum 50% reliability
  }

  /**
   * Get vehicle condition
   */
  private async getVehicleCondition(
    vehicleId: string | undefined,
    tenantId: string,
  ): Promise<number> {
    if (!vehicleId) {
      return 0.7; // Unknown vehicle, moderate reliability
    }

    // Try to get from Knowledge Base or IoT service
    try {
      const knowledge = await knowledgeBaseService.search({
        query: `vehicle ${vehicleId} condition maintenance`,
        tenantId,
        limit: 1,
      });
      if (
        knowledge.length > 0 &&
        knowledge[0].entry.metadata?.vehicleCondition
      ) {
        return knowledge[0].entry.metadata.vehicleCondition;
      }
    } catch (error) {
      console.warn(
        "Error getting vehicle condition from knowledge base:",
        error,
      );
    }

    // Default: assume good condition
    return 0.8; // 80% reliability
  }

  /**
   * Calculate time of day risk
   */
  private calculateTimeOfDayRisk(date: Date): number {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Night driving (10 PM - 6 AM) = higher risk
    if (hour >= 22 || hour < 6) {
      return 0.7; // 70% reliability
    }

    // Rush hour = higher risk
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 0.75; // 75% reliability
    }

    // Weekend = lower risk (less traffic)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 0.9; // 90% reliability
    }

    // Normal business hours = best
    return 0.85; // 85% reliability
  }

  /**
   * Get factor weights (learned over time)
   */
  async getFactorWeights(
    tenantId: string,
  ): Promise<ShipmentQuantumState["factorWeights"]> {
    // Check cache first
    if (this.factorWeightsCache.has(tenantId)) {
      return this.factorWeightsCache.get(tenantId)!;
    }

    // Try to get from Knowledge Base
    try {
      const knowledge = await knowledgeBaseService.search({
        query: `quantum logistics factor weights tenant ${tenantId}`,
        tenantId,
        limit: 1,
      });
      if (knowledge.length > 0 && knowledge[0].entry.metadata?.factorWeights) {
        const weights = knowledge[0].entry.metadata.factorWeights;
        this.factorWeightsCache.set(tenantId, weights);
        return weights;
      }
    } catch (error) {
      console.warn("Error getting factor weights from knowledge base:", error);
    }

    // Return defaults
    const defaults = { ...DEFAULT_FACTOR_WEIGHTS };
    this.factorWeightsCache.set(tenantId, defaults);
    return defaults;
  }

  /**
   * Determine quantum state from probability
   */
  determineState(onTimeProbability: number): QuantumState {
    if (onTimeProbability >= STATE_DEFINITIONS.COMMITTED.probabilityThreshold) {
      return "COMMITTED";
    } else if (
      onTimeProbability >= STATE_DEFINITIONS.CONTINGENT.probabilityThreshold
    ) {
      return "CONTINGENT";
    } else {
      return "PHANTOM";
    }
  }

  /**
   * WAVEFORM COLLAPSE: Update state based on observation
   * This is the core quantum mechanics-inspired feature
   */
  async collapseWaveform(
    state: ShipmentQuantumState,
    trigger: CollapseTrigger,
    triggerData: Record<string, any>,
  ): Promise<ShipmentQuantumState> {
    const previousState = state.currentState;
    const previousProbabilities = { ...state.probabilities };

    // Calculate new probabilities based on trigger
    let newProbabilities: ShipmentQuantumState["probabilities"];

    switch (trigger) {
      case "WHATSAPP_PING":
        // Driver responded = positive signal
        newProbabilities = this.adjustForPositiveSignal(
          state.probabilities,
          0.2,
        );
        break;

      case "GEOFENCE_ENTRY":
        // Entered expected zone = strong positive signal
        newProbabilities = this.adjustForPositiveSignal(
          state.probabilities,
          0.4,
        );
        break;

      case "GEOFENCE_EXIT":
        // Left expected zone unexpectedly = negative signal
        newProbabilities = this.adjustForNegativeSignal(
          state.probabilities,
          0.2,
        );
        break;

      case "TIMEOUT":
        // No response = negative signal
        newProbabilities = this.adjustForNegativeSignal(
          state.probabilities,
          0.3,
        );
        break;

      case "WEATHER_ALERT":
        // Weather changed = adjust based on severity
        const weatherSeverity =
          triggerData.severity === "critical"
            ? 0.4
            : triggerData.severity === "high"
              ? 0.3
              : triggerData.severity === "medium"
                ? 0.2
                : 0.1;
        newProbabilities = this.adjustForNegativeSignal(
          state.probabilities,
          weatherSeverity,
        );
        break;

      case "TRAFFIC_ALERT":
        // Traffic changed = adjust based on congestion
        const trafficSeverity =
          triggerData.congestionLevel === "severe"
            ? 0.3
            : triggerData.congestionLevel === "heavy"
              ? 0.2
              : triggerData.congestionLevel === "moderate"
                ? 0.1
                : 0.05;
        newProbabilities = this.adjustForNegativeSignal(
          state.probabilities,
          trafficSeverity,
        );
        break;

      case "GPS_UPDATE":
        // Check if on track
        const onTrack = triggerData.onTrack !== false; // Default to true if not specified
        if (onTrack) {
          newProbabilities = this.adjustForPositiveSignal(
            state.probabilities,
            0.1,
          );
        } else {
          newProbabilities = this.adjustForNegativeSignal(
            state.probabilities,
            0.15,
          );
        }
        break;

      case "CUSTOMER_CONFIRM":
        // Customer confirmed readiness = positive
        if (triggerData.confirmed === true) {
          newProbabilities = this.adjustForPositiveSignal(
            state.probabilities,
            0.15,
          );
        } else {
          newProbabilities = this.adjustForNegativeSignal(
            state.probabilities,
            0.2,
          );
        }
        break;

      case "VEHICLE_DIAGNOSTIC":
        // Vehicle diagnostic = adjust based on condition
        const vehicleScore = triggerData.overallScore || 0.8;
        if (vehicleScore >= 0.8) {
          newProbabilities = this.adjustForPositiveSignal(
            state.probabilities,
            0.1,
          );
        } else if (vehicleScore < 0.5) {
          newProbabilities = this.adjustForNegativeSignal(
            state.probabilities,
            0.2,
          );
        } else {
          newProbabilities = state.probabilities; // No change
        }
        break;

      case "JOURNEY_TOUCHPOINT":
        // Journey touchpoint reached = positive
        newProbabilities = this.adjustForPositiveSignal(
          state.probabilities,
          0.2,
        );
        break;

      case "EXCEPTION_DETECTED":
        // Exception = negative
        const exceptionSeverity =
          triggerData.severity === "CRITICAL"
            ? 0.4
            : triggerData.severity === "HIGH"
              ? 0.3
              : triggerData.severity === "MEDIUM"
                ? 0.2
                : 0.1;
        newProbabilities = this.adjustForNegativeSignal(
          state.probabilities,
          exceptionSeverity,
        );
        break;

      default:
        newProbabilities = state.probabilities;
    }

    // Normalize probabilities
    newProbabilities = normalizeProbabilities(newProbabilities);

    // Determine new state
    const newState = this.determineState(newProbabilities.onTime);

    // Calculate learning signal (how much we learned)
    const stateChanged = previousState !== newState;
    const probabilityChange = Math.abs(
      newProbabilities.onTime - previousProbabilities.onTime,
    );
    const learningSignal = stateChanged
      ? probabilityChange > 0.2
        ? 0.8
        : 0.5
      : probabilityChange > 0.1
        ? 0.3
        : 0.1;

    // Create collapse event
    const collapseEvent: CollapseEvent = {
      id: `collapse-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
      trigger,
      previousState,
      previousProbabilities,
      newState,
      newProbabilities,
      triggerData,
      confidence: Math.min(0.95, state.overallConfidence + 0.05),
      learningSignal,
    };

    // Return updated state
    return {
      ...state,
      currentState: newState,
      probabilities: newProbabilities,
      collapseHistory: [...state.collapseHistory, collapseEvent],
      updatedAt: new Date(),
      overallConfidence: Math.min(0.95, state.overallConfidence + 0.05),
      lastObservation: new Date(),
      observationCount: state.observationCount + 1,
      // Mark as "collapsed" if we have high confidence
      collapsed: state.overallConfidence > 0.85,
      collapsedState: state.overallConfidence > 0.85 ? newState : null,
      collapsedAt: state.overallConfidence > 0.85 ? new Date() : null,
      collapseTrigger: state.overallConfidence > 0.85 ? trigger : null,
    };
  }

  /**
   * Adjust probabilities for positive signal
   */
  private adjustForPositiveSignal(
    current: ShipmentQuantumState["probabilities"],
    strength: number,
  ): ShipmentQuantumState["probabilities"] {
    const adjustment = strength * (1 - current.onTime); // More room to improve = more improvement
    const newOnTime = Math.min(0.99, current.onTime + adjustment);
    const remaining = 1 - newOnTime;

    return {
      onTime: newOnTime,
      delayed: remaining * 0.7,
      noShow: remaining * 0.3,
    };
  }

  /**
   * Adjust probabilities for negative signal
   */
  private adjustForNegativeSignal(
    current: ShipmentQuantumState["probabilities"],
    strength: number,
  ): ShipmentQuantumState["probabilities"] {
    const adjustment = strength * current.onTime; // More to lose = more loss
    const newOnTime = Math.max(0.01, current.onTime - adjustment);
    const remaining = 1 - newOnTime;

    return {
      onTime: newOnTime,
      delayed: remaining * 0.6, // Shifted more toward delay
      noShow: remaining * 0.4,
    };
  }

  /**
   * Extract route from shipment
   */
  private extractRouteFromShipment(shipment: Shipment): RouteInfo {
    const distance =
      shipment.route?.distanceKm ||
      this.calculateDistance(shipment.origin, shipment.destination) ||
      100;

    return {
      id: shipment.route?.id,
      distanceKm: distance,
      estimatedDurationHours:
        shipment.route?.estimatedDurationHours || distance / 60, // Assume 60 km/h average
      waypoints: shipment.route?.waypoints || [
        {
          lat: shipment.origin.lat,
          lng: shipment.origin.lng,
          name: shipment.origin.address,
        },
        {
          lat: shipment.destination.lat,
          lng: shipment.destination.lng,
          name: shipment.destination.address,
        },
      ],
      borderCrossings: shipment.route?.borderCrossings,
      checkpoints: shipment.route?.checkpoints,
    };
  }

  /**
   * Extract cargo info from shipment
   */
  private extractCargoFromShipment(shipment: Shipment): CargoInfo {
    return {
      type: shipment.items?.[0]?.description,
      temperatureSensitive: shipment.specialHandling?.perishable || false,
      timeSensitive:
        shipment.priority === "URGENT" || shipment.serviceLevel === "SAME_DAY",
      fragile: shipment.specialHandling?.fragile || false,
      hazardous: !!shipment.hazmat,
      perishable: shipment.specialHandling?.perishable || false,
      value: shipment.totalValue,
      specialHandling: shipment.specialHandling?.requirements || [],
    };
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   */
  private calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): number | null {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return null;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(destination.lat - origin.lat);
    const dLon = this.toRad(destination.lng - origin.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(origin.lat)) *
        Math.cos(this.toRad(destination.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get AI insights from Knowledge Base
   */
  private async getAIInsights(
    shipment: Shipment,
    state: QuantumState,
    factors: ShipmentQuantumState["factors"],
  ): Promise<ShipmentQuantumState["aiInsights"]> {
    try {
      const query = `shipment quantum state ${state} factors ${JSON.stringify(factors)} recommendations`;
      const results = await knowledgeBaseService.search({
        query,
        tenantId: shipment.tenantId,
        limit: 3,
      });

      return {
        recommendations: results
          .slice(0, 3)
          .map((r) => r.entry.summary || r.entry.content.substring(0, 100)),
        riskFactors: Object.entries(factors)
          .filter(([_, value]) => value < 0.6)
          .map(([key, _]) => key),
        similarHistoricalCases: results.map((r) => r.entry.id),
      };
    } catch (error) {
      console.warn("Error getting AI insights:", error);
      return undefined;
    }
  }

  /**
   * Store learning signal in Knowledge Base
   */
  private async storeLearningSignal(
    tenantId: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await knowledgeBaseService.learn({
        tenantId,
        agentId: "schrodingers-truck",
        type: data.type,
        trigger: `Quantum state initialized for shipment ${data.shipmentId}`,
        input: data,
        output: { state: data.state, probabilities: data.probabilities },
        confidence: data.confidence || 0.6,
        success: true,
      });
    } catch (error) {
      console.warn("Error storing learning signal:", error);
    }
  }
}

// Export singleton instance
export const probabilityEngine = new ProbabilityEngine();
