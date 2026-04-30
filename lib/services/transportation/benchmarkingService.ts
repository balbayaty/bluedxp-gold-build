/**
 * Transportation Benchmarking Service
 *
 * Compares performance against industry standards:
 * - Transit time benchmarks
 * - Cost benchmarks
 * - Compliance benchmarks
 * - Service level benchmarks
 * - Industry best practices
 *
 * 4IR & 5IR Aligned - Industry Intelligence
 */

import type { Shipment, TransportMode, ShipmentType } from "@/types/tms";
import type { IntelligentRoutePlan } from "./intelligentRoutePlanningService";
import type { EnhancedTransitTimeCalculation } from "./enhancedTransitTimeCalculator";

// ============================================================================
// TYPES
// ============================================================================

export interface IndustryBenchmark {
  category: string;
  metric: string;
  industryAverage: number;
  industryBest: number;
  industryWorst: number;
  unit: string;
  source: string;
  lastUpdated: Date;
}

export interface BenchmarkComparison {
  metric: string;
  yourValue: number;
  industryAverage: number;
  industryBest: number;
  industryWorst: number;
  percentile: number; // 0-100 (where you rank)
  status: "BELOW_AVERAGE" | "AVERAGE" | "ABOVE_AVERAGE" | "BEST_IN_CLASS";
  gap: {
    toAverage: number;
    toBest: number;
    improvement: number; // percentage
  };
  recommendations: string[];
}

export interface TransportationBenchmark {
  shipmentId?: string;
  routePlan?: IntelligentRoutePlan;
  transitTime?: EnhancedTransitTimeCalculation;

  // Transit time benchmarks
  transitTimeBenchmark: BenchmarkComparison;

  // Cost benchmarks
  costBenchmark?: BenchmarkComparison;

  // Compliance benchmarks
  complianceBenchmark?: BenchmarkComparison;

  // Service level benchmarks
  serviceLevelBenchmark?: BenchmarkComparison;

  // Overall score
  overallScore: {
    score: number; // 0-100
    percentile: number; // 0-100
    status: "BELOW_AVERAGE" | "AVERAGE" | "ABOVE_AVERAGE" | "BEST_IN_CLASS";
    category: string;
  };

  // Recommendations
  recommendations: string[];

  // Metadata
  benchmarkedAt: Date;
  tenantId: string;
}

export interface BenchmarkingRequest {
  shipment?: Shipment;
  routePlan?: IntelligentRoutePlan;
  transitTime?: EnhancedTransitTimeCalculation;
  mode?: TransportMode;
  type?: ShipmentType;
  route?: {
    origin: string;
    destination: string;
    distance?: number; // km
  };
  tenantId?: string;
}

// ============================================================================
// BENCHMARK DATA
// ============================================================================

const INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  // Transit Time Benchmarks (hours per 1000km)
  {
    category: "TRANSIT_TIME",
    metric: "Road Transport",
    industryAverage: 15,
    industryBest: 12,
    industryWorst: 20,
    unit: "hours per 1000km",
    source: "Industry Standard",
    lastUpdated: new Date("2024-01-01"),
  },
  {
    category: "TRANSIT_TIME",
    metric: "Air Freight",
    industryAverage: 2,
    industryBest: 1.5,
    industryWorst: 3,
    unit: "hours per 1000km",
    source: "Industry Standard",
    lastUpdated: new Date("2024-01-01"),
  },
  {
    category: "TRANSIT_TIME",
    metric: "Sea Freight",
    industryAverage: 48,
    industryBest: 40,
    industryWorst: 60,
    unit: "hours per 1000km",
    source: "Industry Standard",
    lastUpdated: new Date("2024-01-01"),
  },

  // Cost Benchmarks (USD per 1000km per ton)
  {
    category: "COST",
    metric: "Road Transport",
    industryAverage: 150,
    industryBest: 120,
    industryWorst: 200,
    unit: "USD per 1000km per ton",
    source: "Industry Standard",
    lastUpdated: new Date("2024-01-01"),
  },

  // Compliance Benchmarks
  {
    category: "COMPLIANCE",
    metric: "Customs Clearance Time",
    industryAverage: 24,
    industryBest: 4,
    industryWorst: 72,
    unit: "hours",
    source: "Industry Standard",
    lastUpdated: new Date("2024-01-01"),
  },

  // Service Level Benchmarks
  {
    category: "SERVICE_LEVEL",
    metric: "On-Time Delivery Rate",
    industryAverage: 85,
    industryBest: 98,
    industryWorst: 70,
    unit: "percentage",
    source: "Industry Standard",
    lastUpdated: new Date("2024-01-01"),
  },
];

// ============================================================================
// SERVICE
// ============================================================================

