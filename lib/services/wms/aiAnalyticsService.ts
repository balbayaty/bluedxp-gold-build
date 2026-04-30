/**
 * AI Analytics Service for WMS
 * Predictive analytics, demand forecasting, and optimization
 * 4IR & 5IR Aligned • AI-First • Deep Architecture
 */

import { SKU } from "@/types/sku";
import { InventoryStock, inventoryService } from "./inventoryService";
import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { skuService } from "./skuService";

// ============================================================================
// AI ANALYTICS TYPES
// ============================================================================

export interface DemandForecast {
  skuId: string;
  forecastPeriod: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  forecastDate: Date | string;
  predictedDemand: number;
  confidenceLevel: number; // 0-100
  lowerBound: number;
  upperBound: number;
  factors: {
    seasonality?: number;
    trend?: number;
    promotions?: number;
    historical?: number;
  };
}

export interface InventoryOptimization {
  skuId: string;
  currentStock: number;
  optimalStock: number;
  recommendedAction: "INCREASE" | "DECREASE" | "MAINTAIN";
  recommendedQuantity: number;
  reason: string;
  expectedImpact: {
    costSavings?: number;
    serviceLevel?: number;
    stockoutRisk?: number;
  };
}

export interface SafetyStockOptimization {
  skuId: string;
  currentSafetyStock: number;
  optimalSafetyStock: number;
  recommendedSafetyStock: number;
  calculationMethod: "STATISTICAL" | "ML" | "HYBRID";
  factors: {
    demandVariability: number;
    leadTimeVariability: number;
    serviceLevel: number;
    historicalStockouts: number;
  };
}

export interface ReorderPointOptimization {
  skuId: string;
  currentReorderPoint: number;
  optimalReorderPoint: number;
  recommendedReorderPoint: number;
  calculationMethod: "STATISTICAL" | "ML" | "HYBRID";
  factors: {
    averageDemand: number;
    leadTime: number;
    safetyStock: number;
    demandVariability: number;
  };
}

export interface ABCXYZClassification {
  skuId: string;
  abcClass: "A" | "B" | "C";
  xyzClass: "X" | "Y" | "Z";
  combinedClass: string; // e.g., 'AX', 'BY', 'CZ'
  value: number;
  variability: number;
  recommendations: string[];
}

// ============================================================================
// AI ANALYTICS SERVICE INTERFACE
// ============================================================================

export interface AnalyticsOptions {
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
}

export interface AIAnalyticsService {
  // Demand Forecasting
  forecastDemand(
    skuId: string,
    period: DemandForecast["forecastPeriod"],
    options?: AnalyticsOptions,
  ): Promise<DemandForecast>;
  forecastDemandBatch(
    skuIds: string[],
    period: DemandForecast["forecastPeriod"],
    options?: AnalyticsOptions,
  ): Promise<DemandForecast[]>;

  // Inventory Optimization
  optimizeInventory(
    skuId: string,
    options?: AnalyticsOptions,
  ): Promise<InventoryOptimization>;
  optimizeInventoryBatch(
    skuIds: string[],
    options?: AnalyticsOptions,
  ): Promise<InventoryOptimization[]>;

  // Safety Stock Optimization
  optimizeSafetyStock(
    skuId: string,
    options?: AnalyticsOptions,
  ): Promise<SafetyStockOptimization>;
  optimizeSafetyStockBatch(
    skuIds: string[],
    options?: AnalyticsOptions,
  ): Promise<SafetyStockOptimization[]>;

  // Reorder Point Optimization
  optimizeReorderPoint(
    skuId: string,
    options?: AnalyticsOptions,
  ): Promise<ReorderPointOptimization>;
  optimizeReorderPointBatch(
    skuIds: string[],
    options?: AnalyticsOptions,
  ): Promise<ReorderPointOptimization[]>;

  // Classification
  classifyABCXYZ(
    skuId: string,
    options?: AnalyticsOptions,
  ): Promise<ABCXYZClassification>;
  classifyABCXYZBatch(
    skuIds: string[],
    options?: AnalyticsOptions,
  ): Promise<ABCXYZClassification[]>;

  // Anomaly Detection
  detectAnomalies(
    skuId: string,
    options?: AnalyticsOptions,
  ): Promise<{
    anomalies: Array<{ type: string; severity: string; description: string }>;
  }>;
}

// ============================================================================
// AI ANALYTICS SERVICE IMPLEMENTATION
// ============================================================================

