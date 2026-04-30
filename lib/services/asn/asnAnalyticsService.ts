/**
 * ASN Analytics Service
 * Comprehensive analytics for ASN operations
 * Provides metrics, trends, and performance insights
 */

import { asnService } from "./asnService";
import { lifecycleService } from "@/lib/services/process-lifecycle";
import type { ASNData } from "@/types/asn";

export interface ASNAnalytics {
  overview: {
    totalASNs: number;
    activeASNs: number;
    completedASNs: number;
    averageProcessingTime: number;
    slaComplianceRate: number;
  };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCompliance: Record<string, number>;
  trends: Array<{
    date: string;
    created: number;
    completed: number;
    averageTime: number;
  }>;
  bottlenecks: Array<{
    stage: string;
    averageDuration: number;
    bottleneckScore: number;
    recommendations: string[];
  }>;
  performance: {
    onTimeDeliveryRate: number;
    averageDelay: number;
    topPerformers: Array<{
      vendor: string;
      onTimeRate: number;
      averageTime: number;
    }>;
    bottomPerformers: Array<{
      vendor: string;
      onTimeRate: number;
      averageTime: number;
    }>;
  };
  slaMetrics: {
    compliant: number;
    warning: number;
    critical: number;
    notApplicable: number;
    averageCompliancePercentage: number;
  };
}

class ASNAnalyticsService {
  /**
   * Get comprehensive analytics
   */
  async getAnalytics(filters?: {
    processType?: "INBOUND" | "OUTBOUND";
    dateFrom?: Date;
    dateTo?: Date;
    vendorNumber?: string;
  }): Promise<ASNAnalytics> {
    const asns = await asnService.getAllASNs(filters);
    const statistics = await asnService.getASNStatistics(filters);

    // Calculate trends (last 30 days)
    const trends = this.calculateTrends(asns, filters);

    // Calculate bottlenecks
    const bottlenecks = await this.calculateBottlenecks(asns);

    // Calculate performance metrics
    const performance = this.calculatePerformance(asns);

    // Calculate SLA metrics
    const slaMetrics = this.calculateSLAMetrics(asns);

    return {
      overview: {
        totalASNs: statistics.total,
        activeASNs: asns.filter(
          (a) =>
            a.status !== "COMPLETED" &&
            a.status !== "GR_POSTED" &&
            a.status !== "CANCELLED",
        ).length,
        completedASNs: asns.filter(
          (a) => a.status === "COMPLETED" || a.status === "GR_POSTED",
        ).length,
        averageProcessingTime: statistics.averageProcessingTime,
        slaComplianceRate: statistics.slaComplianceRate,
      },
      byStatus: statistics.byStatus,
      byPriority: statistics.byPriority,
      byCompliance: statistics.byCompliance,
      trends,
      bottlenecks,
      performance,
      slaMetrics,
    };
  }

  /**
   * Calculate trends
   */
  private calculateTrends(
    asns: ASNData[],
    filters?: { dateFrom?: Date; dateTo?: Date },
  ): Array<{
    date: string;
    created: number;
    completed: number;
    averageTime: number;
  }> {
    const days = 30;
    const trends: Array<{
      date: string;
      created: number;
      completed: number;
      averageTime: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayASNs = asns.filter((asn) => {
        const created = new Date(asn.createdAt).toISOString().split("T")[0];
        return created === dateStr;
      });

      const completed = dayASNs.filter(
        (asn) => asn.status === "COMPLETED" || asn.status === "GR_POSTED",
      );

      let totalTime = 0;
      let completedCount = 0;

      completed.forEach((asn) => {
        if (asn.actualDeliveryDate) {
          const created = new Date(asn.createdAt);
          const completed = new Date(asn.actualDeliveryDate);
          totalTime +=
            (completed.getTime() - created.getTime()) / 1000 / 60 / 60; // hours
          completedCount++;
        }
      });

      trends.push({
        date: dateStr,
        created: dayASNs.length,
        completed: completed.length,
        averageTime: completedCount > 0 ? totalTime / completedCount : 0,
      });
    }

    return trends;
  }

