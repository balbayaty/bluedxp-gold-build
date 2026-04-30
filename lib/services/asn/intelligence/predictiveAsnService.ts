/**
 * Predictive ASN Service
 * AI-powered predictions for ASN arrival times, exceptions, and quality
 */

import { PrismaClient } from "@prisma/client";
import { eventBus } from "@/lib/services/event-store";
import type { ASN, ArrivalPrediction, PredictionFactor } from "@/types/asn";

export class PredictiveAsnService {
  constructor(private db: PrismaClient) {}

  /**
   * Predict ASN arrival time
   */
  async predictArrival(
    asnId: string,
    tenantId: string,
  ): Promise<ArrivalPrediction> {
    const asn = await this.db.aSN.findFirst({
      where: { id: asnId, tenantId },
      include: {
        items: true,
        trackingEvents: true,
      },
    });

    if (!asn) {
      throw new Error("ASN not found");
    }

    // Get historical data for supplier
    const historicalData = await this.getHistoricalSupplierData(
      asn.supplierId,
      tenantId,
    );

    // Calculate prediction factors
    const factors = this.calculatePredictionFactors(asn, historicalData);

    // Calculate predicted arrival time
    const predictedArrival = this.calculatePredictedArrival(
      asn.expectedArrivalDate,
      factors,
    );

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(factors, historicalData);

    // Calculate earliest and latest arrival windows
    const { earliestArrival, latestArrival } = this.calculateArrivalWindow(
      predictedArrival,
      confidence,
      factors,
    );

    const prediction: ArrivalPrediction = {
      asnId,
      predictedArrival,
      confidence,
      factors,
      earliestArrival,
      latestArrival,
      updatedAt: new Date(),
    };

    // Update ASN with prediction
    await this.db.aSN.update({
      where: { id: asnId },
      data: {
        predictedArrivalTime: predictedArrival,
        predictedArrivalConfidence: confidence,
      },
    });

    // Publish event
    await eventBus.publish("asn.prediction.arrival", {
      asnId,
      prediction,
      tenantId,
    });

    return prediction;
  }

  /**
   * Predict exception probability
   */
  async predictExceptionProbability(
    asnId: string,
    tenantId: string,
  ): Promise<number> {
    const asn = await this.db.aSN.findFirst({
      where: { id: asnId, tenantId },
      include: {
        items: true,
        exceptions: true,
      },
    });

    if (!asn) {
      throw new Error("ASN not found");
    }

    // Get supplier exception history
    const supplierExceptionRate = await this.getSupplierExceptionRate(
      asn.supplierId,
      tenantId,
    );

    // Calculate risk factors
    const riskFactors = {
      supplierHistory: supplierExceptionRate,
      itemCount: asn.items.length,
      value: asn.totalValue,
      daysUntilArrival: this.getDaysUntilArrival(asn.expectedArrivalDate),
      hasPreviousExceptions: asn.exceptions.length > 0,
    };

    // Calculate probability (0-1)
    let probability = 0;

    // Base probability from supplier history
    probability += supplierExceptionRate * 0.4;

    // Item count factor (more items = higher risk)
    if (riskFactors.itemCount > 50) {
      probability += 0.15;
    } else if (riskFactors.itemCount > 20) {
      probability += 0.1;
    }

    // Value factor (higher value = higher risk)
    if (riskFactors.value > 100000) {
      probability += 0.15;
    } else if (riskFactors.value > 50000) {
      probability += 0.1;
    }

    // Time factor (very early or very late = higher risk)
    if (riskFactors.daysUntilArrival < 0) {
      probability += 0.1; // Already late
    } else if (riskFactors.daysUntilArrival > 30) {
      probability += 0.05; // Very far out
    }

    // Previous exceptions factor
    if (riskFactors.hasPreviousExceptions) {
      probability += 0.1;
    }

    // Cap at 0.95 (never 100% certain)
    probability = Math.min(probability, 0.95);

    // Update ASN
    await this.db.aSN.update({
      where: { id: asnId },
      data: {
        exceptionProbability: probability,
      },
    });

    return probability;
  }

