/**
 * Utility Bill Analytics Service
 *
 * Comprehensive analytics and insights for utility bills:
 * - Trend analysis
 * - Comparative analytics
 * - Anomaly detection
 * - Cost optimization insights
 * - Consumption pattern analysis
 * - AI-powered recommendations
 *
 * Features:
 * - Multi-dimensional analysis (facility, warehouse, period, utility type)
 * - Statistical analysis (mean, median, standard deviation, percentiles)
 * - Predictive analytics
 * - Benchmarking
 * - Cost allocation analysis
 */

import type {
  UtilityBill,
  UtilityBillAnalytics,
  ComparisonAnalysis,
  AnomalyDetection,
  Insight,
  BillComparisonRequest,
  BillComparisonResult,
  UtilityBillFilters,
} from "@/types/utility-bills";
import { getUtilityBillService } from "./utilityBillService";

export interface AnalyticsConfig {
  enableAnomalyDetection?: boolean;
  enablePredictiveAnalytics?: boolean;
  enableAIInsights?: boolean;
  anomalyThreshold?: number; // Standard deviations
  trendAnalysisWindow?: number; // Days
}

/**
 * Utility Bill Analytics Service
 */
export class UtilityBillAnalyticsService {
  private config: AnalyticsConfig;
  private billService = getUtilityBillService();

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enableAnomalyDetection: true,
      enablePredictiveAnalytics: true,
      enableAIInsights: true,
      anomalyThreshold: 2.5, // 2.5 standard deviations
      trendAnalysisWindow: 90, // 90 days
      ...config,
    };
  }

  /**
   * Generate comprehensive analytics
   */
  async generateAnalytics(
    filters?: UtilityBillFilters,
    period?: { start: Date; end: Date },
  ): Promise<UtilityBillAnalytics> {
    const query = { filters };
    const { bills } = await this.billService.getBills(query);

    // Use provided period or default to last 12 months
    const endDate = period?.end || new Date();
    const startDate =
      period?.start ||
      new Date(
        endDate.getFullYear() - 1,
        endDate.getMonth(),
        endDate.getDate(),
      );

    // Filter bills by period
    const periodBills = bills.filter((bill) => {
      const billDate = bill.issueDate;
      return billDate >= startDate && billDate <= endDate;
    });

    // Calculate summary
    const summary = this.calculateSummary(periodBills);

    // Analyze by utility type
    const byUtilityType = this.analyzeByUtilityType(periodBills);

    // Analyze by facility
    const byFacility = this.analyzeByFacility(periodBills);

    // Analyze by warehouse
    const byWarehouse = this.analyzeByWarehouse(periodBills);

    // Calculate trends
    const trends = this.calculateTrends(periodBills, startDate, endDate);

    // Generate comparisons
    const comparisons = await this.generateComparisons(periodBills);

    // Detect anomalies
    const anomalies = this.config.enableAnomalyDetection
      ? await this.detectAnomalies(periodBills)
      : [];

    // Generate insights
    const insights = this.config.enableAIInsights
      ? await this.generateInsights(periodBills, summary, trends, anomalies)
      : [];

    return {
      period: { start: startDate, end: endDate },
      summary,
      byUtilityType,
      byFacility,
      byWarehouse,
      trends,
      comparisons,
      anomalies,
      insights,
    };
  }

  /**
   * Compare bills
   */
  async compareBills(
    request: BillComparisonRequest,
  ): Promise<BillComparisonResult> {
    const query = {
      filters: {
        facilityIds: request.facilityIds,
        warehouseIds: request.warehouseIds,
        utilityTypes: request.utilityTypes,
        dateRange: request.period,
      },
    };
    const { bills } = await this.billService.getBills(query);

    if (bills.length === 0) {
      throw new Error("No bills found for comparison");
    }

    const metrics = request.metrics.map((metric) => {
      const values = this.getComparisonValues(
        bills,
        request.comparisonType,
        metric,
      );
      return {
        metric,
        values,
        ...this.calculateStatistics(values.map((v) => v.value)),
      };
    });

    const insights = this.generateComparisonInsights(
      metrics,
      request.comparisonType,
    );
    const recommendations = this.generateComparisonRecommendations(
      metrics,
      request.comparisonType,
    );

    return {
      comparisonType: request.comparisonType,
      period: request.period || {
        start: new Date(Math.min(...bills.map((b) => b.issueDate.getTime()))),
        end: new Date(Math.max(...bills.map((b) => b.issueDate.getTime()))),
      },
      metrics,
      insights,
      recommendations,
    };
  }

  /**
   * Detect anomalies in bills
   */
  async detectAnomalies(bills: UtilityBill[]): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Group bills by account/facility/warehouse for comparison
    const groupedBills = this.groupBillsForAnomalyDetection(bills);

    for (const [key, groupBills] of Object.entries(groupedBills)) {
      if (groupBills.length < 2) continue; // Need at least 2 bills for comparison

      // Calculate statistics
      const amounts = groupBills.map((b) => b.totalAmount);
      const consumptions = groupBills
        .map((b) => b.consumption?.quantity || 0)
        .filter((c) => c > 0);

      const amountMean = this.mean(amounts);
      const amountStdDev = this.standardDeviation(amounts, amountMean);
      const consumptionMean =
        consumptions.length > 0 ? this.mean(consumptions) : 0;
      const consumptionStdDev =
        consumptions.length > 0
          ? this.standardDeviation(consumptions, consumptionMean)
          : 0;

      // Check each bill for anomalies
      for (const bill of groupBills) {
        // Amount spike/drop
        if (amountStdDev > 0) {
          const zScore = Math.abs(
            (bill.totalAmount - amountMean) / amountStdDev,
          );
          if (zScore > (this.config.anomalyThreshold || 2.5)) {
            anomalies.push({
              id: `anomaly-${bill.id}-${Date.now()}`,
              billId: bill.id,
              type: bill.totalAmount > amountMean ? "spike" : "drop",
              severity:
                zScore > 4 ? "critical" : zScore > 3 ? "high" : "medium",
              description: `Bill amount ${bill.totalAmount > amountMean ? "spiked" : "dropped"} significantly compared to historical average`,
              detectedAt: new Date(),
              details: {
                expectedValue: amountMean,
                actualValue: bill.totalAmount,
                deviation: bill.totalAmount - amountMean,
                deviationPercentage:
                  ((bill.totalAmount - amountMean) / amountMean) * 100,
                confidence: Math.min(100, zScore * 20),
              },
              suggestedActions: [
                "Verify meter reading",
                "Check for billing errors",
                "Review consumption patterns",
                "Contact utility provider if discrepancy persists",
              ],
              status: "new",
            });
          }
        }

        // Consumption anomaly
        if (bill.consumption && consumptionStdDev > 0) {
          const zScore = Math.abs(
            (bill.consumption.quantity - consumptionMean) / consumptionStdDev,
          );
          if (zScore > (this.config.anomalyThreshold || 2.5)) {
            anomalies.push({
              id: `anomaly-${bill.id}-consumption-${Date.now()}`,
              billId: bill.id,
              type:
                bill.consumption.quantity > consumptionMean ? "spike" : "drop",
              severity:
                zScore > 4 ? "critical" : zScore > 3 ? "high" : "medium",
              description: `Consumption ${bill.consumption.quantity > consumptionMean ? "spiked" : "dropped"} significantly`,
              detectedAt: new Date(),
              details: {
                expectedValue: consumptionMean,
                actualValue: bill.consumption.quantity,
                deviation: bill.consumption.quantity - consumptionMean,
                deviationPercentage:
                  ((bill.consumption.quantity - consumptionMean) /
                    consumptionMean) *
                  100,
                confidence: Math.min(100, zScore * 20),
              },
              suggestedActions: [
                "Check for equipment malfunctions",
                "Review operational changes",
                "Verify meter accuracy",
                "Investigate potential leaks or inefficiencies",
              ],
              status: "new",
            });
          }
        }

        // Data quality checks
        if (!bill.consumption || bill.consumption.quantity === 0) {
          anomalies.push({
            id: `anomaly-${bill.id}-quality-${Date.now()}`,
            billId: bill.id,
            type: "data-quality",
            severity: "medium",
            description: "Missing or zero consumption data",
            detectedAt: new Date(),
            details: {
              actualValue: bill.consumption?.quantity || 0,
              deviation: 0,
              deviationPercentage: 0,
              confidence: 80,
            },
            suggestedActions: [
              "Verify consumption data entry",
              "Contact provider for accurate readings",
              "Update bill with correct consumption data",
            ],
            status: "new",
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Generate insights
   */
  async generateInsights(
    bills: UtilityBill[],
    summary: UtilityBillAnalytics["summary"],
    trends: UtilityBillAnalytics["trends"],
    anomalies: AnomalyDetection[],
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Cost optimization insights
    if (trends.length >= 3) {
      const recentTrend = trends.slice(-3);
      const avgRecent = this.mean(recentTrend.map((t) => t.totalAmount));
      const avgPrevious =
        trends.length >= 6
          ? this.mean(trends.slice(-6, -3).map((t) => t.totalAmount))
          : avgRecent;

      if (avgRecent > avgPrevious * 1.1) {
        insights.push({
          id: `insight-cost-increase-${Date.now()}`,
          type: "cost-optimization",
          category: "cost-trend",
          title: "Rising Utility Costs Detected",
          description: `Average utility costs have increased by ${(((avgRecent - avgPrevious) / avgPrevious) * 100).toFixed(1)}% in recent months`,
          impact: {
            potentialSavings: (avgRecent - avgPrevious) * 12, // Annualized
          },
          confidence: 85,
          priority: "high",
          actionable: true,
          recommendedActions: [
            "Review energy efficiency measures",
            "Consider renegotiating utility contracts",
            "Investigate consumption patterns",
            "Explore alternative providers",
          ],
          generatedAt: new Date(),
          generatedBy: "ai",
        });
      }
    }

    // Consumption pattern insights
    const electricityBills = bills.filter(
      (b) => b.utilityType === "electricity" && b.consumption,
    );
    if (electricityBills.length >= 6) {
      const consumptions = electricityBills.map((b) => b.consumption!.quantity);
      const avgConsumption = this.mean(consumptions);
      const highConsumptionBills = electricityBills.filter(
        (b) => b.consumption!.quantity > avgConsumption * 1.2,
      );

      if (highConsumptionBills.length > 0) {
        insights.push({
          id: `insight-consumption-pattern-${Date.now()}`,
          type: "consumption-pattern",
          category: "efficiency",
          title: "High Consumption Periods Identified",
          description: `${highConsumptionBills.length} bills show consumption ${(((highConsumptionBills[0].consumption!.quantity - avgConsumption) / avgConsumption) * 100).toFixed(1)}% above average`,
          impact: {
            consumptionReduction: avgConsumption * 0.1, // Potential 10% reduction
          },
          confidence: 75,
          priority: "medium",
          actionable: true,
          recommendedActions: [
            "Analyze peak consumption periods",
            "Implement demand management strategies",
            "Consider load shifting",
            "Review equipment schedules",
          ],
          relatedBills: highConsumptionBills.map((b) => b.id),
          generatedAt: new Date(),
          generatedBy: "ai",
        });
      }
    }

    // Anomaly-based insights
    const criticalAnomalies = anomalies.filter(
      (a) => a.severity === "critical",
    );
    if (criticalAnomalies.length > 0) {
      insights.push({
        id: `insight-anomalies-${Date.now()}`,
        type: "risk",
        category: "anomalies",
        title: "Critical Anomalies Require Attention",
        description: `${criticalAnomalies.length} critical anomalies detected that require immediate investigation`,
        impact: {
          riskLevel: "high",
        },
        confidence: 90,
        priority: "critical",
        actionable: true,
        recommendedActions: [
          "Review all critical anomalies",
          "Verify meter readings",
          "Contact utility providers",
          "Investigate root causes",
        ],
        relatedBills: criticalAnomalies.map((a) => a.billId),
        generatedAt: new Date(),
        generatedBy: "system",
      });
    }

    // Efficiency opportunities
    const byFacility = this.analyzeByFacility(bills);
    if (byFacility.length >= 2) {
      const sortedByEfficiency = byFacility.sort((a, b) => {
        const aEfficiency =
          a.totalConsumption > 0
            ? a.totalAmount / a.totalConsumption
            : Infinity;
        const bEfficiency =
          b.totalConsumption > 0
            ? b.totalAmount / b.totalConsumption
            : Infinity;
        return bEfficiency - aEfficiency; // Higher cost per unit = less efficient
      });

      const leastEfficient = sortedByEfficiency[0];
      const mostEfficient = sortedByEfficiency[sortedByEfficiency.length - 1];

      if (
        leastEfficient &&
        mostEfficient &&
        leastEfficient.facilityId !== mostEfficient.facilityId
      ) {
        const leastEfficiency =
          leastEfficient.totalConsumption > 0
            ? leastEfficient.totalAmount / leastEfficient.totalConsumption
            : 0;
        const mostEfficiency =
          mostEfficient.totalConsumption > 0
            ? mostEfficient.totalAmount / mostEfficient.totalConsumption
            : 0;

        if (leastEfficiency > mostEfficiency * 1.2) {
          insights.push({
            id: `insight-efficiency-${Date.now()}`,
            type: "opportunity",
            category: "efficiency",
            title: "Efficiency Improvement Opportunity",
            description: `${leastEfficient.facilityName} has ${(((leastEfficiency - mostEfficiency) / mostEfficiency) * 100).toFixed(1)}% higher cost per unit than ${mostEfficient.facilityName}`,
            impact: {
              potentialSavings:
                leastEfficient.totalAmount -
                leastEfficient.totalConsumption *
                  (mostEfficient.totalAmount / mostEfficient.totalConsumption),
            },
            confidence: 80,
            priority: "high",
            actionable: true,
            recommendedActions: [
              `Review efficiency measures at ${leastEfficient.facilityName}`,
              "Compare operational practices",
              "Identify best practices from efficient facilities",
              "Implement efficiency improvements",
            ],
            relatedFacilities: [
              leastEfficient.facilityId,
              mostEfficient.facilityId,
            ],
            generatedAt: new Date(),
            generatedBy: "ai",
          });
        }
      }
    }

    return insights;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private calculateSummary(
    bills: UtilityBill[],
  ): UtilityBillAnalytics["summary"] {
    const totalBills = bills.length;
    const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const averageBillAmount = totalBills > 0 ? totalAmount / totalBills : 0;
    const totalConsumption = bills.reduce(
      (sum, b) => sum + (b.consumption?.quantity || 0),
      0,
    );
    const averageConsumption =
      totalBills > 0 ? totalConsumption / totalBills : 0;

    return {
      totalBills,
      totalAmount,
      averageBillAmount,
      totalConsumption,
      averageConsumption,
    };
  }

  private analyzeByUtilityType(
    bills: UtilityBill[],
  ): UtilityBillAnalytics["byUtilityType"] {
    const grouped = new Map<string, UtilityBill[]>();

    for (const bill of bills) {
      const key = bill.utilityType;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(bill);
    }

    return Array.from(grouped.entries()).map(([utilityType, typeBills]) => {
      const summary = this.calculateSummary(typeBills);
      return {
        utilityType: utilityType as UtilityBill["utilityType"],
        count: summary.totalBills,
        totalAmount: summary.totalAmount,
        totalConsumption: summary.totalConsumption,
        averageAmount: summary.averageBillAmount,
        averageConsumption: summary.averageConsumption,
      };
    });
  }

  private analyzeByFacility(
    bills: UtilityBill[],
  ): UtilityBillAnalytics["byFacility"] {
    const grouped = new Map<string, UtilityBill[]>();

    for (const bill of bills) {
      if (!bill.facilityId) continue;
      const key = bill.facilityId;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(bill);
    }

    return Array.from(grouped.entries()).map(([facilityId, facilityBills]) => {
      const summary = this.calculateSummary(facilityBills);
      return {
        facilityId,
        facilityName: facilityBills[0].facilityName || facilityId,
        count: summary.totalBills,
        totalAmount: summary.totalAmount,
        totalConsumption: summary.totalConsumption,
      };
    });
  }

  private analyzeByWarehouse(
    bills: UtilityBill[],
  ): UtilityBillAnalytics["byWarehouse"] {
    const grouped = new Map<string, UtilityBill[]>();

    for (const bill of bills) {
      if (!bill.warehouseId) continue;
      const key = bill.warehouseId;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(bill);
    }

    return Array.from(grouped.entries()).map(
      ([warehouseId, warehouseBills]) => {
        const summary = this.calculateSummary(warehouseBills);
        return {
          warehouseId,
          warehouseCode: warehouseBills[0].warehouseCode || warehouseId,
          warehouseName: warehouseBills[0].warehouseName || warehouseId,
          count: summary.totalBills,
          totalAmount: summary.totalAmount,
          totalConsumption: summary.totalConsumption,
        };
      },
    );
  }

  private calculateTrends(
    bills: UtilityBill[],
    startDate: Date,
    endDate: Date,
  ): UtilityBillAnalytics["trends"] {
    const trends: UtilityBillAnalytics["trends"] = [];
    const monthlyGroups = new Map<string, UtilityBill[]>();

    // Group bills by month
    for (const bill of bills) {
      const monthKey = `${bill.issueDate.getFullYear()}-${String(bill.issueDate.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, []);
      }
      monthlyGroups.get(monthKey)!.push(bill);
    }

    // Calculate monthly trends
    for (const [month, monthBills] of monthlyGroups.entries()) {
      const summary = this.calculateSummary(monthBills);
      trends.push({
        month,
        totalAmount: summary.totalAmount,
        totalConsumption: summary.totalConsumption,
        billCount: summary.totalBills,
      });
    }

    return trends.sort((a, b) => a.month.localeCompare(b.month));
  }

  private async generateComparisons(
    bills: UtilityBill[],
  ): Promise<ComparisonAnalysis[]> {
    const comparisons: ComparisonAnalysis[] = [];

    // Facility comparison
    const byFacility = this.analyzeByFacility(bills);
    if (byFacility.length >= 2) {
      comparisons.push({
        type: "facility",
        dimension: "Cost per Facility",
        comparisons: byFacility.map((f) => ({
          label: f.facilityName,
          value: f.totalAmount,
          percentageChange: this.calculatePercentageChange(
            f.totalAmount,
            this.mean(byFacility.map((f) => f.totalAmount)),
          ),
        })),
        insights: this.generateFacilityInsights(byFacility),
      });
    }

    // Warehouse comparison
    const byWarehouse = this.analyzeByWarehouse(bills);
    if (byWarehouse.length >= 2) {
      comparisons.push({
        type: "warehouse",
        dimension: "Cost per Warehouse",
        comparisons: byWarehouse.map((w) => ({
          label: w.warehouseName,
          value: w.totalAmount,
          percentageChange: this.calculatePercentageChange(
            w.totalAmount,
            this.mean(byWarehouse.map((w) => w.totalAmount)),
          ),
        })),
        insights: this.generateWarehouseInsights(byWarehouse),
      });
    }

    return comparisons;
  }

  private getComparisonValues(
    bills: UtilityBill[],
    comparisonType: string,
    metric: string,
  ): BillComparisonResult["metrics"][0]["values"] {
    const values: BillComparisonResult["metrics"][0]["values"] = [];

    if (comparisonType === "facility") {
      const grouped = new Map<string, UtilityBill[]>();
      for (const bill of bills) {
        if (!bill.facilityId) continue;
        const key = bill.facilityId;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(bill);
      }

      for (const [facilityId, facilityBills] of grouped.entries()) {
        const value = this.getMetricValue(facilityBills, metric);
        values.push({
          label: facilityBills[0].facilityName || facilityId,
          value,
        });
      }
    } else if (comparisonType === "warehouse") {
      const grouped = new Map<string, UtilityBill[]>();
      for (const bill of bills) {
        if (!bill.warehouseId) continue;
        const key = bill.warehouseId;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(bill);
      }

      for (const [warehouseId, warehouseBills] of grouped.entries()) {
        const value = this.getMetricValue(warehouseBills, metric);
        values.push({
          label: warehouseBills[0].warehouseName || warehouseId,
          value,
        });
      }
    }

    // Calculate percentage changes and trends
    const avg = this.mean(values.map((v) => v.value));
    for (const val of values) {
      val.percentageChange = this.calculatePercentageChange(val.value, avg);
      val.trend =
        val.value > avg
          ? "increasing"
          : val.value < avg
            ? "decreasing"
            : "stable";
    }

    return values;
  }

  private getMetricValue(bills: UtilityBill[], metric: string): number {
    switch (metric) {
      case "amount":
        return bills.reduce((sum, b) => sum + b.totalAmount, 0);
      case "consumption":
        return bills.reduce(
          (sum, b) => sum + (b.consumption?.quantity || 0),
          0,
        );
      case "efficiency":
        const totalConsumption = bills.reduce(
          (sum, b) => sum + (b.consumption?.quantity || 0),
          0,
        );
        const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
        return totalConsumption > 0 ? totalAmount / totalConsumption : 0;
      case "cost-per-unit":
        const consumption = bills.reduce(
          (sum, b) => sum + (b.consumption?.quantity || 0),
          0,
        );
        const amount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
        return consumption > 0 ? amount / consumption : 0;
      default:
        return 0;
    }
  }

  private calculateStatistics(values: number[]): {
    average?: number;
    median?: number;
    min?: number;
    max?: number;
    standardDeviation?: number;
  } {
    if (values.length === 0) return {};

    return {
      average: this.mean(values),
      median: this.median(values),
      min: Math.min(...values),
      max: Math.max(...values),
      standardDeviation: this.standardDeviation(values, this.mean(values)),
    };
  }

  private generateComparisonInsights(
    metrics: BillComparisonResult["metrics"],
    comparisonType: string,
  ): string[] {
    const insights: string[] = [];

    for (const metric of metrics) {
      if (metric.average && metric.max && metric.min) {
        const range = metric.max - metric.min;
        const rangePercentage = (range / metric.average) * 100;

        if (rangePercentage > 30) {
          insights.push(
            `Significant variation in ${metric.metric} across ${comparisonType}s (${rangePercentage.toFixed(1)}% range)`,
          );
        }
      }
    }

    return insights;
  }

  private generateComparisonRecommendations(
    metrics: BillComparisonResult["metrics"],
    comparisonType: string,
  ): string[] {
    const recommendations: string[] = [];

    for (const metric of metrics) {
      if (metric.values.length >= 2) {
        const sorted = [...metric.values].sort((a, b) => b.value - a.value);
        const best = sorted[sorted.length - 1];
        const worst = sorted[0];

        if (worst.value > best.value * 1.2) {
          recommendations.push(
            `Review ${metric.metric} practices at ${worst.label} - ${(((worst.value - best.value) / best.value) * 100).toFixed(1)}% higher than ${best.label}`,
          );
        }
      }
    }

    return recommendations;
  }

  private groupBillsForAnomalyDetection(
    bills: UtilityBill[],
  ): Record<string, UtilityBill[]> {
    const grouped: Record<string, UtilityBill[]> = {};

    for (const bill of bills) {
      // Group by account number (most specific)
      const key =
        bill.accountNumber ||
        `${bill.facilityId || bill.warehouseId || "unknown"}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(bill);
    }

    return grouped;
  }

  private generateFacilityInsights(
    byFacility: UtilityBillAnalytics["byFacility"],
  ): string[] {
    const insights: string[] = [];
    const total = byFacility.reduce((sum, f) => sum + f.totalAmount, 0);
    const avg = total / byFacility.length;

    const highest = byFacility.reduce(
      (max, f) => (f.totalAmount > max.totalAmount ? f : max),
      byFacility[0],
    );
    const lowest = byFacility.reduce(
      (min, f) => (f.totalAmount < min.totalAmount ? f : min),
      byFacility[0],
    );

    if (highest.totalAmount > avg * 1.2) {
      insights.push(
        `${highest.facilityName} has ${(((highest.totalAmount - avg) / avg) * 100).toFixed(1)}% higher costs than average`,
      );
    }

    return insights;
  }

  private generateWarehouseInsights(
    byWarehouse: UtilityBillAnalytics["byWarehouse"],
  ): string[] {
    const insights: string[] = [];
    const total = byWarehouse.reduce((sum, w) => sum + w.totalAmount, 0);
    const avg = total / byWarehouse.length;

    const highest = byWarehouse.reduce(
      (max, w) => (w.totalAmount > max.totalAmount ? w : max),
      byWarehouse[0],
    );
    const lowest = byWarehouse.reduce(
      (min, w) => (w.totalAmount < min.totalAmount ? w : min),
      byWarehouse[0],
    );

    if (highest.totalAmount > avg * 1.2) {
      insights.push(
        `${highest.warehouseName} has ${(((highest.totalAmount - avg) / avg) * 100).toFixed(1)}% higher costs than average`,
      );
    }

    return insights;
  }

  // Statistical helper methods
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private standardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = this.mean(squaredDiffs);
    return Math.sqrt(variance);
  }

  private calculatePercentageChange(value: number, baseline: number): number {
    if (baseline === 0) return 0;
    return ((value - baseline) / baseline) * 100;
  }
}

// Singleton instance
let analyticsServiceInstance: UtilityBillAnalyticsService | null = null;

export function getUtilityBillAnalyticsService(
  config?: AnalyticsConfig,
): UtilityBillAnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new UtilityBillAnalyticsService(config);
  }
  return analyticsServiceInstance;
}
