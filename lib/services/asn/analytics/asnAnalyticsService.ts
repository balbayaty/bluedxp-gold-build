/**
 * ASN Analytics Service
 * Provides analytics and insights for ASN operations
 */

import { PrismaClient } from "@prisma/client";
import type {
  ASNAnalytics,
  SupplierIntelligence,
  ExecutiveDashboardData,
  OperationalDashboardData,
  AnalyticalDashboardData,
  DashboardAlert,
  DashboardInsight,
} from "@/types/asn";

export class AsnAnalyticsService {
  constructor(private db: PrismaClient) {}

  /**
   * Get comprehensive ASN analytics
   */
  async getAnalytics(
    periodStart: Date,
    periodEnd: Date,
    tenantId: string,
    warehouseId?: string,
    supplierId?: string,
  ): Promise<ASNAnalytics> {
    const where: any = {
      tenantId,
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Get all ASNs in period
    const asns = await this.db.aSN.findMany({
      where,
      include: {
        items: true,
        exceptions: true,
        trackingEvents: true,
      },
    });

    // Calculate metrics
    const totalAsns = asns.length;
    const totalItems = asns.reduce((sum, asn) => sum + asn.items.length, 0);
    const totalValue = asns.reduce((sum, asn) => sum + asn.totalValue, 0);

    // Calculate on-time arrival rate
    const asnsWithArrival = asns.filter(
      (asn) => asn.actualArrivalDate && asn.expectedArrivalDate,
    );
    const onTimeCount = asnsWithArrival.filter((asn) => {
      const expected = new Date(asn.expectedArrivalDate!);
      const actual = new Date(asn.actualArrivalDate!);
      const diff = Math.abs(actual.getTime() - expected.getTime());
      return diff <= 24 * 60 * 60 * 1000; // Within 24 hours
    }).length;
    const onTimeArrivalRate =
      asnsWithArrival.length > 0 ? onTimeCount / asnsWithArrival.length : 0;

    // Calculate average processing time
    const completedAsns = asns.filter(
      (asn) =>
        asn.status === "completed" && asn.receivedAt && asn.actualArrivalDate,
    );
    const processingTimes = completedAsns.map((asn) => {
      const arrival = new Date(asn.actualArrivalDate!);
      const received = new Date(asn.receivedAt!);
      return (received.getTime() - arrival.getTime()) / (1000 * 60 * 60); // hours
    });
    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    // Calculate exception rate
    const exceptionCount = asns.filter(
      (asn) => asn.exceptions.length > 0,
    ).length;
    const exceptionRate = totalAsns > 0 ? exceptionCount / totalAsns : 0;

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const status of [
      "pending",
      "in_transit",
      "arrived",
      "receiving",
      "received",
      "exception",
      "cancelled",
      "completed",
    ]) {
      statusBreakdown[status] = asns.filter(
        (asn) => asn.status === status,
      ).length;
    }

    // Exception breakdown
    const exceptionBreakdown: Record<string, number> = {};
    for (const asn of asns) {
      for (const exception of asn.exceptions) {
        exceptionBreakdown[exception.type] =
          (exceptionBreakdown[exception.type] || 0) + 1;
      }
    }

    // Get top suppliers
    const supplierMap = new Map<string, any>();
    for (const asn of asns) {
      if (!supplierMap.has(asn.supplierId)) {
        supplierMap.set(asn.supplierId, {
          supplierId: asn.supplierId,
          supplierName: asn.supplierName || "",
          asns: [],
        });
      }
      supplierMap.get(asn.supplierId).asns.push(asn);
    }

    const topSuppliers = Array.from(supplierMap.values())
      .map((supplier) =>
        this.calculateSupplierIntelligence(
          supplier.asns,
          supplier.supplierId,
          supplier.supplierName,
        ),
      )
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10);

