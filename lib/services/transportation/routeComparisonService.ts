/**
 * Route Comparison Service
 *
 * Comprehensive route comparison with multiple options, pricing, CO2e, transit times
 * Compares different routes, carriers, modes, and provides recommendations
 */

import type {
  Location,
  RouteOption,
  RouteComparison,
  TransportMode,
  ShipmentType,
  Route,
} from "@/types/tms";
import { co2EmissionsService } from "./co2EmissionsService";
import { pricingIntelligenceService } from "./pricingIntelligenceService";
import { transitTimePredictionService } from "./transitTimePredictionService";
import { assertRealInProduction } from "./strictMode";

export interface RouteComparisonRequest {
  origin: Location;
  destination: Location;
  cargo: {
    weight: number; // kg
    volume: number; // m³
    value: number;
    type: ShipmentType;
    mode?: TransportMode; // Preferred mode, but will compare all
  };
  preferences?: {
    prioritize?: "COST" | "TIME" | "EMISSIONS" | "RELIABILITY" | "BALANCED";
    weights?: {
      cost?: number; // 0-1, default 0.3
      time?: number; // 0-1, default 0.3
      emissions?: number; // 0-1, default 0.2
      reliability?: number; // 0-1, default 0.2
    };
    maxOptions?: number; // Default 10
    includeModes?: TransportMode[];
    excludeModes?: TransportMode[];
    dateRange?: {
      earliestPickup?: Date | string;
      latestDelivery?: Date | string;
    };
  };
}

