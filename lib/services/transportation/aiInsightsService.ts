/**
 * AI Insights Service for Transportation
 *
 * Provides AI-powered insights, recommendations, predictions, and optimizations
 * for transportation operations
 */

import type {
  Shipment,
  TransportationInsight,
  TransportationAIInsights,
  RouteOption,
} from "@/types/tms";
import { callAI } from "@/utils/aiClient";
import { routeComparisonService } from "./routeComparisonService";
import { pricingIntelligenceService } from "./pricingIntelligenceService";
import { co2EmissionsService } from "./co2EmissionsService";
import { transitTimePredictionService } from "./transitTimePredictionService";

export interface AIInsightsRequest {
  shipment?: Shipment;
  routeOptions?: RouteOption[];
  historicalData?: {
    similarShipments?: Shipment[];
    performanceMetrics?: Record<string, number>;
  };
}

export class TransportationAIInsightsService {
  /**
   * Generate comprehensive AI insights for a shipment
   */
  async generateInsights(
    request: AIInsightsRequest,
  ): Promise<TransportationAIInsights> {
    const { shipment, routeOptions, historicalData } = request;

    if (!shipment) {
      throw new Error("Shipment is required for insights generation");
    }

    const insights: TransportationInsight[] = [];

    // Cost optimization insights
    const costInsights = await this.generateCostOptimizationInsights(
      shipment,
      routeOptions,
    );
    insights.push(...costInsights);

    // Route optimization insights
    const routeInsights = await this.generateRouteOptimizationInsights(
      shipment,
      routeOptions,
    );
    insights.push(...routeInsights);

    // Carrier selection insights
    const carrierInsights = await this.generateCarrierSelectionInsights(
      shipment,
      historicalData,
    );
    insights.push(...carrierInsights);

    // Timing optimization insights
    const timingInsights =
      await this.generateTimingOptimizationInsights(shipment);
    insights.push(...timingInsights);

    // Risk mitigation insights
    const riskInsights = await this.generateRiskMitigationInsights(
      shipment,
      historicalData,
    );
    insights.push(...riskInsights);

    // Sustainability insights
    const sustainabilityInsights = await this.generateSustainabilityInsights(
      shipment,
      routeOptions,
    );
    insights.push(...sustainabilityInsights);

    // Sort by priority and impact score
    insights.sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.impact.score - a.impact.score;
    });

    // Generate summary
    const summary = this.generateSummary(insights);

    return {
      shipmentId: shipment.id,
      insights,
      summary,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate cost optimization insights
   */
  private async generateCostOptimizationInsights(
    shipment: Shipment,
    routeOptions?: RouteOption[],
  ): Promise<TransportationInsight[]> {
    const insights: TransportationInsight[] = [];

    if (!routeOptions || routeOptions.length === 0) {
      // Generate route options for comparison
      const comparison = await routeComparisonService.compareRoutes({
        origin: shipment.origin,
        destination: shipment.destination,
        cargo: {
          weight: shipment.totalWeight,
          volume: shipment.totalVolume,
          value: shipment.totalValue,
          type: shipment.type,
        },
        preferences: {
          prioritize: "COST",
        },
      });

      routeOptions = comparison.options;
    }

    if (routeOptions.length > 0) {
      // Find best cost option
      const bestCostOption = routeOptions.reduce((best, current) =>
        current.pricing.totalCost < best.pricing.totalCost ? current : best,
      );

      // Compare with current shipment cost
      const currentCost = shipment.freightCharges?.total || 0;
      const potentialSavings = currentCost - bestCostOption.pricing.totalCost;

      if (potentialSavings > 0) {
        insights.push({
          id: `cost-opt-${shipment.id}`,
          type: "COST_OPTIMIZATION",
          priority: potentialSavings > currentCost * 0.1 ? "HIGH" : "MEDIUM",
          title: "Cost Optimization Opportunity",
          description: `Alternative route could save ${potentialSavings.toFixed(2)} ${shipment.currency || "USD"}`,
          impact: {
            potentialSavings,
            score: Math.min((potentialSavings / currentCost) * 100, 100),
          },
          recommendations: [
            {
              action: "Consider alternative route",
              description: `Route via ${bestCostOption.carrierName || bestCostOption.mode} offers ${((potentialSavings / currentCost) * 100).toFixed(1)}% cost savings`,
              expectedOutcome: `Save ${potentialSavings.toFixed(2)} ${shipment.currency || "USD"}`,
              effort: "LOW",
              cost: 0,
            },
          ],
          evidence: {
            dataPoints: [
              `Current cost: ${currentCost.toFixed(2)}`,
              `Best alternative: ${bestCostOption.pricing.totalCost.toFixed(2)}`,
              `Savings: ${potentialSavings.toFixed(2)}`,
            ],
            confidence: 0.85,
          },
          relatedShipments: [shipment.id],
          generatedAt: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  /**
   * Generate route optimization insights
   */
  private async generateRouteOptimizationInsights(
    shipment: Shipment,
    routeOptions?: RouteOption[],
  ): Promise<TransportationInsight[]> {
    const insights: TransportationInsight[] = [];

    if (!routeOptions || routeOptions.length === 0) {
      return insights;
    }

    // Find fastest route
    const fastestRoute = routeOptions.reduce((best, current) =>
      current.transitTime.estimated < best.transitTime.estimated
        ? current
        : best,
    );

    // Find most reliable route
    const mostReliableRoute = routeOptions.reduce((best, current) =>
      (current.reliability.onTimeRate || 0) > (best.reliability.onTimeRate || 0)
        ? current
        : best,
    );

    // Compare with current route
    const currentTransitTime = shipment.route?.estimatedDuration || 0;
    const fastestTransitTime = fastestRoute.transitTime.estimated;

    if (currentTransitTime > 0 && fastestTransitTime < currentTransitTime) {
      const timeReduction = currentTransitTime - fastestTransitTime;
      insights.push({
        id: `route-opt-${shipment.id}`,
        type: "ROUTE_OPTIMIZATION",
        priority: timeReduction > 24 ? "HIGH" : "MEDIUM",
        title: "Faster Route Available",
        description: `Alternative route could reduce transit time by ${timeReduction.toFixed(1)} hours`,
        impact: {
          timeReduction,
          score: Math.min((timeReduction / currentTransitTime) * 100, 100),
        },
        recommendations: [
          {
            action: "Consider faster route",
            description: `Route via ${fastestRoute.carrierName || fastestRoute.mode} is ${timeReduction.toFixed(1)} hours faster`,
            expectedOutcome: `Reduce transit time by ${timeReduction.toFixed(1)} hours`,
            effort: "LOW",
          },
        ],
        evidence: {
          dataPoints: [
            `Current transit time: ${currentTransitTime.toFixed(1)} hours`,
            `Fastest alternative: ${fastestTransitTime.toFixed(1)} hours`,
            `Time reduction: ${timeReduction.toFixed(1)} hours`,
          ],
          confidence: 0.8,
        },
        relatedShipments: [shipment.id],
        generatedAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Generate carrier selection insights
   */
  private async generateCarrierSelectionInsights(
    shipment: Shipment,
    historicalData?: AIInsightsRequest["historicalData"],
  ): Promise<TransportationInsight[]> {
    const insights: TransportationInsight[] = [];

    if (
      !historicalData?.similarShipments ||
      historicalData.similarShipments.length === 0
    ) {
      return insights;
    }

    // Analyze carrier performance from historical data
    const carrierPerformance = new Map<
      string,
      {
        count: number;
        onTimeRate: number;
        averageCost: number;
        totalCost: number;
      }
    >();

    historicalData.similarShipments.forEach((s) => {
      if (s.carrierId && s.carrierName) {
        const existing = carrierPerformance.get(s.carrierId) || {
          count: 0,
          onTimeRate: 0,
          averageCost: 0,
          totalCost: 0,
        };

        existing.count++;
        existing.totalCost += s.freightCharges?.total || 0;
        existing.averageCost = existing.totalCost / existing.count;

        // Calculate on-time rate (simplified)
        const delivered = s.status === "DELIVERED";
        const onTime =
          delivered && s.actualDelivery && s.estimatedDelivery
            ? new Date(s.actualDelivery) <= new Date(s.estimatedDelivery)
            : false;
        existing.onTimeRate =
          (existing.onTimeRate * (existing.count - 1) + (onTime ? 100 : 0)) /
          existing.count;

        carrierPerformance.set(s.carrierId, existing);
      }
    });

    // Find best performing carrier
    if (carrierPerformance.size > 0) {
      const bestCarrier = Array.from(carrierPerformance.entries()).sort(
        (a, b) => {
          // Score: 50% on-time rate, 50% cost (lower is better)
          const scoreA =
            a[1].onTimeRate * 0.5 - (a[1].averageCost / 1000) * 0.5;
          const scoreB =
            b[1].onTimeRate * 0.5 - (b[1].averageCost / 1000) * 0.5;
          return scoreB - scoreA;
        },
      )[0];

      if (bestCarrier && shipment.carrierId !== bestCarrier[0]) {
        insights.push({
          id: `carrier-opt-${shipment.id}`,
          type: "CARRIER_SELECTION",
          priority: "MEDIUM",
          title: "Better Carrier Option Available",
          description: `Historical data shows ${bestCarrier[0]} has better performance`,
          impact: {
            score: 70,
          },
          recommendations: [
            {
              action: "Consider alternative carrier",
              description: `Carrier has ${bestCarrier[1].onTimeRate.toFixed(1)}% on-time rate and ${bestCarrier[1].averageCost.toFixed(2)} average cost`,
              expectedOutcome:
                "Improved reliability and potentially lower cost",
              effort: "LOW",
            },
          ],
          evidence: {
            dataPoints: [
              `Historical shipments: ${bestCarrier[1].count}`,
              `On-time rate: ${bestCarrier[1].onTimeRate.toFixed(1)}%`,
              `Average cost: ${bestCarrier[1].averageCost.toFixed(2)}`,
            ],
            confidence: 0.75,
          },
          relatedShipments: [shipment.id],
          generatedAt: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  /**
   * Generate timing optimization insights
   */
  private async generateTimingOptimizationInsights(
    shipment: Shipment,
  ): Promise<TransportationInsight[]> {
    const insights: TransportationInsight[] = [];

    // Check if pickup date is optimal
    if (shipment.pickupDate) {
      const pickupDate = new Date(shipment.pickupDate);
      const dayOfWeek = pickupDate.getDay();

      // Avoid weekends and holidays for better transit times
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        insights.push({
          id: `timing-opt-${shipment.id}`,
          type: "TIMING_OPTIMIZATION",
          priority: "LOW",
          title: "Weekend Pickup May Cause Delays",
          description:
            "Pickup scheduled for weekend may result in longer transit times",
          impact: {
            timeReduction: 24, // Potential reduction if moved to weekday
            score: 50,
          },
          recommendations: [
            {
              action: "Consider weekday pickup",
              description: "Moving pickup to weekday can reduce transit time",
              expectedOutcome: "Faster delivery",
              effort: "LOW",
            },
          ],
          evidence: {
            dataPoints: [
              `Current pickup: ${pickupDate.toLocaleDateString()}`,
              "Weekend pickups typically add 24-48 hours",
            ],
            confidence: 0.7,
          },
          relatedShipments: [shipment.id],
          generatedAt: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  /**
   * Generate risk mitigation insights
   */
  private async generateRiskMitigationInsights(
    shipment: Shipment,
    historicalData?: AIInsightsRequest["historicalData"],
  ): Promise<TransportationInsight[]> {
    const insights: TransportationInsight[] = [];

    // Check for risk factors
    const riskFactors: string[] = [];

    // International shipment
    if (
      shipment.origin.address.countryCode !==
      shipment.destination.address.countryCode
    ) {
      riskFactors.push("International shipment - customs delays possible");
    }

    // Hazardous materials
    if (shipment.hazmat?.isHazmat) {
      riskFactors.push("Hazardous materials - special handling required");
    }

    // Temperature controlled
    if (shipment.temperatureControl?.required) {
      riskFactors.push("Temperature controlled - monitoring critical");
    }

    // High value
    if (shipment.totalValue > 100000) {
      riskFactors.push("High value shipment - insurance recommended");
    }

    if (riskFactors.length > 0) {
      insights.push({
        id: `risk-${shipment.id}`,
        type: "RISK_MITIGATION",
        priority: riskFactors.length > 2 ? "HIGH" : "MEDIUM",
        title: "Risk Factors Identified",
        description: `${riskFactors.length} risk factor(s) identified for this shipment`,
        impact: {
          riskReduction: 20,
          score: riskFactors.length * 20,
        },
        recommendations: riskFactors.map((factor) => ({
          action: "Mitigate risk",
          description: factor,
          expectedOutcome: "Reduced risk of delays or issues",
          effort: "MEDIUM",
        })),
        evidence: {
          dataPoints: riskFactors,
          confidence: 0.8,
        },
        relatedShipments: [shipment.id],
        generatedAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Generate sustainability insights
   */
  private async generateSustainabilityInsights(
    shipment: Shipment,
    routeOptions?: RouteOption[],
  ): Promise<TransportationInsight[]> {
    const insights: TransportationInsight[] = [];

    if (!routeOptions || routeOptions.length === 0) {
      return insights;
    }

    // Find lowest emission route
    const lowestEmissionRoute = routeOptions.reduce((best, current) =>
      current.emissions.co2e < best.emissions.co2e ? current : best,
    );

    // Compare with current emissions
    const currentEmissions = shipment.emissions?.totalCO2e || 0;
    const lowestEmissions = lowestEmissionRoute.emissions.co2e;

    if (currentEmissions > 0 && lowestEmissions < currentEmissions) {
      const emissionReduction = currentEmissions - lowestEmissions;
      insights.push({
        id: `sustainability-${shipment.id}`,
        type: "SUSTAINABILITY",
        priority: "MEDIUM",
        title: "Lower Emission Route Available",
        description: `Alternative route could reduce CO2e emissions by ${emissionReduction.toFixed(2)} kg`,
        impact: {
          emissionReduction,
          score: Math.min((emissionReduction / currentEmissions) * 100, 100),
        },
        recommendations: [
          {
            action: "Consider lower emission route",
            description: `Route via ${lowestEmissionRoute.carrierName || lowestEmissionRoute.mode} reduces emissions by ${((emissionReduction / currentEmissions) * 100).toFixed(1)}%`,
            expectedOutcome: `Reduce CO2e by ${emissionReduction.toFixed(2)} kg`,
            effort: "LOW",
          },
        ],
        evidence: {
          dataPoints: [
            `Current emissions: ${currentEmissions.toFixed(2)} kg CO2e`,
            `Lowest alternative: ${lowestEmissions.toFixed(2)} kg CO2e`,
            `Reduction: ${emissionReduction.toFixed(2)} kg CO2e`,
          ],
          confidence: 0.85,
        },
        relatedShipments: [shipment.id],
        generatedAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Generate summary of insights
   */
  private generateSummary(
    insights: TransportationInsight[],
  ): TransportationAIInsights["summary"] {
    const highPriority = insights.filter(
      (i) => i.priority === "HIGH" || i.priority === "CRITICAL",
    ).length;
    const totalSavings = insights.reduce(
      (sum, i) => sum + (i.impact.potentialSavings || 0),
      0,
    );
    const topRecommendations = insights
      .slice(0, 5)
      .map((i) => i.recommendations[0]?.action || i.title)
      .filter(Boolean) as string[];

    return {
      totalInsights: insights.length,
      highPriority,
      potentialSavings: totalSavings > 0 ? totalSavings : undefined,
      topRecommendations,
    };
  }
}

export const transportationAIInsightsService =
  new TransportationAIInsightsService();