class AIAnalyticsServiceImpl implements AIAnalyticsService {
  /**
   * Calculate statistical measures from historical data
   */
  private calculateStatistics(values: number[]): {
    mean: number;
    stdDev: number;
    variance: number;
    cv: number; // Coefficient of Variation
  } {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0, variance: 0, cv: 0 };
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    return { mean, stdDev, variance, cv };
  }

  /**
   * Get historical demand data from inventory movements
   */
  private async getHistoricalDemand(
    skuId: string,
    days: number = 90,
  ): Promise<number[]> {
    try {
      const movements = await inventoryService.getMovements(skuId, {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      });

      // Group by day and sum quantities
      const dailyDemand = new Map<string, number>();
      movements
        .filter((m) => m.movementType === "OUT")
        .forEach((m) => {
          const date = new Date(m.performedAt).toISOString().split("T")[0];
          dailyDemand.set(date, (dailyDemand.get(date) || 0) + m.quantity);
        });

      return Array.from(dailyDemand.values());
    } catch (error) {
      console.warn("Error getting historical demand:", error);
      return [];
    }
  }

  async forecastDemand(
    skuId: string,
    period: DemandForecast["forecastPeriod"],
    options?: { tenantId?: string; customerId?: string; warehouseId?: string },
  ): Promise<DemandForecast> {
    // Get historical demand data
    const historicalDemand = await this.getHistoricalDemand(skuId, 90);

    let predictedDemand = 100;
    let confidenceLevel = 75;
    let seasonality = 1.0;
    let trend = 1.0;

    if (historicalDemand.length > 0) {
      const stats = this.calculateStatistics(historicalDemand);
      const mean = stats.mean;

      // Simple moving average forecast
      const recentDemand = historicalDemand.slice(-30); // Last 30 days
      const recentMean =
        recentDemand.length > 0
          ? recentDemand.reduce((sum, val) => sum + val, 0) /
            recentDemand.length
          : mean;

      // Calculate trend (comparing recent vs older periods)
      if (historicalDemand.length >= 60) {
        const olderPeriod = historicalDemand.slice(0, 30);
        const olderMean =
          olderPeriod.reduce((sum, val) => sum + val, 0) / olderPeriod.length;
        trend = olderMean > 0 ? recentMean / olderMean : 1.0;
      }

      // Convert daily to period
      const daysInPeriod =
        period === "DAILY"
          ? 1
          : period === "WEEKLY"
            ? 7
            : period === "MONTHLY"
              ? 30
              : period === "QUARTERLY"
                ? 90
                : 365;

      predictedDemand = Math.round(recentMean * daysInPeriod);

      // Confidence based on data quality and variability
      const cv = stats.cv;
      confidenceLevel = Math.max(60, Math.min(95, 100 - cv * 100));

      // Simple seasonality detection (compare current month to average)
      const currentMonth = new Date().getMonth();
      const monthlyDemand = new Map<number, number[]>();
      // This would require date parsing from movements - simplified for now
      seasonality = 1.0;
    }

    const lowerBound = Math.round(predictedDemand * 0.85);
    const upperBound = Math.round(predictedDemand * 1.15);

    const forecast: DemandForecast = {
      skuId,
      forecastPeriod: period,
      forecastDate: new Date().toISOString(),
      predictedDemand: Math.round(predictedDemand),
      confidenceLevel: Math.round(confidenceLevel),
      lowerBound: Math.round(predictedDemand * 0.8),
      upperBound: Math.round(predictedDemand * 1.2),
      factors: {
        seasonality,
        trend,
        historical: 0.9,
      },
    };

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "wms.analytics.forecast.generated",
      aggregateId: skuId,
      aggregateType: "SKU",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        ...forecast,
        tenantId: options?.tenantId,
        customerId: options?.customerId,
        warehouseId: options?.warehouseId,
      },
    });

    // Store in knowledge base
    try {
      const sku = await skuService.getSKU(skuId);
      if (sku && options?.tenantId) {
        await knowledgeBaseService.create({
          tenantId: options.tenantId,
          agentId: "wms-ai-analytics",
          type: "insight",
          category: "wms",
          content: `Demand Forecast for SKU ${sku.skuCode}:\n\nPeriod: ${period}\nPredicted Demand: ${forecast.predictedDemand}\nConfidence: ${forecast.confidenceLevel}%\nLower Bound: ${forecast.lowerBound}\nUpper Bound: ${forecast.upperBound}\n\nFactors:\n- Seasonality: ${(forecast.factors.seasonality || 0) * 100}%\n- Trend: ${(forecast.factors.trend || 0) * 100}%\n- Historical: ${(forecast.factors.historical || 0) * 100}%`,
          summary: `Demand forecast for ${sku.skuCode}: ${forecast.predictedDemand} units (${forecast.confidenceLevel}% confidence)`,
          metadata: {
            module: "wms",
            entityType: "SKU",
            entityId: skuId,
            skuCode: sku.skuCode,
            forecastPeriod: period,
            predictedDemand: forecast.predictedDemand,
            confidenceLevel: forecast.confidenceLevel,
            customerId: options.customerId,
            warehouseId: options.warehouseId,
          },
          keywords: [
            "demand",
            "forecast",
            "sku",
            sku.skuCode,
            period.toLowerCase(),
          ],
          searchableText: `demand forecast ${sku.skuCode} ${period} ${forecast.predictedDemand}`,
          source: "ai_analytics",
          sourceId: skuId,
          confidence: forecast.confidenceLevel,
          verified: false,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        });
      }
    } catch (error) {
      console.warn("Error storing forecast in knowledge base:", error);
    }

    return forecast;
  }

  async forecastDemandBatch(
    skuIds: string[],
    period: DemandForecast["forecastPeriod"],
    options?: AnalyticsOptions,
  ): Promise<DemandForecast[]> {
    return Promise.all(
      skuIds.map((id) => this.forecastDemand(id, period, options)),
    );
  }

  async optimizeInventory(
    skuId: string,
    options?: AnalyticsOptions,
  ): Promise<InventoryOptimization> {
    // Get current stock and SKU data
    const sku = await skuService.getSKU(skuId);
    if (!sku) {
      throw new Error(`SKU not found: ${skuId}`);
    }

    // Get current inventory
    let currentStock = 0;
    try {
      const warehouses = options?.warehouseId
        ? [options.warehouseId]
        : ["WH-001"]; // Default or specified
      for (const whId of warehouses) {
        const stock = await inventoryService.getStock(skuId, whId);
        if (stock) {
          currentStock += stock.quantity;
        }
      }
    } catch (error) {
      console.warn("Error getting current stock:", error);
    }

    // Get demand forecast
    const forecast = await this.forecastDemand(skuId, "MONTHLY", options);

    // Get safety stock and reorder point optimizations
    const safetyStockOpt = await this.optimizeSafetyStock(skuId, options);
    const reorderPointOpt = await this.optimizeReorderPoint(skuId, options);

    // Calculate optimal stock: (Average Monthly Demand * 2) + Safety Stock
    // This provides ~2 months of coverage plus safety buffer
    const monthlyDemand = forecast.predictedDemand;
    const optimalStock = Math.round(
      monthlyDemand * 2 + safetyStockOpt.recommendedSafetyStock,
    );

    const recommendedAction =
      currentStock < optimalStock
        ? "INCREASE"
        : currentStock > optimalStock * 1.2
          ? "DECREASE"
          : "MAINTAIN";
    const recommendedQuantity = Math.abs(optimalStock - currentStock);

    // Calculate expected impact
    const stockoutRisk =
      currentStock < reorderPointOpt.recommendedReorderPoint ? 0.15 : 0.05;
    const serviceLevel = 1 - stockoutRisk;
    const costSavings =
      recommendedAction === "DECREASE"
        ? Math.round(
            (currentStock - optimalStock) *
              (sku.averageCost || sku.standardCost || 0) *
              0.1,
          ) // 10% holding cost savings
        : 0;

    return {
      skuId,
      currentStock,
      optimalStock,
      recommendedAction,
      recommendedQuantity,
      reason: `Based on demand forecast (${monthlyDemand} units/month), safety stock (${safetyStockOpt.recommendedSafetyStock}), and service level targets`,
      expectedImpact: {
        costSavings,
        serviceLevel,
        stockoutRisk,
      },
    };
  }

  async optimizeInventoryBatch(
    skuIds: string[],
    options?: AnalyticsOptions,
  ): Promise<InventoryOptimization[]> {
    return Promise.all(skuIds.map((id) => this.optimizeInventory(id, options)));
  }

  async optimizeSafetyStock(
    skuId: string,
    options?: AnalyticsOptions,
  ): Promise<SafetyStockOptimization> {
    const sku = await skuService.getSKU(skuId);
    if (!sku) {
      throw new Error(`SKU not found: ${skuId}`);
    }

    const currentSafetyStock = sku.safetyStock || 0;

    // Get historical demand
    const historicalDemand = await this.getHistoricalDemand(skuId, 90);

    if (historicalDemand.length < 10) {
      // Not enough data - use default
      return {
        skuId,
        currentSafetyStock,
        optimalSafetyStock: currentSafetyStock || 20,
        recommendedSafetyStock: currentSafetyStock || 20,
        calculationMethod: "STATISTICAL",
        factors: {
          demandVariability: 0.2,
          leadTimeVariability: 0.1,
          serviceLevel: 0.95,
          historicalStockouts: 0,
        },
      };
    }

    const stats = this.calculateStatistics(historicalDemand);
    const demandVariability = stats.cv; // Coefficient of Variation

    // Assume lead time variability (would come from purchase order data)
    const leadTimeVariability = 0.1; // 10% variability
    const serviceLevel = 0.95; // 95% service level
    const zScore = 1.645; // Z-score for 95% service level

    // Average lead time (would come from PO data, defaulting to 5 days)
    const avgLeadTime = 5; // days

    // Safety Stock Formula: Z * sqrt(LT) * σD
    // Where Z = service level factor, LT = lead time, σD = demand standard deviation
    const optimalSafetyStock = Math.round(
      zScore * Math.sqrt(avgLeadTime) * stats.stdDev,
    );

    // Ensure minimum safety stock
    const recommendedSafetyStock = Math.max(
      optimalSafetyStock,
      Math.round(stats.mean * 0.1),
    );

    return {
      skuId,
      currentSafetyStock,
      optimalSafetyStock,
      recommendedSafetyStock,
      calculationMethod: "STATISTICAL",
      factors: {
        demandVariability,
        leadTimeVariability,
        serviceLevel,
        historicalStockouts: 0, // Would be calculated from stockout events
      },
    };
  }

  async optimizeSafetyStockBatch(
    skuIds: string[],
    options?: AnalyticsOptions,
  ): Promise<SafetyStockOptimization[]> {
    return Promise.all(
      skuIds.map((id) => this.optimizeSafetyStock(id, options)),
    );
  }

  async optimizeReorderPoint(
    skuId: string,
    options?: AnalyticsOptions,
  ): Promise<ReorderPointOptimization> {
    const sku = await skuService.getSKU(skuId);
    if (!sku) {
      throw new Error(`SKU not found: ${skuId}`);
    }

    const currentReorderPoint = sku.reorderPoint || 0;

    // Get safety stock optimization
    const safetyStockOpt = await this.optimizeSafetyStock(skuId, options);

    // Get historical demand
    const historicalDemand = await this.getHistoricalDemand(skuId, 90);

    if (historicalDemand.length < 10) {
      // Not enough data
      const avgDemand = 10; // Default
      const leadTime = 5; // Default
      const safetyStock = safetyStockOpt.recommendedSafetyStock;
      const recommendedReorderPoint = Math.round(
        avgDemand * leadTime + safetyStock,
      );

      return {
        skuId,
        currentReorderPoint,
        optimalReorderPoint: recommendedReorderPoint,
        recommendedReorderPoint,
        calculationMethod: "STATISTICAL",
        factors: {
          averageDemand: avgDemand,
          leadTime,
          safetyStock,
          demandVariability: 0.2,
        },
      };
    }

    const stats = this.calculateStatistics(historicalDemand);
    const averageDemand = stats.mean;
    const demandVariability = stats.cv;

    // Average lead time (would come from PO data)
    const leadTime = 5; // days
    const safetyStock = safetyStockOpt.recommendedSafetyStock;

    // Reorder Point Formula: (Average Daily Demand * Lead Time) + Safety Stock
    const optimalReorderPoint = Math.round(
      averageDemand * leadTime + safetyStock,
    );
    const recommendedReorderPoint = Math.max(
      optimalReorderPoint,
      safetyStock * 2,
    ); // Ensure minimum

    return {
      skuId,
      currentReorderPoint,
      optimalReorderPoint,
      recommendedReorderPoint,
      calculationMethod: "STATISTICAL",
      factors: {
        averageDemand,
        leadTime,
        safetyStock,
        demandVariability,
      },
    };
  }

  async optimizeReorderPointBatch(
    skuIds: string[],
    options?: AnalyticsOptions,
  ): Promise<ReorderPointOptimization[]> {
    return Promise.all(
      skuIds.map((id) => this.optimizeReorderPoint(id, options)),
    );
  }

  async classifyABCXYZ(
    skuId: string,
    options?: { tenantId?: string; customerId?: string; warehouseId?: string },
  ): Promise<ABCXYZClassification> {
    const sku = await skuService.getSKU(skuId);
    if (!sku) {
      throw new Error(`SKU not found: ${skuId}`);
    }

    // Get current inventory value
    let totalValue = 0;
    let totalQuantity = 0;
    try {
      const warehouses = options?.warehouseId
        ? [options.warehouseId]
        : ["WH-001"];
      for (const whId of warehouses) {
        const stock = await inventoryService.getStock(skuId, whId);
        if (stock) {
          totalQuantity += stock.quantity;
        }
      }
      const unitCost = sku.averageCost || sku.standardCost || 0;
      totalValue = totalQuantity * unitCost;
    } catch (error) {
      console.warn("Error getting inventory value:", error);
      // Fallback to SKU value estimate
      totalValue =
        (sku.averageCost || sku.standardCost || 0) * (sku.maxStock || 100);
    }

    // Get historical demand for XYZ classification
    const historicalDemand = await this.getHistoricalDemand(skuId, 90);
    let variability = 0.5; // Default medium variability

    if (historicalDemand.length >= 10) {
      const stats = this.calculateStatistics(historicalDemand);
      variability = stats.cv; // Coefficient of Variation (0-1+)
    }

    // ABC Classification (Value-based)
    // A: Top 80% of value (typically 20% of items)
    // B: Next 15% of value (typically 30% of items)
    // C: Remaining 5% of value (typically 50% of items)
    // For single SKU, we'll use absolute thresholds
    let abcClass: "A" | "B" | "C" = "C";
    if (totalValue >= 50000) abcClass = "A";
    else if (totalValue >= 10000) abcClass = "B";

    // XYZ Classification (Variability-based)
    // X: Low variability (CV < 0.25) - Predictable demand
    // Y: Medium variability (0.25 <= CV < 0.5) - Moderate predictability
    // Z: High variability (CV >= 0.5) - Unpredictable demand
    let xyzClass: "X" | "Y" | "Z" = "Z";
    if (variability < 0.25) xyzClass = "X";
    else if (variability < 0.5) xyzClass = "Y";

    // Generate recommendations based on classification
    const recommendations: string[] = [];
    if (abcClass === "A" && xyzClass === "X") {
      recommendations.push(
        "High value, low variability - Priority management, frequent reviews",
      );
      recommendations.push(
        "Maintain tight inventory control and frequent monitoring",
      );
      recommendations.push("Consider automated reordering");
    } else if (abcClass === "A" && xyzClass === "Y") {
      recommendations.push(
        "High value, medium variability - Regular reviews required",
      );
      recommendations.push("Monitor demand patterns closely");
    } else if (abcClass === "A" && xyzClass === "Z") {
      recommendations.push(
        "High value, high variability - Critical management required",
      );
      recommendations.push(
        "Implement safety stock buffer and flexible ordering",
      );
    } else if (abcClass === "B" && xyzClass === "X") {
      recommendations.push(
        "Medium value, low variability - Standard management",
      );
    } else if (abcClass === "C" && xyzClass === "Z") {
      recommendations.push(
        "Low value, high variability - Basic management, periodic reviews",
      );
      recommendations.push("Consider bulk ordering or supplier consolidation");
    } else {
      recommendations.push(
        `Class ${abcClass}${xyzClass} - Standard inventory management practices`,
      );
    }

    const classification: ABCXYZClassification = {
      skuId,
      abcClass,
      xyzClass,
      combinedClass: `${abcClass}${xyzClass}`,
      value,
      variability,
      recommendations,
    };

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "wms.analytics.classification.generated",
      aggregateId: skuId,
      aggregateType: "SKU",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        ...classification,
        tenantId: options?.tenantId,
        customerId: options?.customerId,
        warehouseId: options?.warehouseId,
      },
    });

    // Store in knowledge base
    try {
      const sku = await skuService.getSKU(skuId);
      if (sku && options?.tenantId) {
        await knowledgeBaseService.create({
          tenantId: options.tenantId,
          agentId: "wms-ai-analytics",
          type: "insight",
          category: "wms",
          content: `ABC/XYZ Classification for SKU ${sku.skuCode}:\n\nABC Class: ${abcClass} (Value: ${value.toLocaleString()})\nXYZ Class: ${xyzClass} (Variability: ${variability.toFixed(2)})\nCombined: ${classification.combinedClass}\n\nRecommendations:\n${recommendations.map((r) => `- ${r}`).join("\n")}`,
          summary: `SKU ${sku.skuCode} classified as ${classification.combinedClass} (ABC: ${abcClass}, XYZ: ${xyzClass})`,
          metadata: {
            module: "wms",
            entityType: "SKU",
            entityId: skuId,
            skuCode: sku.skuCode,
            abcClass,
            xyzClass,
            combinedClass: classification.combinedClass,
            value,
            variability,
            customerId: options.customerId,
            warehouseId: options.warehouseId,
          },
          keywords: [
            "abc",
            "xyz",
            "classification",
            "sku",
            sku.skuCode,
            abcClass,
            xyzClass,
            classification.combinedClass,
          ],
          searchableText: `abc xyz classification ${sku.skuCode} ${abcClass} ${xyzClass} ${classification.combinedClass}`,
          source: "ai_analytics",
          sourceId: skuId,
          confidence: 85,
          verified: false,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        });
      }
    } catch (error) {
      console.warn("Error storing classification in knowledge base:", error);
    }

    return classification;
  }

  async classifyABCXYZBatch(
    skuIds: string[],
    options?: AnalyticsOptions,
  ): Promise<ABCXYZClassification[]> {
    return Promise.all(skuIds.map((id) => this.classifyABCXYZ(id, options)));
  }

  async detectAnomalies(
    skuId: string,
    options?: AnalyticsOptions,
  ): Promise<{
    anomalies: Array<{ type: string; severity: string; description: string }>;
  }> {
    const anomalies: Array<{
      type: string;
      severity: string;
      description: string;
    }> = [];

    try {
      // Get historical demand
      const historicalDemand = await this.getHistoricalDemand(skuId, 90);

      if (historicalDemand.length < 10) {
        return { anomalies }; // Not enough data
      }

      const stats = this.calculateStatistics(historicalDemand);
      const mean = stats.mean;
      const stdDev = stats.stdDev;

      // Get recent demand (last 7 days)
      const recentDemand = historicalDemand.slice(-7);

      // Detect anomalies using Z-score method
      // Z-score > 2 or < -2 indicates anomaly
      recentDemand.forEach((demand, index) => {
        if (stdDev > 0) {
          const zScore = Math.abs((demand - mean) / stdDev);

          if (zScore > 3) {
            anomalies.push({
              type: "EXTREME_DEMAND_SPIKE",
              severity: "HIGH",
              description: `Extreme demand spike detected: ${demand} units (${zScore.toFixed(2)}σ from mean). Expected: ${mean.toFixed(0)} units`,
            });
          } else if (zScore > 2) {
            anomalies.push({
              type: "UNUSUAL_DEMAND",
              severity: "MEDIUM",
              description: `Unusual demand detected: ${demand} units (${zScore.toFixed(2)}σ from mean). Expected: ${mean.toFixed(0)} units`,
            });
          }
        }
      });

      // Detect zero demand periods (potential stockout or discontinued)
      const zeroDemandDays = recentDemand.filter((d) => d === 0).length;
      if (zeroDemandDays >= 3 && mean > 0) {
        anomalies.push({
          type: "ZERO_DEMAND_PERIOD",
          severity: "MEDIUM",
          description: `No demand detected for ${zeroDemandDays} days. Possible stockout or discontinued item.`,
        });
      }

      // Check current stock vs reorder point
      const sku = await skuService.getSKU(skuId);
      if (sku) {
        let currentStock = 0;
        try {
          const warehouses = options?.warehouseId
            ? [options.warehouseId]
            : ["WH-001"];
          for (const whId of warehouses) {
            const stock = await inventoryService.getStock(skuId, whId);
            if (stock) {
              currentStock += stock.quantity;
            }
          }
        } catch (error) {
          // Ignore
        }

        if (
          sku.reorderPoint &&
          currentStock < sku.reorderPoint &&
          currentStock > 0
        ) {
          anomalies.push({
            type: "LOW_STOCK_ALERT",
            severity: "HIGH",
            description: `Stock level (${currentStock}) is below reorder point (${sku.reorderPoint}). Reorder recommended.`,
          });
        }

        if (currentStock === 0 && mean > 0) {
          anomalies.push({
            type: "STOCKOUT",
            severity: "CRITICAL",
            description: "Stock level is zero. Immediate action required.",
          });
        }
      }
    } catch (error) {
      console.warn("Error detecting anomalies:", error);
    }

    return { anomalies };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const aiAnalyticsService: AIAnalyticsService =
  new AIAnalyticsServiceImpl();
