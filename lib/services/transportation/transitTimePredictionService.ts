/**
 * Transit Time Prediction Service
 *
 * AI-powered transit time prediction with confidence intervals,
 * delay probability, and risk factor analysis
 */

import type {
  Location,
  TransitTimePrediction,
  TransportMode,
} from "@/types/tms";
import { callAI } from "@/utils/aiClient";
import { assertRealInProduction } from "./strictMode";

export interface TransitTimePredictionRequest {
  origin: Location;
  destination: Location;
  mode: TransportMode;
  waypoints?: Location[];
  cargo?: {
    weight?: number;
    volume?: number;
    type?: string;
  };
  date?: Date | string;
}

export class TransitTimePredictionService {
  // Base speeds by mode (km/h)
  private baseSpeeds: Record<TransportMode, number> = {
    AIR: 800,
    SEA: 30,
    LAND: 80,
    RAIL: 60,
    MULTIMODAL: 50,
    EXPRESS: 100,
    COURIER: 60,
  };

  // Base transit times by mode (hours per 1000km)
  private baseTransitTimes: Record<TransportMode, number> = {
    AIR: 1.25, // 1.25 hours per 1000km
    SEA: 33.3, // 33.3 hours per 1000km
    LAND: 12.5, // 12.5 hours per 1000km
    RAIL: 16.7, // 16.7 hours per 1000km
    MULTIMODAL: 20, // 20 hours per 1000km
    EXPRESS: 10, // 10 hours per 1000km
    COURIER: 16.7, // 16.7 hours per 1000km
  };

  /**
   * Predict transit time for a route
   */
  async predictTransitTime(
    request: TransitTimePredictionRequest,
  ): Promise<TransitTimePrediction> {
    const { origin, destination, mode, waypoints, cargo, date } = request;

    // Calculate distance
    const distance = this.calculateDistance(origin, destination, waypoints);

    // Get base transit time
    const baseTransitTime = (distance / 1000) * this.baseTransitTimes[mode];

    // Get factors affecting transit time
    const factors = await this.analyzeFactors(origin, destination, mode, date);

    // Calculate predictions with confidence intervals
    const predictions = this.calculatePredictions(
      baseTransitTime,
      factors,
      mode,
    );

    // Break down by segments if multimodal or has waypoints
    const segments = await this.calculateSegments(
      origin,
      destination,
      waypoints,
      mode,
      factors,
    );

    // Get AI insights
    const aiInsights = await this.getAIInsights(
      origin,
      destination,
      mode,
      factors,
      predictions,
    );

    return {
      route: {
        origin,
        destination,
        mode,
        waypoints,
      },
      predictions,
      factors: {
        distance,
        mode,
        historicalAverage: baseTransitTime,
        ...factors,
      },
      segments,
      aiInsights,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Valid for 24 hours
    };
  }

  /**
   * Calculate distance including waypoints
   */
  private calculateDistance(
    origin: Location,
    destination: Location,
    waypoints?: Location[],
  ): number {
    let totalDistance = 0;

    // Distance from origin to first waypoint or destination
    if (waypoints && waypoints.length > 0) {
      totalDistance += this.haversineDistance(origin, waypoints[0]);

      // Distances between waypoints
      for (let i = 0; i < waypoints.length - 1; i++) {
        totalDistance += this.haversineDistance(waypoints[i], waypoints[i + 1]);
      }

      // Distance from last waypoint to destination
      totalDistance += this.haversineDistance(
        waypoints[waypoints.length - 1],
        destination,
      );
    } else {
      totalDistance = this.haversineDistance(origin, destination);
    }

    return totalDistance;
  }