export class BenchmarkingService {
  /**
   * Benchmark transportation performance
   */
  async benchmark(
    request: BenchmarkingRequest,
  ): Promise<TransportationBenchmark> {
    const {
      shipment,
      routePlan,
      transitTime,
      mode = shipment?.mode || "LAND",
      type = shipment?.type || "FTL",
      route,
      tenantId = "default",
    } = request;

    // 1. Benchmark transit time
    const transitTimeBenchmark = this.benchmarkTransitTime(
      routePlan,
      transitTime,
      mode,
      route,
    );

    // 2. Benchmark cost (if available)
    const costBenchmark = routePlan
      ? this.benchmarkCost(routePlan, mode, route)
      : undefined;

    // 3. Benchmark compliance (if available)
    const complianceBenchmark = transitTime
      ? this.benchmarkCompliance(transitTime)
      : undefined;

    // 4. Calculate overall score
    const overallScore = this.calculateOverallScore(
      transitTimeBenchmark,
      costBenchmark,
      complianceBenchmark,
    );

    // 5. Generate recommendations
    const recommendations = this.generateRecommendations(
      transitTimeBenchmark,
      costBenchmark,
      complianceBenchmark,
      overallScore,
    );

    return {
      shipmentId: shipment?.id,
      routePlan,
      transitTime,
      transitTimeBenchmark,
      costBenchmark,
      complianceBenchmark,
      overallScore,
      recommendations,
      benchmarkedAt: new Date(),
      tenantId,
    };
  }

  /**
   * Get industry benchmarks for a category
   */
  getIndustryBenchmarks(category: string): IndustryBenchmark[] {
    return INDUSTRY_BENCHMARKS.filter((b) => b.category === category);
  }

