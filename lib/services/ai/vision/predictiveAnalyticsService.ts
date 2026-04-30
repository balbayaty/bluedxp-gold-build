/**
 * Predictive Analytics Service for AI Vision
 * Mind-blowing predictive insights, trend forecasting, and proactive issue prevention
 * Uses historical data, patterns, and ML to predict future issues
 */

import { visionDatabaseService } from "./visionDatabaseService";
import { eventBus } from "@/lib/services/event-store";
import { logger } from "@/lib/services/observability/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface PredictiveInsight {
  id: string;
  type: "trend" | "anomaly" | "risk" | "opportunity" | "maintenance";
  title: string;
  description: string;
  confidence: number;
  timeframe: "24h" | "7d" | "30d" | "90d";
  predictedValue?: number;
  currentValue?: number;
  trend: "increasing" | "decreasing" | "stable" | "volatile";
  severity: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface TrendForecast {
  metric: string;
  currentValue: number;
  forecastedValues: Array<{
    date: string;
    value: number;
    confidence: number;
  }>;
  trend: "increasing" | "decreasing" | "stable";
  changeRate: number; // percentage change per period
  confidence: number;
}

export interface RiskPrediction {
  riskType: string;
  probability: number; // 0-1
  impact: "low" | "medium" | "high" | "critical";
  timeframe: string;
  factors: string[];
  mitigation: string[];
  confidence: number;
}

// ============================================================================
// PREDICTIVE ANALYTICS SERVICE
// ============================================================================

class PredictiveAnalyticsService {
  /**
   * Generate predictive insights from historical data
   */
  async generateInsights(
    tenantId?: string,
    timeframe: "7d" | "30d" | "90d" = "30d",
  ): Promise<PredictiveInsight[]> {
    try {
      // Get historical data
      const analyses = await visionDatabaseService.listAnalyses({
        tenantId,
        limit: 1000,
      });

      if (analyses.length < 10) {
        return []; // Need minimum data for predictions
      }

      const insights: PredictiveInsight[] = [];

      // 1. Trend Analysis
      const trendInsights = this.analyzeTrends(analyses, timeframe);
      insights.push(...trendInsights);

      // 2. Anomaly Detection
      const anomalyInsights = this.detectAnomalies(analyses, timeframe);
      insights.push(...anomalyInsights);

      // 3. Risk Prediction
      const riskInsights = this.predictRisks(analyses, timeframe);
      insights.push(...riskInsights);

      // 4. Maintenance Predictions
      const maintenanceInsights = this.predictMaintenance(analyses, timeframe);
      insights.push(...maintenanceInsights);

      // 5. Opportunity Detection
      const opportunityInsights = this.detectOpportunities(analyses, timeframe);
      insights.push(...opportunityInsights);

      // Sort by severity and confidence
      insights.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff =
          severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      });

