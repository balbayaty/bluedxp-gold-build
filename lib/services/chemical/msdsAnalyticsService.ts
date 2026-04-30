/**
 * MSDS Analytics Service
 * Comprehensive analytics and insights for MSDS data
 * Provides trends, distributions, predictions, and intelligent recommendations
 */

import { getMSDSDatabaseAdapter } from "./msdsDatabaseAdapter";

export interface MSDSAnalytics {
  overview: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    approvalRate: number;
  };
  hazardDistribution: {
    High: number;
    Medium: number;
    Low: number;
  };
  manufacturerDistribution: Array<{
    manufacturer: string;
    count: number;
    percentage: number;
  }>;
  statusTrend: Array<{
    date: string;
    approved: number;
    pending: number;
    rejected: number;
  }>;
  hazardTrend: Array<{
    date: string;
    High: number;
    Medium: number;
    Low: number;
  }>;
  topChemicals: Array<{
    productName: string;
    casNumber: string;
    count: number;
    hazardLevel: string;
  }>;
  complianceMetrics: {
    ghsCompliant: number;
    nonGhsCompliant: number;
    complianceRate: number;
  };
  transportationMetrics: {
    airCompatible: number;
    seaCompatible: number;
    roadCompatible: number;
    railCompatible: number;
  };
  aiConfidenceDistribution: {
    high: number; // >80%
    medium: number; // 50-80%
    low: number; // <50%
  };
  predictions: {
    expectedApprovalsNextWeek: number;
    riskLevel: "low" | "medium" | "high";
    recommendations: string[];
  };
}