  /**
   * Get all industry benchmarks
   */
  getAllIndustryBenchmarks(): IndustryBenchmark[] {
    return INDUSTRY_BENCHMARKS;
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private benchmarkTransitTime(
    routePlan?: IntelligentRoutePlan,
    transitTime?: EnhancedTransitTimeCalculation,
    mode: TransportMode = "LAND",
    route?: BenchmarkingRequest["route"],
  ): BenchmarkComparison {
    const yourValue =
      transitTime?.actualTransitTime.total ||
      routePlan?.transitTime.withConstraints ||
      0;

    // Get benchmark for mode
    const benchmark =
      INDUSTRY_BENCHMARKS.find(
        (b) =>
          b.category === "TRANSIT_TIME" &&
          b.metric.toLowerCase().includes(mode.toLowerCase()),
      ) || INDUSTRY_BENCHMARKS.find((b) => b.category === "TRANSIT_TIME")!;

    // Normalize to per 1000km if distance available
    let normalizedValue = yourValue;
    if (route?.distance) {
      normalizedValue = (yourValue / route.distance) * 1000;
    }

    // Calculate percentile
    const percentile = this.calculatePercentile(
      normalizedValue,
      benchmark.industryWorst,
      benchmark.industryAverage,
      benchmark.industryBest,
    );

    // Determine status
    let status: BenchmarkComparison["status"] = "AVERAGE";
    if (normalizedValue <= benchmark.industryBest) {
      status = "BEST_IN_CLASS";
    } else if (normalizedValue < benchmark.industryAverage) {
      status = "ABOVE_AVERAGE";
    } else if (normalizedValue > benchmark.industryAverage) {
      status = "BELOW_AVERAGE";
    }

    // Calculate gaps
    const gap = {
      toAverage: normalizedValue - benchmark.industryAverage,
      toBest: normalizedValue - benchmark.industryBest,
      improvement:
        ((benchmark.industryAverage - normalizedValue) /
          benchmark.industryAverage) *
        100,
    };

    // Generate recommendations
    const recommendations: string[] = [];
    if (normalizedValue > benchmark.industryAverage) {
      recommendations.push(
        `Transit time is ${gap.toAverage.toFixed(1)} hours above industry average`,
      );
      recommendations.push(
        "Consider optimizing route or using compliance programs",
      );
    }
    if (normalizedValue > benchmark.industryBest) {
      recommendations.push(
        `Gap to best-in-class: ${gap.toBest.toFixed(1)} hours`,
      );
      recommendations.push("Review bottlenecks and constraints");
    }

    return {
      metric: "Transit Time",
      yourValue: normalizedValue,
      industryAverage: benchmark.industryAverage,
      industryBest: benchmark.industryBest,
      industryWorst: benchmark.industryWorst,
      percentile,
      status,
      gap,
      recommendations,
    };
  }

  private benchmarkCost(
    routePlan: IntelligentRoutePlan,
    mode: TransportMode,
    route?: BenchmarkingRequest["route"],
  ): BenchmarkComparison | undefined {
    // Would calculate cost per 1000km per ton
    // For now, return undefined (would implement cost calculation)
    return undefined;
  }

  private benchmarkCompliance(
    transitTime: EnhancedTransitTimeCalculation,
  ): BenchmarkComparison {
    const customsTime = transitTime.actualTransitTime.breakdown.customs;
    const benchmark = INDUSTRY_BENCHMARKS.find(
      (b) =>
        b.category === "COMPLIANCE" && b.metric === "Customs Clearance Time",
    )!;

    const percentile = this.calculatePercentile(
      customsTime,
      benchmark.industryWorst,
      benchmark.industryAverage,
      benchmark.industryBest,
    );

    let status: BenchmarkComparison["status"] = "AVERAGE";
    if (customsTime <= benchmark.industryBest) {
      status = "BEST_IN_CLASS";
    } else if (customsTime < benchmark.industryAverage) {
      status = "ABOVE_AVERAGE";
    } else if (customsTime > benchmark.industryAverage) {
      status = "BELOW_AVERAGE";
    }

    const gap = {
      toAverage: customsTime - benchmark.industryAverage,
      toBest: customsTime - benchmark.industryBest,
      improvement:
        ((benchmark.industryAverage - customsTime) /
          benchmark.industryAverage) *
        100,
    };

    const recommendations: string[] = [];
    if (customsTime > benchmark.industryAverage) {
      recommendations.push(
        `Customs clearance time is ${gap.toAverage.toFixed(1)} hours above average`,
      );
      if (transitTime.complianceProgramImpact) {
        recommendations.push(
          "Already using compliance programs - consider additional programs",
        );
      } else {
        recommendations.push(
          "Consider enrolling in AEO or Golden List programs",
        );
      }
    }

    return {
      metric: "Customs Clearance Time",
      yourValue: customsTime,
      industryAverage: benchmark.industryAverage,
      industryBest: benchmark.industryBest,
      industryWorst: benchmark.industryWorst,
      percentile,
      status,
      gap,
      recommendations,
    };
  }

  private calculatePercentile(
    value: number,
    worst: number,
    average: number,
    best: number,
  ): number {
    // Calculate percentile (0-100)
    // Lower is better for transit time
    if (value <= best) return 95; // Top 5%
    if (value <= average)
      return 50 + ((average - value) / (average - best)) * 45;
    if (value >= worst) return 5; // Bottom 5%
    return 50 - ((value - average) / (worst - average)) * 45;
  }

  private calculateOverallScore(
    transitTime: BenchmarkComparison,
    cost?: BenchmarkComparison,
    compliance?: BenchmarkComparison,
  ): TransportationBenchmark["overallScore"] {
    // Weighted average of all benchmarks
    let totalScore = transitTime.percentile * 0.5; // 50% weight

    if (cost) {
      totalScore += cost.percentile * 0.3; // 30% weight
    } else {
      totalScore += 50 * 0.3; // Default if no cost data
    }

    if (compliance) {
      totalScore += compliance.percentile * 0.2; // 20% weight
    } else {
      totalScore += 50 * 0.2; // Default if no compliance data
    }

    let status: TransportationBenchmark["overallScore"]["status"] = "AVERAGE";
    if (totalScore >= 90) {
      status = "BEST_IN_CLASS";
    } else if (totalScore >= 70) {
      status = "ABOVE_AVERAGE";
    } else if (totalScore < 50) {
      status = "BELOW_AVERAGE";
    }

    let category = "Average Performer";
    if (status === "BEST_IN_CLASS") {
      category = "Industry Leader";
    } else if (status === "ABOVE_AVERAGE") {
      category = "Above Average Performer";
    } else if (status === "BELOW_AVERAGE") {
      category = "Below Average Performer";
    }

    return {
      score: Math.round(totalScore),
      percentile: Math.round(totalScore),
      status,
      category,
    };
  }

  private generateRecommendations(
    transitTime: BenchmarkComparison,
    cost?: BenchmarkComparison,
    compliance?: BenchmarkComparison,
    overallScore: TransportationBenchmark["overallScore"],
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore.status === "BELOW_AVERAGE") {
      recommendations.push(
        "Overall performance is below industry average - significant improvements needed",
      );
    }

    recommendations.push(...transitTime.recommendations);

    if (cost && cost.status === "BELOW_AVERAGE") {
      recommendations.push(...cost.recommendations);
    }

    if (compliance && compliance.status === "BELOW_AVERAGE") {
      recommendations.push(...compliance.recommendations);
    }

    if (overallScore.status === "BEST_IN_CLASS") {
      recommendations.push(
        "Excellent performance - maintain current practices",
      );
    }

    return Array.from(new Set(recommendations)); // Remove duplicates
  }
}

export const benchmarkingService = new BenchmarkingService();
