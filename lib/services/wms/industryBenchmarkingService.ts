/**
 * Industry Benchmarking Service
 * Performance comparison against industry standards
 * NO DUPLICATION - New service for benchmarking
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// BENCHMARKING TYPES
// ============================================================================

export interface IndustryBenchmark {
  id: string;
  category:
    | "PICKING"
    | "PUTAWAY"
    | "INVENTORY"
    | "ORDER_FULFILLMENT"
    | "LABOR"
    | "EQUIPMENT"
    | "OVERALL";
  metric: string;
  industryAverage: number;
  industryTopQuartile: number;
  industryTop10Percent: number;
  unit: string;
  source: string;
  lastUpdated: Date;
}

export interface WarehouseBenchmark {
  warehouseId: string;
  benchmarks: Array<{
    category: IndustryBenchmark["category"];
    metric: string;
    value: number;
    industryAverage: number;
    industryTopQuartile: number;
    industryTop10Percent: number;
    performance:
      | "BELOW_AVERAGE"
      | "AVERAGE"
      | "ABOVE_AVERAGE"
      | "TOP_QUARTILE"
      | "TOP_10_PERCENT";
    gap: number; // percentage difference from top 10%
    recommendations: string[];
  }>;
  overallScore: number;
  ranking:
    | "BELOW_AVERAGE"
    | "AVERAGE"
    | "ABOVE_AVERAGE"
    | "TOP_QUARTILE"
    | "TOP_10_PERCENT";
  generatedAt: Date;
}

export interface BenchmarkComparison {
  warehouseId: string;
  comparisons: Array<{
    metric: string;
    yourValue: number;
    industryAverage: number;
    top10Percent: number;
    gap: number;
    improvementPotential: number;
  }>;
  totalGap: number;
  improvementPotential: number;
}

// ============================================================================
// INDUSTRY BENCHMARKING SERVICE
// ============================================================================

class IndustryBenchmarkingService {
  private benchmarks: Map<string, IndustryBenchmark> = new Map();
  private warehouseBenchmarks: Map<string, WarehouseBenchmark> = new Map();

  /**
   * Initialize with industry benchmarks
   */
  initialize(): void {
    // Load standard industry benchmarks
    const standardBenchmarks: IndustryBenchmark[] = [
      {
        id: "pick-rate",
        category: "PICKING",
        metric: "Picks per Hour",
        industryAverage: 60,
        industryTopQuartile: 80,
        industryTop10Percent: 100,
        unit: "picks/hour",
        source: "WERC",
        lastUpdated: new Date(),
      },
      {
        id: "order-accuracy",
        category: "ORDER_FULFILLMENT",
        metric: "Order Accuracy",
        industryAverage: 98.5,
        industryTopQuartile: 99.5,
        industryTop10Percent: 99.9,
        unit: "percentage",
        source: "WERC",
        lastUpdated: new Date(),
      },
      {
        id: "on-time-delivery",
        category: "ORDER_FULFILLMENT",
        metric: "On-Time Delivery",
        industryAverage: 92,
        industryTopQuartile: 96,
        industryTop10Percent: 98,
        unit: "percentage",
        source: "WERC",
        lastUpdated: new Date(),
      },
      {
        id: "inventory-accuracy",
        category: "INVENTORY",
        metric: "Inventory Accuracy",
        industryAverage: 95,
        industryTopQuartile: 98,
        industryTop10Percent: 99.5,
        unit: "percentage",
        source: "WERC",
        lastUpdated: new Date(),
      },
      {
        id: "labor-productivity",
        category: "LABOR",
        metric: "Labor Productivity",
        industryAverage: 75,
        industryTopQuartile: 85,
        industryTop10Percent: 95,
        unit: "percentage",
        source: "WERC",
        lastUpdated: new Date(),
      },
      {
        id: "equipment-utilization",
        category: "EQUIPMENT",
        metric: "Equipment Utilization",
        industryAverage: 60,
        industryTopQuartile: 75,
        industryTop10Percent: 85,
        unit: "percentage",
        source: "WERC",
        lastUpdated: new Date(),
      },
      {
        id: "cycle-time",
        category: "ORDER_FULFILLMENT",
        metric: "Order Cycle Time",
        industryAverage: 24,
        industryTopQuartile: 18,
        industryTop10Percent: 12,
        unit: "hours",
        source: "WERC",
        lastUpdated: new Date(),
      },
    ];

    standardBenchmarks.forEach((benchmark) => {
      this.benchmarks.set(benchmark.id, benchmark);
    });
  }

  /**
   * Generate warehouse benchmark
   */
  async generateBenchmark(warehouseId: string): Promise<WarehouseBenchmark> {
    // In production, fetch actual warehouse metrics
    // For now, use mock data
    const warehouseMetrics = {
      PICKING: { "Picks per Hour": 65 },
      ORDER_FULFILLMENT: {
        "Order Accuracy": 98.8,
        "On-Time Delivery": 94,
        "Order Cycle Time": 20,
      },
      INVENTORY: { "Inventory Accuracy": 96 },
      LABOR: { "Labor Productivity": 78 },
      EQUIPMENT: { "Equipment Utilization": 65 },
    };

    const benchmarkResults: WarehouseBenchmark["benchmarks"] = [];

    // Compare each metric
    for (const [category, metrics] of Object.entries(warehouseMetrics)) {
      for (const [metric, value] of Object.entries(metrics)) {
        const benchmark = Array.from(this.benchmarks.values()).find(
          (b) => b.category === category && b.metric === metric,
        );

        if (benchmark) {
          let performance: WarehouseBenchmark["benchmarks"][0]["performance"];
          if (value >= benchmark.industryTop10Percent) {
            performance = "TOP_10_PERCENT";
          } else if (value >= benchmark.industryTopQuartile) {
            performance = "TOP_QUARTILE";
          } else if (value >= benchmark.industryAverage) {
            performance = "ABOVE_AVERAGE";
          } else if (value >= benchmark.industryAverage * 0.9) {
            performance = "AVERAGE";
          } else {
            performance = "BELOW_AVERAGE";
          }

          const gap =
            benchmark.industryTop10Percent > 0
              ? ((benchmark.industryTop10Percent - value) /
                  benchmark.industryTop10Percent) *
                100
              : 0;

          const recommendations = this.generateRecommendations(
            category as IndustryBenchmark["category"],
            performance,
            gap,
          );

          benchmarkResults.push({
            category: category as IndustryBenchmark["category"],
            metric,
            value,
            industryAverage: benchmark.industryAverage,
            industryTopQuartile: benchmark.industryTopQuartile,
            industryTop10Percent: benchmark.industryTop10Percent,
            performance,
            gap,
            recommendations,
          });
        }
      }
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(benchmarkResults);
    const ranking = this.determineRanking(overallScore);

    const warehouseBenchmark: WarehouseBenchmark = {
      warehouseId,
      benchmarks: benchmarkResults,
      overallScore,
      ranking,
      generatedAt: new Date(),
    };

    this.warehouseBenchmarks.set(warehouseId, warehouseBenchmark);

    // Publish event
    await eventBus.publish({
      id: `benchmark-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "benchmark.generated",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        benchmark: warehouseBenchmark,
      },
    });

    return warehouseBenchmark;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    benchmarks: WarehouseBenchmark["benchmarks"],
  ): number {
    if (benchmarks.length === 0) return 0;

    const scores = benchmarks.map((b) => {
      switch (b.performance) {
        case "TOP_10_PERCENT":
          return 100;
        case "TOP_QUARTILE":
          return 90;
        case "ABOVE_AVERAGE":
          return 75;
        case "AVERAGE":
          return 60;
        case "BELOW_AVERAGE":
          return 40;
        default:
          return 50;
      }
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Determine ranking
   */
  private determineRanking(score: number): WarehouseBenchmark["ranking"] {
    if (score >= 95) return "TOP_10_PERCENT";
    if (score >= 85) return "TOP_QUARTILE";
    if (score >= 70) return "ABOVE_AVERAGE";
    if (score >= 55) return "AVERAGE";
    return "BELOW_AVERAGE";
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    category: IndustryBenchmark["category"],
    performance: WarehouseBenchmark["benchmarks"][0]["performance"],
    gap: number,
  ): string[] {
    const recommendations: string[] = [];

    if (performance === "BELOW_AVERAGE" || performance === "AVERAGE") {
      switch (category) {
        case "PICKING":
          recommendations.push(
            "Implement voice picking or pick-to-light systems",
          );
          recommendations.push("Optimize pick paths using AI");
          recommendations.push("Train staff on efficient picking techniques");
          break;
        case "ORDER_FULFILLMENT":
          recommendations.push("Implement real-time order tracking");
          recommendations.push("Optimize order batching and wave planning");
          recommendations.push("Improve communication with carriers");
          break;
        case "INVENTORY":
          recommendations.push("Implement cycle counting program");
          recommendations.push("Use RFID or barcode scanning");
          recommendations.push("Improve receiving accuracy");
          break;
        case "LABOR":
          recommendations.push("Implement workforce management system");
          recommendations.push("Optimize labor scheduling");
          recommendations.push("Provide training and development");
          break;
        case "EQUIPMENT":
          recommendations.push("Implement preventive maintenance program");
          recommendations.push("Optimize equipment allocation");
          recommendations.push("Consider automation for high-volume tasks");
          break;
      }

      if (gap > 20) {
        recommendations.push(
          `Significant gap of ${gap.toFixed(1)}% - consider major process improvements`,
        );
      }
    }

    return recommendations;
  }

  /**
   * Get benchmark comparison
   */
  async getComparison(warehouseId: string): Promise<BenchmarkComparison> {
    const warehouseBenchmark = this.warehouseBenchmarks.get(warehouseId);
    if (!warehouseBenchmark) {
      throw new Error(`Benchmark not found for warehouse: ${warehouseId}`);
    }

    const comparisons: BenchmarkComparison["comparisons"] =
      warehouseBenchmark.benchmarks.map((b) => ({
        metric: b.metric,
        yourValue: b.value,
        industryAverage: b.industryAverage,
        top10Percent: b.industryTop10Percent,
        gap: b.gap,
        improvementPotential: b.industryTop10Percent - b.value,
      }));

    const totalGap =
      comparisons.reduce((sum, c) => sum + c.gap, 0) / comparisons.length;
    const improvementPotential =
      comparisons.reduce((sum, c) => sum + c.improvementPotential, 0) /
      comparisons.length;

    return {
      warehouseId,
      comparisons,
      totalGap,
      improvementPotential,
    };
  }

  /**
   * Get warehouse benchmark
   */
  async getWarehouseBenchmark(
    warehouseId: string,
  ): Promise<WarehouseBenchmark | null> {
    return this.warehouseBenchmarks.get(warehouseId) || null;
  }

  /**
   * Get industry benchmark
   */
  async getIndustryBenchmark(
    benchmarkId: string,
  ): Promise<IndustryBenchmark | null> {
    return this.benchmarks.get(benchmarkId) || null;
  }
}

export const industryBenchmarkingService = new IndustryBenchmarkingService();

// Initialize on load
industryBenchmarkingService.initialize();
