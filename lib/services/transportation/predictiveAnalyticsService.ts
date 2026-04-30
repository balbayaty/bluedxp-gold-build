/**
 * Transportation Predictive Analytics Service
 *
 * Demand forecasting, disruption prediction, carrier performance prediction
 * Integrates with existing ML registry and analytics services
 */

import type { Shipment, TransportMode } from "@/types/tms";
import { mlModelRegistry } from "@/lib/services/ml-registry";
import { callAI } from "@/utils/aiClient";
import { eventBus } from "@/lib/services/event-store";
import { assertRealInProduction } from "./strictMode";

export interface DemandForecast {
  period: { from: Date; to: Date };
  mode: TransportMode;
  region: string;
  predictedVolume: number;
  confidence: number; // 0-100
  factors: {
    seasonal: number;
    trend: number;
    market: number;
  };
  historicalComparison: {
    average: number;
    deviation: number;
  };
}

export interface DisruptionPrediction {
  shipmentId: string;
  type:
    | "WEATHER"
    | "TRAFFIC"
    | "PORT_CONGESTION"
    | "CUSTOMS_DELAY"
    | "CARRIER_ISSUE";
  probability: number; // 0-100
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  predictedImpact: {
    delayHours?: number;
    costImpact?: number;
    alternativeRoutes?: string[];
  };
  recommendations: string[];
  detectedAt: Date | string;
}

export interface CarrierPerformancePrediction {
  carrierId: string;
  predictedOnTimeRate: number; // %
  predictedCost: number;
  predictedReliability: number; // %
  confidence: number;
  factors: {
    historical: number;
    current: number;
    market: number;
  };
  riskScore: number; // 0-100 (lower is better)
}

