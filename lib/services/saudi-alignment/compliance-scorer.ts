/**
 * Compliance Scorer
 *
 * Real-time compliance scoring and risk assessment
 * Generates recommendations for improvement
 *
 * @module saudi-alignment
 */

import { regulatoryTracker } from "./regulatory-tracker";
import { vision2030Mapper } from "./vision-2030-mapper";
import type {
  ComplianceScorer,
  ComplianceScore,
  ComplianceStatus,
} from "./types";

// ============================================================================
// COMPLIANCE SCORER
// ============================================================================

export class ComplianceScorerImpl implements ComplianceScorer {
  /**
   * Calculate compliance score
   */
  async calculateScore(
    entityId: string,
    entityType: string,
  ): Promise<ComplianceScore> {
    // Get compliance status
    const complianceStatus = await regulatoryTracker.checkCompliance(
      entityId,
      entityType,
    );

    // Calculate agency scores
    const agencyScores: Record<string, number> = {};
    const agencyGroups = new Map<string, ComplianceStatus["requirements"]>();

    for (const req of complianceStatus.requirements) {
      if (!agencyGroups.has(req.agency)) {
        agencyGroups.set(req.agency, []);
      }
      agencyGroups.get(req.agency)!.push(req);
    }

    for (const [agency, reqs] of agencyGroups.entries()) {
      const compliantCount = reqs.filter(
        (r) => r.status === "COMPLIANT",
      ).length;
      agencyScores[agency] =
        reqs.length > 0 ? (compliantCount / reqs.length) * 100 : 100;
    }

    // Calculate category scores
    const categoryScores: Record<string, number> = {};
    const categoryGroups = new Map<string, ComplianceStatus["requirements"]>();

    for (const req of complianceStatus.requirements) {
      const category = req.requirementTitle.split(" ")[0] || "OTHER";
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(req);
    }

    for (const [category, reqs] of categoryGroups.entries()) {
      const compliantCount = reqs.filter(
        (r) => r.status === "COMPLIANT",
      ).length;
      categoryScores[category] =
        reqs.length > 0 ? (compliantCount / reqs.length) * 100 : 100;
    }

    // Calculate overall score
    const overallScore = complianceStatus.overallCompliance;

    // Assess risk level
    const riskLevel = this.assessRisk({
      entityId,
      entityType,
      overallScore,
      agencyScores: agencyScores as any,
      categoryScores,
      riskLevel: "LOW",
      violations: [],
      recommendations: [],
      calculatedAt: new Date(),
    });

    // Identify violations
    const violations = complianceStatus.requirements
      .filter((r) => r.status !== "COMPLIANT" && r.status !== "NOT_APPLICABLE")
      .map((r) => ({
        requirementId: r.requirementId,
        requirementTitle: r.requirementTitle,
        agency: r.agency,
        severity: this.determineViolationSeverity(r.status),
        description: `Requirement "${r.requirementTitle}" is ${r.status}`,
        recommendedAction: this.getRecommendedAction(r),
        deadline: r.expiresAt ? new Date(r.expiresAt) : undefined,
      }));

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      entityId,
      entityType,
      overallScore,
      agencyScores: agencyScores as any,
      categoryScores,
      riskLevel,
      violations,
      recommendations: [],
      calculatedAt: new Date(),
    });

    return {
      entityId,
      entityType,
      overallScore,
      agencyScores: agencyScores as any,
      categoryScores,
      riskLevel,
      violations,
      recommendations,
      calculatedAt: new Date(),
    };
  }

  /**
   * Assess risk level
   */
  assessRisk(
    complianceScore: ComplianceScore,
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (complianceScore.overallScore >= 90) {
      return "LOW";
    } else if (complianceScore.overallScore >= 70) {
      return "MEDIUM";
    } else if (complianceScore.overallScore >= 50) {
      return "HIGH";
    } else {
      return "CRITICAL";
    }
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(complianceScore: ComplianceScore): string[] {
    const recommendations: string[] = [];

    // Overall score recommendations
    if (complianceScore.overallScore < 70) {
      recommendations.push(
        `Overall compliance score is ${complianceScore.overallScore.toFixed(1)}% - immediate action required`,
      );
    }

    // Agency-specific recommendations
    for (const [agency, score] of Object.entries(
      complianceScore.agencyScores,
    )) {
      if (score < 70) {
        recommendations.push(
          `${agency} compliance is ${score.toFixed(1)}% - review and address gaps`,
        );
      }
    }

    // Violation-specific recommendations
    const criticalViolations = complianceScore.violations.filter(
      (v) => v.severity === "CRITICAL",
    );
    if (criticalViolations.length > 0) {
      recommendations.push(
        `${criticalViolations.length} critical violation(s) require immediate attention`,
      );
    }

    // Expiring requirements
    const expiringSoon = complianceScore.violations.filter((v) => {
      if (!v.deadline) return false;
      const daysUntilExpiry =
        (v.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });
    if (expiringSoon.length > 0) {
      recommendations.push(
        `${expiringSoon.length} requirement(s) expiring within 30 days - renew now`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Compliance status is good - maintain current practices",
      );
    }

    return recommendations;
  }

  /**
   * Determine violation severity
   */
  private determineViolationSeverity(
    status: ComplianceStatus["requirements"][0]["status"],
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    switch (status) {
      case "EXPIRED":
        return "CRITICAL";
      case "NON_COMPLIANT":
        return "HIGH";
      case "PENDING":
        return "MEDIUM";
      default:
        return "LOW";
    }
  }

  /**
   * Get recommended action
   */
  private getRecommendedAction(
    requirement: ComplianceStatus["requirements"][0],
  ): string {
    switch (requirement.status) {
      case "EXPIRED":
        return `Renew ${requirement.requirementTitle} immediately - expired`;
      case "NON_COMPLIANT":
        return `Address compliance gaps for ${requirement.requirementTitle}`;
      case "PENDING":
        return `Complete verification for ${requirement.requirementTitle}`;
      default:
        return "Maintain compliance";
    }
  }
}

// Export singleton
export const complianceScorer: ComplianceScorer = new ComplianceScorerImpl();