  /**
   * Haversine distance calculation
   */
  private haversineDistance(loc1: Location, loc2: Location): number {
    if (!loc1.coordinates || !loc2.coordinates) {
      // Fallback: estimate 1000 km
      return 1000;
    }

    const R = 6371; // Earth's radius in km
    const lat1 = loc1.coordinates.lat;
    const lon1 = loc1.coordinates.lng;
    const lat2 = loc2.coordinates.lat;
    const lon2 = loc2.coordinates.lng;

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

  /**
   * Analyze factors affecting transit time
   */
  private async analyzeFactors(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    date?: Date | string,
  ): Promise<{
    trafficConditions?: "LIGHT" | "MODERATE" | "HEAVY" | "SEVERE";
    weatherImpact?: "NONE" | "MINOR" | "MODERATE" | "MAJOR";
    customsImpact?: number;
    portCongestion?: "LOW" | "MEDIUM" | "HIGH";
    seasonalFactors?: string[];
  }> {
    // In production, integrate with real-time data sources
    // For now, simulate based on mode and route
    assertRealInProduction(
      "tms.transitTimePrediction.factors",
      "Transit time factor analysis is simulated. Configure telemetry + historical analytics for production.",
    );

    const factors: TransitTimePrediction["factors"] = {
      trafficConditions: mode === "LAND" ? "MODERATE" : undefined,
      weatherImpact: "NONE",
      customsImpact: 0,
      portCongestion: mode === "SEA" ? "MEDIUM" : undefined,
      seasonalFactors: [],
    };

    // Add customs impact for international shipments
    if (origin.address.countryCode !== destination.address.countryCode) {
      factors.customsImpact = mode === "AIR" ? 2 : mode === "SEA" ? 24 : 4; // hours
    }

    // Add seasonal factors
    const currentDate = date ? new Date(date) : new Date();
    const month = currentDate.getMonth();

    if (month >= 10 || month <= 1) {
      factors.seasonalFactors?.push("HOLIDAY_SEASON");
      factors.trafficConditions = "HEAVY";
    }

    return factors;
  }

  /**
   * Calculate predictions with confidence intervals
   */
  private calculatePredictions(
    baseTransitTime: number,
    factors: TransitTimePrediction["factors"],
    mode: TransportMode,
  ): TransitTimePrediction["predictions"] {
    // Calculate adjustments based on factors
    let adjustment = 0;

    // Traffic conditions
    if (factors.trafficConditions === "HEAVY") adjustment += 0.2;
    else if (factors.trafficConditions === "SEVERE") adjustment += 0.4;
    else if (factors.trafficConditions === "MODERATE") adjustment += 0.1;

    // Weather impact
    if (factors.weatherImpact === "MINOR") adjustment += 0.1;
    else if (factors.weatherImpact === "MODERATE") adjustment += 0.2;
    else if (factors.weatherImpact === "MAJOR") adjustment += 0.4;

    // Port congestion
    if (factors.portCongestion === "MEDIUM") adjustment += 0.15;
    else if (factors.portCongestion === "HIGH") adjustment += 0.3;

    // Customs impact
    if (factors.customsImpact) {
      adjustment += factors.customsImpact / baseTransitTime;
    }

    // Calculate predictions
    const realistic = baseTransitTime * (1 + adjustment);
    const optimistic = realistic * 0.85; // 15% faster
    const pessimistic = realistic * 1.3; // 30% slower

    // Confidence based on factors
    let confidence = 0.8;
    if (
      factors.trafficConditions === "SEVERE" ||
      factors.weatherImpact === "MAJOR"
    ) {
      confidence = 0.6;
    } else if (
      factors.trafficConditions === "LIGHT" &&
      factors.weatherImpact === "NONE"
    ) {
      confidence = 0.9;
    }

    return {
      optimistic: Math.round(optimistic * 10) / 10,
      realistic: Math.round(realistic * 10) / 10,
      pessimistic: Math.round(pessimistic * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Calculate transit time by segments
   */
  private async calculateSegments(
    origin: Location,
    destination: Location,
    waypoints: Location[] | undefined,
    mode: TransportMode,
    factors: TransitTimePrediction["factors"],
  ): Promise<TransitTimePrediction["segments"]> {
    const segments: TransitTimePrediction["segments"] = [];

    if (waypoints && waypoints.length > 0) {
      // Segment from origin to first waypoint
      const distance1 = this.haversineDistance(origin, waypoints[0]);
      const time1 = (distance1 / 1000) * this.baseTransitTimes[mode];
      segments.push({
        segment: `${origin.name} → ${waypoints[0].name}`,
        estimatedTime: Math.round(time1 * 10) / 10,
        distance: Math.round(distance1),
        mode,
        factors: [],
      });

      // Segments between waypoints
      for (let i = 0; i < waypoints.length - 1; i++) {
        const distance = this.haversineDistance(waypoints[i], waypoints[i + 1]);
        const time = (distance / 1000) * this.baseTransitTimes[mode];
        segments.push({
          segment: `${waypoints[i].name} → ${waypoints[i + 1].name}`,
          estimatedTime: Math.round(time * 10) / 10,
          distance: Math.round(distance),
          mode,
          factors: [],
        });
      }

      // Segment from last waypoint to destination
      const distance2 = this.haversineDistance(
        waypoints[waypoints.length - 1],
        destination,
      );
      const time2 = (distance2 / 1000) * this.baseTransitTimes[mode];
      segments.push({
        segment: `${waypoints[waypoints.length - 1].name} → ${destination.name}`,
        estimatedTime: Math.round(time2 * 10) / 10,
        distance: Math.round(distance2),
        mode,
        factors: [],
      });
    } else {
      // Single segment
      const distance = this.haversineDistance(origin, destination);
      const time = (distance / 1000) * this.baseTransitTimes[mode];
      segments.push({
        segment: `${origin.name} → ${destination.name}`,
        estimatedTime: Math.round(time * 10) / 10,
        distance: Math.round(distance),
        mode,
        factors: [],
      });
    }

    return segments;
  }

  /**
   * Get AI insights for transit time
   */
  private async getAIInsights(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    factors: TransitTimePrediction["factors"],
    predictions: TransitTimePrediction["predictions"],
  ): Promise<TransitTimePrediction["aiInsights"]> {
    // Calculate delay probability
    const delayProbability = this.calculateDelayProbability(
      factors,
      predictions,
    );

    // Identify risk factors
    const riskFactors: string[] = [];
    if (
      factors.trafficConditions === "HEAVY" ||
      factors.trafficConditions === "SEVERE"
    ) {
      riskFactors.push("Heavy traffic expected");
    }
    if (
      factors.weatherImpact === "MODERATE" ||
      factors.weatherImpact === "MAJOR"
    ) {
      riskFactors.push("Weather conditions may cause delays");
    }
    if (factors.portCongestion === "HIGH") {
      riskFactors.push("High port congestion");
    }
    if (factors.customsImpact && factors.customsImpact > 12) {
      riskFactors.push("Extended customs clearance time");
    }
    if (factors.seasonalFactors?.includes("HOLIDAY_SEASON")) {
      riskFactors.push("Holiday season - increased delays");
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (delayProbability > 0.5) {
      recommendations.push(
        "Consider booking earlier to account for potential delays",
      );
    }
    if (factors.customsImpact && factors.customsImpact > 12) {
      recommendations.push(
        "Ensure all customs documents are prepared in advance",
      );
    }
    if (factors.portCongestion === "HIGH") {
      recommendations.push("Consider alternative ports or earlier booking");
    }

    return {
      delayProbability: Math.round(delayProbability * 100) / 100,
      riskFactors: riskFactors.length > 0 ? riskFactors : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  /**
   * Calculate delay probability
   */
  private calculateDelayProbability(
    factors: TransitTimePrediction["factors"],
    predictions: TransitTimePrediction["predictions"],
  ): number {
    let probability = 0.3; // Base probability

    // Adjust based on factors
    if (factors.trafficConditions === "HEAVY") probability += 0.2;
    if (factors.trafficConditions === "SEVERE") probability += 0.4;
    if (factors.weatherImpact === "MODERATE") probability += 0.15;
    if (factors.weatherImpact === "MAJOR") probability += 0.3;
    if (factors.portCongestion === "HIGH") probability += 0.2;
    if (factors.customsImpact && factors.customsImpact > 12)
      probability += 0.15;

    // Adjust based on confidence
    if (predictions.confidence < 0.7) probability += 0.1;

    return Math.min(probability, 0.95); // Cap at 95%
  }
}

export const transitTimePredictionService = new TransitTimePredictionService();