export class TransportationPredictiveAnalyticsService {
  /**
   * Forecast demand
   */
  async forecastDemand(
    mode: TransportMode,
    region: string,
    period: { from: Date; to: Date },
  ): Promise<DemandForecast> {
    // Get historical data
    const historicalData = await this.getHistoricalShipments(mode, region, {
      from: new Date(period.from.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year back
      to: period.from,
    });

    // Calculate seasonal factors
    const seasonal = this.calculateSeasonalFactor(period.from);

    // Calculate trend
    const trend = this.calculateTrend(historicalData);

    // Use ML model if available
    let predictedVolume = 0;
    let confidence = 70;

    try {
      const mlResult = await mlModelRegistry.predict("demand-forecast", {
        mode,
        region,
        historicalData: historicalData.length,
        seasonal,
        trend,
      });

      if (mlResult && mlResult.predictedVolume) {
        predictedVolume = mlResult.predictedVolume;
        confidence = mlResult.confidence || 70;
      } else {
        // Fallback to statistical forecast
        predictedVolume = this.statisticalForecast(
          historicalData,
          seasonal,
          trend,
        );
      }
    } catch (error) {
      // ML model not available, use statistical
      predictedVolume = this.statisticalForecast(
        historicalData,
        seasonal,
        trend,
      );
    }

    const average =
      historicalData.length > 0
        ? historicalData.reduce((sum, s) => sum + 1, 0) / historicalData.length
        : 0;

    return {
      period,
      mode,
      region,
      predictedVolume,
      confidence,
      factors: {
        seasonal,
        trend,
        market: 1.0,
      },
      historicalComparison: {
        average,
        deviation: predictedVolume - average,
      },
    };
  }

  /**
   * Predict disruptions
   */
  async predictDisruptions(
    shipment: Shipment,
  ): Promise<DisruptionPrediction[]> {
    const predictions: DisruptionPrediction[] = [];

    // Weather prediction
    const weatherPrediction = await this.predictWeatherDisruption(shipment);
    if (weatherPrediction) predictions.push(weatherPrediction);

    // Traffic prediction
    const trafficPrediction = await this.predictTrafficDisruption(shipment);
    if (trafficPrediction) predictions.push(trafficPrediction);

    // Port congestion
    if (shipment.mode === "SEA") {
      const portPrediction = await this.predictPortCongestion(shipment);
      if (portPrediction) predictions.push(portPrediction);
    }

    // Customs delay
    if (
      shipment.origin.address.countryCode !==
      shipment.destination.address.countryCode
    ) {
      const customsPrediction = await this.predictCustomsDelay(shipment);
      if (customsPrediction) predictions.push(customsPrediction);
    }

    // Carrier issues
    if (shipment.carrierId) {
      const carrierPrediction = await this.predictCarrierIssues(shipment);
      if (carrierPrediction) predictions.push(carrierPrediction);
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Predict carrier performance
   */
  async predictCarrierPerformance(
    carrierId: string,
  ): Promise<CarrierPerformancePrediction> {
    // Get historical performance
    const historical = await this.getCarrierHistoricalPerformance(carrierId);

    // Use ML model if available
    let predictedOnTimeRate = 85;
    let predictedCost = 1000;
    let predictedReliability = 80;
    let confidence = 70;

    try {
      const mlResult = await mlModelRegistry.predict("carrier-performance", {
        carrierId,
        historical,
      });

      if (mlResult) {
        predictedOnTimeRate = mlResult.onTimeRate || predictedOnTimeRate;
        predictedCost = mlResult.cost || predictedCost;
        predictedReliability = mlResult.reliability || predictedReliability;
        confidence = mlResult.confidence || confidence;
      }
    } catch (error) {
      // Use statistical prediction
      predictedOnTimeRate = historical.averageOnTimeRate || 85;
      predictedCost = historical.averageCost || 1000;
      predictedReliability = historical.averageReliability || 80;
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(
      predictedOnTimeRate,
      predictedReliability,
      historical,
    );

    return {
      carrierId,
      predictedOnTimeRate,
      predictedCost,
      predictedReliability,
      confidence,
      factors: {
        historical: 0.5,
        current: 0.3,
        market: 0.2,
      },
      riskScore,
    };
  }

  /**
   * Predict weather disruption
   */
  private async predictWeatherDisruption(
    shipment: Shipment,
  ): Promise<DisruptionPrediction | null> {
    // In production, integrate with weather API
    // For now, simulate
    assertRealInProduction(
      "tms.predictive.weather",
      "Weather disruption prediction is simulated. Configure weather provider integration for production.",
    );
    const probability = Math.random() * 20; // 0-20% chance
    if (probability < 5) return null;

    return {
      shipmentId: shipment.id,
      type: "WEATHER",
      probability: Math.round(probability),
      severity: probability > 15 ? "HIGH" : probability > 10 ? "MEDIUM" : "LOW",
      predictedImpact: {
        delayHours: probability * 2,
      },
      recommendations: [
        "Monitor weather conditions",
        "Consider alternative routes",
        "Add buffer time to delivery",
      ],
      detectedAt: new Date().toISOString(),
    };
  }

  /**
   * Predict traffic disruption
   */
  private async predictTrafficDisruption(
    shipment: Shipment,
  ): Promise<DisruptionPrediction | null> {
    // In production, integrate with traffic API
    assertRealInProduction(
      "tms.predictive.traffic",
      "Traffic disruption prediction is not implemented. Configure traffic provider integration for production.",
    );
    return null;
  }

  /**
   * Predict port congestion
   */
  private async predictPortCongestion(
    shipment: Shipment,
  ): Promise<DisruptionPrediction | null> {
    // In production, integrate with port APIs
    assertRealInProduction(
      "tms.predictive.portCongestion",
      "Port congestion prediction is not implemented. Configure port/terminal integrations for production.",
    );
    return null;
  }

  /**
   * Predict customs delay
   */
  private async predictCustomsDelay(
    shipment: Shipment,
  ): Promise<DisruptionPrediction | null> {
    // Check historical customs clearance times
    const avgClearanceTime = 24; // hours (would come from historical data)
    const probability = shipment.customs?.status === "PENDING" ? 30 : 10;

    return {
      shipmentId: shipment.id,
      type: "CUSTOMS_DELAY",
      probability,
      severity: probability > 20 ? "MEDIUM" : "LOW",
      predictedImpact: {
        delayHours: avgClearanceTime,
      },
      recommendations: [
        "Ensure all documents are complete",
        "Work with experienced customs broker",
        "Consider AEO status for faster clearance",
      ],
      detectedAt: new Date().toISOString(),
    };
  }

  /**
   * Predict carrier issues
   */
  private async predictCarrierIssues(
    shipment: Shipment,
  ): Promise<DisruptionPrediction | null> {
    if (!shipment.carrierId) return null;

    const performance = await this.predictCarrierPerformance(
      shipment.carrierId,
    );
    const probability = 100 - performance.predictedOnTimeRate;

    if (probability < 10) return null;

    return {
      shipmentId: shipment.id,
      type: "CARRIER_ISSUE",
      probability,
      severity: probability > 30 ? "HIGH" : probability > 15 ? "MEDIUM" : "LOW",
      predictedImpact: {
        delayHours: probability * 0.5,
      },
      recommendations: [
        "Monitor carrier performance closely",
        "Have backup carrier ready",
        "Communicate proactively with carrier",
      ],
      detectedAt: new Date().toISOString(),
    };
  }

  /**
   * Get historical shipments
   */
  private async getHistoricalShipments(
    mode: TransportMode,
    region: string,
    period: { from: Date; to: Date },
  ): Promise<Shipment[]> {
    // In production, query database
    return [];
  }

  /**
   * Calculate seasonal factor
   */
  private calculateSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    // Holiday season (Nov-Jan) typically higher demand
    if (month >= 10 || month <= 1) return 1.2;
    // Summer months (Jun-Aug) typically lower
    if (month >= 5 && month <= 7) return 0.9;
    return 1.0;
  }

  /**
   * Calculate trend
   */
  private calculateTrend(historicalData: Shipment[]): number {
    // In production, calculate actual trend
    return 1.0;
  }

  /**
   * Statistical forecast
   */
  private statisticalForecast(
    historicalData: Shipment[],
    seasonal: number,
    trend: number,
  ): number {
    const baseVolume = historicalData.length;
    return baseVolume * seasonal * trend;
  }

  /**
   * Get carrier historical performance
   */
  private async getCarrierHistoricalPerformance(carrierId: string): Promise<{
    averageOnTimeRate: number;
    averageCost: number;
    averageReliability: number;
  }> {
    // In production, query database
    return {
      averageOnTimeRate: 85,
      averageCost: 1000,
      averageReliability: 80,
    };
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(
    onTimeRate: number,
    reliability: number,
    historical: any,
  ): number {
    // Lower on-time rate = higher risk
    const onTimeRisk = 100 - onTimeRate;
    // Lower reliability = higher risk
    const reliabilityRisk = 100 - reliability;
    // Combine
    return onTimeRisk * 0.6 + reliabilityRisk * 0.4;
  }
}

export const transportationPredictiveAnalyticsService =
  new TransportationPredictiveAnalyticsService();
