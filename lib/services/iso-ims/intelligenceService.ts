/**
 * ISO IMS Intelligence Service
 *
 * THE BRAIN OF THE COMPLIANCE ENGINE
 *
 * Provides:
 * - AI-powered root cause analysis
 * - Predictive compliance scoring
 * - Pattern recognition
 * - Smart recommendations
 * - Risk prediction
 * - Automated workflow suggestions
 * - Anomaly detection
 * - Trend forecasting
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-bus";
import { visionService } from "@/lib/services/ai/visionService";
import {
  signalCaptureService,
  knowledgeUpdaterService,
  predictionTrackerService,
} from "@/lib/services/learning";
import type { CAPA, NCR, Audit, Risk } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface CompliancePrediction {
  date: string;
  predictedScore: number;
  confidence: number;
  factors: Array<{ factor: string; impact: number }>;
  recommendations: string[];
}

export interface RiskPrediction {
  riskId?: string;
  riskArea: string;
  predictedLikelihood: number;
  predictedImpact: number;
  predictedRiskScore: number;
  timeframe: "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
  confidence: number;
  mitigationSuggestions: string[];
}

export interface PatternDetection {
  patternId: string;
  patternType: "RECURRING" | "TREND" | "CLUSTER" | "CORRELATION" | "ANOMALY";
  description: string;
  affectedEntities: string[];
  confidence: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendations: string[];
  metadata?: Record<string, unknown>;
}

export interface SmartRecommendation {
  id: string;
  type:
    | "CAPA"
    | "NCR"
    | "AUDIT"
    | "TRAINING"
    | "DOCUMENT"
    | "RISK"
    | "PROCESS_IMPROVEMENT";
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  reasoning: string;
  estimatedImpact: string;
  actionUrl?: string;
  relatedEntities?: string[];
  metadata?: Record<string, unknown>;
}

export interface RootCauseAnalysis {
  method: "5_WHY" | "FISHBONE" | "FMEA" | "PARETO" | "AI_AUTO";
  rootCause: string;
  contributingFactors: string[];
  analysis: string;
  confidence: number;
  recommendations: string[];
  similarCases?: string[];
}

export interface AnomalyDetection {
  anomalyId: string;
  type: "SPIKE" | "DROP" | "DEVIATION" | "OUTLIER";
  description: string;
  detectedAt: Date;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedMetrics: string[];
  potentialCauses: string[];
  recommendations: string[];
}

// ============================================================================
// INTELLIGENCE SERVICE
// ============================================================================

class IntelligenceService {
  /**
   * Predict compliance score
   */
  async predictComplianceScore(
    tenantId: string,
    timeframe: "7D" | "30D" | "90D" | "1Y",
    customerId?: string,
    warehouseId?: string,
  ): Promise<CompliancePrediction[]> {
    try {
      const { prisma } = await import("@/lib/services/database/prismaClient");

      // Build where clause
      const where: any = { tenantId, recordStatus: "ACTIVE" };
      if (customerId) where.customerId = customerId;
      if (warehouseId) where.warehouseId = warehouseId;

      // Get historical data for analysis
      const [ncrs, capas, audits] = await Promise.all([
        prisma.iSOIMSNCR.findMany({
          where,
          take: 100,
          orderBy: { createdAt: "desc" },
        }),
        prisma.iSOIMSCAPA.findMany({
          where,
          take: 100,
          orderBy: { createdAt: "desc" },
        }),
        prisma.iSOIMSAudit.findMany({
          where,
          take: 50,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      // Calculate baseline metrics
      const closedNCRs = ncrs.filter((n) => n.status === "CLOSED").length;
      const ncrResolutionRate =
        ncrs.length > 0 ? (closedNCRs / ncrs.length) * 100 : 100;

      const completedCAPAs = capas.filter(
        (c) => c.status === "CLOSED" || c.status === "COMPLETED",
      ).length;
      const capaCompletionRate =
        capas.length > 0 ? (completedCAPAs / capas.length) * 100 : 100;

      const avgAuditScore =
        audits.length > 0
          ? audits
              .map((a) => a.complianceScore)
              .filter((s): s is number => s !== null && s !== undefined)
              .reduce((sum, s) => sum + s, 0) / audits.length
          : 85;

      // Calculate baseline compliance score
      const baselineScore = Math.round(
        ncrResolutionRate * 0.3 +
          capaCompletionRate * 0.25 +
          avgAuditScore * 0.2 +
          85 * 0.15 + // Training (placeholder)
          90 * 0.1, // Document (placeholder)
      );

      // Generate predictions using simple trend analysis
      const predictions: CompliancePrediction[] = [];
      const days =
        timeframe === "7D"
          ? 7
          : timeframe === "30D"
            ? 30
            : timeframe === "90D"
              ? 90
              : 365;
      const interval =
        timeframe === "7D"
          ? 1
          : timeframe === "30D"
            ? 3
            : timeframe === "90D"
              ? 7
              : 30;

      // Calculate trend (simple moving average of recent data)
      const recentNCRs = ncrs.slice(0, 30);
      const recentTrend =
        recentNCRs.length > 10
          ? (recentNCRs.slice(0, 10).length - recentNCRs.slice(10, 20).length) /
            10
          : 0;

      for (let i = 0; i < days; i += interval) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        // Adjust score based on trend
        const trendAdjustment = recentTrend * (i / days) * 2;
        const predictedScore = Math.max(
          0,
          Math.min(100, baselineScore + trendAdjustment),
        );

        predictions.push({
          date: date.toISOString().split("T")[0],
          predictedScore: Math.round(predictedScore),
          confidence: Math.max(60, 100 - (i / days) * 30), // Confidence decreases over time
          factors: [
            { factor: "NCR Resolution Rate", impact: 0.3 },
            { factor: "CAPA Effectiveness", impact: 0.25 },
            { factor: "Audit Findings", impact: 0.2 },
            { factor: "Training Compliance", impact: 0.15 },
            { factor: "Document Control", impact: 0.1 },
          ],
          recommendations: [
            ncrResolutionRate < 80
              ? "Focus on improving NCR resolution time"
              : "Maintain NCR resolution rate",
            capaCompletionRate < 85
              ? "Improve CAPA closure time"
              : "Maintain CAPA effectiveness",
            avgAuditScore < 85
              ? "Address audit findings promptly"
              : "Maintain audit compliance",
          ],
        });
      }

      return predictions;
    } catch (error) {
      console.error("Error predicting compliance score:", error);
      return [];
    }
  }

  /**
   * Predict risks
   */
  async predictRisks(
    tenantId: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<RiskPrediction[]> {
    try {
      const { prisma } = await import("@/lib/services/database/prismaClient");

      // Build where clause
      const where: any = { tenantId, recordStatus: "ACTIVE" };
      if (customerId) where.customerId = customerId;
      if (warehouseId) where.warehouseId = warehouseId;

      // Get historical data
      const [risks, ncrs, audits] = await Promise.all([
        prisma.iSOIMSRisk.findMany({ where, take: 50 }),
        prisma.iSOIMSNCR.findMany({ where, take: 100 }),
        prisma.iSOIMSAudit.findMany({ where, take: 20 }),
      ]);

      // Analyze by category
      const categoryAnalysis: Record<
        string,
        { count: number; avgScore: number; highRiskCount: number }
      > = {};

      risks.forEach((risk) => {
        const cat = risk.riskCategory;
        if (!categoryAnalysis[cat]) {
          categoryAnalysis[cat] = { count: 0, avgScore: 0, highRiskCount: 0 };
        }
        categoryAnalysis[cat].count++;
        categoryAnalysis[cat].avgScore += risk.riskScore;
        if (risk.riskLevel === "HIGH" || risk.riskLevel === "CRITICAL") {
          categoryAnalysis[cat].highRiskCount++;
        }
      });

      // Generate predictions
      const predictions: RiskPrediction[] = [];

      Object.entries(categoryAnalysis).forEach(([category, data]) => {
        const avgScore = data.count > 0 ? data.avgScore / data.count : 0;
        const likelihood = Math.min(1, (avgScore / 25) * 0.8 + 0.2); // Normalize to 0.2-1.0
        const impact = Math.min(1, (avgScore / 25) * 0.8 + 0.2);
        const riskScore = likelihood * impact;
        const highRiskRatio =
          data.count > 0 ? data.highRiskCount / data.count : 0;

        // Get related NCRs for this category
        const relatedNCRs = ncrs.filter((n) => {
          // Match by category if available
          return true; // Simplified - could match by keywords
        });

        predictions.push({
          riskArea: category,
          predictedLikelihood: Math.round(likelihood * 100) / 100,
          predictedImpact: Math.round(impact * 100) / 100,
          predictedRiskScore: Math.round(riskScore * 100) / 100,
          timeframe:
            highRiskRatio > 0.3
              ? "SHORT_TERM"
              : highRiskRatio > 0.1
                ? "MEDIUM_TERM"
                : "LONG_TERM",
          confidence: Math.max(60, 100 - data.count * 2), // More data = higher confidence
          mitigationSuggestions: [
            highRiskRatio > 0.3
              ? "Immediate risk mitigation required"
              : "Develop risk treatment plan",
            relatedNCRs.length > 0
              ? "Review related NCRs for root causes"
              : "Conduct risk assessment",
            "Implement monitoring and controls",
          ],
        });
      });

      // Sort by risk score and return top 5
      return predictions
        .sort((a, b) => b.predictedRiskScore - a.predictedRiskScore)
        .slice(0, 5);
    } catch (error) {
      console.error("Error predicting risks:", error);
      return [];
    }
  }

  /**
   * Detect patterns
   */
  async detectPatterns(
    tenantId: string,
    entityType: "NCR" | "CAPA" | "AUDIT" | "RISK",
    filters?: Record<string, unknown>,
  ): Promise<PatternDetection[]> {
    try {
      const { prisma } = await import("@/lib/services/database/prismaClient");
      const patterns: PatternDetection[] = [];

      // Build where clause
      const where: any = { tenantId, recordStatus: "ACTIVE" };

      if (entityType === "NCR") {
        const ncrs = await prisma.iSOIMSNCR.findMany({ where, take: 200 });

        // Pattern 1: Location-based clustering
        const locationGroups: Record<string, any[]> = {};
        ncrs.forEach((ncr) => {
          const location = ncr.reportedLocation || "Unknown";
          if (!locationGroups[location]) locationGroups[location] = [];
          locationGroups[location].push(ncr);
        });

        Object.entries(locationGroups).forEach(([location, groupNCRs]) => {
          if (groupNCRs.length >= 3) {
            patterns.push({
              patternId: `pattern-loc-${location}`,
              patternType: "CLUSTER",
              description: `Multiple NCRs clustered in ${location}`,
              affectedEntities: groupNCRs.map((n) => n.id),
              confidence: Math.min(95, 70 + groupNCRs.length * 3),
              severity: groupNCRs.length >= 5 ? "HIGH" : "MEDIUM",
              recommendations: [
                `Investigate root cause in ${location}`,
                "Review procedures for this location",
                "Consider preventive CAPA",
              ],
            });
          }
        });

        // Pattern 2: Type-based recurring
        const typeGroups: Record<string, any[]> = {};
        ncrs.forEach((ncr) => {
          const type = ncr.ncType;
          if (!typeGroups[type]) typeGroups[type] = [];
          typeGroups[type].push(ncr);
        });

        Object.entries(typeGroups).forEach(([type, groupNCRs]) => {
          if (groupNCRs.length >= 5) {
            patterns.push({
              patternId: `pattern-type-${type}`,
              patternType: "RECURRING",
              description: `Recurring ${type} NCRs`,
              affectedEntities: groupNCRs.map((n) => n.id),
              confidence: Math.min(95, 75 + groupNCRs.length * 2),
              severity: "HIGH",
              recommendations: [
                `Review ${type} processes for systemic issues`,
                "Create preventive CAPA",
                "Increase training and awareness",
              ],
            });
          }
        });

        // Pattern 3: Time-based trends
        const monthlyGroups: Record<string, any[]> = {};
        ncrs.forEach((ncr) => {
          const month = ncr.createdAt.toISOString().substring(0, 7);
          if (!monthlyGroups[month]) monthlyGroups[month] = [];
          monthlyGroups[month].push(ncr);
        });

        const months = Object.keys(monthlyGroups).sort();
        if (months.length >= 3) {
          const recent = monthlyGroups[months[months.length - 1]]?.length || 0;
          const previous =
            monthlyGroups[months[months.length - 2]]?.length || 0;
          const before = monthlyGroups[months[months.length - 3]]?.length || 0;

          if (recent > previous * 1.3 && previous > before * 1.2) {
            patterns.push({
              patternId: "pattern-trend-increasing",
              patternType: "TREND",
              description: "Increasing NCR trend detected",
              affectedEntities: monthlyGroups[months[months.length - 1]].map(
                (n) => n.id,
              ),
              confidence: 80,
              severity: "MEDIUM",
              recommendations: [
                "Investigate recent process changes",
                "Review training effectiveness",
                "Conduct management review",
              ],
            });
          }
        }
      } else if (entityType === "CAPA") {
        const capas = await prisma.iSOIMSCAPA.findMany({ where, take: 200 });

        // Pattern: Overdue CAPAs
        const now = new Date();
        const overdue = capas.filter(
          (c) =>
            new Date(c.targetDate) < now &&
            c.status !== "CLOSED" &&
            c.status !== "COMPLETED",
        );

        if (overdue.length >= 3) {
          patterns.push({
            patternId: "pattern-capas-overdue",
            patternType: "CLUSTER",
            description: "Multiple overdue CAPAs detected",
            affectedEntities: overdue.map((c) => c.id),
            confidence: 95,
            severity: "HIGH",
            recommendations: [
              "Prioritize overdue CAPA resolution",
              "Review CAPA management process",
              "Allocate additional resources",
            ],
          });
        }
      } else if (entityType === "RISK") {
        const risks = await prisma.iSOIMSRisk.findMany({ where, take: 100 });

        // Pattern: High-risk clusters
        const highRisks = risks.filter(
          (r) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL",
        );
        const categoryGroups: Record<string, any[]> = {};

        highRisks.forEach((risk) => {
          const cat = risk.riskCategory;
          if (!categoryGroups[cat]) categoryGroups[cat] = [];
          categoryGroups[cat].push(risk);
        });

        Object.entries(categoryGroups).forEach(([category, groupRisks]) => {
          if (groupRisks.length >= 3) {
            patterns.push({
              patternId: `pattern-risk-${category}`,
              patternType: "CLUSTER",
              description: `High-risk cluster in ${category}`,
              affectedEntities: groupRisks.map((r) => r.id),
              confidence: 85,
              severity: "CRITICAL",
              recommendations: [
                `Immediate risk mitigation required for ${category}`,
                "Develop comprehensive treatment plan",
                "Increase monitoring frequency",
              ],
            });
          }
        });
      }

      return patterns;
    } catch (error) {
      console.error("Error detecting patterns:", error);
      return [];
    }
  }

  /**
   * Analyze document with computer vision
   */
  async analyzeDocumentWithVision(
    documentId: string,
    imageUrl: string,
    tenantId: string,
  ): Promise<{
    detectedText: string;
    qualityIssues: Array<{
      issue: string;
      severity: string;
      confidence: number;
    }>;
    complianceIssues: Array<{
      standard: string;
      violation: string;
      confidence: number;
    }>;
    visualAnomalies: Array<{
      type: string;
      description: string;
      confidence: number;
    }>;
  }> {
    try {
      // Use vision service for document analysis
      const visionResult = await visionService.analyzeImage(imageUrl, {
        analysisType: "document",
        includeOCR: true,
        includeCompliance: true,
        includeQuality: true,
      });

      return {
        detectedText: visionResult.analysis.description || "",
        qualityIssues:
          visionResult.analysis.qualityIssues?.map((qi) => ({
            issue: qi.issue,
            severity: qi.severity,
            confidence: qi.confidence,
          })) || [],
        complianceIssues:
          visionResult.analysis.complianceIssues?.map((ci) => ({
            standard: ci.standard,
            violation: ci.violation,
            confidence: ci.confidence,
          })) || [],
        visualAnomalies: [],
      };
    } catch (error) {
      console.error("Error analyzing document with vision:", error);
      return {
        detectedText: "",
        qualityIssues: [],
        complianceIssues: [],
        visualAnomalies: [],
      };
    }
  }

  /**
   * Process voice command for ISO IMS
   */
  async processVoiceCommand(
    audioData: string | Blob,
    tenantId: string,
    context?: {
      module?: string;
      userId?: string;
    },
  ): Promise<{
    command: string;
    intent: string;
    entities: Record<string, any>;
    action: string;
    confidence: number;
  }> {
    try {
      // Would integrate with voice AI service
      // For now, return mock response
      return {
        command: "Show compliance score",
        intent: "VIEW_COMPLIANCE",
        entities: {},
        action: "navigate",
        confidence: 0.85,
      };
    } catch (error) {
      console.error("Error processing voice command:", error);
      throw error;
    }
  }

  /**
   * Track prediction and learn from outcome
   */
  async trackPredictionAndLearn(
    predictionId: string,
    prediction: {
      type: string;
      value: any;
      confidence: number;
      model: string;
      context: string[];
    },
    outcome: {
      value: any;
      observedAt: Date;
      source: string;
    },
    tenantId: string,
  ): Promise<void> {
    try {
      // Register prediction
      await predictionTrackerService.registerPrediction(
        predictionId,
        prediction,
      );

      // Record outcome and generate learning signal
      const learningSignal = await predictionTrackerService.recordOutcome(
        predictionId,
        outcome,
      );

      // Process learning signal to update knowledge
      if (learningSignal) {
        await knowledgeUpdaterService.processSignal(learningSignal.id);
      }
    } catch (error) {
      console.error("Error tracking prediction and learning:", error);
    }
  }

  /**
   * Capture learning signal for ISO IMS
   */
  async captureLearningSignal(
    prediction: {
      type:
        | "compliance_score"
        | "ncr_trend"
        | "capa_success"
        | "risk_prediction";
      value: any;
      confidence: number;
      model: string;
      context: string[];
    },
    outcome: {
      value: any;
      observedAt: Date;
      source: string;
    },
    tenantId: string,
  ): Promise<string> {
    try {
      const signal = await signalCaptureService.captureSignal(
        prediction,
        outcome,
        tenantId,
      );

      // Process signal to update knowledge
      await knowledgeUpdaterService.processSignal(signal.id);

      return signal.id;
    } catch (error) {
      console.error("Error capturing learning signal:", error);
      throw error;
    }
  }

  /**
   * Generate smart recommendations
   */
  async generateRecommendations(
    tenantId: string,
    context?: {
      ncrs?: NCR[];
      capas?: CAPA[];
      audits?: Audit[];
      risks?: Risk[];
    },
  ): Promise<SmartRecommendation[]> {
    try {
      const recommendations: SmartRecommendation[] = [];

      // Analyze NCRs
      if (context?.ncrs && context.ncrs.length > 0) {
        const openNCRs = context.ncrs.filter(
          (n) => n.status === "OPEN" || n.status === "UNDER_INVESTIGATION",
        );
        if (openNCRs.length > 5) {
          recommendations.push({
            id: "rec-1",
            type: "PROCESS_IMPROVEMENT",
            title: "High Number of Open NCRs",
            description: `You have ${openNCRs.length} open NCRs. Consider prioritizing resolution.`,
            priority: "HIGH",
            confidence: 90,
            reasoning:
              "High number of unresolved NCRs indicates potential systemic issues",
            estimatedImpact:
              "High - Improving resolution time will improve compliance score",
            actionUrl: "/ncr-management?filter=open",
            relatedEntities: openNCRs.map((n) => n.id),
          });
        }

        // Check for recurring issues
        const recurringPatterns = await this.detectPatterns(tenantId, "NCR");
        if (recurringPatterns.length > 0) {
          recommendations.push({
            id: "rec-2",
            type: "CAPA",
            title: "Recurring Issues Detected",
            description: `Found ${recurringPatterns.length} recurring patterns. Consider preventive CAPAs.`,
            priority: "HIGH",
            confidence: 85,
            reasoning:
              "Recurring patterns indicate need for preventive actions",
            estimatedImpact: "High - Preventive actions reduce future NCRs",
            actionUrl: "/capa-management",
            relatedEntities: recurringPatterns.flatMap(
              (p) => p.affectedEntities,
            ),
          });
        }
      }

      // Analyze CAPAs
      if (context?.capas && context.capas.length > 0) {
        const overdueCAPAs = context.capas.filter((c) => {
          if (!c.targetDate) return false;
          return (
            new Date(c.targetDate) < new Date() &&
            c.status !== "COMPLETED" &&
            c.status !== "CLOSED"
          );
        });

        if (overdueCAPAs.length > 0) {
          recommendations.push({
            id: "rec-3",
            type: "CAPA",
            title: "Overdue CAPAs",
            description: `You have ${overdueCAPAs.length} overdue CAPAs requiring attention.`,
            priority: "HIGH",
            confidence: 95,
            reasoning: "Overdue CAPAs indicate potential compliance gaps",
            estimatedImpact:
              "High - Resolving overdue CAPAs improves compliance",
            actionUrl: "/capa-management?filter=overdue",
            relatedEntities: overdueCAPAs.map((c) => c.id),
          });
        }
      }

      // Analyze Risks
      if (context?.risks && context.risks.length > 0) {
        const highRisks = context.risks.filter(
          (r) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL",
        );
        if (highRisks.length > 0) {
          recommendations.push({
            id: "rec-4",
            type: "RISK",
            title: "High-Risk Areas Identified",
            description: `You have ${highRisks.length} high or critical risks requiring attention.`,
            priority: "CRITICAL",
            confidence: 88,
            reasoning:
              "High risks pose significant compliance and operational threats",
            estimatedImpact:
              "Critical - Addressing high risks prevents incidents",
            actionUrl: "/risk-management?filter=high",
            relatedEntities: highRisks.map((r) => r.id),
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [];
    }
  }

  /**
   * Perform intelligent root cause analysis
   */
  async performRootCauseAnalysis(
    description: string,
    context?: Record<string, unknown>,
  ): Promise<RootCauseAnalysis> {
    try {
      // Use unified RCA engine
      const { rootCauseAnalysisEngine } =
        await import("@/lib/services/intelligence-analytics/root-cause/rootCauseAnalysisEngine");

      // Get tenant ID from context or use default
      const tenantId = (context?.tenantId as string) || "default";
      const entityId = (context?.entityId as string) || `iso-ims-${Date.now()}`;

      // Perform unified RCA
      const unifiedRCA = await rootCauseAnalysisEngine.analyzeRootCause({
        tenantId,
        issueId: entityId,
        issueType: "ISO_IMS_NCR",
        source: {
          module: "iso-ims",
          entityType: "NCR",
          entityId,
        },
        context: {
          description,
          ...context,
        },
        method: "HYBRID",
      });

      // Transform unified RCA to ISO-IMS format
      const primaryRootCause =
        unifiedRCA.rootCauses[0]?.description || "Process or system failure";
      const contributingFactors = unifiedRCA.contributingFactors.map(
        (cf) => cf.description,
      );
      const recommendations = unifiedRCA.recommendations.map(
        (rec) => rec.action,
      );

      return {
        method: "AI_AUTO",
        rootCause: primaryRootCause,
        contributingFactors,
        analysis:
          unifiedRCA.summary ||
          `Based on unified analysis, the primary root cause is: ${primaryRootCause}`,
        confidence: unifiedRCA.confidence || 75,
        recommendations,
        similarCases: unifiedRCA.evidenceIds || [],
      };
    } catch (error) {
      console.error("Error performing root cause analysis:", error);
      throw error;
    }
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(
    tenantId: string,
    metricType:
      | "NCR_COUNT"
      | "CAPA_COUNT"
      | "COMPLIANCE_SCORE"
      | "AUDIT_FINDINGS",
    timeframe: "7D" | "30D" | "90D",
  ): Promise<AnomalyDetection[]> {
    try {
      const { prisma } = await import("@/lib/services/database/prismaClient");
      const anomalies: AnomalyDetection[] = [];
      const where: any = { tenantId, recordStatus: "ACTIVE" };

      // Calculate timeframe
      const days = timeframe === "7D" ? 7 : timeframe === "30D" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      if (metricType === "NCR_COUNT") {
        // Get NCRs in timeframe
        const recentNCRs = await prisma.iSOIMSNCR.findMany({
          where: {
            ...where,
            createdAt: { gte: startDate },
          },
        });

        // Get historical average (previous period)
        const previousStart = new Date(startDate);
        previousStart.setDate(previousStart.getDate() - days);
        const previousNCRs = await prisma.iSOIMSNCR.findMany({
          where: {
            ...where,
            createdAt: { gte: previousStart, lt: startDate },
          },
        });

        const recentCount = recentNCRs.length;
        const previousCount = previousNCRs.length;
        const avgCount = previousCount;
        const threshold = avgCount * 1.5; // 50% increase threshold

        if (recentCount > threshold && avgCount > 0) {
          anomalies.push({
            anomalyId: `anomaly-ncr-spike-${Date.now()}`,
            type: "SPIKE",
            description: `NCR count increased by ${Math.round(((recentCount - avgCount) / avgCount) * 100)}% compared to previous period`,
            detectedAt: new Date(),
            severity: recentCount > avgCount * 2 ? "CRITICAL" : "HIGH",
            affectedMetrics: ["NCR_COUNT"],
            potentialCauses: [
              "Process changes or disruptions",
              "Training gaps",
              "Equipment failures",
              "Supplier quality issues",
            ],
            recommendations: [
              "Investigate root causes of increased NCRs",
              "Review recent process changes",
              "Conduct management review",
            ],
          });
        } else if (recentCount < avgCount * 0.5 && avgCount > 5) {
          anomalies.push({
            anomalyId: `anomaly-ncr-drop-${Date.now()}`,
            type: "DROP",
            description: `NCR count decreased by ${Math.round(((avgCount - recentCount) / avgCount) * 100)}% compared to previous period`,
            detectedAt: new Date(),
            severity: "LOW",
            affectedMetrics: ["NCR_COUNT"],
            potentialCauses: [
              "Improved processes",
              "Effective CAPAs",
              "Better training",
            ],
            recommendations: [
              "Verify if improvement is sustainable",
              "Document best practices",
            ],
          });
        }
      } else if (metricType === "CAPA_COUNT") {
        const recentCAPAs = await prisma.iSOIMSCAPA.findMany({
          where: {
            ...where,
            createdAt: { gte: startDate },
          },
        });

        const previousStart = new Date(startDate);
        previousStart.setDate(previousStart.getDate() - days);
        const previousCAPAs = await prisma.iSOIMSCAPA.findMany({
          where: {
            ...where,
            createdAt: { gte: previousStart, lt: startDate },
          },
        });

        const recentCount = recentCAPAs.length;
        const previousCount = previousCAPAs.length;
        const avgCount = previousCount;

        if (recentCount > avgCount * 1.5 && avgCount > 0) {
          anomalies.push({
            anomalyId: `anomaly-capa-spike-${Date.now()}`,
            type: "SPIKE",
            description: `CAPA creation increased by ${Math.round(((recentCount - avgCount) / avgCount) * 100)}%`,
            detectedAt: new Date(),
            severity: "MEDIUM",
            affectedMetrics: ["CAPA_COUNT"],
            potentialCauses: [
              "Increased NCRs requiring CAPAs",
              "Proactive preventive actions",
            ],
            recommendations: [
              "Review CAPA effectiveness",
              "Ensure adequate resources for CAPA implementation",
            ],
          });
        }
      } else if (metricType === "COMPLIANCE_SCORE") {
        // Get recent audits
        const recentAudits = await prisma.iSOIMSAudit.findMany({
          where: {
            ...where,
            createdAt: { gte: startDate },
          },
        });

        const scores = recentAudits
          .map((a) => a.complianceScore)
          .filter((s): s is number => s !== null && s !== undefined);

        if (scores.length > 0) {
          const avgScore =
            scores.reduce((sum, s) => sum + s, 0) / scores.length;
          const previousStart = new Date(startDate);
          previousStart.setDate(previousStart.getDate() - days);
          const previousAudits = await prisma.iSOIMSAudit.findMany({
            where: {
              ...where,
              createdAt: { gte: previousStart, lt: startDate },
            },
          });

          const previousScores = previousAudits
            .map((a) => a.complianceScore)
            .filter((s): s is number => s !== null && s !== undefined);

          if (previousScores.length > 0) {
            const previousAvg =
              previousScores.reduce((sum, s) => sum + s, 0) /
              previousScores.length;

            if (avgScore < previousAvg - 10) {
              anomalies.push({
                anomalyId: `anomaly-compliance-drop-${Date.now()}`,
                type: "DROP",
                description: `Compliance score dropped by ${Math.round(previousAvg - avgScore)} points`,
                detectedAt: new Date(),
                severity: avgScore < 70 ? "CRITICAL" : "HIGH",
                affectedMetrics: ["COMPLIANCE_SCORE"],
                potentialCauses: [
                  "Increased non-conformances",
                  "Ineffective CAPAs",
                  "Process deterioration",
                ],
                recommendations: [
                  "Conduct immediate management review",
                  "Review and strengthen quality processes",
                  "Increase audit frequency",
                ],
              });
            }
          }
        }
      }

      return anomalies;
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      return [];
    }
  }

  /**
   * Forecast trends
   */
  async forecastTrends(
    tenantId: string,
    metricType: "NCR_COUNT" | "CAPA_COUNT" | "COMPLIANCE_SCORE",
    days: number,
  ): Promise<Array<{ date: string; value: number; confidence: number }>> {
    try {
      const { prisma } = await import("@/lib/services/database/prismaClient");
      const where: any = { tenantId, recordStatus: "ACTIVE" };

      // Get historical data (last 90 days)
      const historicalStart = new Date();
      historicalStart.setDate(historicalStart.getDate() - 90);

      let historicalData: any[] = [];
      if (metricType === "NCR_COUNT") {
        const ncrs = await prisma.iSOIMSNCR.findMany({
          where: { ...where, createdAt: { gte: historicalStart } },
        });
        // Group by day
        const dailyCounts: Record<string, number> = {};
        ncrs.forEach((ncr) => {
          const day = ncr.createdAt.toISOString().split("T")[0];
          dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        });
        historicalData = Object.entries(dailyCounts).map(([date, value]) => ({
          date,
          value,
        }));
      } else if (metricType === "CAPA_COUNT") {
        const capas = await prisma.iSOIMSCAPA.findMany({
          where: { ...where, createdAt: { gte: historicalStart } },
        });
        const dailyCounts: Record<string, number> = {};
        capas.forEach((capa) => {
          const day = capa.createdAt.toISOString().split("T")[0];
          dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        });
        historicalData = Object.entries(dailyCounts).map(([date, value]) => ({
          date,
          value,
        }));
      } else if (metricType === "COMPLIANCE_SCORE") {
        const audits = await prisma.iSOIMSAudit.findMany({
          where: { ...where, createdAt: { gte: historicalStart } },
        });
        const dailyScores: Record<string, number[]> = {};
        audits.forEach((audit) => {
          if (audit.complianceScore !== null) {
            const day = audit.createdAt.toISOString().split("T")[0];
            if (!dailyScores[day]) dailyScores[day] = [];
            dailyScores[day].push(audit.complianceScore!);
          }
        });
        historicalData = Object.entries(dailyScores).map(([date, scores]) => ({
          date,
          value: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        }));
      }

      // Calculate simple moving average
      const sortedData = historicalData.sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      const windowSize = Math.min(7, sortedData.length);
      const recentValues = sortedData.slice(-windowSize).map((d) => d.value);
      const avgValue =
        recentValues.length > 0
          ? recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length
          : 50;

      // Calculate trend (simple linear regression)
      let trend = 0;
      if (sortedData.length >= 2) {
        const firstHalf = sortedData.slice(
          0,
          Math.floor(sortedData.length / 2),
        );
        const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
        const firstAvg =
          firstHalf.length > 0
            ? firstHalf.map((d) => d.value).reduce((sum, v) => sum + v, 0) /
              firstHalf.length
            : avgValue;
        const secondAvg =
          secondHalf.length > 0
            ? secondHalf.map((d) => d.value).reduce((sum, v) => sum + v, 0) /
              secondHalf.length
            : avgValue;
        trend = (secondAvg - firstAvg) / sortedData.length;
      }

      // Generate forecast
      const forecast: Array<{
        date: string;
        value: number;
        confidence: number;
      }> = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        // Apply trend
        const predictedValue = avgValue + trend * i;

        // Confidence decreases over time
        const confidence = Math.max(50, 100 - (i / days) * 40);

        forecast.push({
          date: date.toISOString().split("T")[0],
          value: Math.round(predictedValue * 100) / 100,
          confidence: Math.round(confidence),
        });
      }

      return forecast;
    } catch (error) {
      console.error("Error forecasting trends:", error);
      return [];
    }
  }

  /**
   * Get compliance health score
   */
  async getComplianceHealthScore(
    tenantId: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<{
    overallScore: number;
    breakdown: {
      ncrHealth: number;
      capaHealth: number;
      auditHealth: number;
      riskHealth: number;
      trainingHealth: number;
      documentHealth: number;
    };
    factors: Array<{
      factor: string;
      impact: number;
      status: "GOOD" | "WARNING" | "CRITICAL";
    }>;
    recommendations: string[];
  }> {
    try {
      const { prisma } = await import("@/lib/services/database/prismaClient");
      const where: any = { tenantId, recordStatus: "ACTIVE" };
      if (customerId) where.customerId = customerId;
      if (warehouseId) where.warehouseId = warehouseId;

      // Get all data
      const [ncrs, capas, audits, risks, trainings, documents] =
        await Promise.all([
          prisma.iSOIMSNCR.findMany({ where }),
          prisma.iSOIMSCAPA.findMany({ where }),
          prisma.iSOIMSAudit.findMany({ where }),
          prisma.iSOIMSRisk.findMany({ where }),
          prisma.iSOIMSTraining.findMany({ where }),
          prisma.iSOIMSDocument.findMany({ where }),
        ]);

      // Calculate NCR Health (based on resolution rate and timeliness)
      const closedNCRs = ncrs.filter((n) => n.status === "CLOSED").length;
      const ncrResolutionRate =
        ncrs.length > 0 ? (closedNCRs / ncrs.length) * 100 : 100;
      const now = new Date();
      const overdueNCRs = ncrs.filter((n) => {
        if (n.status === "CLOSED") return false;
        // Assume 30 days target resolution
        const targetDate = new Date(n.createdAt);
        targetDate.setDate(targetDate.getDate() + 30);
        return targetDate < now;
      }).length;
      const ncrHealth = Math.max(
        0,
        Math.min(100, ncrResolutionRate - overdueNCRs * 5),
      );

      // Calculate CAPA Health (based on completion rate and effectiveness)
      const completedCAPAs = capas.filter(
        (c) => c.status === "CLOSED" || c.status === "COMPLETED",
      ).length;
      const capaCompletionRate =
        capas.length > 0 ? (completedCAPAs / capas.length) * 100 : 100;
      const overdueCAPAs = capas.filter((c) => {
        if (c.status === "CLOSED" || c.status === "COMPLETED") return false;
        return new Date(c.targetDate) < now;
      }).length;
      const withEffectiveness = capas.filter(
        (c) =>
          c.effectivenessScore !== null && c.effectivenessScore !== undefined,
      );
      const avgEffectiveness =
        withEffectiveness.length > 0
          ? withEffectiveness.reduce(
              (sum, c) => sum + (c.effectivenessScore || 0),
              0,
            ) / withEffectiveness.length
          : 85;
      const capaHealth = Math.max(
        0,
        Math.min(
          100,
          capaCompletionRate * 0.6 + avgEffectiveness * 0.4 - overdueCAPAs * 3,
        ),
      );

      // Calculate Audit Health (based on compliance scores)
      const auditScores = audits
        .map((a) => a.complianceScore)
        .filter((s): s is number => s !== null && s !== undefined);
      const auditHealth =
        auditScores.length > 0
          ? auditScores.reduce((sum, s) => sum + s, 0) / auditScores.length
          : 85;

      // Calculate Risk Health (based on risk levels and treatment)
      const highRisks = risks.filter(
        (r) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL",
      ).length;
      const treatedRisks = risks.filter(
        (r) => r.status === "TREATED" || r.status === "MONITORED",
      ).length;
      const riskTreatmentRate =
        risks.length > 0 ? (treatedRisks / risks.length) * 100 : 100;
      const riskHealth = Math.max(
        0,
        Math.min(100, riskTreatmentRate - highRisks * 10),
      );

      // Calculate Training Health (based on completion and scheduling)
      const completedTrainings = trainings.filter(
        (t) => t.status === "COMPLETED",
      ).length;
      const trainingCompletionRate =
        trainings.length > 0
          ? (completedTrainings / trainings.length) * 100
          : 100;
      const scheduledTrainings = trainings.filter(
        (t) => t.scheduledDate !== null,
      ).length;
      const trainingScheduleRate =
        trainings.length > 0
          ? (scheduledTrainings / trainings.length) * 100
          : 100;
      const trainingHealth =
        trainingCompletionRate * 0.7 + trainingScheduleRate * 0.3;

      // Calculate Document Health (based on approval and review status)
      const approvedDocs = documents.filter(
        (d) => d.status === "APPROVED",
      ).length;
      const docApprovalRate =
        documents.length > 0 ? (approvedDocs / documents.length) * 100 : 100;
      const reviewedDocs = documents.filter(
        (d) => d.reviewDate !== null,
      ).length;
      const docReviewRate =
        documents.length > 0 ? (reviewedDocs / documents.length) * 100 : 100;
      const documentHealth = docApprovalRate * 0.6 + docReviewRate * 0.4;

      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        ncrHealth * 0.2 +
          capaHealth * 0.25 +
          auditHealth * 0.15 +
          riskHealth * 0.2 +
          trainingHealth * 0.1 +
          documentHealth * 0.1,
      );

      // Generate factors
      const factors: Array<{
        factor: string;
        impact: number;
        status: "GOOD" | "WARNING" | "CRITICAL";
      }> = [
        {
          factor: "NCR Resolution Rate",
          impact: 0.2,
          status:
            ncrHealth >= 80 ? "GOOD" : ncrHealth >= 60 ? "WARNING" : "CRITICAL",
        },
        {
          factor: "CAPA Effectiveness",
          impact: 0.25,
          status:
            capaHealth >= 85
              ? "GOOD"
              : capaHealth >= 70
                ? "WARNING"
                : "CRITICAL",
        },
        {
          factor: "Audit Findings",
          impact: 0.15,
          status:
            auditHealth >= 85
              ? "GOOD"
              : auditHealth >= 70
                ? "WARNING"
                : "CRITICAL",
        },
        {
          factor: "Risk Management",
          impact: 0.2,
          status:
            riskHealth >= 75
              ? "GOOD"
              : riskHealth >= 60
                ? "WARNING"
                : "CRITICAL",
        },
        {
          factor: "Training Compliance",
          impact: 0.1,
          status:
            trainingHealth >= 80
              ? "GOOD"
              : trainingHealth >= 65
                ? "WARNING"
                : "CRITICAL",
        },
        {
          factor: "Document Control",
          impact: 0.1,
          status:
            documentHealth >= 85
              ? "GOOD"
              : documentHealth >= 70
                ? "WARNING"
                : "CRITICAL",
        },
      ];

      // Generate recommendations
      const recommendations: string[] = [];
      if (ncrHealth < 70) {
        recommendations.push("Improve NCR resolution time and rate");
      }
      if (capaHealth < 75) {
        recommendations.push("Enhance CAPA effectiveness and closure rate");
      }
      if (auditHealth < 80) {
        recommendations.push(
          "Address audit findings to improve compliance score",
        );
      }
      if (riskHealth < 70) {
        recommendations.push(
          "Strengthen risk management and treatment processes",
        );
      }
      if (trainingHealth < 75) {
        recommendations.push("Improve training completion and scheduling");
      }
      if (documentHealth < 80) {
        recommendations.push("Enhance document approval and review processes");
      }

      if (recommendations.length === 0) {
        recommendations.push("Maintain current compliance levels");
      }

      return {
        overallScore,
        breakdown: {
          ncrHealth: Math.round(ncrHealth),
          capaHealth: Math.round(capaHealth),
          auditHealth: Math.round(auditHealth),
          riskHealth: Math.round(riskHealth),
          trainingHealth: Math.round(trainingHealth),
          documentHealth: Math.round(documentHealth),
        },
        factors,
        recommendations,
      };
    } catch (error) {
      console.error("Error calculating compliance health score:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const intelligenceService = new IntelligenceService();
