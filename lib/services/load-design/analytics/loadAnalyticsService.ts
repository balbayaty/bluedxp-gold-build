/**
 * Load Design Analytics Service
 *
 * Comprehensive analytics for load design operations:
 * - Utilization metrics
 * - Cost analysis
 * - Compliance tracking
 * - Carrier performance
 * - Route optimization metrics
 * - Predictive analytics
 *
 * 4IR & 5IR Aligned - Data-driven insights
 */

import type {
  LoadPlan,
  LoadItem,
  OptimizationStrategy,
} from "@/types/load-design";

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface LoadAnalytics {
  // Utilization Metrics
  utilization: {
    average: number;
    trend: "increasing" | "decreasing" | "stable";
    best: number;
    worst: number;
    distribution: Array<{ range: string; count: number }>;
  };

  // Cost Metrics
  cost: {
    total: number;
    average: number;
    trend: "increasing" | "decreasing" | "stable";
    breakdown: {
      freight: number;
      fuel: number;
      labor: number;
      handling: number;
      customs: number;
      insurance: number;
      other: number;
    };
    savings: {
      potential: number;
      achieved: number;
      percentage: number;
    };
  };

  // Compliance Metrics
  compliance: {
    score: number;
    trend: "improving" | "declining" | "stable";
    violations: {
      total: number;
      critical: number;
      warnings: number;
    };
    byCategory: {
      weight: number;
      dimensions: number;
      hazmat: number;
      temperature: number;
      customs: number;
      route: number;
    };
  };

  // Carrier Performance
  carriers: Array<{
    id: string;
    name: string;
    shipments: number;
    onTimeRate: number;
    averageCost: number;
    utilization: number;
    complianceScore: number;
    rating: number;
  }>;

  // Route Optimization
  routes: {
    total: number;
    optimized: number;
    averageDistance: number;
    averageTime: number;
    savings: {
      distance: number;
      time: number;
      cost: number;
    };
  };

  // Time-based Trends
  trends: {
    daily: Array<{
      date: string;
      utilization: number;
      cost: number;
      compliance: number;
    }>;
    weekly: Array<{
      week: string;
      utilization: number;
      cost: number;
      compliance: number;
    }>;
    monthly: Array<{
      month: string;
      utilization: number;
      cost: number;
      compliance: number;
    }>;
  };

  // Predictive Metrics
  predictions: {
    nextWeekUtilization: number;
    nextWeekCost: number;
    nextWeekCompliance: number;
    recommendations: string[];
  };
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  vehicleType?: string;
  transportMode?: string;
  carrierId?: string;
  strategy?: OptimizationStrategy;
}

// ============================================================================
// LOAD ANALYTICS SERVICE
// ============================================================================

export class LoadAnalyticsService {
  /**
   * Calculate comprehensive analytics from load plans
   */
  async calculateAnalytics(
    loadPlans: LoadPlan[],
    filters?: AnalyticsFilters,
  ): Promise<LoadAnalytics> {
    // Filter load plans if filters provided
    let filteredPlans = loadPlans;
    if (filters) {
      filteredPlans = this.filterLoadPlans(loadPlans, filters);
    }

    // Calculate utilization metrics
    const utilization = this.calculateUtilizationMetrics(filteredPlans);

    // Calculate cost metrics
    const cost = this.calculateCostMetrics(filteredPlans);

    // Calculate compliance metrics
    const compliance = this.calculateComplianceMetrics(filteredPlans);

    // Calculate carrier performance
    const carriers = this.calculateCarrierPerformance(filteredPlans);

    // Calculate route optimization metrics
    const routes = this.calculateRouteMetrics(filteredPlans);

    // Calculate time-based trends
    const trends = this.calculateTrends(filteredPlans);

    // Generate predictions
    const predictions = await this.generatePredictions(filteredPlans, trends);

    return {
      utilization,
      cost,
      compliance,
      carriers,
      routes,
      trends,
      predictions,
    };
  }

