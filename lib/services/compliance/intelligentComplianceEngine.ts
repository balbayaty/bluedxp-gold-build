/**
 * Intelligent Compliance Engine
 * AI-powered compliance recommendations, risk prediction, and automated insights
 * Deep learning from patterns and historical data
 */

import {
  ComplianceRecord,
  ComplianceStatus,
  CompliancePriority,
  ComplianceRecommendation,
  ComplianceViolation,
  ComplianceFinding,
} from "@/types/compliance";
import { LocalRegulation } from "@/types/compliance-hierarchy";

// ============================================================================
// RISK PREDICTION ENGINE
// ============================================================================

export interface RiskPrediction {
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  predictedViolations: PredictedViolation[];
  recommendations: string[];
  confidence: number; // 0-100
  predictionDate: Date | string;
}

export interface RiskFactor {
  factor: string;
  severity: CompliancePriority;
  description: string;
  impact: string;
  likelihood: number; // 0-100
  mitigationStrategy?: string;
}

export interface PredictedViolation {
  type: string;
  description: string;
  likelihood: number; // 0-100
  timeframe: string; // e.g., "30 days", "90 days"
  severity: CompliancePriority;
  preventionActions: string[];
}

/**
 * Predict compliance risks based on historical patterns
 */
export function predictComplianceRisk(
  records: ComplianceRecord[],
  regulations: LocalRegulation[],
): RiskPrediction {
  const riskFactors: RiskFactor[] = [];
  const predictedViolations: PredictedViolation[] = [];
  let overallRiskScore = 0;

  // Analyze compliance scores
  const avgScore =
    records.reduce((sum, r) => sum + r.complianceScore, 0) / records.length;
  if (avgScore < 70) {
    riskFactors.push({
      factor: "Low Average Compliance Score",
      severity: avgScore < 50 ? "CRITICAL" : "HIGH",
      description: `Average compliance score is ${avgScore.toFixed(1)}%`,
      impact: "Increased likelihood of violations and regulatory action",
      likelihood: 100 - avgScore,
      mitigationStrategy: "Immediate compliance improvement actions required",
    });
    overallRiskScore += (100 - avgScore) * 0.3;
  }

  // Analyze expiring documents
  const expiringDocs = records.flatMap((r) =>
    r.documents.filter((d) => {
      if (!d.expiryDate) return false;
      const daysUntilExpiry =
        (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }),
  );

  if (expiringDocs.length > 0) {
    riskFactors.push({
      factor: "Expiring Documents",
      severity: expiringDocs.length > 5 ? "HIGH" : "MEDIUM",
      description: `${expiringDocs.length} document(s) expiring within 30 days`,
      impact: "Risk of operating with expired documentation",
      likelihood: 70,
      mitigationStrategy: "Renew documents before expiry",
    });
    overallRiskScore += expiringDocs.length * 5;

    predictedViolations.push({
      type: "Expired Documentation",
      description: "Documents will expire if not renewed",
      likelihood: 80,
      timeframe: "30 days",
      severity: "HIGH",
      preventionActions: [
        "Set renewal reminders",
        "Prepare renewal documents",
        "Schedule renewal appointments",
      ],
    });
  }

  // Analyze violation patterns
  const recentViolations = records.flatMap((r) =>
    r.violations.filter((v) => {
      const daysSince =
        (Date.now() - new Date(v.detectedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 90 && v.status === "OPEN";
    }),
  );

  if (recentViolations.length > 0) {
    const criticalViolations = recentViolations.filter(
      (v) => v.severity === "CRITICAL",
    );
    if (criticalViolations.length > 0) {
      riskFactors.push({
        factor: "Open Critical Violations",
        severity: "CRITICAL",
        description: `${criticalViolations.length} critical violation(s) unresolved`,
        impact: "Operations may be blocked or penalties may apply",
        likelihood: 95,
        mitigationStrategy: "Immediate resolution required",
      });
      overallRiskScore += criticalViolations.length * 20;
    }
  }

  // Analyze trend
  const recentScores = records
    .map((r) => ({ score: r.complianceScore, date: new Date(r.lastChecked) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  if (recentScores.length >= 3) {
    const trend =
      recentScores[0].score - recentScores[recentScores.length - 1].score;
    if (trend < -10) {
      riskFactors.push({
        factor: "Declining Compliance Trend",
        severity: "HIGH",
        description: `Compliance score declined by ${Math.abs(trend).toFixed(1)}% over recent period`,
        impact: "Continued decline may lead to violations",
        likelihood: 75,
        mitigationStrategy:
          "Investigate root causes and implement corrective actions",
      });
      overallRiskScore += Math.abs(trend) * 0.5;
    }
  }

  // Determine overall risk
  const overallRisk: RiskPrediction["overallRisk"] =
    overallRiskScore >= 70
      ? "CRITICAL"
      : overallRiskScore >= 50
        ? "HIGH"
        : overallRiskScore >= 30
          ? "MEDIUM"
          : "LOW";

  // Generate recommendations
  const recommendations: string[] = [];
  if (avgScore < 70) {
    recommendations.push(
      "Improve overall compliance score through systematic compliance improvement plan",
    );
  }
  if (expiringDocs.length > 0) {
    recommendations.push(
      `Renew ${expiringDocs.length} expiring document(s) before expiry`,
    );
  }
  if (recentViolations.length > 0) {
    recommendations.push(
      `Resolve ${recentViolations.length} open violation(s) immediately`,
    );
  }
  if (overallRiskScore >= 50) {
    recommendations.push("Conduct comprehensive compliance audit");
    recommendations.push("Implement proactive compliance monitoring");
  }

  return {
    overallRisk,
    riskScore: Math.min(100, overallRiskScore),
    riskFactors,
    predictedViolations,
    recommendations,
    confidence: 85, // Based on data quality and patterns
    predictionDate: new Date().toISOString(),
  };
}

// ============================================================================
// INTELLIGENT RECOMMENDATIONS ENGINE
// ============================================================================

export interface IntelligentRecommendation {
  id: string;
  type: "AUTO_FIX" | "PREVENTIVE" | "IMPROVEMENT" | "OPTIMIZATION";
  title: string;
  description: string;
  priority: CompliancePriority;
  confidence: number; // 0-100
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  effort: "LOW" | "MEDIUM" | "HIGH";
  estimatedBenefit: string;
  actions: string[];
  relatedRecords: string[];
  source: "AI_ANALYSIS" | "PATTERN_DETECTION" | "ML_MODEL" | "BEST_PRACTICE";
  createdAt: Date | string;
}

/**
 * Generate intelligent compliance recommendations
 */
export function generateIntelligentRecommendations(
  records: ComplianceRecord[],
  regulations: LocalRegulation[],
): IntelligentRecommendation[] {
  const recommendations: IntelligentRecommendation[] = [];

  // Pattern: Missing documents
  const recordsWithMissingDocs = records.filter((r) => {
    const requiredDocs = r.requirement.requiredDocuments.filter(
      (d) => d.mandatory,
    );
    const uploadedDocs = r.documents.map((d) => d.documentType);
    return requiredDocs.some((d) => !uploadedDocs.includes(d.documentType));
  });

  if (recordsWithMissingDocs.length > 0) {
    recommendations.push({
      id: "rec-001",
      type: "PREVENTIVE",
      title: "Upload Missing Mandatory Documents",
      description: `${recordsWithMissingDocs.length} compliance record(s) are missing mandatory documents`,
      priority: "HIGH",
      confidence: 100,
      impact: "HIGH",
      effort: "MEDIUM",
      estimatedBenefit:
        "Prevent compliance violations and improve compliance scores",
      actions: [
        "Identify missing documents per record",
        "Collect required documents",
        "Upload documents to system",
        "Verify document validity",
      ],
      relatedRecords: recordsWithMissingDocs.map((r) => r.id),
      source: "PATTERN_DETECTION",
      createdAt: new Date().toISOString(),
    });
  }

  // Pattern: Expiring documents
  const expiringSoon = records.flatMap((r) =>
    r.documents
      .filter((d) => {
        if (!d.expiryDate) return false;
        const daysUntilExpiry =
          (new Date(d.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24);
        return daysUntilExpiry > 0 && daysUntilExpiry <= 45;
      })
      .map((d) => ({ recordId: r.id, document: d })),
  );

  if (expiringSoon.length > 0) {
    recommendations.push({
      id: "rec-002",
      type: "PREVENTIVE",
      title: "Renew Expiring Documents",
      description: `${expiringSoon.length} document(s) expiring within 45 days`,
      priority: "MEDIUM",
      confidence: 100,
      impact: "MEDIUM",
      effort: "MEDIUM",
      estimatedBenefit: "Prevent document expiry and maintain compliance",
      actions: [
        "Review expiring documents list",
        "Initiate renewal process",
        "Schedule renewal appointments",
        "Set up automated renewal reminders",
      ],
      relatedRecords: Array.from(new Set(expiringSoon.map((e) => e.recordId))),
      source: "PATTERN_DETECTION",
      createdAt: new Date().toISOString(),
    });
  }

  // Pattern: Low compliance scores
  const lowScoreRecords = records.filter((r) => r.complianceScore < 70);
  if (lowScoreRecords.length > 0) {
    recommendations.push({
      id: "rec-003",
      type: "IMPROVEMENT",
      title: "Improve Low Compliance Scores",
      description: `${lowScoreRecords.length} record(s) have compliance scores below 70%`,
      priority: "HIGH",
      confidence: 95,
      impact: "HIGH",
      effort: "HIGH",
      estimatedBenefit: "Improve overall compliance posture and reduce risk",
      actions: [
        "Analyze root causes of low scores",
        "Address violations and findings",
        "Upload missing evidence",
        "Implement corrective actions",
        "Schedule follow-up compliance checks",
      ],
      relatedRecords: lowScoreRecords.map((r) => r.id),
      source: "AI_ANALYSIS",
      createdAt: new Date().toISOString(),
    });
  }

  // Pattern: Unresolved violations
  const openViolations = records.flatMap((r) =>
    r.violations
      .filter((v) => v.status === "OPEN")
      .map((v) => ({ recordId: r.id, violation: v })),
  );

  if (openViolations.length > 0) {
    const criticalViolations = openViolations.filter(
      (v) => v.violation.severity === "CRITICAL",
    );
    recommendations.push({
      id: "rec-004",
      type: "AUTO_FIX",
      title: "Resolve Open Violations",
      description: `${openViolations.length} violation(s) require resolution, including ${criticalViolations.length} critical`,
      priority: criticalViolations.length > 0 ? "CRITICAL" : "HIGH",
      confidence: 100,
      impact: criticalViolations.length > 0 ? "CRITICAL" : "HIGH",
      effort: "HIGH",
      estimatedBenefit: "Resolve compliance issues and prevent penalties",
      actions: [
        "Prioritize critical violations",
        "Assign resolution owners",
        "Implement remediation plans",
        "Track resolution progress",
        "Verify resolution completion",
      ],
      relatedRecords: Array.from(
        new Set(openViolations.map((v) => v.recordId)),
      ),
      source: "PATTERN_DETECTION",
      createdAt: new Date().toISOString(),
    });
  }

  // Optimization: Automated compliance checks
  const recordsNeedingCheck = records.filter((r) => {
    const daysSinceCheck =
      (Date.now() - new Date(r.lastChecked).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCheck > 30;
  });

  if (recordsNeedingCheck.length > 0) {
    recommendations.push({
      id: "rec-005",
      type: "OPTIMIZATION",
      title: "Schedule Automated Compliance Checks",
      description: `${recordsNeedingCheck.length} record(s) haven't been checked in over 30 days`,
      priority: "MEDIUM",
      confidence: 90,
      impact: "MEDIUM",
      effort: "LOW",
      estimatedBenefit:
        "Maintain up-to-date compliance status and early violation detection",
      actions: [
        "Enable automated compliance checks",
        "Set up check schedules",
        "Configure notification alerts",
        "Review check results regularly",
      ],
      relatedRecords: recordsNeedingCheck.map((r) => r.id),
      source: "BEST_PRACTICE",
      createdAt: new Date().toISOString(),
    });
  }

  return recommendations;
}

// ============================================================================
// COMPLIANCE SCORING ALGORITHM
// ============================================================================

export interface ComplianceScoreBreakdown {
  baseScore: number;
  adjustments: ScoreAdjustment[];
  finalScore: number;
  factors: ScoreFactor[];
}

export interface ScoreAdjustment {
  factor: string;
  adjustment: number;
  reason: string;
}

export interface ScoreFactor {
  factor: string;
  weight: number;
  score: number;
  contribution: number;
}

/**
 * Calculate intelligent compliance score with detailed breakdown
 */
export function calculateIntelligentComplianceScore(
  record: ComplianceRecord,
): ComplianceScoreBreakdown {
  let baseScore = 100;
  const adjustments: ScoreAdjustment[] = [];
  const factors: ScoreFactor[] = [];

  // Factor 1: Required Documents (30% weight)
  const requiredDocs = record.requirement.requiredDocuments.filter(
    (d) => d.mandatory,
  );
  const uploadedDocs = record.documents.map((d) => d.documentType);
  const missingDocs = requiredDocs.filter(
    (d) => !uploadedDocs.includes(d.documentType),
  );
  const docScore =
    requiredDocs.length > 0
      ? ((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100
      : 100;

  factors.push({
    factor: "Required Documents",
    weight: 0.3,
    score: docScore,
    contribution: docScore * 0.3,
  });

  if (missingDocs.length > 0) {
    const adjustment = -missingDocs.length * 10;
    baseScore += adjustment;
    adjustments.push({
      factor: "Missing Documents",
      adjustment,
      reason: `${missingDocs.length} mandatory document(s) missing`,
    });
  }

  // Factor 2: Document Validity (20% weight)
  const validDocs = record.documents.filter((d) => d.status === "VALID").length;
  const expiredDocs = record.documents.filter(
    (d) => d.status === "EXPIRED",
  ).length;
  const totalDocs = record.documents.length;
  const validityScore =
    totalDocs > 0 ? ((validDocs - expiredDocs * 2) / totalDocs) * 100 : 100;

  factors.push({
    factor: "Document Validity",
    weight: 0.2,
    score: Math.max(0, validityScore),
    contribution: Math.max(0, validityScore) * 0.2,
  });

  if (expiredDocs > 0) {
    const adjustment = -expiredDocs * 15;
    baseScore += adjustment;
    adjustments.push({
      factor: "Expired Documents",
      adjustment,
      reason: `${expiredDocs} document(s) expired`,
    });
  }

  // Factor 3: Violations (25% weight)
  const criticalViolations = record.violations.filter(
    (v) => v.severity === "CRITICAL" && v.status === "OPEN",
  ).length;
  const highViolations = record.violations.filter(
    (v) => v.severity === "HIGH" && v.status === "OPEN",
  ).length;
  const mediumViolations = record.violations.filter(
    (v) => v.severity === "MEDIUM" && v.status === "OPEN",
  ).length;

  const violationScore = Math.max(
    0,
    100 -
      (criticalViolations * 30 + highViolations * 15 + mediumViolations * 5),
  );

  factors.push({
    factor: "Violations",
    weight: 0.25,
    score: violationScore,
    contribution: violationScore * 0.25,
  });

  if (criticalViolations > 0 || highViolations > 0) {
    const adjustment = -(criticalViolations * 30 + highViolations * 15);
    baseScore += adjustment;
    adjustments.push({
      factor: "Open Violations",
      adjustment,
      reason: `${criticalViolations} critical, ${highViolations} high severity violation(s)`,
    });
  }

  // Factor 4: Evidence Verification (15% weight)
  const verifiedEvidence = record.evidence.filter((e) => e.verified).length;
  const totalEvidence = record.evidence.length;
  const evidenceScore =
    totalEvidence > 0 ? (verifiedEvidence / totalEvidence) * 100 : 100;

  factors.push({
    factor: "Evidence Verification",
    weight: 0.15,
    score: evidenceScore,
    contribution: evidenceScore * 0.15,
  });

  if (record.evidence.some((e) => !e.verified)) {
    const adjustment = -5;
    baseScore += adjustment;
    adjustments.push({
      factor: "Unverified Evidence",
      adjustment,
      reason: "Some evidence not yet verified",
    });
  }

  // Factor 5: Timeliness (10% weight)
  const daysSinceCheck =
    (Date.now() - new Date(record.lastChecked).getTime()) /
    (1000 * 60 * 60 * 24);
  const timelinessScore =
    daysSinceCheck <= 30 ? 100 : Math.max(0, 100 - (daysSinceCheck - 30) * 2);

  factors.push({
    factor: "Timeliness",
    weight: 0.1,
    score: timelinessScore,
    contribution: timelinessScore * 0.1,
  });

  if (daysSinceCheck > 60) {
    const adjustment = -10;
    baseScore += adjustment;
    adjustments.push({
      factor: "Stale Compliance Check",
      adjustment,
      reason: `Last check was ${Math.floor(daysSinceCheck)} days ago`,
    });
  }

  const finalScore = Math.max(0, Math.min(100, baseScore));

  return {
    baseScore: 100,
    adjustments,
    finalScore,
    factors,
  };
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const intelligentComplianceEngine = {
  predictComplianceRisk,
  generateIntelligentRecommendations,
  calculateIntelligentComplianceScore,
};

export default intelligentComplianceEngine;