      // Emit event
      await eventBus.publish({
        type: "ai.vision.predictive.insights.generated",
        aggregateId: `insights-${Date.now()}`,
        aggregateType: "PredictiveInsights",
        payload: {
          tenantId,
          timeframe,
          count: insights.length,
          criticalCount: insights.filter((i) => i.severity === "critical")
            .length,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      return insights;
    } catch (error) {
      logger.error(
        "Predictive analytics error",
        error instanceof Error ? error : new Error(String(error)),
        {
          module: "ai-vision",
          service: "predictive-analytics",
        },
      );
      return [];
    }
  }

  /**
   * Forecast trends for specific metrics
   */
  async forecastTrends(
    metric: string,
    tenantId?: string,
    periods: number = 7,
  ): Promise<TrendForecast> {
    try {
      const analyses = await visionDatabaseService.listAnalyses({
        tenantId,
        limit: 1000,
      });

      // Calculate historical values
      const historicalValues = this.calculateHistoricalValues(analyses, metric);

      if (historicalValues.length < 3) {
        throw new Error("Insufficient data for forecasting");
      }

      // Simple linear regression for trend
      const trend = this.calculateTrend(historicalValues);

      // Forecast future values
      const forecastedValues = [];
      const lastValue = historicalValues[historicalValues.length - 1];
      const changeRate = trend.slope;

      for (let i = 1; i <= periods; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        // Simple linear projection (can be enhanced with ARIMA, LSTM, etc.)
        const forecastedValue = lastValue.value + changeRate * i;
        const confidence = Math.max(50, 100 - i * 5); // Confidence decreases over time

        forecastedValues.push({
          date: date.toISOString().split("T")[0],
          value: Math.max(0, forecastedValue), // Ensure non-negative
          confidence,
        });
      }

      return {
        metric,
        currentValue: lastValue.value,
        forecastedValues,
        trend:
          changeRate > 0
            ? "increasing"
            : changeRate < 0
              ? "decreasing"
              : "stable",
        changeRate: Math.abs(changeRate) * 100,
        confidence: 75, // Base confidence
      };
    } catch (error) {
      logger.error(
        "Trend forecasting error",
        error instanceof Error ? error : new Error(String(error)),
        {
          module: "ai-vision",
          service: "predictive-analytics",
        },
      );
      throw error;
    }
  }

  /**
   * Predict risks based on patterns
   */
  async predictRisks(
    tenantId?: string,
    timeframe: "7d" | "30d" | "90d" = "30d",
  ): Promise<RiskPrediction[]> {
    try {
      const analyses = await visionDatabaseService.listAnalyses({
        tenantId,
        limit: 1000,
      });

      const risks: RiskPrediction[] = [];

      // Analyze patterns
      const criticalIssuesRate = this.calculateCriticalIssuesRate(analyses);
      const complianceTrend = this.calculateComplianceTrend(analyses);
      const damageFrequency = this.calculateDamageFrequency(analyses);

      // Risk 1: Increasing Critical Issues
      if (
        criticalIssuesRate.trend === "increasing" &&
        criticalIssuesRate.current > 0.1
      ) {
        risks.push({
          riskType: "Critical Issues Escalation",
          probability: Math.min(0.9, criticalIssuesRate.current * 2),
          impact: "critical",
          timeframe: "7-14 days",
          factors: [
            `Current critical issue rate: ${(criticalIssuesRate.current * 100).toFixed(1)}%`,
            `Trend: ${criticalIssuesRate.trend}`,
            `Historical average: ${(criticalIssuesRate.average * 100).toFixed(1)}%`,
          ],
          mitigation: [
            "Increase quality checks",
            "Review root causes of recent critical issues",
            "Implement preventive measures",
            "Schedule maintenance review",
          ],
          confidence: 80,
        });
      }

      // Risk 2: Compliance Degradation
      if (
        complianceTrend.trend === "decreasing" &&
        complianceTrend.current < 0.85
      ) {
        risks.push({
          riskType: "Compliance Violation Risk",
          probability: Math.min(0.8, (1 - complianceTrend.current) * 1.5),
          impact: "high",
          timeframe: "14-30 days",
          factors: [
            `Current compliance score: ${(complianceTrend.current * 100).toFixed(1)}%`,
            `Trend: ${complianceTrend.trend}`,
            `Target: 95%`,
          ],
          mitigation: [
            "Review compliance violations",
            "Implement corrective actions",
            "Increase compliance monitoring",
            "Schedule compliance audit",
          ],
          confidence: 75,
        });
      }

      // Risk 3: Damage Frequency Increase
      if (
        damageFrequency.trend === "increasing" &&
        damageFrequency.current > damageFrequency.average * 1.2
      ) {
        risks.push({
          riskType: "Damage Frequency Increase",
          probability: Math.min(
            0.7,
            (damageFrequency.current / damageFrequency.average) * 0.5,
          ),
          impact: "high",
          timeframe: "7-21 days",
          factors: [
            `Current damage rate: ${damageFrequency.current.toFixed(2)} per day`,
            `Historical average: ${damageFrequency.average.toFixed(2)} per day`,
            `Increase: ${((damageFrequency.current / damageFrequency.average - 1) * 100).toFixed(1)}%`,
          ],
          mitigation: [
            "Review handling procedures",
            "Check equipment condition",
            "Review carrier performance",
            "Implement damage prevention measures",
          ],
          confidence: 70,
        });
      }

      return risks;
    } catch (error) {
      logger.error(
        "Risk prediction error",
        error instanceof Error ? error : new Error(String(error)),
        {
          module: "ai-vision",
          service: "predictive-analytics",
        },
      );
      return [];
    }
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  private analyzeTrends(
    analyses: any[],
    timeframe: string,
  ): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    // Calculate compliance trend
    const complianceScores = analyses
      .filter(
        (a) => a.complianceScore !== null && a.complianceScore !== undefined,
      )
      .map((a) => a.complianceScore)
      .slice(-30); // Last 30 analyses

    if (complianceScores.length >= 7) {
      const current = complianceScores.slice(-7).reduce((a, b) => a + b, 0) / 7;
      const previous =
        complianceScores.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
      const trend =
        current > previous
          ? "increasing"
          : current < previous
            ? "decreasing"
            : "stable";

      if (trend === "decreasing" && current < 85) {
        insights.push({
          id: `trend-compliance-${Date.now()}`,
          type: "trend",
          title: "Compliance Score Declining",
          description: `Compliance score has decreased from ${previous.toFixed(1)}% to ${current.toFixed(1)}% over the last week.`,
          confidence: 85,
          timeframe: "7d" as any,
          currentValue: current,
          predictedValue: current - 5, // Projected decline
          trend: "decreasing",
          severity:
            current < 70 ? "critical" : current < 80 ? "high" : "medium",
          recommendations: [
            "Review recent compliance violations",
            "Identify root causes",
            "Implement corrective actions",
            "Increase monitoring frequency",
          ],
          metadata: { metric: "compliance", previous, current },
          createdAt: new Date(),
        });
      }
    }

    return insights;
  }

  private detectAnomalies(
    analyses: any[],
    timeframe: string,
  ): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    // Detect sudden spike in issues
    const recentIssues = analyses
      .slice(-7)
      .reduce((sum, a) => sum + (a.totalIssues || 0), 0);
    const averageIssues =
      analyses
        .slice(-30, -7)
        .reduce((sum, a) => sum + (a.totalIssues || 0), 0) / 23;

    if (recentIssues > averageIssues * 1.5 && recentIssues > 10) {
      insights.push({
        id: `anomaly-issues-${Date.now()}`,
        type: "anomaly",
        title: "Unusual Spike in Issues Detected",
        description: `Issue count has increased by ${((recentIssues / averageIssues - 1) * 100).toFixed(1)}% compared to historical average.`,
        confidence: 80,
        timeframe: "7d" as any,
        currentValue: recentIssues,
        predictedValue: recentIssues * 1.2,
        trend: "increasing",
        severity: recentIssues > averageIssues * 2 ? "critical" : "high",
        recommendations: [
          "Investigate root cause immediately",
          "Review recent changes in operations",
          "Check for systemic issues",
          "Implement emergency measures if needed",
        ],
        metadata: { recentIssues, averageIssues },
        createdAt: new Date(),
      });
    }

    return insights;
  }

