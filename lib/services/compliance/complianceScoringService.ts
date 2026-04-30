/**
 * Compliance Scoring Service
 * Advanced scoring algorithms and trend analysis
 */

import { ComplianceRecord, ComplianceViolation } from "@/types/compliance";
import { RegulatoryAuthorityNode } from "@/types/compliance-hierarchy";

// ============================================================================
// SCORING TYPES
// ============================================================================

export interface ComplianceScore {
  overall: number;
  byAuthority: Record<string, number>;
  byCategory: Record<string, number>;
  trend: ScoreTrend;
  factors: ScoreFactor[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
}

export interface ScoreTrend {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  direction: "IMPROVING" | "DECLINING" | "STABLE";
  history: TrendPoint[];
}

export interface TrendPoint {
  date: string;
  score: number;
  violations: number;
  compliant: number;
  nonCompliant: number;
}

export interface ScoreFactor {
  name: string;
  weight: number;
  score: number;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  description: string;
}

export interface ScoringWeights {
  complianceStatus: number;
  violationSeverity: number;
  violationCount: number;
  documentCompleteness: number;
  deadlineAdherence: number;
  auditHistory: number;
  riskFactors: number;
}

// ============================================================================
// DEFAULT WEIGHTS
// ============================================================================

const DEFAULT_WEIGHTS: ScoringWeights = {
  complianceStatus: 0.3, // 30% - Current compliance status
  violationSeverity: 0.25, // 25% - Severity of violations
  violationCount: 0.15, // 15% - Number of violations
  documentCompleteness: 0.1, // 10% - Document completeness
  deadlineAdherence: 0.1, // 10% - Meeting deadlines
  auditHistory: 0.05, // 5% - Audit history
  riskFactors: 0.05, // 5% - Risk factors
};

// ============================================================================
// SCORING ALGORITHMS
// ============================================================================

/**
 * Calculate comprehensive compliance score
 */
export function calculateComplianceScore(
  records: ComplianceRecord[],
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ComplianceScore {
  if (records.length === 0) {
    return {
      overall: 100,
      byAuthority: {},
      byCategory: {},
      trend: {
        current: 100,
        previous: 100,
        change: 0,
        changePercentage: 0,
        direction: "STABLE",
        history: [],
      },
      factors: [],
      riskLevel: "LOW",
      confidence: 1.0,
    };
  }

  // Factor 1: Compliance Status (30%)
  const compliantCount = records.filter((r) => r.status === "COMPLIANT").length;
  const atRiskCount = records.filter((r) => r.status === "AT_RISK").length;
  const nonCompliantCount = records.filter(
    (r) => r.status === "NON_COMPLIANT",
  ).length;
  const statusScore =
    ((compliantCount * 100 + atRiskCount * 70 + nonCompliantCount * 0) /
      records.length) *
    weights.complianceStatus;

  // Factor 2: Violation Severity (25%)
  const allViolations = records.flatMap((r) => r.violations || []);
  const criticalViolations = allViolations.filter(
    (v) => v.severity === "CRITICAL",
  ).length;
  const highViolations = allViolations.filter(
    (v) => v.severity === "HIGH",
  ).length;
  const mediumViolations = allViolations.filter(
    (v) => v.severity === "MEDIUM",
  ).length;
  const lowViolations = allViolations.filter(
    (v) => v.severity === "LOW",
  ).length;

  const severityPenalty =
    criticalViolations * 20 +
    highViolations * 10 +
    mediumViolations * 5 +
    lowViolations * 2;
  const severityScore =
    Math.max(0, 100 - severityPenalty) * weights.violationSeverity;

  // Factor 3: Violation Count (15%)
  const violationCountScore =
    Math.max(0, 100 - allViolations.length * 5) * weights.violationCount;

  // Factor 4: Document Completeness (10%)
  const recordsWithDocuments = records.filter(
    (r) => r.documents && r.documents.length > 0,
  ).length;
  const documentScore =
    (recordsWithDocuments / records.length) *
    100 *
    weights.documentCompleteness;

  // Factor 5: Deadline Adherence (10%)
  const now = new Date();
  const recordsWithDeadlines = records.filter((r) => r.deadline);
  const onTimeRecords = recordsWithDeadlines.filter((r) => {
    if (!r.deadline) return false;
    return new Date(r.deadline) >= now;
  }).length;
  const deadlineScore =
    recordsWithDeadlines.length > 0
      ? (onTimeRecords / recordsWithDeadlines.length) *
        100 *
        weights.deadlineAdherence
      : 100 * weights.deadlineAdherence;

  // Factor 6: Audit History (5%)
  const auditScore = 100 * weights.auditHistory; // Simplified - would need audit data

  // Factor 7: Risk Factors (5%)
  const riskScore = 100 * weights.riskFactors; // Simplified - would integrate with risk engine

  // Calculate overall score
  const overall = Math.min(
    100,
    Math.max(
      0,
      statusScore +
        severityScore +
        violationCountScore +
        documentScore +
        deadlineScore +
        auditScore +
        riskScore,
    ),
  );

  // Calculate by authority
  const byAuthority: Record<string, number> = {};
  const authorityGroups = new Map<string, ComplianceRecord[]>();
  records.forEach((r) => {
    if (!authorityGroups.has(r.authority)) {
      authorityGroups.set(r.authority, []);
    }
    authorityGroups.get(r.authority)!.push(r);
  });

  authorityGroups.forEach((authRecords, authority) => {
    byAuthority[authority] = calculateComplianceScore(
      authRecords,
      weights,
    ).overall;
  });

  // Calculate by category
  const byCategory: Record<string, number> = {};
  const categoryGroups = new Map<string, ComplianceRecord[]>();
  records.forEach((r) => {
    if (!categoryGroups.has(r.category)) {
      categoryGroups.set(r.category, []);
    }
    categoryGroups.get(r.category)!.push(r);
  });

  categoryGroups.forEach((catRecords, category) => {
    byCategory[category] = calculateComplianceScore(
      catRecords,
      weights,
    ).overall;
  });

  // Determine risk level
  const riskLevel =
    overall >= 90
      ? "LOW"
      : overall >= 70
        ? "MEDIUM"
        : overall >= 50
          ? "HIGH"
          : "CRITICAL";

  // Calculate confidence (based on data completeness)
  const confidence = Math.min(1.0, records.length / 10); // More records = higher confidence

  // Build factors
  const factors: ScoreFactor[] = [
    {
      name: "Compliance Status",
      weight: weights.complianceStatus,
      score: statusScore / weights.complianceStatus,
      impact:
        statusScore > 80
          ? "POSITIVE"
          : statusScore < 50
            ? "NEGATIVE"
            : "NEUTRAL",
      description: `${compliantCount} compliant, ${atRiskCount} at risk, ${nonCompliantCount} non-compliant`,
    },
    {
      name: "Violation Severity",
      weight: weights.violationSeverity,
      score: severityScore / weights.violationSeverity,
      impact: severityScore > 80 ? "POSITIVE" : "NEGATIVE",
      description: `${criticalViolations} critical, ${highViolations} high, ${mediumViolations} medium, ${lowViolations} low`,
    },
    {
      name: "Violation Count",
      weight: weights.violationCount,
      score: violationCountScore / weights.violationCount,
      impact: violationCountScore > 80 ? "POSITIVE" : "NEGATIVE",
      description: `${allViolations.length} total violations`,
    },
    {
      name: "Document Completeness",
      weight: weights.documentCompleteness,
      score: documentScore / weights.documentCompleteness,
      impact: documentScore > 80 ? "POSITIVE" : "NEGATIVE",
      description: `${recordsWithDocuments}/${records.length} records have documents`,
    },
    {
      name: "Deadline Adherence",
      weight: weights.deadlineAdherence,
      score: deadlineScore / weights.deadlineAdherence,
      impact: deadlineScore > 80 ? "POSITIVE" : "NEGATIVE",
      description: `${onTimeRecords}/${recordsWithDeadlines.length} deadlines met`,
    },
  ];

  // Calculate trend (simplified - would need historical data)
  const trend: ScoreTrend = {
    current: overall,
    previous: overall, // Would be from historical data
    change: 0,
    changePercentage: 0,
    direction: "STABLE",
    history: [],
  };

  return {
    overall,
    byAuthority,
    byCategory,
    trend,
    factors,
    riskLevel,
    confidence,
  };
}

/**
 * Calculate trend from historical data
 */
export function calculateTrend(
  currentScore: number,
  historicalScores: TrendPoint[],
): ScoreTrend {
  if (historicalScores.length === 0) {
    return {
      current: currentScore,
      previous: currentScore,
      change: 0,
      changePercentage: 0,
      direction: "STABLE",
      history: [],
    };
  }

  const previous = historicalScores[historicalScores.length - 1].score;
  const change = currentScore - previous;
  const changePercentage = previous > 0 ? (change / previous) * 100 : 0;

  let direction: "IMPROVING" | "DECLINING" | "STABLE";
  if (changePercentage > 2) {
    direction = "IMPROVING";
  } else if (changePercentage < -2) {
    direction = "DECLINING";
  } else {
    direction = "STABLE";
  }

  return {
    current: currentScore,
    previous,
    change,
    changePercentage,
    direction,
    history: historicalScores,
  };
}

/**
 * Get score breakdown
 */
export function getScoreBreakdown(score: ComplianceScore): {
  category: string;
  score: number;
  weight: number;
  contribution: number;
}[] {
  return score.factors.map((factor) => ({
    category: factor.name,
    score: factor.score,
    weight: factor.weight,
    contribution: factor.score * factor.weight,
  }));
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const complianceScoringService = {
  calculateComplianceScore,
  calculateTrend,
  getScoreBreakdown,
  DEFAULT_WEIGHTS,
};

export default complianceScoringService;