    // Daily volume
    const dailyVolumeMap = new Map<string, number>();
    for (const asn of asns) {
      const date = asn.createdAt.toISOString().split("T")[0];
      dailyVolumeMap.set(date, (dailyVolumeMap.get(date) || 0) + 1);
    }
    const dailyVolume = Array.from(dailyVolumeMap.entries())
      .map(([date, count]) => ({ date: new Date(date), count }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Exception trend
    const exceptionTrendMap = new Map<string, number>();
    for (const asn of asns) {
      if (asn.exceptions.length > 0) {
        const date = asn.createdAt.toISOString().split("T")[0];
        exceptionTrendMap.set(
          date,
          (exceptionTrendMap.get(date) || 0) + asn.exceptions.length,
        );
      }
    }
    const exceptionTrend = Array.from(exceptionTrendMap.entries())
      .map(([date, count]) => ({ date: new Date(date), count }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Cost metrics
    const totalCost = asns.reduce((sum, asn) => {
      const processingCost = asn.totalValue * 0.02; // 2% processing cost
      const exceptionCost = asn.exceptions.reduce((excSum, exc) => {
        return excSum + (exc.estimatedCost || 0);
      }, 0);
      return sum + processingCost + exceptionCost;
    }, 0);

    const averageCostPerAsn = totalAsns > 0 ? totalCost / totalAsns : 0;

    const costByExceptionType: Record<string, number> = {};
    for (const asn of asns) {
      for (const exception of asn.exceptions) {
        costByExceptionType[exception.type] =
          (costByExceptionType[exception.type] || 0) +
          (exception.estimatedCost || 0);
      }
    }

    return {
      periodStart,
      periodEnd,
      totalAsns,
      totalItems,
      totalValue,
      onTimeArrivalRate,
      averageProcessingTime,
      exceptionRate,
      statusBreakdown: statusBreakdown as any,
      exceptionBreakdown: exceptionBreakdown as any,
      topSuppliers,
      dailyVolume,
      exceptionTrend,
      totalCost,
      averageCostPerAsn,
      costByExceptionType: costByExceptionType as any,
    };
  }

  /**
   * Get executive dashboard data
   */
  async getExecutiveDashboard(
    tenantId: string,
    days: number = 30,
  ): Promise<ExecutiveDashboardData> {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);

    const analytics = await this.getAnalytics(periodStart, periodEnd, tenantId);

    // Get recent exceptions
    const recentExceptions = await this.db.aSNException.findMany({
      where: {
        tenantId,
        detectedAt: { gte: periodStart },
      },
      include: {
        asn: {
          select: {
            id: true,
            asnNumber: true,
            supplierName: true,
          },
        },
      },
      orderBy: {
        detectedAt: "desc",
      },
      take: 10,
    });

    // Generate alerts
    const alerts = await this.generateAlerts(tenantId, periodStart, periodEnd);

    return {
      summary: {
        totalAsns: analytics.totalAsns,
        pendingAsns: analytics.statusBreakdown.pending || 0,
        inTransitAsns: analytics.statusBreakdown.in_transit || 0,
        exceptionAsns: analytics.statusBreakdown.exception || 0,
        totalValue: analytics.totalValue,
      },
      trends: {
        asnVolume: analytics.dailyVolume,
        exceptionRate: analytics.exceptionTrend.map((item) => ({
          date: item.date,
          rate: analytics.totalAsns > 0 ? item.count / analytics.totalAsns : 0,
        })),
        onTimeRate: analytics.dailyVolume.map((item) => ({
          date: item.date,
          rate: 0.85, // Simplified - would calculate from actual data
        })),
      },
      topSuppliers: analytics.topSuppliers,
      recentExceptions: recentExceptions.map((exc) => ({
        id: exc.id,
        asnId: exc.asnId,
        itemId: exc.itemId,
        type: exc.type as any,
        severity: exc.severity as any,
        description: exc.description,
        detectedAt: exc.detectedAt,
        detectedBy: exc.detectedBy,
        resolvedAt: exc.resolvedAt,
        resolvedBy: exc.resolvedBy,
        resolution: exc.resolution,
        aiSuggestedResolution: exc.aiSuggestedResolution,
        rootCause: exc.rootCause,
        status: exc.status as any,
        metadata: exc.metadata || {},
      })),
      alerts,
    };
  }

  /**
   * Get operational dashboard data
   */
  async getOperationalDashboard(
    tenantId: string,
  ): Promise<OperationalDashboardData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get queue
    const pending = await this.db.aSN.findMany({
      where: {
        tenantId,
        status: "pending",
      },
      orderBy: {
        expectedArrivalDate: "asc",
      },
      take: 20,
    });

    const inProgress = await this.db.aSN.findMany({
      where: {
        tenantId,
        status: { in: ["receiving", "in_transit"] },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    const exceptions = await this.db.aSN.findMany({
      where: {
        tenantId,
        status: "exception",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    // Get today's ASNs
    const expected = await this.db.aSN.findMany({
      where: {
        tenantId,
        expectedArrivalDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const arrived = await this.db.aSN.findMany({
      where: {
        tenantId,
        actualArrivalDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const completed = await this.db.aSN.findMany({
      where: {
        tenantId,
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Generate alerts
    const alerts = await this.generateAlerts(tenantId, today, tomorrow);

    return {
      queue: {
        pending: pending.map((asn) => this.mapToASN(asn)),
        inProgress: inProgress.map((asn) => this.mapToASN(asn)),
        exceptions: exceptions.map((asn) => this.mapToASN(asn)),
      },
      today: {
        expected: expected.map((asn) => this.mapToASN(asn)),
        arrived: arrived.map((asn) => this.mapToASN(asn)),
        completed: completed.map((asn) => this.mapToASN(asn)),
      },
      resources: {
        receivingBays: [], // Would integrate with WMS
        staff: [], // Would integrate with HR
      },
      alerts,
    };
  }

  /**
   * Get analytical dashboard data
   */
  async getAnalyticalDashboard(
    tenantId: string,
    days: number = 30,
  ): Promise<AnalyticalDashboardData> {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);

    const analytics = await this.getAnalytics(periodStart, periodEnd, tenantId);

    // Get predictions (would integrate with predictive service)
    const predictions = {
      arrivalPredictions: [],
      exceptionPredictions: [],
    };

    // Generate insights
    const insights = await this.generateInsights(analytics, tenantId);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      analytics,
      insights,
    );

    return {
      analytics,
      predictions,
      insights,
      recommendations,
    };
  }

  /**
   * Calculate supplier intelligence
   */
  private calculateSupplierIntelligence(
    asns: any[],
    supplierId: string,
    supplierName: string,
  ): SupplierIntelligence {
    const totalAsns = asns.length;

    // Calculate on-time delivery rate
    const asnsWithArrival = asns.filter(
      (asn) => asn.actualArrivalDate && asn.expectedArrivalDate,
    );
    const onTimeCount = asnsWithArrival.filter((asn) => {
      const expected = new Date(asn.expectedArrivalDate!);
      const actual = new Date(asn.actualArrivalDate!);
      const diff = Math.abs(actual.getTime() - expected.getTime());
      return diff <= 24 * 60 * 60 * 1000;
    }).length;
    const onTimeDeliveryRate =
      asnsWithArrival.length > 0 ? onTimeCount / asnsWithArrival.length : 0.8;

    // Calculate average delivery time
    const deliveryTimes = asnsWithArrival.map((asn) => {
      const expected = new Date(asn.expectedArrivalDate!);
      const actual = new Date(asn.actualArrivalDate!);
      return (actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24); // days
    });
    const averageDeliveryTime =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

    // Calculate quality score
    const qualityScores = asns
      .filter((asn) => asn.qualityScore !== null)
      .map((asn) => asn.qualityScore);
    const qualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 85;

    // Calculate exception rate
    const exceptionCount = asns.filter(
      (asn) => asn.exceptions.length > 0,
    ).length;
    const exceptionRate = totalAsns > 0 ? exceptionCount / totalAsns : 0;

    // Calculate scores
    const reliabilityScore = onTimeDeliveryRate * 100;
    const qualityScoreValue = qualityScore;
    const complianceScore = (1 - exceptionRate) * 100;

    const overallScore =
      reliabilityScore * 0.4 + qualityScoreValue * 0.4 + complianceScore * 0.2;

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low";
    if (overallScore < 60) {
      riskLevel = "high";
    } else if (overallScore < 80) {
      riskLevel = "medium";
    }

    // Determine performance trend
    const recentAsns = asns.slice(-10);
    const olderAsns = asns.slice(0, -10);
    const recentScore =
      recentAsns.length > 0
        ? recentAsns.reduce((sum, asn) => sum + (asn.qualityScore || 85), 0) /
          recentAsns.length
        : 85;
    const olderScore =
      olderAsns.length > 0
        ? olderAsns.reduce((sum, asn) => sum + (asn.qualityScore || 85), 0) /
          olderAsns.length
        : 85;

    let performanceTrend: "improving" | "stable" | "declining" = "stable";
    if (recentScore > olderScore + 5) {
      performanceTrend = "improving";
    } else if (recentScore < olderScore - 5) {
      performanceTrend = "declining";
    }

    return {
      supplierId,
      supplierName,
      onTimeDeliveryRate,
      averageDeliveryTime,
      qualityScore: qualityScoreValue,
      exceptionRate,
      performanceTrend,
      recentExceptions: exceptionCount,
      overallScore,
      reliabilityScore,
      qualityScore: qualityScoreValue,
      complianceScore,
      riskLevel,
      totalAsns,
      lastAsnDate:
        asns.length > 0 ? asns[asns.length - 1].createdAt : undefined,
      updatedAt: new Date(),
    };
  }

  /**
   * Generate alerts
   */
  private async generateAlerts(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];

    // Check for overdue ASNs
    const overdueCount = await this.db.aSN.count({
      where: {
        tenantId,
        expectedArrivalDate: { lt: new Date() },
        status: { in: ["pending", "in_transit"] },
      },
    });

    if (overdueCount > 0) {
      alerts.push({
        id: "overdue-asns",
        type: "warning",
        title: `${overdueCount} Overdue ASN${overdueCount > 1 ? "s" : ""}`,
        message: `${overdueCount} ASN(s) are past their expected arrival date`,
        timestamp: new Date(),
        actionUrl: "/asn?status=overdue",
      });
    }

    // Check for high exception rate
    const totalAsns = await this.db.aSN.count({
      where: {
        tenantId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const exceptionAsns = await this.db.aSN.count({
      where: {
        tenantId,
        createdAt: { gte: periodStart, lte: periodEnd },
        status: "exception",
      },
    });

    const exceptionRate = totalAsns > 0 ? exceptionAsns / totalAsns : 0;

    if (exceptionRate > 0.2) {
      alerts.push({
        id: "high-exception-rate",
        type: "error",
        title: "High Exception Rate",
        message: `${(exceptionRate * 100).toFixed(1)}% of ASNs have exceptions`,
        timestamp: new Date(),
        actionUrl: "/asn/analytics",
      });
    }

    return alerts;
  }

  /**
   * Generate insights
   */
  private async generateInsights(
    analytics: ASNAnalytics,
    tenantId: string,
  ): Promise<DashboardInsight[]> {
    const insights: DashboardInsight[] = [];

    // Exception trend insight
    if (analytics.exceptionTrend.length >= 2) {
      const recent = analytics.exceptionTrend.slice(-7);
      const older = analytics.exceptionTrend.slice(0, -7);
      const recentAvg =
        recent.reduce((sum, item) => sum + item.count, 0) / recent.length;
      const olderAvg =
        older.length > 0
          ? older.reduce((sum, item) => sum + item.count, 0) / older.length
          : recentAvg;

      if (recentAvg > olderAvg * 1.2) {
        insights.push({
          id: "exception-trend-increasing",
          type: "risk",
          title: "Exception Rate Increasing",
          description: `Exception rate has increased by ${((recentAvg / olderAvg - 1) * 100).toFixed(1)}% in the last 7 days`,
          impact: "high",
          confidence: 0.8,
          timestamp: new Date(),
        });
      }
    }

    // Supplier performance insight
    if (analytics.topSuppliers.length > 0) {
      const lowPerformers = analytics.topSuppliers.filter(
        (s) => s.overallScore < 70,
      );
      if (lowPerformers.length > 0) {
        insights.push({
          id: "low-performing-suppliers",
          type: "risk",
          title: "Low Performing Suppliers",
          description: `${lowPerformers.length} supplier(s) have overall scores below 70`,
          impact: "medium",
          confidence: 0.9,
          recommendations: [
            "Review supplier contracts",
            "Implement quality improvement plans",
          ],
          timestamp: new Date(),
        });
      }
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    analytics: ASNAnalytics,
    insights: DashboardInsight[],
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (analytics.onTimeArrivalRate < 0.8) {
      recommendations.push(
        "Improve supplier communication to reduce late arrivals",
      );
    }

    if (analytics.exceptionRate > 0.15) {
      recommendations.push("Implement stricter quality checks at receiving");
    }

    if (analytics.averageProcessingTime > 4) {
      recommendations.push(
        "Optimize receiving processes to reduce processing time",
      );
    }

    return recommendations;
  }

  /**
   * Map database model to ASN
   */
  private mapToASN(dbAsn: any): any {
    return {
      id: dbAsn.id,
      asnNumber: dbAsn.asnNumber,
      supplierId: dbAsn.supplierId,
      supplierName: dbAsn.supplierName || "",
      warehouseId: dbAsn.warehouseId,
      expectedArrivalDate: dbAsn.expectedArrivalDate,
      actualArrivalDate: dbAsn.actualArrivalDate,
      status: dbAsn.status,
      priority: dbAsn.priority,
      totalItems: dbAsn.totalItems,
      totalQuantity: dbAsn.totalQuantity,
      totalValue: dbAsn.totalValue,
      currency: dbAsn.currency || "SAR",
    };
  }
}

// Export singleton
let asnAnalyticsServiceInstance: AsnAnalyticsService | null = null;

export function getAsnAnalyticsService(): AsnAnalyticsService {
  if (!asnAnalyticsServiceInstance) {
    const { PrismaClient } = require("@prisma/client");
    asnAnalyticsServiceInstance = new AsnAnalyticsService(new PrismaClient());
  }
  return asnAnalyticsServiceInstance;
}