  /**
   * Filter load plans based on criteria
   */
  private filterLoadPlans(
    plans: LoadPlan[],
    filters: AnalyticsFilters,
  ): LoadPlan[] {
    return plans.filter((plan) => {
      if (filters.startDate && new Date(plan.createdAt) < filters.startDate)
        return false;
      if (filters.endDate && new Date(plan.createdAt) > filters.endDate)
        return false;
      if (filters.vehicleType && plan.vehicleType !== filters.vehicleType)
        return false;
      if (filters.transportMode && plan.transportMode !== filters.transportMode)
        return false;
      if (filters.carrierId && plan.carrier?.id !== filters.carrierId)
        return false;
      if (filters.strategy && plan.optimization?.strategy !== filters.strategy)
        return false;
      return true;
    });
  }

  /**
   * Calculate utilization metrics
   */
  private calculateUtilizationMetrics(plans: LoadPlan[]) {
    if (plans.length === 0) {
      return {
        average: 0,
        trend: "stable" as const,
        best: 0,
        worst: 0,
        distribution: [],
      };
    }

    const utilizations = plans.map((p) => p.utilization.overall);
    const average =
      utilizations.reduce((a, b) => a + b, 0) / utilizations.length;
    const best = Math.max(...utilizations);
    const worst = Math.min(...utilizations);

    // Calculate trend (compare last 30% vs first 30%)
    const sortedByDate = [...plans].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const recentCount = Math.max(1, Math.floor(sortedByDate.length * 0.3));
    const recent = sortedByDate.slice(-recentCount);
    const older = sortedByDate.slice(0, recentCount);

    const recentAvg =
      recent.reduce((sum, p) => sum + p.utilization.overall, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, p) => sum + p.utilization.overall, 0) / older.length;

    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (recentAvg > olderAvg + 2) trend = "increasing";
    else if (recentAvg < olderAvg - 2) trend = "decreasing";

    // Distribution buckets
    const distribution = [
      { range: "0-50%", count: utilizations.filter((u) => u < 50).length },
      {
        range: "50-70%",
        count: utilizations.filter((u) => u >= 50 && u < 70).length,
      },
      {
        range: "70-85%",
        count: utilizations.filter((u) => u >= 70 && u < 85).length,
      },
      {
        range: "85-95%",
        count: utilizations.filter((u) => u >= 85 && u < 95).length,
      },
      { range: "95-100%", count: utilizations.filter((u) => u >= 95).length },
    ];