  /**
   * Predict quality score
   */
  async predictQualityScore(asnId: string, tenantId: string): Promise<number> {
    const asn = await this.db.aSN.findFirst({
      where: { id: asnId, tenantId },
      include: {
        items: true,
      },
    });

    if (!asn) {
      throw new Error("ASN not found");
    }

    // Get supplier quality history
    const supplierQualityHistory = await this.getSupplierQualityHistory(
      asn.supplierId,
      tenantId,
    );

    // Calculate quality score (0-100)
    let qualityScore = 85; // Base score

    // Supplier history factor
    if (supplierQualityHistory.averageQualityScore) {
      qualityScore = supplierQualityHistory.averageQualityScore * 0.7;
    }

    // Item factors
    const itemQualityScores = await Promise.all(
      asn.items.map((item) => this.predictItemQuality(item.id, tenantId)),
    );

    const averageItemQuality =
      itemQualityScores.reduce((a, b) => a + b, 0) / itemQualityScores.length;
    qualityScore = qualityScore * 0.5 + averageItemQuality * 0.5;

    // Update ASN
    await this.db.aSN.update({
      where: { id: asnId },
      data: {
        qualityScore,
      },
    });

    return qualityScore;
  }

  /**
   * Batch predict for multiple ASNs
   */
  async batchPredict(
    asnIds: string[],
    tenantId: string,
  ): Promise<Map<string, ArrivalPrediction>> {
    const predictions = new Map<string, ArrivalPrediction>();

    for (const asnId of asnIds) {
      try {
        const prediction = await this.predictArrival(asnId, tenantId);
        predictions.set(asnId, prediction);
      } catch (error) {
        console.error(`Failed to predict for ASN ${asnId}:`, error);
      }
    }

    return predictions;
  }

  /**
   * Get historical supplier data
   */
  private async getHistoricalSupplierData(
    supplierId: string,
    tenantId: string,
  ): Promise<any> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const historicalAsns = await this.db.aSN.findMany({
      where: {
        supplierId,
        tenantId,
        createdAt: { gte: last30Days },
        status: { in: ["received", "completed"] },
      },
      include: {
        trackingEvents: true,
      },
    });

    if (historicalAsns.length === 0) {
      return {
        count: 0,
        averageDelay: 0,
        onTimeRate: 0.8, // Default assumption
      };
    }

    // Calculate average delay
    const delays = historicalAsns
      .filter((asn) => asn.actualArrivalDate && asn.expectedArrivalDate)
      .map((asn) => {
        const expected = new Date(asn.expectedArrivalDate).getTime();
        const actual = new Date(asn.actualArrivalDate!).getTime();
        return (actual - expected) / (1000 * 60 * 60 * 24); // days
      });

    const averageDelay =
      delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;

    // Calculate on-time rate
    const onTimeCount = delays.filter((d) => Math.abs(d) <= 1).length;
    const onTimeRate = delays.length > 0 ? onTimeCount / delays.length : 0.8;