  private predictRisks(
    analyses: any[],
    timeframe: string,
  ): PredictiveInsight[] {
    // This is handled by the main predictRisks method
    return [];
  }

  private predictMaintenance(
    analyses: any[],
    timeframe: string,
  ): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    // Predict maintenance needs based on equipment-related issues
    const equipmentIssues = analyses.filter((a) =>
      a.analysis?.qualityIssues?.some((q: any) =>
        q.type?.toLowerCase().includes("equipment"),
      ),
    ).length;

    if (equipmentIssues > 5) {
      insights.push({
        id: `maintenance-equipment-${Date.now()}`,
        type: "maintenance",
        title: "Equipment Maintenance Recommended",
        description: `${equipmentIssues} equipment-related issues detected in recent analyses. Preventive maintenance may be needed.`,
        confidence: 70,
        timeframe: "30d" as any,
        currentValue: equipmentIssues,
        trend: "stable",
        severity: equipmentIssues > 10 ? "high" : "medium",
        recommendations: [
          "Schedule equipment inspection",
          "Review equipment maintenance logs",
          "Check for recurring issues",
          "Plan preventive maintenance",
        ],
        metadata: { equipmentIssues },
        createdAt: new Date(),
      });
    }

    return insights;
  }

  private detectOpportunities(
    analyses: any[],
    timeframe: string,
  ): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    // Detect improvement opportunities
    const highComplianceRate =
      analyses.filter((a) => (a.complianceScore || 0) >= 95).length /
      analyses.length;

    if (highComplianceRate > 0.8) {
      insights.push({
        id: `opportunity-excellence-${Date.now()}`,
        type: "opportunity",
        title: "Excellence Opportunity",
        description: `High compliance rate (${(highComplianceRate * 100).toFixed(1)}%) indicates opportunity to optimize processes further.`,
        confidence: 75,
        timeframe: "30d" as any,
        currentValue: highComplianceRate * 100,
        trend: "stable",
        severity: "low",
        recommendations: [
          "Identify best practices",
          "Document successful patterns",
          "Share learnings across teams",
          "Optimize for efficiency",
        ],
        metadata: { complianceRate: highComplianceRate },
        createdAt: new Date(),
      });
    }

    return insights;
  }

  private calculateHistoricalValues(
    analyses: any[],
    metric: string,
  ): Array<{ date: string; value: number }> {
    // Group by date and calculate metric value
    const dailyValues = new Map<string, number[]>();

    analyses.forEach((analysis) => {
      const date = new Date(analysis.createdAt).toISOString().split("T")[0];
      let value = 0;

      switch (metric) {
        case "compliance":
          value = analysis.complianceScore || 0;
          break;
        case "issues":
          value = analysis.totalIssues || 0;
          break;
        case "critical_issues":
          value = analysis.criticalIssues || 0;
          break;
        default:
          value = 0;
      }

      if (!dailyValues.has(date)) {
        dailyValues.set(date, []);
      }
      dailyValues.get(date)!.push(value);
    });

    // Calculate average per day
    const result: Array<{ date: string; value: number }> = [];
    dailyValues.forEach((values, date) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      result.push({ date, value: avg });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateTrend(values: Array<{ date: string; value: number }>): {
    slope: number;
    intercept: number;
  } {
    // Simple linear regression
    const n = values.length;
    const x = values.map((_, i) => i);
    const y = values.map((v) => v.value);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private calculateCriticalIssuesRate(analyses: any[]): {
    current: number;
    average: number;
    trend: "increasing" | "decreasing" | "stable";
  } {
    const recent = analyses.slice(-7);
    const historical = analyses.slice(-30, -7);

    const recentRate =
      recent.reduce((sum, a) => sum + (a.criticalIssues || 0), 0) /
      recent.length;
    const historicalRate =
      historical.reduce((sum, a) => sum + (a.criticalIssues || 0), 0) /
      historical.length;

    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (recentRate > historicalRate * 1.1) trend = "increasing";
    else if (recentRate < historicalRate * 0.9) trend = "decreasing";

    return {
      current: recentRate,
      average: historicalRate,
      trend,
    };
  }

  private calculateComplianceTrend(analyses: any[]): {
    current: number;
    average: number;
    trend: "increasing" | "decreasing" | "stable";
  } {
    const recent = analyses
      .slice(-7)
      .filter(
        (a) => a.complianceScore !== null && a.complianceScore !== undefined,
      )
      .map((a) => a.complianceScore / 100);
    const historical = analyses
      .slice(-30, -7)
      .filter(
        (a) => a.complianceScore !== null && a.complianceScore !== undefined,
      )
      .map((a) => a.complianceScore / 100);

    if (recent.length === 0 || historical.length === 0) {
      return { current: 0.9, average: 0.9, trend: "stable" };
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const historicalAvg =
      historical.reduce((a, b) => a + b, 0) / historical.length;

    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (recentAvg > historicalAvg * 1.05) trend = "increasing";
    else if (recentAvg < historicalAvg * 0.95) trend = "decreasing";

    return {
      current: recentAvg,
      average: historicalAvg,
      trend,
    };
  }

  private calculateDamageFrequency(analyses: any[]): {
    current: number;
    average: number;
    trend: "increasing" | "decreasing" | "stable";
  } {
    const recent = analyses.slice(-7);
    const historical = analyses.slice(-30, -7);

    const recentDamage = recent.filter((a) =>
      a.analysis?.qualityIssues?.some((q: any) =>
        q.type?.toLowerCase().includes("damage"),
      ),
    ).length;
    const historicalDamage = historical.filter((a) =>
      a.analysis?.qualityIssues?.some((q: any) =>
        q.type?.toLowerCase().includes("damage"),
      ),
    ).length;

    const recentRate = recentDamage / 7; // per day
    const historicalRate = historicalDamage / 23; // per day

    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (recentRate > historicalRate * 1.2) trend = "increasing";
    else if (recentRate < historicalRate * 0.8) trend = "decreasing";

    return {
      current: recentRate,
      average: historicalRate,
      trend,
    };
  }
}

// Export singleton
export const predictiveAnalyticsService = new PredictiveAnalyticsService();