export class RouteComparisonService {
  /**
   * Compare multiple route options
   */
  async compareRoutes(
    request: RouteComparisonRequest,
  ): Promise<RouteComparison> {
    const { origin, destination, cargo, preferences } = request;

    // Generate route options
    const options = await this.generateRouteOptions(
      origin,
      destination,
      cargo,
      preferences,
    );

    // Enrich each option with pricing, transit time, emissions, reliability
    const enrichedOptions = await Promise.all(
      options.map((option) => this.enrichRouteOption(option, cargo)),
    );

    // Score and rank options
    const scoredOptions = this.scoreAndRankOptions(
      enrichedOptions,
      preferences,
    );

    // Select recommended option
    const recommended = scoredOptions[0]; // Top ranked

    return {
      origin,
      destination,
      cargo,
      options: scoredOptions,
      recommended,
      comparisonCriteria: {
        prioritize: preferences?.prioritize || "BALANCED",
        weights: preferences?.weights || {
          cost: 0.3,
          time: 0.3,
          emissions: 0.2,
          reliability: 0.2,
        },
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate route options based on different modes and carriers
   */
  private async generateRouteOptions(
    origin: Location,
    destination: Location,
    cargo: RouteComparisonRequest["cargo"],
    preferences?: RouteComparisonRequest["preferences"],
  ): Promise<RouteOption[]> {
    const options: RouteOption[] = [];
    const modes: TransportMode[] =
      preferences?.includeModes ||
      (preferences?.excludeModes
        ? ["AIR", "SEA", "LAND", "RAIL", "MULTIMODAL"].filter(
            (m) => !preferences.excludeModes?.includes(m),
          )
        : ["AIR", "SEA", "LAND", "RAIL", "MULTIMODAL"]);

    // Generate options for each mode
    for (const mode of modes) {
      // Get carriers for this mode
      const carriers = await this.getCarriersForMode(mode);

      // Generate route for this mode
      const route = await this.generateRoute(origin, destination, mode);

      // Create option for each carrier (or default if no carriers)
      if (carriers.length > 0) {
        for (const carrier of carriers) {
          options.push({
            id: `route-${mode}-${carrier.id}-${Date.now()}`,
            route,
            carrierId: carrier.id,
            carrierName: carrier.name,
            mode,
            type: cargo.type,
            pricing: {
              baseRate: 0, // Will be enriched
              totalCost: 0,
              currency: "USD",
            },
            transitTime: {
              estimated: 0, // Will be enriched
            },
            emissions: {
              co2e: 0, // Will be enriched
            },
            reliability: {
              onTimeRate: carrier.performance?.onTimeDeliveryRate || 85,
              averageDelay: 0,
              riskScore: 50,
            },
          });
        }
      } else {
        // Default option without specific carrier
        options.push({
          id: `route-${mode}-default-${Date.now()}`,
          route,
          mode,
          type: cargo.type,
          pricing: {
            baseRate: 0,
            totalCost: 0,
            currency: "USD",
          },
          transitTime: {
            estimated: 0,
          },
          emissions: {
            co2e: 0,
          },
          reliability: {
            onTimeRate: 85,
            averageDelay: 0,
            riskScore: 50,
          },
        });
      }
    }

    // Limit to maxOptions
    const maxOptions = preferences?.maxOptions || 10;
    return options.slice(0, maxOptions);
  }

  /**
   * Enrich route option with pricing, transit time, emissions, reliability
   */
  private async enrichRouteOption(
    option: RouteOption,
    cargo: RouteComparisonRequest["cargo"],
  ): Promise<RouteOption> {
    // Get pricing intelligence
    const pricing = await pricingIntelligenceService.getPricingIntelligence({
      origin: option.route.origin,
      destination: option.route.destination,
      mode: option.mode,
      type: option.type,
      cargo: {
        weight: cargo.weight,
        volume: cargo.volume,
        value: cargo.value,
      },
    });

    // Get transit time prediction
    const transitTime = await transitTimePredictionService.predictTransitTime({
      origin: option.route.origin,
      destination: option.route.destination,
      mode: option.mode,
      waypoints: option.route.waypoints,
    });

    // Calculate CO2 emissions
    const emissions = await co2EmissionsService.calculateEmissions({
      origin: option.route.origin,
      destination: option.route.destination,
      distance: option.route.distance || 0,
      mode: option.mode,
      cargo: {
        weight: cargo.weight,
        volume: cargo.volume,
      },
    });

    // Get reliability data
    const reliability = await this.getReliabilityData(option);

    return {
      ...option,
      pricing: {
        baseRate: pricing.marketRate || 0,
        fuelSurcharge: pricing.marketRate ? pricing.marketRate * 0.1 : 0,
        totalCost: pricing.marketRate ? pricing.marketRate * 1.1 : 0,
        currency: "USD",
        rateIndex: pricing.marketRateIndex?.indexValue,
        savings: pricing.comparison?.vsMarket?.difference,
        savingsPercentage: pricing.comparison?.vsMarket?.percentage,
      },
      transitTime: {
        estimated: transitTime.predictions.realistic,
        min: transitTime.predictions.optimistic,
        max: transitTime.predictions.pessimistic,
        confidence: transitTime.predictions.confidence,
        factors: [
          ...(transitTime.factors.trafficConditions
            ? [transitTime.factors.trafficConditions]
            : []),
          ...(transitTime.factors.weatherImpact
            ? [transitTime.factors.weatherImpact]
            : []),
          ...(transitTime.factors.portCongestion
            ? [transitTime.factors.portCongestion]
            : []),
        ],
      },
      emissions: {
        co2e: emissions.totalCO2e,
        co2ePerKg: emissions.totalCO2e / cargo.weight,
        co2ePerKm: emissions.totalCO2e / (option.route.distance || 1),
        calculationMethod: emissions.calculationMethod.method,
      },
      reliability: {
        ...option.reliability,
        ...reliability,
      },
    };
  }

  /**
   * Score and rank route options
   */
  private scoreAndRankOptions(
    options: RouteOption[],
    preferences?: RouteComparisonRequest["preferences"],
  ): RouteOption[] {
    const weights = preferences?.weights || {
      cost: 0.3,
      time: 0.3,
      emissions: 0.2,
      reliability: 0.2,
    };

    // Normalize values and calculate scores
    const normalized = this.normalizeOptions(options);

    // Calculate composite score for each option
    const scored = normalized.map((option) => {
      const costScore = (1 - option.normalizedCost) * 100 * weights.cost;
      const timeScore = (1 - option.normalizedTime) * 100 * weights.time;
      const emissionsScore =
        (1 - option.normalizedEmissions) * 100 * weights.emissions;
      const reliabilityScore =
        option.normalizedReliability * 100 * weights.reliability;

      const totalScore =
        costScore + timeScore + emissionsScore + reliabilityScore;

      return {
        ...option,
        score: totalScore,
      };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Add rank
    return scored.map((option, index) => ({
      ...option,
      rank: index + 1,
    }));
  }

  /**
   * Normalize option values for comparison (0-1 scale)
   */
  private normalizeOptions(options: RouteOption[]): Array<
    RouteOption & {
      normalizedCost: number;
      normalizedTime: number;
      normalizedEmissions: number;
      normalizedReliability: number;
    }
  > {
    // Find min/max for each dimension
    const costs = options.map((o) => o.pricing.totalCost).filter((c) => c > 0);
    const times = options
      .map((o) => o.transitTime.estimated)
      .filter((t) => t > 0);
    const emissions = options.map((o) => o.emissions.co2e).filter((e) => e > 0);
    const reliabilities = options.map((o) => o.reliability.onTimeRate || 0);

    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const minEmissions = Math.min(...emissions);
    const maxEmissions = Math.max(...emissions);
    const minReliability = Math.min(...reliabilities);
    const maxReliability = Math.max(...reliabilities);

    // Normalize each option
    return options.map((option) => {
      const normalizedCost =
        maxCost > minCost
          ? (option.pricing.totalCost - minCost) / (maxCost - minCost)
          : 0.5;
      const normalizedTime =
        maxTime > minTime
          ? (option.transitTime.estimated - minTime) / (maxTime - minTime)
          : 0.5;
      const normalizedEmissions =
        maxEmissions > minEmissions
          ? (option.emissions.co2e - minEmissions) /
            (maxEmissions - minEmissions)
          : 0.5;
      const normalizedReliability =
        maxReliability > minReliability
          ? (option.reliability.onTimeRate || 0 - minReliability) /
            (maxReliability - minReliability)
          : 0.5;

      return {
        ...option,
        normalizedCost,
        normalizedTime,
        normalizedEmissions,
        normalizedReliability,
      };
    });
  }

  /**
   * Generate route between origin and destination
   */
  private async generateRoute(
    origin: Location,
    destination: Location,
    mode: TransportMode,
  ): Promise<Route> {
    // Calculate distance (simplified - in production, use mapping service)
    const distance = this.calculateDistance(
      origin.coordinates || { lat: 0, lng: 0 },
      destination.coordinates || { lat: 0, lng: 0 },
    );

    // Estimate duration based on mode
    const estimatedDuration = this.estimateDuration(distance, mode);

    return {
      id: `route-${mode}-${Date.now()}`,
      origin,
      destination,
      mode,
      distance,
      estimatedDuration,
      cost: 0, // Will be calculated
      currency: "USD",
      optimized: false,
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) *
        Math.cos(this.toRad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate duration based on distance and mode
   */
  private estimateDuration(distance: number, mode: TransportMode): number {
    const averageSpeeds: Record<TransportMode, number> = {
      AIR: 800, // km/h
      SEA: 30, // km/h
      LAND: 80, // km/h
      RAIL: 60, // km/h
      MULTIMODAL: 50, // km/h (average)
      EXPRESS: 100, // km/h
      COURIER: 60, // km/h
    };

    const speed = averageSpeeds[mode] || 50;
    return distance / speed;
  }

  /**
   * Get carriers for a specific mode
   */
  private async getCarriersForMode(mode: TransportMode): Promise<
    Array<{
      id: string;
      name: string;
      performance?: { onTimeDeliveryRate?: number };
    }>
  > {
    // In production, fetch from database or carrier service
    // For now, return mock data
    assertRealInProduction(
      "tms.routeComparison.carriers",
      "Carrier sourcing is currently mock. Configure carrier integrations or a carrier directory service.",
    );
    const mockCarriers: Record<
      TransportMode,
      Array<{
        id: string;
        name: string;
        performance?: { onTimeDeliveryRate?: number };
      }>
    > = {
      AIR: [
        {
          id: "carrier-air-1",
          name: "Emirates SkyCargo",
          performance: { onTimeDeliveryRate: 95 },
        },
        {
          id: "carrier-air-2",
          name: "Qatar Airways Cargo",
          performance: { onTimeDeliveryRate: 93 },
        },
      ],
      SEA: [
        {
          id: "carrier-sea-1",
          name: "Maersk",
          performance: { onTimeDeliveryRate: 92 },
        },
        {
          id: "carrier-sea-2",
          name: "MSC",
          performance: { onTimeDeliveryRate: 90 },
        },
      ],
      LAND: [
        {
          id: "carrier-land-1",
          name: "DHL",
          performance: { onTimeDeliveryRate: 94 },
        },
        {
          id: "carrier-land-2",
          name: "FedEx",
          performance: { onTimeDeliveryRate: 96 },
        },
      ],
      RAIL: [
        {
          id: "carrier-rail-1",
          name: "Saudi Railways",
          performance: { onTimeDeliveryRate: 88 },
        },
      ],
      MULTIMODAL: [],
      EXPRESS: [],
      COURIER: [],
    };

    return mockCarriers[mode] || [];
  }

  /**
   * Get reliability data for route option
   */
  private async getReliabilityData(option: RouteOption): Promise<{
    onTimeRate?: number;
    averageDelay?: number;
    riskScore?: number;
    riskFactors?: string[];
  }> {
    // In production, fetch from historical data or analytics service
    return {
      onTimeRate: option.reliability.onTimeRate || 85,
      averageDelay: 2, // hours
      riskScore: 30, // Lower is better
      riskFactors: ["TRAFFIC", "CUSTOMS"],
    };
  }
}

export const routeComparisonService = new RouteComparisonService();