    return {
      count: historicalAsns.length,
      averageDelay,
      onTimeRate,
      delays,
    };
  }

  /**
   * Calculate prediction factors
   */
  private calculatePredictionFactors(
    asn: any,
    historicalData: any,
  ): PredictionFactor[] {
    const factors: PredictionFactor[] = [];

    // Supplier history factor
    if (historicalData.count > 0) {
      factors.push({
        name: "Supplier History",
        impact: historicalData.averageDelay > 0 ? 0.3 : -0.2,
        description: `Supplier has ${historicalData.onTimeRate * 100}% on-time rate`,
        confidence: Math.min(historicalData.count / 10, 1),
      });
    }

    // Time until expected arrival
    const daysUntil = this.getDaysUntilArrival(asn.expectedArrivalDate);
    if (daysUntil < 0) {
      factors.push({
        name: "Already Overdue",
        impact: 0.5,
        description: `ASN is ${Math.abs(daysUntil)} days overdue`,
        confidence: 1,
      });
    } else if (daysUntil < 1) {
      factors.push({
        name: "Imminent Arrival",
        impact: -0.2,
        description: "ASN expected within 24 hours",
        confidence: 0.9,
      });
    }

    // Item count factor
    if (asn.items.length > 50) {
      factors.push({
        name: "Large Shipment",
        impact: 0.2,
        description: "Large number of items may cause delays",
        confidence: 0.7,
      });
    }

    // Value factor
    if (asn.totalValue > 100000) {
      factors.push({
        name: "High Value",
        impact: -0.1,
        description: "High-value shipments often prioritized",
        confidence: 0.6,
      });
    }

    return factors;
  }

  /**
   * Calculate predicted arrival time
   */
  private calculatePredictedArrival(
    expectedArrival: Date,
    factors: PredictionFactor[],
  ): Date {
    const expected = new Date(expectedArrival);
    const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0);

    // Adjust based on impact (in days)
    const adjustmentDays = totalImpact * 2; // Scale impact
    expected.setDate(expected.getDate() + Math.round(adjustmentDays));

    return expected;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    factors: PredictionFactor[],
    historicalData: any,
  ): number {
    let confidence = 0.5; // Base confidence

    // Historical data quality
    if (historicalData.count >= 10) {
      confidence += 0.3;
    } else if (historicalData.count >= 5) {
      confidence += 0.2;
    }

    // Factor confidence
    const avgFactorConfidence =
      factors.length > 0
        ? factors.reduce((sum, f) => sum + f.confidence, 0) / factors.length
        : 0.5;

    confidence = confidence * 0.6 + avgFactorConfidence * 0.4;

    return Math.min(confidence, 0.95);
  }

  /**
   * Calculate arrival window
   */
  private calculateArrivalWindow(
    predictedArrival: Date,
    confidence: number,
    factors: PredictionFactor[],
  ): { earliestArrival: Date; latestArrival: Date } {
    const predicted = new Date(predictedArrival);
    const uncertainty = (1 - confidence) * 3; // Days of uncertainty

    const earliest = new Date(predicted);
    earliest.setDate(earliest.getDate() - Math.ceil(uncertainty));

    const latest = new Date(predicted);
    latest.setDate(latest.getDate() + Math.ceil(uncertainty));

    return { earliestArrival: earliest, latestArrival: latest };
  }

  /**
   * Get days until arrival
   */
  private getDaysUntilArrival(expectedArrival: Date): number {
    const now = new Date();
    const expected = new Date(expectedArrival);
    const diff = expected.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get supplier exception rate
   */
  private async getSupplierExceptionRate(
    supplierId: string,
    tenantId: string,
  ): Promise<number> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const totalAsns = await this.db.aSN.count({
      where: {
        supplierId,
        tenantId,
        createdAt: { gte: last30Days },
      },
    });

    if (totalAsns === 0) return 0.1; // Default 10%

    const exceptionAsns = await this.db.aSN.count({
      where: {
        supplierId,
        tenantId,
        createdAt: { gte: last30Days },
        status: "exception",
      },
    });

    return exceptionAsns / totalAsns;
  }

  /**
   * Get supplier quality history
   */
  private async getSupplierQualityHistory(
    supplierId: string,
    tenantId: string,
  ): Promise<any> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const asns = await this.db.aSN.findMany({
      where: {
        supplierId,
        tenantId,
        createdAt: { gte: last30Days },
        qualityScore: { not: null },
      },
      select: {
        qualityScore: true,
      },
    });

    if (asns.length === 0) {
      return { averageQualityScore: 85 };
    }

    const avgQuality =
      asns.reduce((sum, asn) => sum + (asn.qualityScore || 85), 0) /
      asns.length;

    return { averageQualityScore: avgQuality };
  }

  /**
   * Predict item quality
   */
  private async predictItemQuality(
    itemId: string,
    tenantId: string,
  ): Promise<number> {
    // Simplified - in real implementation, use ML model
    // For now, return base score
    return 85;
  }
}

// Export singleton
let predictiveAsnServiceInstance: PredictiveAsnService | null = null;

export function getPredictiveAsnService(): PredictiveAsnService {
  if (!predictiveAsnServiceInstance) {
    const { PrismaClient } = require("@prisma/client");

    predictiveAsnServiceInstance = new PredictiveAsnService(new PrismaClient());
  }

  return predictiveAsnServiceInstance;
}