    return { average, trend, best, worst, distribution };
  }

  /**
   * Calculate cost metrics
   */
  private calculateCostMetrics(plans: LoadPlan[]) {
    if (plans.length === 0) {
      return {
        total: 0,
        average: 0,
        trend: "stable" as const,
        breakdown: {
          freight: 0,
          fuel: 0,
          labor: 0,
          handling: 0,
          customs: 0,
          insurance: 0,
          other: 0,
        },
        savings: {
          potential: 0,
          achieved: 0,
          percentage: 0,
        },
      };
    }

    const costs = plans.map((p) => p.cost.total);
    const total = costs.reduce((a, b) => a + b, 0);
    const average = total / costs.length;

    // Calculate trend
    const sortedByDate = [...plans].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const recentCount = Math.max(1, Math.floor(sortedByDate.length * 0.3));
    const recent = sortedByDate.slice(-recentCount);
    const older = sortedByDate.slice(0, recentCount);

    const recentAvg =
      recent.reduce((sum, p) => sum + p.cost.total, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, p) => sum + p.cost.total, 0) / older.length;

    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (recentAvg > olderAvg * 1.05) trend = "increasing";
    else if (recentAvg < olderAvg * 0.95) trend = "decreasing";

    // Cost breakdown
    const breakdown = {
      freight: plans.reduce((sum, p) => sum + (p.cost.freight || 0), 0),
      fuel: plans.reduce((sum, p) => sum + (p.cost.fuel || 0), 0),
      labor: plans.reduce((sum, p) => sum + (p.cost.labor || 0), 0),
      handling: plans.reduce((sum, p) => sum + (p.cost.handling || 0), 0),
      customs: plans.reduce((sum, p) => sum + (p.cost.customs || 0), 0),
      insurance: plans.reduce((sum, p) => sum + (p.cost.insurance || 0), 0),
      other: plans.reduce((sum, p) => sum + (p.cost.other || 0), 0),
    };

    // Calculate savings (compare optimized vs non-optimized)
    const optimized = plans.filter(
      (p) => p.optimization?.score && p.optimization.score > 80,
    );
    const nonOptimized = plans.filter(
      (p) => !p.optimization || p.optimization.score <= 80,
    );

    const optimizedAvg =
      optimized.length > 0
        ? optimized.reduce((sum, p) => sum + p.cost.total, 0) / optimized.length
        : average;
    const nonOptimizedAvg =
      nonOptimized.length > 0
        ? nonOptimized.reduce((sum, p) => sum + p.cost.total, 0) /
          nonOptimized.length
        : average;

    const potentialSavings =
      nonOptimized.length * (nonOptimizedAvg - optimizedAvg);
    const achievedSavings = optimized.length * (nonOptimizedAvg - optimizedAvg);
    const savingsPercentage =
      nonOptimizedAvg > 0
        ? ((nonOptimizedAvg - optimizedAvg) / nonOptimizedAvg) * 100
        : 0;

    return {
      total,
      average,
      trend,
      breakdown,
      savings: {
        potential: potentialSavings,
        achieved: achievedSavings,
        percentage: savingsPercentage,
      },
    };
  }

  /**
   * Calculate compliance metrics
   */
  private calculateComplianceMetrics(plans: LoadPlan[]) {
    if (plans.length === 0) {
      return {
        score: 100,
        trend: "stable" as const,
        violations: { total: 0, critical: 0, warnings: 0 },
        byCategory: {
          weight: 0,
          dimensions: 0,
          hazmat: 0,
          temperature: 0,
          customs: 0,
          route: 0,
        },
      };
    }

    const complianceScores = plans.map((p) => p.compliance?.score || 100);
    const score =
      complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length;

    // Calculate trend
    const sortedByDate = [...plans].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const recentCount = Math.max(1, Math.floor(sortedByDate.length * 0.3));
    const recent = sortedByDate.slice(-recentCount);
    const older = sortedByDate.slice(0, recentCount);

    const recentAvg =
      recent.reduce((sum, p) => sum + (p.compliance?.score || 100), 0) /
      recent.length;
    const olderAvg =
      older.reduce((sum, p) => sum + (p.compliance?.score || 100), 0) /
      older.length;

    let trend: "improving" | "declining" | "stable" = "stable";
    if (recentAvg > olderAvg + 2) trend = "improving";
    else if (recentAvg < olderAvg - 2) trend = "declining";

    // Count violations
    let totalViolations = 0;
    let criticalViolations = 0;
    let warnings = 0;
    const byCategory = {
      weight: 0,
      dimensions: 0,
      hazmat: 0,
      temperature: 0,
      customs: 0,
      route: 0,
    };

    plans.forEach((plan) => {
      if (plan.compliance?.errors) {
        plan.compliance.errors.forEach((error) => {
          totalViolations++;
          if (error.severity === "CRITICAL") criticalViolations++;
          if (error.category) {
            const cat = error.category.toLowerCase() as keyof typeof byCategory;
            if (cat in byCategory) byCategory[cat]++;
          }
        });
      }
      if (plan.compliance?.warnings) {
        warnings += plan.compliance.warnings.length;
      }
    });

    return {
      score,
      trend,
      violations: {
        total: totalViolations,
        critical: criticalViolations,
        warnings,
      },
      byCategory,
    };
  }

  /**
   * Calculate carrier performance
   */
  private calculateCarrierPerformance(plans: LoadPlan[]) {
    const carrierMap = new Map<
      string,
      {
        name: string;
        shipments: number;
        totalCost: number;
        totalUtilization: number;
        totalCompliance: number;
        onTimeCount: number;
        totalShipments: number;
      }
    >();

    plans.forEach((plan) => {
      if (!plan.carrier) return;

      const existing = carrierMap.get(plan.carrier.id) || {
        name: plan.carrier.name,
        shipments: 0,
        totalCost: 0,
        totalUtilization: 0,
        totalCompliance: 0,
        onTimeCount: 0,
        totalShipments: 0,
      };

      existing.shipments++;
      existing.totalCost += plan.cost.total;
      existing.totalUtilization += plan.utilization.overall;
      existing.totalCompliance += plan.compliance?.score || 100;
      existing.totalShipments++;

      // Check on-time delivery (simplified - would need actual delivery data)
      if (plan.status === "DELIVERED" || plan.status === "IN_TRANSIT") {
        existing.onTimeCount++;
      }

      carrierMap.set(plan.carrier.id, existing);
    });

    return Array.from(carrierMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        shipments: data.shipments,
        onTimeRate:
          data.totalShipments > 0
            ? (data.onTimeCount / data.totalShipments) * 100
            : 0,
        averageCost: data.shipments > 0 ? data.totalCost / data.shipments : 0,
        utilization:
          data.shipments > 0 ? data.totalUtilization / data.shipments : 0,
        complianceScore:
          data.shipments > 0 ? data.totalCompliance / data.shipments : 100,
        rating:
          data.shipments > 0
            ? (data.totalUtilization / data.shipments) * 0.3 +
              (data.totalCompliance / data.shipments) * 0.3 +
              (data.onTimeCount / data.totalShipments) * 100 * 0.4
            : 0,
      }))
      .sort((a, b) => b.rating - a.rating);
  }

  /**
   * Calculate route optimization metrics
   */
  private calculateRouteMetrics(plans: LoadPlan[]) {
    const routes = plans.filter((p) => p.route);
    const optimized = routes.filter(
      (p) => p.optimization?.score && p.optimization.score > 80,
    );

    const distances = routes.map((p) => p.route?.distance || 0);
    const times = routes.map((p) => p.route?.estimatedTime || 0);

    const averageDistance =
      distances.length > 0
        ? distances.reduce((a, b) => a + b, 0) / distances.length
        : 0;
    const averageTime =
      times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    // Calculate savings (simplified - would need baseline comparison)
    const optimizedDistances = optimized.map((p) => p.route?.distance || 0);
    const optimizedTimes = optimized.map((p) => p.route?.estimatedTime || 0);

    const avgOptimizedDistance =
      optimizedDistances.length > 0
        ? optimizedDistances.reduce((a, b) => a + b, 0) /
          optimizedDistances.length
        : averageDistance;
    const avgOptimizedTime =
      optimizedTimes.length > 0
        ? optimizedTimes.reduce((a, b) => a + b, 0) / optimizedTimes.length
        : averageTime;

    const distanceSavings = averageDistance - avgOptimizedDistance;
    const timeSavings = averageTime - avgOptimizedTime;
    const costSavings = distanceSavings * 0.5 + timeSavings * 0.3; // Simplified calculation

    return {
      total: routes.length,
      optimized: optimized.length,
      averageDistance,
      averageTime,
      savings: {
        distance: distanceSavings,
        time: timeSavings,
        cost: costSavings,
      },
    };
  }

  /**
   * Calculate time-based trends
   */
  private calculateTrends(plans: LoadPlan[]) {
    // Group by date
    const dailyMap = new Map<
      string,
      { utilization: number[]; cost: number[]; compliance: number[] }
    >();
    const weeklyMap = new Map<
      string,
      { utilization: number[]; cost: number[]; compliance: number[] }
    >();
    const monthlyMap = new Map<
      string,
      { utilization: number[]; cost: number[]; compliance: number[] }
    >();

    plans.forEach((plan) => {
      const date = new Date(plan.createdAt);
      const dayKey = date.toISOString().split("T")[0];
      const weekKey = this.getWeekKey(date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      // Daily
      const daily = dailyMap.get(dayKey) || {
        utilization: [],
        cost: [],
        compliance: [],
      };
      daily.utilization.push(plan.utilization.overall);
      daily.cost.push(plan.cost.total);
      daily.compliance.push(plan.compliance?.score || 100);
      dailyMap.set(dayKey, daily);

      // Weekly
      const weekly = weeklyMap.get(weekKey) || {
        utilization: [],
        cost: [],
        compliance: [],
      };
      weekly.utilization.push(plan.utilization.overall);
      weekly.cost.push(plan.cost.total);
      weekly.compliance.push(plan.compliance?.score || 100);
      weeklyMap.set(weekKey, weekly);

      // Monthly
      const monthly = monthlyMap.get(monthKey) || {
        utilization: [],
        cost: [],
        compliance: [],
      };
      monthly.utilization.push(plan.utilization.overall);
      monthly.cost.push(plan.cost.total);
      monthly.compliance.push(plan.compliance?.score || 100);
      monthlyMap.set(monthKey, monthly);
    });

    const average = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      daily: Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => ({
          date,
          utilization: average(data.utilization),
          cost: average(data.cost),
          compliance: average(data.compliance),
        })),
      weekly: Array.from(weeklyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([week, data]) => ({
          week,
          utilization: average(data.utilization),
          cost: average(data.cost),
          compliance: average(data.compliance),
        })),
      monthly: Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          month,
          utilization: average(data.utilization),
          cost: average(data.cost),
          compliance: average(data.compliance),
        })),
    };
  }

  /**
   * Get week key (YYYY-WW format)
   */
  private getWeekKey(date: Date): string {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  /**
   * Generate predictions based on trends
   */
  private async generatePredictions(
    plans: LoadPlan[],
    trends: LoadAnalytics["trends"],
  ): Promise<LoadAnalytics["predictions"]> {
    // Simple linear regression for predictions
    const recent = trends.weekly.slice(-4);
    if (recent.length < 2) {
      return {
        nextWeekUtilization: 0,
        nextWeekCost: 0,
        nextWeekCompliance: 100,
        recommendations: [],
      };
    }

    // Calculate trend
    const utilizationTrend = this.calculateLinearTrend(
      recent.map((r) => r.utilization),
    );
    const costTrend = this.calculateLinearTrend(recent.map((r) => r.cost));
    const complianceTrend = this.calculateLinearTrend(
      recent.map((r) => r.compliance),
    );

    const nextWeekUtilization =
      utilizationTrend.slope > 0
        ? Math.min(
            100,
            recent[recent.length - 1].utilization + utilizationTrend.slope,
          )
        : Math.max(
            0,
            recent[recent.length - 1].utilization + utilizationTrend.slope,
          );

    const nextWeekCost = Math.max(
      0,
      recent[recent.length - 1].cost + costTrend.slope,
    );
    const nextWeekCompliance =
      complianceTrend.slope > 0
        ? Math.min(
            100,
            recent[recent.length - 1].compliance + complianceTrend.slope,
          )
        : Math.max(
            0,
            recent[recent.length - 1].compliance + complianceTrend.slope,
          );

    // Generate recommendations
    const recommendations: string[] = [];
    if (nextWeekUtilization < 80) {
      recommendations.push(
        "Consider load consolidation to improve utilization",
      );
    }
    if (costTrend.slope > 0) {
      recommendations.push(
        "Review carrier rates and consider alternative routes",
      );
    }
    if (nextWeekCompliance < 95) {
      recommendations.push(
        "Focus on compliance training and validation processes",
      );
    }
    if (utilizationTrend.slope < 0) {
      recommendations.push(
        "Optimize load planning to reverse utilization decline",
      );
    }

    return {
      nextWeekUtilization,
      nextWeekCost,
      nextWeekCompliance,
      recommendations,
    };
  }

  /**
   * Calculate linear trend (slope)
   */
  private calculateLinearTrend(values: number[]): {
    slope: number;
    intercept: number;
  } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }
}

export const loadAnalyticsService = new LoadAnalyticsService();
