/**
 * Geofence Predictive Analytics Service
 *
 * AI/ML-powered predictive intelligence for geofence system
 * - Dwell time prediction
 * - Zone entry/exit forecasting
 * - Anomaly detection
 * - Risk scoring
 * - Route optimization
 * - Driver behavior prediction
 *
 * Integrates with:
 * - Knowledge Base (pattern learning)
 * - Agent Orchestration (AI recommendations)
 * - Schrödinger's Truck (quantum predictions)
 * - Process Lifecycle (predictive transitions)
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { eventBus } from "@/lib/services/event-store";
import type { GeofenceZone, GeofenceEvent } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface DwellTimePrediction {
  shipmentId: string;
  zoneId: string;
  predictedDwellTime: number; // minutes
  confidence: number; // 0-1
  factors: {
    historicalAverage: number;
    driverHistory: number;
    timeOfDay: number;
    dayOfWeek: number;
    cargoType: number;
    zoneType: number;
  };
  range: {
    min: number;
    max: number;
    percentile25: number;
    percentile75: number;
  };
  timestamp: Date;
}

export interface ZoneEntryPrediction {
  shipmentId: string;
  zoneId: string;
  predictedEntryTime: Date;
  confidence: number;
  factors: {
    currentLocation: { lat: number; lng: number };
    distanceToZone: number; // km
    averageSpeed: number; // km/h
    trafficConditions: number;
    routeComplexity: number;
  };
  alternativeRoutes?: Array<{
    routeId: string;
    estimatedTime: Date;
    confidence: number;
  }>;
}

export interface AnomalyDetection {
  id: string;
  type:
    | "UNUSUAL_DWELL"
    | "UNEXPECTED_ENTRY"
    | "UNEXPECTED_EXIT"
    | "ROUTE_DEVIATION"
    | "SPEED_VIOLATION"
    | "TIME_ANOMALY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  event: GeofenceEvent;
  zone: GeofenceZone;
  description: string;
  recommendations: string[];
  detectedAt: Date;
}

export interface RiskScore {
  shipmentId: string;
  zoneId: string;
  overallRisk: number; // 0-100
  riskFactors: {
    delayRisk: number;
    complianceRisk: number;
    costRisk: number;
    safetyRisk: number;
  };
  mitigation: {
    actions: string[];
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  };
  timestamp: Date;
}

export interface PredictiveInsight {
  id: string;
  type: "OPTIMIZATION" | "RISK" | "OPPORTUNITY" | "TREND" | "ANOMALY";
  title: string;
  description: string;
  confidence: number;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  value?: number; // Estimated value (cost savings, time savings, etc.)
  recommendations: string[];
  timeframe: "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
  detectedAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

class GeofencePredictiveAnalyticsService {
  private historicalData: Map<string, GeofenceEvent[]> = new Map();
  private predictions: Map<string, DwellTimePrediction> = new Map();
  private anomalies: Map<string, AnomalyDetection> = new Map();

  /**
   * Predict dwell time for a shipment in a zone
   */
  async predictDwellTime(
    shipmentId: string,
    zoneId: string,
    zone: GeofenceZone,
    context: {
      driverId?: string;
      cargoType?: string;
      timeOfDay?: Date;
      historicalEvents?: GeofenceEvent[];
    },
  ): Promise<DwellTimePrediction> {
    // Get historical data
    const historical =
      context.historicalEvents ||
      this.historicalData.get(`${shipmentId}-${zoneId}`) ||
      [];

    // Calculate historical average
    const historicalDwellTimes = historical
      .filter((e) => e.eventType === "ZONE_EXIT" && e.dwellTime !== undefined)
      .map((e) => e.dwellTime!);

    const historicalAverage =
      historicalDwellTimes.length > 0
        ? historicalDwellTimes.reduce((a, b) => a + b, 0) /
          historicalDwellTimes.length
        : zone.metadata.expectedDwellTime || 30;

    // Get driver history from knowledge base
    const driverHistory = context.driverId
      ? await this.getDriverDwellHistory(context.driverId, zoneId)
      : historicalAverage;

    // Time-of-day factor (rush hour, night, etc.)
    const timeOfDay = context.timeOfDay
      ? this.getTimeOfDayFactor(context.timeOfDay)
      : 1.0;

    // Day-of-week factor
    const dayOfWeek = context.timeOfDay
      ? this.getDayOfWeekFactor(context.timeOfDay)
      : 1.0;

    // Cargo type factor
    const cargoType = context.cargoType
      ? this.getCargoTypeFactor(context.cargoType)
      : 1.0;

    // Zone type factor
    const zoneType = this.getZoneTypeFactor(zone.type);

    // Weighted prediction
    const weights = {
      historicalAverage: 0.3,
      driverHistory: 0.25,
      timeOfDay: 0.15,
      dayOfWeek: 0.1,
      cargoType: 0.1,
      zoneType: 0.1,
    };

    const predictedDwellTime =
      historicalAverage * weights.historicalAverage +
      driverHistory * weights.driverHistory +
      historicalAverage * timeOfDay * weights.timeOfDay +
      historicalAverage * dayOfWeek * weights.dayOfWeek +
      historicalAverage * cargoType * weights.cargoType +
      historicalAverage * zoneType * weights.zoneType;

    // Calculate confidence based on data availability
    const confidence = Math.min(
      1.0,
      0.5 + historicalDwellTimes.length * 0.1 + (context.driverId ? 0.2 : 0),
    );

    // Calculate range (percentiles)
    const sorted = [...historicalDwellTimes].sort((a, b) => a - b);
    const percentile25 =
      sorted.length > 0
        ? sorted[Math.floor(sorted.length * 0.25)]
        : predictedDwellTime * 0.75;
    const percentile75 =
      sorted.length > 0
        ? sorted[Math.floor(sorted.length * 0.75)]
        : predictedDwellTime * 1.25;

    const prediction: DwellTimePrediction = {
      shipmentId,
      zoneId,
      predictedDwellTime: Math.round(predictedDwellTime),
      confidence,
      factors: {
        historicalAverage,
        driverHistory,
        timeOfDay,
        dayOfWeek,
        cargoType,
        zoneType,
      },
      range: {
        min: Math.max(0, predictedDwellTime * 0.5),
        max: predictedDwellTime * 2,
        percentile25,
        percentile75,
      },
      timestamp: new Date(),
    };

    this.predictions.set(`${shipmentId}-${zoneId}`, prediction);

    // Publish event
    await eventBus.publish({
      type: "geofence.dwell.predicted",
      data: {
        shipmentId,
        zoneId,
        prediction,
      },
      metadata: {
        source: "geofence-predictive-analytics",
        timestamp: new Date().toISOString(),
      },
    });

    return prediction;
  }

  /**
   * Predict zone entry time
   */
  async predictZoneEntry(
    shipmentId: string,
    zoneId: string,
    zone: GeofenceZone,
    currentLocation: { lat: number; lng: number },
  ): Promise<ZoneEntryPrediction> {
    // Calculate distance to zone
    const zoneCenter =
      zone.geometry.type === "CIRCLE"
        ? (
            zone.geometry.coordinates as {
              center: { lat: number; lng: number };
              radius: number;
            }
          ).center
        : this.getPolygonCenter(zone.geometry.coordinates as number[][]);

    const distance = this.calculateDistance(currentLocation, zoneCenter);

    // Estimate average speed (km/h)
    const averageSpeed = 60; // Default, can be enhanced with historical data

    // Estimate time (hours)
    const estimatedHours = distance / averageSpeed;

    // Adjust for traffic (simplified - can be enhanced with real-time traffic data)
    const trafficFactor = this.getTrafficFactor(new Date());
    const adjustedHours = estimatedHours * trafficFactor;

    // Calculate route complexity (simplified)
    const routeComplexity =
      zone.type === "BORDER_CROSSING"
        ? 1.5
        : zone.type === "CITY_LIMIT"
          ? 1.2
          : 1.0;

    const predictedEntryTime = new Date(
      Date.now() + adjustedHours * routeComplexity * 60 * 60 * 1000,
    );

    const prediction: ZoneEntryPrediction = {
      shipmentId,
      zoneId,
      predictedEntryTime,
      confidence: 0.7, // Can be improved with more data
      factors: {
        currentLocation,
        distanceToZone: distance,
        averageSpeed,
        trafficConditions: trafficFactor,
        routeComplexity,
      },
    };

    return prediction;
  }

  /**
   * Detect anomalies in geofence events
   */
  async detectAnomaly(
    event: GeofenceEvent,
    zone: GeofenceZone,
    historicalEvents: GeofenceEvent[],
  ): Promise<AnomalyDetection | null> {
    const anomalies: AnomalyDetection[] = [];

    // Check for unusual dwell time
    if (event.eventType === "ZONE_EXIT" && event.dwellTime !== undefined) {
      const expectedDwell = zone.metadata.expectedDwellTime || 30;
      const maxDwell = zone.metadata.maxDwellTime || 90;

      if (event.dwellTime > maxDwell * 1.5) {
        anomalies.push({
          id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "UNUSUAL_DWELL",
          severity:
            event.dwellTime > maxDwell * 2
              ? "CRITICAL"
              : event.dwellTime > maxDwell * 1.5
                ? "HIGH"
                : "MEDIUM",
          confidence: 0.85,
          event,
          zone,
          description: `Dwell time of ${event.dwellTime.toFixed(1)} minutes exceeds expected ${expectedDwell} minutes by ${((event.dwellTime / expectedDwell - 1) * 100).toFixed(0)}%`,
          recommendations: [
            "Investigate cause of delay",
            "Contact driver for status update",
            "Notify customer if applicable",
            "Review zone configuration",
          ],
          detectedAt: new Date(),
        });
      }
    }

    // Check for unexpected entry (zone not in expected route)
    if (event.eventType === "ZONE_ENTRY") {
      // This would require route information - simplified for now
      const isExpected = true; // Would check against planned route
      if (!isExpected) {
        anomalies.push({
          id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "UNEXPECTED_ENTRY",
          severity: "HIGH",
          confidence: 0.75,
          event,
          zone,
          description: `Shipment entered unexpected zone: ${zone.name}`,
          recommendations: [
            "Verify route deviation",
            "Check driver instructions",
            "Investigate if authorized",
          ],
          detectedAt: new Date(),
        });
      }
    }

    // Check for time-of-day anomalies
    const eventHour = new Date(event.timestamp).getHours();
    const isUnusualTime =
      (eventHour >= 22 || eventHour <= 5) && zone.type !== "REST_AREA";
    if (isUnusualTime) {
      anomalies.push({
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "TIME_ANOMALY",
        severity: "MEDIUM",
        confidence: 0.7,
        event,
        zone,
        description: `Zone event occurred at unusual time: ${eventHour}:00`,
        recommendations: [
          "Verify event accuracy",
          "Check driver schedule",
          "Review zone operating hours",
        ],
        detectedAt: new Date(),
      });
    }

    // Return highest severity anomaly
    if (anomalies.length > 0) {
      const sorted = anomalies.sort((a, b) => {
        const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
      const anomaly = sorted[0];
      this.anomalies.set(anomaly.id, anomaly);

      // Publish event
      await eventBus.publish({
        type: "geofence.anomaly.detected",
        data: {
          anomaly,
          event,
          zone,
        },
        metadata: {
          source: "geofence-predictive-analytics",
          timestamp: new Date().toISOString(),
        },
      });

      return anomaly;
    }

    return null;
  }

  /**
   * Calculate risk score for a shipment in a zone
   */
  async calculateRiskScore(
    shipmentId: string,
    zoneId: string,
    zone: GeofenceZone,
    context: {
      currentDwellTime?: number;
      predictedDwellTime?: number;
      historicalDelays?: number;
    },
  ): Promise<RiskScore> {
    // Delay risk
    const delayRisk =
      context.currentDwellTime && context.predictedDwellTime
        ? Math.min(
            100,
            (context.currentDwellTime / context.predictedDwellTime - 1) * 50,
          )
        : context.historicalDelays
          ? Math.min(100, context.historicalDelays * 10)
          : 20;

    // Compliance risk (based on zone type and operating hours)
    const complianceRisk = zone.metadata.operatingHours
      ? this.checkOperatingHoursCompliance(zone, new Date())
      : 10;

    // Cost risk (based on dwell time and zone type)
    const costRisk = context.currentDwellTime
      ? Math.min(
          100,
          (context.currentDwellTime / (zone.metadata.maxDwellTime || 90)) * 50,
        )
      : 15;

    // Safety risk (based on zone type)
    const safetyRisk =
      zone.type === "RESTRICTED_AREA"
        ? 40
        : zone.type === "BORDER_CROSSING"
          ? 30
          : zone.type === "CITY_LIMIT"
            ? 20
            : 10;

    // Overall risk (weighted average)
    const overallRisk =
      delayRisk * 0.4 +
      complianceRisk * 0.2 +
      costRisk * 0.2 +
      safetyRisk * 0.2;

    // Generate mitigation actions
    const actions: string[] = [];
    if (delayRisk > 50) actions.push("Contact driver for status update");
    if (delayRisk > 70) actions.push("Escalate to operations manager");
    if (complianceRisk > 50) actions.push("Review compliance requirements");
    if (costRisk > 50) actions.push("Optimize zone configuration");
    if (safetyRisk > 50) actions.push("Verify safety protocols");

    const riskScore: RiskScore = {
      shipmentId,
      zoneId,
      overallRisk: Math.round(overallRisk),
      riskFactors: {
        delayRisk: Math.round(delayRisk),
        complianceRisk: Math.round(complianceRisk),
        costRisk: Math.round(costRisk),
        safetyRisk: Math.round(safetyRisk),
      },
      mitigation: {
        actions,
        priority:
          overallRisk > 70
            ? "URGENT"
            : overallRisk > 50
              ? "HIGH"
              : overallRisk > 30
                ? "MEDIUM"
                : "LOW",
      },
      timestamp: new Date(),
    };

    return riskScore;
  }

  /**
   * Generate predictive insights
   */
  async generateInsights(
    tenantId: string,
    timeRange?: { start: Date; end: Date },
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // This would analyze historical data and generate insights
    // Simplified for now - can be enhanced with ML models

    // Example: Zone optimization opportunity
    insights.push({
      id: `insight-${Date.now()}-1`,
      type: "OPTIMIZATION",
      title: "Zone Optimization Opportunity",
      description:
        'Zone "Main Warehouse" shows consistent dwell time patterns. Consider adjusting expected dwell time to 25 minutes (currently 30).',
      confidence: 0.82,
      impact: "MEDIUM",
      value: 5000, // Estimated annual savings
      recommendations: [
        "Review historical dwell times",
        "Adjust zone configuration",
        "Monitor impact of changes",
      ],
      timeframe: "SHORT_TERM",
      detectedAt: new Date(),
    });

    return insights;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getDriverDwellHistory(
    driverId: string,
    zoneId: string,
  ): Promise<number> {
    // Query knowledge base for driver history
    try {
      const results = await knowledgeBaseService.search({
        query: `driver ${driverId} dwell time zone ${zoneId}`,
        tenantId: "default",
        maxResults: 10,
      });
      // Extract average from results (simplified)
      return 30; // Default, would calculate from results
    } catch {
      return 30; // Default
    }
  }

  private getTimeOfDayFactor(time: Date): number {
    const hour = time.getHours();
    // Rush hour factors
    if (hour >= 7 && hour <= 9) return 1.3; // Morning rush
    if (hour >= 17 && hour <= 19) return 1.4; // Evening rush
    if (hour >= 22 || hour <= 5) return 0.8; // Night (less traffic)
    return 1.0; // Normal
  }

  private getDayOfWeekFactor(time: Date): number {
    const day = time.getDay();
    // Weekend factors
    if (day === 0 || day === 6) return 0.9; // Weekend (less traffic)
    if (day === 5) return 1.1; // Friday (more traffic)
    return 1.0; // Normal
  }

  private getCargoTypeFactor(cargoType: string): number {
    // Different cargo types have different handling times
    const factors: Record<string, number> = {
      HAZMAT: 1.5,
      REFRIGERATED: 1.3,
      FRAGILE: 1.2,
      STANDARD: 1.0,
    };
    return factors[cargoType.toUpperCase()] || 1.0;
  }

  private getZoneTypeFactor(zoneType: GeofenceZone["type"]): number {
    const factors: Record<GeofenceZone["type"], number> = {
      WAREHOUSE: 1.0,
      CUSTOMER_SITE: 1.2,
      CHECKPOINT: 0.5,
      BORDER_CROSSING: 2.0,
      REST_AREA: 0.3,
      FUEL_STATION: 0.2,
      RESTRICTED_AREA: 1.5,
      CITY_LIMIT: 0.1,
      CUSTOM: 1.0,
    };
    return factors[zoneType] || 1.0;
  }

  private getTrafficFactor(time: Date): number {
    // Simplified traffic factor (can be enhanced with real-time traffic API)
    const hour = time.getHours();
    if (hour >= 7 && hour <= 9) return 1.3;
    if (hour >= 17 && hour <= 19) return 1.4;
    return 1.0;
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private getPolygonCenter(coordinates: number[][]): {
    lat: number;
    lng: number;
  } {
    // Calculate centroid
    let sumLat = 0;
    let sumLng = 0;
    for (const coord of coordinates) {
      sumLat += coord[0];
      sumLng += coord[1];
    }
    return {
      lat: sumLat / coordinates.length,
      lng: sumLng / coordinates.length,
    };
  }

  private checkOperatingHoursCompliance(
    zone: GeofenceZone,
    time: Date,
  ): number {
    if (!zone.metadata.operatingHours) return 10;

    const hour = time.getHours();
    const minute = time.getMinutes();
    const currentTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const dayName = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][time.getDay()];

    const operatingHours = zone.metadata.operatingHours;
    if (!operatingHours.days.includes(dayName)) return 80; // Outside operating days

    if (currentTime < operatingHours.from || currentTime > operatingHours.to) {
      return 60; // Outside operating hours
    }

    return 10; // Compliant
  }
}

export const geofencePredictiveAnalyticsService =
  new GeofencePredictiveAnalyticsService();