class MSDSAnalyticsService {
  /**
   * Get comprehensive analytics for MSDS data
   */
  async getAnalytics(
    tenantId: string,
    dateRange?: { from: string; to: string },
  ): Promise<MSDSAnalytics> {
    const dbAdapter = getMSDSDatabaseAdapter();
    let allMSDS: any[] = [];

    // Get all MSDS from database
    if (dbAdapter.isDatabaseAvailable()) {
      allMSDS = await dbAdapter.getAllMSDS(tenantId);
    }

    // Filter by date range if provided
    if (dateRange) {
      allMSDS = allMSDS.filter((entry) => {
        const createdAt = new Date(entry.metadata?.createdAt || 0);
        const from = new Date(dateRange.from);
        const to = new Date(dateRange.to);
        return createdAt >= from && createdAt <= to;
      });
    }

    // Calculate overview
    const total = allMSDS.length;
    const approved = allMSDS.filter(
      (e) => e.msds?.status === "approved",
    ).length;
    const pending = allMSDS.filter((e) => e.msds?.status === "pending").length;
    const rejected = allMSDS.filter(
      (e) => e.msds?.status === "rejected",
    ).length;
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;

    // Hazard distribution
    const hazardDistribution = {
      High: allMSDS.filter((e) => e.extractedData?.hazardLevel === "High")
        .length,
      Medium: allMSDS.filter((e) => e.extractedData?.hazardLevel === "Medium")
        .length,
      Low: allMSDS.filter((e) => e.extractedData?.hazardLevel === "Low").length,
    };

    // Manufacturer distribution
    const manufacturerCounts = new Map<string, number>();
    allMSDS.forEach((entry) => {
      const manufacturer =
        entry.extractedData?.manufacturer ||
        entry.extractedData?.supplier ||
        "Unknown";
      manufacturerCounts.set(
        manufacturer,
        (manufacturerCounts.get(manufacturer) || 0) + 1,
      );
    });
    const manufacturerDistribution = Array.from(manufacturerCounts.entries())
      .map(([manufacturer, count]) => ({
        manufacturer,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Status trend (last 30 days)
    const statusTrend = this.calculateStatusTrend(allMSDS, 30);

    // Hazard trend (last 30 days)
    const hazardTrend = this.calculateHazardTrend(allMSDS, 30);

    // Top chemicals (most frequently uploaded)
    const chemicalCounts = new Map<
      string,
      { count: number; hazardLevel: string; casNumber: string }
    >();
    allMSDS.forEach((entry) => {
      const productName = entry.extractedData?.productName || "Unknown";
      const casNumber = entry.extractedData?.casNumber || "";
      const hazardLevel = entry.extractedData?.hazardLevel || "Medium";
      const existing = chemicalCounts.get(productName);
      if (existing) {
        existing.count++;
      } else {
        chemicalCounts.set(productName, { count: 1, hazardLevel, casNumber });
      }
    });
    const topChemicals = Array.from(chemicalCounts.entries())
      .map(([productName, data]) => ({
        productName,
        casNumber: data.casNumber,
        count: data.count,
        hazardLevel: data.hazardLevel,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Compliance metrics
    const ghsCompliant = allMSDS.filter(
      (e) => e.extractedData?.ghsCompliant !== false,
    ).length;
    const nonGhsCompliant = total - ghsCompliant;
    const complianceRate = total > 0 ? (ghsCompliant / total) * 100 : 0;

    // Transportation metrics
    const transportationMetrics = {
      airCompatible: allMSDS.filter(
        (e) => e.transportationData?.multimodalCompatible?.air !== false,
      ).length,
      seaCompatible: allMSDS.filter(
        (e) => e.transportationData?.multimodalCompatible?.sea !== false,
      ).length,
      roadCompatible: allMSDS.filter(
        (e) => e.transportationData?.multimodalCompatible?.road !== false,
      ).length,
      railCompatible: allMSDS.filter(
        (e) => e.transportationData?.multimodalCompatible?.rail !== false,
      ).length,
    };

    // AI confidence distribution
    const aiConfidenceDistribution = {
      high: allMSDS.filter((e) => {
        const confidence = e.extractedData?.aiConfidence || 0;
        return confidence > 80;
      }).length,
      medium: allMSDS.filter((e) => {
        const confidence = e.extractedData?.aiConfidence || 0;
        return confidence >= 50 && confidence <= 80;
      }).length,
      low: allMSDS.filter((e) => {
        const confidence = e.extractedData?.aiConfidence || 0;
        return confidence < 50;
      }).length,
    };

    // Predictions (simple heuristics - could be enhanced with ML)
    const pendingRate = total > 0 ? pending / total : 0;
    const expectedApprovalsNextWeek = Math.round(pending * 0.7); // Assume 70% approval rate
    const riskLevel: "low" | "medium" | "high" =
      hazardDistribution.High / total > 0.3
        ? "high"
        : hazardDistribution.High / total > 0.15
          ? "medium"
          : "low";

    const recommendations: string[] = [];
    if (pending > total * 0.2) {
      recommendations.push(
        `High number of pending MSDS (${pending}). Consider reviewing and processing them.`,
      );
    }
    if (hazardDistribution.High > total * 0.3) {
      recommendations.push(
        `High percentage of high-hazard chemicals (${((hazardDistribution.High / total) * 100).toFixed(1)}%). Ensure proper safety protocols.`,
      );
    }
    if (complianceRate < 80) {
      recommendations.push(
        `GHS compliance rate is ${complianceRate.toFixed(1)}%. Consider reviewing non-compliant MSDS.`,
      );
    }
    if (aiConfidenceDistribution.low > total * 0.2) {
      recommendations.push(
        `Many MSDS have low AI confidence (${aiConfidenceDistribution.low}). Consider manual review.`,
      );
    }

    return {
      overview: {
        total,
        approved,
        pending,
        rejected,
        approvalRate,
      },
      hazardDistribution,
      manufacturerDistribution,
      statusTrend,
      hazardTrend,
      topChemicals,
      complianceMetrics: {
        ghsCompliant,
        nonGhsCompliant,
        complianceRate,
      },
      transportationMetrics,
      aiConfidenceDistribution,
      predictions: {
        expectedApprovalsNextWeek,
        riskLevel,
        recommendations,
      },
    };
  }

  /**
   * Calculate status trend over time
   */
  private calculateStatusTrend(
    allMSDS: any[],
    days: number,
  ): MSDSAnalytics["statusTrend"] {
    const trend: MSDSAnalytics["statusTrend"] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayMSDS = allMSDS.filter((entry) => {
        const createdAt = new Date(entry.metadata?.createdAt || 0);
        return createdAt.toISOString().split("T")[0] === dateStr;
      });

      trend.push({
        date: dateStr,
        approved: dayMSDS.filter((e) => e.msds?.status === "approved").length,
        pending: dayMSDS.filter((e) => e.msds?.status === "pending").length,
        rejected: dayMSDS.filter((e) => e.msds?.status === "rejected").length,
      });
    }

    return trend;
  }

  /**
   * Calculate hazard trend over time
   */
  private calculateHazardTrend(
    allMSDS: any[],
    days: number,
  ): MSDSAnalytics["hazardTrend"] {
    const trend: MSDSAnalytics["hazardTrend"] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayMSDS = allMSDS.filter((entry) => {
        const createdAt = new Date(entry.metadata?.createdAt || 0);
        return createdAt.toISOString().split("T")[0] === dateStr;
      });

      trend.push({
        date: dateStr,
        High: dayMSDS.filter((e) => e.extractedData?.hazardLevel === "High")
          .length,
        Medium: dayMSDS.filter((e) => e.extractedData?.hazardLevel === "Medium")
          .length,
        Low: dayMSDS.filter((e) => e.extractedData?.hazardLevel === "Low")
          .length,
      });
    }

    return trend;
  }
}

export const msdsAnalyticsService = new MSDSAnalyticsService();
