/**
 * SKU AI/ML Analytics Integration Service
 * Connects SKU module with AI/ML analytics for demand forecasting,
 * inventory optimization, and intelligent recommendations
 */

import { eventBus } from "@/lib/services/event-store";
import type { SKU } from "@/types/sku";

export interface DemandForecast {
  skuId: string;
  forecastPeriod: "daily" | "weekly" | "monthly" | "quarterly";
  forecastData: {
    date: string;
    predictedDemand: number;
    confidence: number;
    lowerBound: number;
    upperBound: number;
  }[];
  trend: "INCREASING" | "DECREASING" | "STABLE" | "SEASONAL";
  seasonality?: {
    pattern: string;
    peakMonths: number[];
    lowMonths: number[];
  };
}

export interface InventoryOptimization {
  skuId: string;
  currentStock: number;
  recommendedStock: number;
  recommendedReorderPoint: number;
  recommendedSafetyStock: number;
  recommendedMaxStock: number;
  optimizationScore: number;
  reasons: string[];
  potentialSavings: {
    holdingCost: number;
    stockoutCost: number;
    totalSavings: number;
  };
}

export interface ABCXYZClassification {
  skuId: string;
  abcClass: "A" | "B" | "C";
  xyzClass: "X" | "Y" | "Z";
  combinedClass: string;
  value: number;
  demandVariability: number;
  recommendations: string[];
}

export interface ReorderRecommendation {
  skuId: string;
  recommendedQuantity: number;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  estimatedArrival: string;
  supplierRecommendations?: {
    supplierId: string;
    price: number;
    leadTime: number;
    rating: number;
  }[];
}

/**
 * SKU AI/ML Analytics Integration Service
 */
export class SKUAIAnalyticsIntegrationService {
  private forecastCache: Map<string, DemandForecast> = new Map();
  private optimizationCache: Map<string, InventoryOptimization> = new Map();
  private classificationCache: Map<string, ABCXYZClassification> = new Map();

  /**
   * Get demand forecast for a SKU
   */
  async getDemandForecast(
    skuId: string,
    period: "daily" | "weekly" | "monthly" | "quarterly" = "monthly",
    months: number = 6,
  ): Promise<DemandForecast | null> {
    const cacheKey = `${skuId}:${period}:${months}`;
    const cached = this.forecastCache.get(cacheKey);

    if (cached && this.isCacheValid(cached.forecastData[0]?.date)) {
      return cached;
    }

    try {
      const response = await fetch(
        `/api/wms/ai-analytics/forecast/${skuId}?period=${period}&months=${months}`,
      );

      if (!response.ok) {
        return this.getMockForecast(skuId, period, months);
      }

      const data: DemandForecast = await response.json();
      this.forecastCache.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error("Error fetching demand forecast:", error);
      return this.getMockForecast(skuId, period, months);
    }
  }

  /**
   * Get inventory optimization recommendations
   */
  async getInventoryOptimization(
    skuId: string,
  ): Promise<InventoryOptimization | null> {
    const cached = this.optimizationCache.get(skuId);
    if (cached) return cached;

    try {
      const response = await fetch(
        `/api/wms/ai-analytics/optimization/${skuId}`,
      );

      if (!response.ok) {
        return null;
      }

      const data: InventoryOptimization = await response.json();
      this.optimizationCache.set(skuId, data);

      return data;
    } catch (error) {
      console.error("Error fetching optimization:", error);
      return null;
    }
  }

  /**
   * Get ABC/XYZ classification
   */
  async getABCXYZClassification(
    skuId: string,
  ): Promise<ABCXYZClassification | null> {
    const cached = this.classificationCache.get(skuId);
    if (cached) return cached;

    try {
      const response = await fetch(
        `/api/wms/ai-analytics/classification/${skuId}`,
      );

      if (!response.ok) {
        return null;
      }

      const data: ABCXYZClassification = await response.json();
      this.classificationCache.set(skuId, data);

      return data;
    } catch (error) {
      console.error("Error fetching classification:", error);
      return null;
    }
  }

  /**
   * Get reorder recommendations
   */
  async getReorderRecommendations(
    skuIds?: string[],
  ): Promise<ReorderRecommendation[]> {
    try {
      const url = skuIds
        ? `/api/wms/ai-analytics/reorder?skuIds=${skuIds.join(",")}`
        : "/api/wms/ai-analytics/reorder";

      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data: ReorderRecommendation[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching reorder recommendations:", error);
      return [];
    }
  }

  /**
   * Apply optimization recommendations
   */
  async applyOptimization(
    skuId: string,
    recommendations: Partial<InventoryOptimization>,
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/wms/ai-analytics/optimization/${skuId}/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recommendations),
        },
      );

      if (!response.ok) {
        return false;
      }

      this.optimizationCache.delete(skuId);

      eventBus.publish({
        type: "ai.optimization.applied",
        data: { skuId, recommendations },
      });

      return true;
    } catch (error) {
      console.error("Error applying optimization:", error);
      return false;
    }
  }

  /**
   * Get bulk analytics for multiple SKUs
   */
  async getBulkAnalytics(skuIds: string[]): Promise<{
    forecasts: Map<string, DemandForecast>;
    optimizations: Map<string, InventoryOptimization>;
    classifications: Map<string, ABCXYZClassification>;
  }> {
    const forecasts = new Map<string, DemandForecast>();
    const optimizations = new Map<string, InventoryOptimization>();
    const classifications = new Map<string, ABCXYZClassification>();

    const promises = skuIds.map(async (skuId) => {
      const [forecast, optimization, classification] = await Promise.all([
        this.getDemandForecast(skuId),
        this.getInventoryOptimization(skuId),
        this.getABCXYZClassification(skuId),
      ]);

      if (forecast) forecasts.set(skuId, forecast);
      if (optimization) optimizations.set(skuId, optimization);
      if (classification) classifications.set(skuId, classification);
    });

    await Promise.all(promises);

    return { forecasts, optimizations, classifications };
  }

  /**
   * Subscribe to AI analytics updates
   */
  subscribeToAnalyticsUpdates(
    skuId: string,
    callback: (data: {
      forecast?: DemandForecast;
      optimization?: InventoryOptimization;
      classification?: ABCXYZClassification;
    }) => void,
  ): () => void {
    const unsubscribe = eventBus.subscribe(
      `ai.analytics.updated.${skuId}`,
      (event: any) => {
        callback(event.data);
      },
    );

    return unsubscribe;
  }

  private isCacheValid(dateString?: string): boolean {
    if (!dateString) return false;
    const age = Date.now() - new Date(dateString).getTime();
    return age < 3600000; // 1 hour
  }

  private getMockForecast(
    skuId: string,
    period: string,
    months: number,
  ): DemandForecast {
    const data: DemandForecast["forecastData"] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + i);

      const baseDemand = 100 + Math.random() * 50;
      data.push({
        date: date.toISOString(),
        predictedDemand: baseDemand,
        confidence: 0.75 + Math.random() * 0.2,
        lowerBound: baseDemand * 0.8,
        upperBound: baseDemand * 1.2,
      });
    }

    return {
      skuId,
      forecastPeriod: period as any,
      forecastData: data,
      trend: "STABLE",
    };
  }

  clearCache(): void {
    this.forecastCache.clear();
    this.optimizationCache.clear();
    this.classificationCache.clear();
  }
}

export const skuAIAnalyticsIntegration = new SKUAIAnalyticsIntegrationService();
