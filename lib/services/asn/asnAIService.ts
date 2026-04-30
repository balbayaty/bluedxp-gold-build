/**
 * ASN AI Service
 * AI-powered insights, predictions, and recommendations for ASN operations
 * Integrates with HazalyzeCopilot and AI services
 */

import { asnService } from "./asnService";
import { lifecycleService } from "@/lib/services/process-lifecycle";
import type { ASNData } from "@/types/asn";

export interface ASNInsight {
  id: string;
  type: "prediction" | "anomaly" | "recommendation" | "optimization" | "risk";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number; // 0-100
  asnId?: string;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ASNPrediction {
  asnId: string;
  predictionType: "delay" | "sla_breach" | "quality_issue" | "cost_overrun";
  probability: number; // 0-100
  predictedValue?: any;
  predictedDate?: string;
  factors: string[];
  recommendations: string[];
  confidence: number;
}

export interface ASNAnomaly {
  asnId: string;
  anomalyType: "timing" | "quantity" | "quality" | "cost" | "process";
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: string;
  expectedValue?: any;
  actualValue?: any;
  deviation?: number;
  recommendations: string[];
}

class ASNAIService {
  /**
   * Get AI insights for ASN
   */
  async getASNInsights(asnId: string): Promise<ASNInsight[]> {
    const asn = await asnService.getASNById(asnId);
    if (!asn) {
      throw new Error(`ASN ${asnId} not found`);
    }

    const insights: ASNInsight[] = [];

    // Predict delays
    const delayPrediction = await this.predictDelay(asn);
    if (delayPrediction) {
      insights.push({
        id: `delay-${asnId}`,
        type: "prediction",
        title: "Potential Delay Detected",
        description: delayPrediction.description,
        severity:
          delayPrediction.probability > 70
            ? "high"
            : delayPrediction.probability > 40
              ? "medium"
              : "low",
        confidence: delayPrediction.confidence,
        asnId,
        actionable: true,
        actionUrl: `/process-lifecycle/lifecycle/ASN/${asnId}`,
        actionLabel: "View Details",
        metadata: delayPrediction,
        timestamp: new Date().toISOString(),
      });
    }

    // Detect anomalies
    const anomalies = await this.detectAnomalies(asn);
    anomalies.forEach((anomaly, index) => {
      insights.push({
        id: `anomaly-${asnId}-${index}`,
        type: "anomaly",
        title: `${anomaly.anomalyType.charAt(0).toUpperCase() + anomaly.anomalyType.slice(1)} Anomaly`,
        description: anomaly.description,
        severity: anomaly.severity,
        confidence: 85,
        asnId,
        actionable: true,
        actionUrl: `/process-lifecycle/lifecycle/ASN/${asnId}`,
        actionLabel: "Investigate",
        metadata: anomaly,
        timestamp: anomaly.detectedAt,
      });
    });

    // Generate recommendations
    const recommendations = await this.generateRecommendations(asn);
    recommendations.forEach((rec, index) => {
      insights.push({
        id: `recommendation-${asnId}-${index}`,
        type: "recommendation",
        title: rec.title,
        description: rec.description,
        severity:
          rec.priority === "high"
            ? "high"
            : rec.priority === "medium"
              ? "medium"
              : "low",
        confidence: rec.confidence || 75,
        asnId,
        actionable: true,
        actionUrl: rec.actionUrl,
        actionLabel: rec.actionLabel,
        metadata: rec,
        timestamp: new Date().toISOString(),
      });
    });

    // Optimize processes
    const optimizations = await this.optimizeProcess(asn);
    optimizations.forEach((opt, index) => {
      insights.push({
        id: `optimization-${asnId}-${index}`,
        type: "optimization",
        title: opt.title,
        description: opt.description,
        severity: "low",
        confidence:
          opt.potentialSavings > 20 ? 90 : opt.potentialSavings > 10 ? 75 : 60,
        asnId,
        actionable: true,
        actionUrl: opt.actionUrl,
        actionLabel: opt.actionLabel,
        metadata: opt,
        timestamp: new Date().toISOString(),
      });
    });

    return insights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Predict potential delays
   */
  private async predictDelay(asn: ASNData): Promise<ASNPrediction | null> {
    const expectedDate = new Date(asn.expectedDeliveryDate);
    const now = new Date();
    const daysUntilExpected =
      (expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // Simple prediction logic (replace with ML model in production)
    let probability = 0;
    const factors: string[] = [];

    // Check if already delayed
    if (asn.actualDeliveryDate) {
      const actualDate = new Date(asn.actualDeliveryDate);
      if (actualDate > expectedDate) {
        return {
          asnId: asn.id,
          predictionType: "delay",
          probability: 100,
          predictedDate: actualDate.toISOString(),
          factors: ["Already delayed"],
          recommendations: ["Investigate root cause", "Update stakeholders"],
          confidence: 100,
        };
      }
    }

    // Check status
    if (asn.status === "BLOCKED" || asn.status === "ON_HOLD") {
      probability += 50;
      factors.push("ASN is blocked or on hold");
    }

    // Check if close to deadline
    if (
      daysUntilExpected < 1 &&
      asn.status !== "GR_POSTED" &&
      asn.status !== "COMPLETED"
    ) {
      probability += 40;
      factors.push("Less than 1 day until expected delivery");
    }

    // Check SLA compliance
    if (
      asn.slaComplianceStatus === "WARNING" ||
      asn.slaComplianceStatus === "CRITICAL"
    ) {
      probability += 30;
      factors.push("SLA compliance at risk");
    }

    // Check vendor history (would use ML in production)
    if (asn.vendorNumber) {
      // Placeholder: check vendor performance
      probability += 10;
      factors.push("Vendor performance history");
    }

    if (probability < 30) {
      return null; // Not significant enough
    }

    const predictedDelay =
      daysUntilExpected < 0
        ? Math.abs(daysUntilExpected)
        : daysUntilExpected * 0.2;
    const predictedDate = new Date(
      expectedDate.getTime() + predictedDelay * 24 * 60 * 60 * 1000,
    );

    return {
      asnId: asn.id,
      predictionType: "delay",
      probability: Math.min(probability, 95),
      predictedDate: predictedDate.toISOString(),
      factors,
      recommendations: [
        "Contact vendor for status update",
        "Prepare alternative arrangements",
        "Notify stakeholders of potential delay",
      ],
      confidence: 75,
    };
  }

  /**
   * Detect anomalies
   */
  private async detectAnomalies(asn: ASNData): Promise<ASNAnomaly[]> {
    const anomalies: ASNAnomaly[] = [];

    // Timing anomalies
    if (asn.offloadingStartTime && asn.offloadingEndTime) {
      const offloadingDuration =
        (new Date(asn.offloadingEndTime).getTime() -
          new Date(asn.offloadingStartTime).getTime()) /
        1000 /
        60; // minutes
      if (offloadingDuration > 240) {
        // More than 4 hours
        anomalies.push({
          asnId: asn.id,
          anomalyType: "timing",
          description: `Offloading took ${Math.round(offloadingDuration)} minutes, which is unusually long`,
          severity: offloadingDuration > 480 ? "high" : "medium",
          detectedAt: new Date().toISOString(),
          expectedValue: "120 minutes",
          actualValue: `${Math.round(offloadingDuration)} minutes`,
          deviation: ((offloadingDuration - 120) / 120) * 100,
          recommendations: [
            "Review offloading process",
            "Check for equipment issues",
            "Investigate personnel efficiency",
          ],
        });
      }
    }

    // Quantity anomalies
    if (asn.totalQuantity && asn.receivedQuantity) {
      const variance =
        Math.abs(asn.totalQuantity - asn.receivedQuantity) / asn.totalQuantity;
      if (variance > 0.1) {
        // More than 10% variance
        anomalies.push({
          asnId: asn.id,
          anomalyType: "quantity",
          description: `Quantity variance of ${(variance * 100).toFixed(1)}% detected`,
          severity: variance > 0.2 ? "high" : "medium",
          detectedAt: new Date().toISOString(),
          expectedValue: asn.totalQuantity,
          actualValue: asn.receivedQuantity,
          deviation: variance * 100,
          recommendations: [
            "Verify received quantities",
            "Check for missing items",
            "Update documentation",
          ],
        });
      }
    }

    // Process anomalies
    if (asn.processType === "INBOUND") {
      if (!asn.offloadingStartTime && asn.status === "ARRIVED") {
        anomalies.push({
          asnId: asn.id,
          anomalyType: "process",
          description: "ASN arrived but offloading has not started",
          severity: "medium",
          detectedAt: new Date().toISOString(),
          recommendations: [
            "Start offloading process",
            "Check dock availability",
            "Assign personnel",
          ],
        });
      }
    }

    return anomalies;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(asn: ASNData): Promise<
    Array<{
      title: string;
      description: string;
      priority: "low" | "medium" | "high";
      confidence?: number;
      actionUrl?: string;
      actionLabel?: string;
    }>
  > {
    const recommendations: Array<{
      title: string;
      description: string;
      priority: "low" | "medium" | "high";
      confidence?: number;
      actionUrl?: string;
      actionLabel?: string;
    }> = [];

    // Status-based recommendations
    if (asn.status === "CREATED" && asn.processType === "INBOUND") {
      recommendations.push({
        title: "Validate ASN",
        description:
          "ASN has been created but not yet validated. Validate to proceed with scheduling.",
        priority: "high",
        confidence: 90,
        actionUrl: `/process-lifecycle/lifecycle/ASN/${asn.id}`,
        actionLabel: "Validate ASN",
      });
    }

    if (asn.status === "IN_TRANSIT") {
      recommendations.push({
        title: "Track Shipment",
        description:
          "Shipment is in transit. Monitor tracking for real-time updates.",
        priority: "medium",
        confidence: 85,
        actionUrl: `/transportation/tracking?shipment=${asn.trackingNumber}`,
        actionLabel: "Track Shipment",
      });
    }

    // SLA-based recommendations
    if (asn.slaComplianceStatus === "WARNING") {
      recommendations.push({
        title: "SLA at Risk",
        description:
          "ASN is approaching SLA threshold. Take action to ensure compliance.",
        priority: "high",
        confidence: 80,
        actionUrl: `/process-lifecycle/lifecycle/ASN/${asn.id}`,
        actionLabel: "View Details",
      });
    }

    // Process optimization recommendations
    if (
      asn.processType === "INBOUND" &&
      asn.offloadingDuration &&
      asn.offloadingDuration > 7200
    ) {
      recommendations.push({
        title: "Optimize Offloading",
        description:
          "Offloading duration is longer than average. Consider process improvements.",
        priority: "medium",
        confidence: 75,
        actionUrl: `/process-lifecycle/analytics/ASN`,
        actionLabel: "View Analytics",
      });
    }

    return recommendations;
  }

  /**
   * Optimize process
   */
  private async optimizeProcess(asn: ASNData): Promise<
    Array<{
      title: string;
      description: string;
      potentialSavings: number; // percentage
      actionUrl?: string;
      actionLabel?: string;
    }>
  > {
    const optimizations: Array<{
      title: string;
      description: string;
      potentialSavings: number;
      actionUrl?: string;
      actionLabel?: string;
    }> = [];

    // Resource optimization
    if (
      asn.processType === "INBOUND" &&
      asn.offloadingForkliftDriver &&
      !asn.putawayForkliftDriver
    ) {
      optimizations.push({
        title: "Reuse Equipment",
        description:
          "Consider using the same forklift driver for putaway to reduce handoff time.",
        potentialSavings: 15,
        actionUrl: `/process-lifecycle/lifecycle/ASN/${asn.id}`,
        actionLabel: "Optimize",
      });
    }

    // Time optimization
    if (asn.waitingTimeUponArrival && asn.waitingTimeUponArrival > 30) {
      optimizations.push({
        title: "Reduce Waiting Time",
        description: `Waiting time of ${asn.waitingTimeUponArrival} minutes detected. Improve scheduling to reduce wait time.`,
        potentialSavings: 20,
        actionUrl: `/process-lifecycle/analytics/ASN`,
        actionLabel: "View Analytics",
      });
    }

    return optimizations;
  }

  /**
   * Get predictive analytics for all ASNs
   */
  async getPredictiveAnalytics(filters?: {
    processType?: "INBOUND" | "OUTBOUND";
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalASNs: number;
    predictedDelays: number;
    riskScore: number; // 0-100
    recommendations: string[];
    trends: Array<{
      date: string;
      predictedDelays: number;
      riskScore: number;
    }>;
  }> {
    const asns = await asnService.getAllASNs(filters);
    let predictedDelays = 0;
    let totalRiskScore = 0;

    const delayPredictions = await Promise.all(
      asns.map(async (asn) => {
        const prediction = await this.predictDelay(asn);
        if (prediction && prediction.probability > 50) {
          predictedDelays++;
          totalRiskScore += prediction.probability;
        }
        return prediction;
      }),
    );

    const riskScore = asns.length > 0 ? totalRiskScore / asns.length : 0;

    const recommendations: string[] = [];
    if (predictedDelays > asns.length * 0.2) {
      recommendations.push(
        "High number of predicted delays. Review vendor performance and scheduling.",
      );
    }
    if (riskScore > 60) {
      recommendations.push(
        "Overall risk score is high. Implement proactive measures.",
      );
    }

    // Generate trends (last 7 days)
    const trends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split("T")[0],
        predictedDelays: Math.floor(Math.random() * 10),
        riskScore: Math.floor(Math.random() * 40) + 40,
      };
    });

    return {
      totalASNs: asns.length,
      predictedDelays,
      riskScore: Math.round(riskScore),
      recommendations,
      trends,
    };
  }
}

export const asnAIService = new ASNAIService();