  /**
   * Calculate bottlenecks
   */
  private async calculateBottlenecks(asns: ASNData[]): Promise<
    Array<{
      stage: string;
      averageDuration: number;
      bottleneckScore: number;
      recommendations: string[];
    }>
  > {
    const stageDurations: Record<string, number[]> = {};

    // Collect duration data for each stage
    asns.forEach((asn) => {
      if (asn.processType === "INBOUND") {
        // Offloading
        if (asn.offloadingStartTime && asn.offloadingEndTime) {
          const duration =
            (new Date(asn.offloadingEndTime).getTime() -
              new Date(asn.offloadingStartTime).getTime()) /
            1000 /
            60; // minutes
          if (!stageDurations["offloading"]) {
            stageDurations["offloading"] = [];
          }
          stageDurations["offloading"].push(duration);
        }

        // Putaway
        if (asn.putawayStartTime && asn.putawayEndTime) {
          const duration =
            (new Date(asn.putawayEndTime).getTime() -
              new Date(asn.putawayStartTime).getTime()) /
            1000 /
            60; // minutes
          if (!stageDurations["putaway"]) {
            stageDurations["putaway"] = [];
          }
          stageDurations["putaway"].push(duration);
        }
      } else if (asn.processType === "OUTBOUND") {
        // Picking
        if (asn.pickingStartTime && asn.pickingEndTime) {
          const duration =
            (new Date(asn.pickingEndTime).getTime() -
              new Date(asn.pickingStartTime).getTime()) /
            1000 /
            60; // minutes
          if (!stageDurations["picking"]) {
            stageDurations["picking"] = [];
          }
          stageDurations["picking"].push(duration);
        }

        // QC
        if (asn.qcStartTime && asn.qcEndTime) {
          const duration =
            (new Date(asn.qcEndTime).getTime() -
              new Date(asn.qcStartTime).getTime()) /
            1000 /
            60; // minutes
          if (!stageDurations["qc"]) {
            stageDurations["qc"] = [];
          }
          stageDurations["qc"].push(duration);
        }
      }
    });

    // Calculate bottlenecks
    const bottlenecks = Object.entries(stageDurations).map(
      ([stage, durations]) => {
        const averageDuration =
          durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const bottleneckScore = (averageDuration / maxDuration) * 100;

        const recommendations: string[] = [];
        if (averageDuration > 120) {
          recommendations.push(
            `Optimize ${stage} process - average time is ${Math.round(averageDuration)} minutes`,
          );
        }
        if (bottleneckScore > 80) {
          recommendations.push(
            `High variance in ${stage} duration - standardize process`,
          );
        }

        return {
          stage,
          averageDuration: Math.round(averageDuration),
          bottleneckScore: Math.round(bottleneckScore),
          recommendations,
        };
      },
    );

    return bottlenecks.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformance(asns: ASNData[]): {
    onTimeDeliveryRate: number;
    averageDelay: number;
    topPerformers: Array<{
      vendor: string;
      onTimeRate: number;
      averageTime: number;
    }>;
    bottomPerformers: Array<{
      vendor: string;
      onTimeRate: number;
      averageTime: number;
    }>;
  } {
    const vendorStats: Record<
      string,
      {
        total: number;
        onTime: number;
        totalTime: number;
        completed: number;
      }
    > = {};

    asns.forEach((asn) => {
      if (!asn.vendorNumber) return;

      if (!vendorStats[asn.vendorNumber]) {
        vendorStats[asn.vendorNumber] = {
          total: 0,
          onTime: 0,
          totalTime: 0,
          completed: 0,
        };
      }

      vendorStats[asn.vendorNumber].total++;

      if (asn.actualDeliveryDate && asn.expectedDeliveryDate) {
        const expected = new Date(asn.expectedDeliveryDate);
        const actual = new Date(asn.actualDeliveryDate);
        const created = new Date(asn.createdAt);

        if (actual <= expected) {
          vendorStats[asn.vendorNumber].onTime++;
        }

        const time = (actual.getTime() - created.getTime()) / 1000 / 60 / 60; // hours
        vendorStats[asn.vendorNumber].totalTime += time;
        vendorStats[asn.vendorNumber].completed++;
      }
    });

    // Calculate overall metrics
    let totalOnTime = 0;
    let totalCompleted = 0;
    let totalDelay = 0;
    let delayedCount = 0;

    asns.forEach((asn) => {
      if (asn.actualDeliveryDate && asn.expectedDeliveryDate) {
        totalCompleted++;
        const expected = new Date(asn.expectedDeliveryDate);
        const actual = new Date(asn.actualDeliveryDate);

        if (actual <= expected) {
          totalOnTime++;
        } else {
          const delay =
            (actual.getTime() - expected.getTime()) / 1000 / 60 / 60; // hours
          totalDelay += delay;
          delayedCount++;
        }
      }
    });

    // Calculate vendor performance
    const vendorPerformance = Object.entries(vendorStats)
      .filter(([_, stats]) => stats.completed > 0)
      .map(([vendor, stats]) => ({
        vendor,
        onTimeRate: (stats.onTime / stats.completed) * 100,
        averageTime: stats.totalTime / stats.completed,
      }))
      .sort((a, b) => b.onTimeRate - a.onTimeRate);

    return {
      onTimeDeliveryRate:
        totalCompleted > 0 ? (totalOnTime / totalCompleted) * 100 : 0,
      averageDelay: delayedCount > 0 ? totalDelay / delayedCount : 0,
      topPerformers: vendorPerformance.slice(0, 5),
      bottomPerformers: vendorPerformance.slice(-5).reverse(),
    };
  }

  /**
   * Calculate SLA metrics
   */
  private calculateSLAMetrics(asns: ASNData[]): {
    compliant: number;
    warning: number;
    critical: number;
    notApplicable: number;
    averageCompliancePercentage: number;
  } {
    const metrics = {
      compliant: 0,
      warning: 0,
      critical: 0,
      notApplicable: 0,
      totalCompliance: 0,
      count: 0,
    };

    asns.forEach((asn) => {
      if (asn.slaComplianceStatus) {
        switch (asn.slaComplianceStatus) {
          case "COMPLIANT":
            metrics.compliant++;
            break;
          case "WARNING":
            metrics.warning++;
            break;
          case "CRITICAL":
            metrics.critical++;
            break;
          case "NOT_APPLICABLE":
            metrics.notApplicable++;
            break;
        }

        if (asn.slaCompliancePercentage !== undefined) {
          metrics.totalCompliance += asn.slaCompliancePercentage;
          metrics.count++;
        }
      }
    });

    return {
      compliant: metrics.compliant,
      warning: metrics.warning,
      critical: metrics.critical,
      notApplicable: metrics.notApplicable,
      averageCompliancePercentage:
        metrics.count > 0 ? metrics.totalCompliance / metrics.count : 0,
    };
  }
}

export const asnAnalyticsService = new ASNAnalyticsService();
