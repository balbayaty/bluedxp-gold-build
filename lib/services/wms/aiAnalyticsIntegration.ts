/**
 * WMS AI Analytics Integration
 *
 * Connects aiAnalyticsService to SKU module and provides:
 * - Demand forecasting
 * - Inventory optimization
 * - ABC/XYZ classification
 * - Safety stock optimization
 * - Reorder point optimization
 */

import { aiAnalyticsService } from "./aiAnalyticsService";
import type { SKU } from "@/types/sku";

export interface DemandForecast {
  skuId: string;
  period: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  forecast: Array<{
    date: Date;
    predictedDemand: number;
    confidence: number; // 0-100
    upperBound: number;
    lowerBound: number;
  }>;
  accuracy: number; // 0-100
  trend: "INCREASING" | "DECREASING" | "STABLE" | "SEASONAL";
}

export interface InventoryOptimization {
  skuId: string;
  currentStock: number;
  recommendedStock: number;
  safetyStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  optimizationScore: number; // 0-100
  recommendations: Array<{
    type:
      | "INCREASE_STOCK"
      | "DECREASE_STOCK"
      | "ADJUST_REORDER_POINT"
      | "CHANGE_SUPPLIER";
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
    expectedImpact: string;
  }>;
}

export interface SKUClassification {
  skuId: string;
  abcClass: "A" | "B" | "C";
  xyzClass: "X" | "Y" | "Z";
  combinedClass: string; // e.g., 'AX', 'BY', 'CZ'
  value: number;
  volume: number;
  variability: number;
  recommendation: string;
}

/**
 * WMS AI Analytics Integration Service
 */
export class WMSAIAnalyticsIntegration {
  /**
   * Get demand forecast for SKU
   */
  async getDemandForecast(
    skuId: string,
    period: DemandForecast["period"] = "MONTHLY",
    periods: number = 12,
  ): Promise<DemandForecast | null> {
    try {
      const forecast = await aiAnalyticsService.forecastDemand(
        skuId,
        period,
        periods,
      );

      if (!forecast) {
        return null;
      }

      return {
        skuId,
        period,
        forecast: forecast.predictions.map((pred) => ({
          date: pred.date,
          predictedDemand: pred.demand,
          confidence: pred.confidence,
          upperBound: pred.upperBound,
          lowerBound: pred.lowerBound,
        })),
        accuracy: forecast.accuracy,
        trend: forecast.trend as DemandForecast["trend"],
      };
    } catch (error) {
      console.error("Error getting demand forecast:", error);
      return null;
    }
  }

  /**
   * Get inventory optimization recommendations
   */
  async getInventoryOptimization(
    skuId: string,
  ): Promise<InventoryOptimization | null> {
    try {
      const optimization = await aiAnalyticsService.optimizeInventory(skuId);

      if (!optimization) {
        return null;
      }

      return {
        skuId,
        currentStock: optimization.currentStock,
        recommendedStock: optimization.recommendedStock,
        safetyStock: optimization.safetyStock,
        reorderPoint: optimization.reorderPoint,
        reorderQuantity: optimization.reorderQuantity,
        optimizationScore: optimization.score,
        recommendations: optimization.recommendations.map((rec) => ({
          type: rec.type as InventoryOptimization["recommendations"][0]["type"],
          priority:
            rec.priority as InventoryOptimization["recommendations"][0]["priority"],
          description: rec.description,
          expectedImpact: rec.expectedImpact,
        })),
      };
    } catch (error) {
      console.error("Error getting inventory optimization:", error);
      return null;
    }
  }

  /**
   * Get ABC/XYZ classification
   */
  async getSKUClassification(skuId: string): Promise<SKUClassification | null> {
    try {
      const classification = await aiAnalyticsService.classifySKU(skuId);

      if (!classification) {
        return null;
      }

      return {
        skuId,
        abcClass: classification.abcClass as "A" | "B" | "C",
        xyzClass: classification.xyzClass as "X" | "Y" | "Z",
        combinedClass: `${classification.abcClass}${classification.xyzClass}`,
        value: classification.value,
        volume: classification.volume,
        variability: classification.variability,
        recommendation: classification.recommendation,
      };
    } catch (error) {
      console.error("Error getting SKU classification:", error);
      return null;
    }
  }

  /**
   * Optimize safety stock
   */
  async optimizeSafetyStock(skuId: string): Promise<{
    currentSafetyStock: number;
    recommendedSafetyStock: number;
    reason: string;
    impact: string;
  } | null> {
    try {
      const optimization = await aiAnalyticsService.optimizeSafetyStock(skuId);

      if (!optimization) {
        return null;
      }

      return {
        currentSafetyStock: optimization.current,
        recommendedSafetyStock: optimization.recommended,
        reason: optimization.reason,
        impact: optimization.impact,
      };
    } catch (error) {
      console.error("Error optimizing safety stock:", error);
      return null;
    }
  }

  /**
   * Optimize reorder point
   */
  async optimizeReorderPoint(skuId: string): Promise<{
    currentReorderPoint: number;
    recommendedReorderPoint: number;
    reason: string;
    impact: string;
  } | null> {
    try {
      const optimization = await aiAnalyticsService.optimizeReorderPoint(skuId);

      if (!optimization) {
        return null;
      }

      return {
        currentReorderPoint: optimization.current,
        recommendedReorderPoint: optimization.recommended,
        reason: optimization.reason,
        impact: optimization.impact,
      };
    } catch (error) {
      console.error("Error optimizing reorder point:", error);
      return null;
    }
  }

  /**
   * Get batch classifications for multiple SKUs
   */
  async getBatchClassifications(
    skuIds: string[],
  ): Promise<SKUClassification[]> {
    try {
      const classifications = await Promise.all(
        skuIds.map((skuId) => this.getSKUClassification(skuId)),
      );

      return classifications.filter((c): c is SKUClassification => c !== null);
    } catch (error) {
      console.error("Error getting batch classifications:", error);
      return [];
    }
  }

  /**
   * Get inventory health score
   */
  async getInventoryHealthScore(skuId: string): Promise<{
    score: number; // 0-100
    factors: Array<{
      name: string;
      score: number;
      impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
      recommendation: string;
    }>;
  } | null> {
    try {
      const health = await aiAnalyticsService.getInventoryHealth(skuId);

      if (!health) {
        return null;
      }

      return {
        score: health.score,
        factors: health.factors.map((factor) => ({
          name: factor.name,
          score: factor.score,
          impact: factor.impact as "POSITIVE" | "NEGATIVE" | "NEUTRAL",
          recommendation: factor.recommendation,
        })),
      };
    } catch (error) {
      console.error("Error getting inventory health score:", error);
      return null;
    }
  }
}

export const wmsAIAnalyticsIntegration = new WMSAIAnalyticsIntegration();
