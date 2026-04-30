/**
 * Proposal Liability Integration Service
 * Deep integration with Liability Engine for risk assessment and insurance optimization
 * Ensures proposals are liability-aware, insurance-optimized, and risk-compliant
 *
 * VISION 2040 ALIGNED: AI-powered risk assessment, insurance premium optimization
 */

import { liabilityEngine } from "@/lib/services/liability/liabilityEngine";
import { eventStore } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type { Proposal } from "@/types/proposals";
import type { LiabilityAssessment, LiabilityRule } from "@/types/liability";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalLiabilityAssessment {
  proposalId: string;
  assessmentId: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactors: Array<{
    factor: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    description: string;
    mitigation: string;
  }>;
  liabilityExposure: {
    potentialExposure: number;
    currency: string;
    exposureType: "CONTRACTUAL" | "TORTIOUS" | "PRODUCT" | "PROFESSIONAL";
    coverageRequired: boolean;
  };
  insurance: {
    recommendedCoverage: {
      type: string;
      minimumAmount: number;
      recommendedAmount: number;
      currency: string;
    }[];
    premiumImpact: {
      currentPremium: number;
      estimatedPremium: number;
      change: number;
      changePercent: number;
    };
    claimHistory: {
      similarProposals: number;
      claimRate: number;
      averageClaimAmount: number;
    };
  };
  compliance: {
    compliant: boolean;
    violations: string[];
    requiredActions: string[];
    regulatoryRequirements: string[];
  };
  recommendations: Array<{
    priority: "HIGH" | "MEDIUM" | "LOW";
    category: "LIABILITY" | "INSURANCE" | "COMPLIANCE" | "RISK";
    recommendation: string;
    impact: string;
    implementation: string;
  }>;
  assessedAt: Date | string;
  assessedBy: string;
}

export interface ProposalInsuranceOptimization {
  proposalId: string;
  currentInsurance: {
    coverage: number;
    premium: number;
    deductible: number;
  };
  optimizedInsurance: {
    coverage: number;
    premium: number;
    deductible: number;
    savings: number;
    savingsPercent: number;
  };
  riskMitigation: {
    measures: string[];
    impact: string;
    premiumReduction: number;
  };
  recommendations: string[];
}

// ============================================================================
// PROPOSAL LIABILITY INTEGRATION SERVICE
// ============================================================================

class ProposalLiabilityIntegration {
  private static instance: ProposalLiabilityIntegration;

  static getInstance(): ProposalLiabilityIntegration {
    if (!ProposalLiabilityIntegration.instance) {
      ProposalLiabilityIntegration.instance =
        new ProposalLiabilityIntegration();
    }
    return ProposalLiabilityIntegration.instance;
  }

  /**
   * Assess proposal liability and risk
   */
  async assessProposalLiability(
    proposal: Proposal,
    tenantId: string,
    assessedBy: string,
  ): Promise<ProposalLiabilityAssessment> {
    // Extract risk factors from proposal
    const riskFactors = this.extractRiskFactors(proposal);

    // Calculate liability exposure
    const liabilityExposure = this.calculateLiabilityExposure(
      proposal,
      riskFactors,
    );

    // Assess insurance requirements
    const insurance = await this.assessInsuranceRequirements(
      proposal,
      liabilityExposure,
      tenantId,
    );

    // Check compliance
    const compliance = await this.checkCompliance(proposal, tenantId);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      proposal,
      riskFactors,
      liabilityExposure,
      insurance,
      compliance,
    );

    // Determine overall risk level
    const riskLevel = this.determineRiskLevel(
      riskFactors,
      liabilityExposure,
      compliance,
    );

    const assessment: ProposalLiabilityAssessment = {
      proposalId: proposal.id,
      assessmentId: `liability-assessment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      riskLevel,
      riskFactors,
      liabilityExposure,
      insurance,
      compliance,
      recommendations,
      assessedAt: new Date().toISOString(),
      assessedBy,
    };

    // Store assessment in knowledge base for learning
    await knowledgeBaseService.create({
      type: "liability_assessment",
      category: "proposal_risk",
      content: JSON.stringify(assessment),
      metadata: {
        proposalId: proposal.id,
        riskLevel,
        assessedBy,
      },
      source: "proposals-rfq",
      sourceId: assessment.assessmentId,
      confidence: 90,
      verified: true,
      keywords: [
        "liability",
        "risk",
        "insurance",
        "compliance",
        riskLevel.toLowerCase(),
      ],
      searchableText: `proposal liability assessment risk ${riskLevel} insurance compliance`,
    });

    // Publish event
    await eventStore.publish({
      type: "proposals.liability.assessed",
      aggregateId: proposal.id,
      aggregateType: "Proposal",
      payload: {
        assessmentId: assessment.assessmentId,
        riskLevel,
        proposalId: proposal.id,
      },
      metadata: {
        tenantId,
        userId: assessedBy,
        timestamp: new Date().toISOString(),
      },
    });

    return assessment;
  }

  /**
   * Optimize insurance for proposal
   */
  async optimizeInsurance(
    proposal: Proposal,
    assessment: ProposalLiabilityAssessment,
    tenantId: string,
  ): Promise<ProposalInsuranceOptimization> {
    // Get current insurance baseline
    const currentInsurance = await this.getCurrentInsuranceBaseline(tenantId);

    // Calculate optimized insurance based on risk mitigation
    const riskMitigation = this.calculateRiskMitigation(assessment);
    const optimizedInsurance = this.calculateOptimizedInsurance(
      currentInsurance,
      assessment,
      riskMitigation,
    );

    const optimization: ProposalInsuranceOptimization = {
      proposalId: proposal.id,
      currentInsurance,
      optimizedInsurance,
      riskMitigation,
      recommendations: this.generateInsuranceRecommendations(
        assessment,
        riskMitigation,
      ),
    };

    // Store optimization in knowledge base
    await knowledgeBaseService.create({
      type: "insurance_optimization",
      category: "proposal_insurance",
      content: JSON.stringify(optimization),
      metadata: {
        proposalId: proposal.id,
        savings: optimizedInsurance.savings,
      },
      source: "proposals-rfq",
      sourceId: proposal.id,
      confidence: 85,
      verified: true,
      keywords: ["insurance", "optimization", "premium", "savings"],
      searchableText: `insurance optimization premium savings ${optimizedInsurance.savingsPercent}%`,
    });

    return optimization;
  }

  /**
   * Extract risk factors from proposal
   */
  private extractRiskFactors(
    proposal: Proposal,
  ): ProposalLiabilityAssessment["riskFactors"] {
    const factors: ProposalLiabilityAssessment["riskFactors"] = [];

    // High-value proposals = higher risk
    if (proposal.totalAmount && proposal.totalAmount > 1000000) {
      factors.push({
        factor: "High Value Proposal",
        severity: "MEDIUM",
        description: `Proposal value exceeds ${proposal.totalAmount} ${proposal.currency}`,
        mitigation: "Ensure adequate insurance coverage and liability caps",
      });
    }

    // Missing terms = higher risk
    const hasTerms = proposal.sections.some((s) => s.type === "TERMS");
    if (!hasTerms) {
      factors.push({
        factor: "Missing Terms & Conditions",
        severity: "HIGH",
        description: "Proposal does not include terms and conditions section",
        mitigation: "Add comprehensive terms and conditions section",
      });
    }

    // Missing signature = higher risk
    if (!proposal.signature) {
      factors.push({
        factor: "No Digital Signature",
        severity: "MEDIUM",
        description: "Proposal does not require digital signature",
        mitigation: "Require digital signature for legal protection",
      });
    }

    // Long validity period = higher risk
    if (proposal.validUntil) {
      const validDays = Math.ceil(
        (new Date(proposal.validUntil).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (validDays > 90) {
        factors.push({
          factor: "Extended Validity Period",
          severity: "LOW",
          description: `Proposal valid for ${validDays} days`,
          mitigation:
            "Consider shorter validity period or price adjustment clause",
        });
      }
    }

    // Service-specific risks
    if (proposal.type === "QUOTE_PROPOSAL") {
      factors.push({
        factor: "Quote Proposal Risk",
        severity: "LOW",
        description: "Quote proposals may have pricing volatility",
        mitigation: "Include price adjustment clauses and validity terms",
      });
    }

    return factors;
  }

  /**
   * Calculate liability exposure
   */
  private calculateLiabilityExposure(
    proposal: Proposal,
    riskFactors: ProposalLiabilityAssessment["riskFactors"],
  ): ProposalLiabilityAssessment["liabilityExposure"] {
    const baseExposure = proposal.totalAmount || 0;
    const riskMultiplier = this.calculateRiskMultiplier(riskFactors);
    const potentialExposure = baseExposure * riskMultiplier;

    // Determine exposure type based on proposal type
    let exposureType: ProposalLiabilityAssessment["liabilityExposure"]["exposureType"] =
      "CONTRACTUAL";
    if (proposal.type.includes("SERVICE")) {
      exposureType = "PROFESSIONAL";
    } else if (proposal.type.includes("PRODUCT")) {
      exposureType = "PRODUCT";
    }

    return {
      potentialExposure,
      currency: proposal.currency || "SAR",
      exposureType,
      coverageRequired: potentialExposure > 10000, // Require coverage for exposures > 10K
    };
  }

  /**
   * Calculate risk multiplier based on factors
   */
  private calculateRiskMultiplier(
    riskFactors: ProposalLiabilityAssessment["riskFactors"],
  ): number {
    let multiplier = 1.0;
    for (const factor of riskFactors) {
      switch (factor.severity) {
        case "CRITICAL":
          multiplier += 0.5;
          break;
        case "HIGH":
          multiplier += 0.3;
          break;
        case "MEDIUM":
          multiplier += 0.15;
          break;
        case "LOW":
          multiplier += 0.05;
          break;
      }
    }
    return Math.min(multiplier, 3.0); // Cap at 3x
  }

  /**
   * Assess insurance requirements
   */
  private async assessInsuranceRequirements(
    proposal: Proposal,
    liabilityExposure: ProposalLiabilityAssessment["liabilityExposure"],
    tenantId: string,
  ): Promise<ProposalLiabilityAssessment["insurance"]> {
    // Get historical claim data
    const claimHistory = await this.getClaimHistory(proposal.type, tenantId);

    // Calculate recommended coverage
    const recommendedCoverage = [
      {
        type: "Professional Indemnity",
        minimumAmount: liabilityExposure.potentialExposure * 0.5,
        recommendedAmount: liabilityExposure.potentialExposure * 1.5,
        currency: liabilityExposure.currency,
      },
      {
        type: "General Liability",
        minimumAmount: liabilityExposure.potentialExposure * 0.3,
        recommendedAmount: liabilityExposure.potentialExposure,
        currency: liabilityExposure.currency,
      },
    ];

    // Calculate premium impact
    const currentPremium = await this.getCurrentPremium(tenantId);
    const estimatedPremium = this.estimatePremium(
      recommendedCoverage,
      claimHistory,
      liabilityExposure,
    );
    const premiumChange = estimatedPremium - currentPremium;
    const premiumChangePercent =
      currentPremium > 0 ? (premiumChange / currentPremium) * 100 : 0;

    return {
      recommendedCoverage,
      premiumImpact: {
        currentPremium,
        estimatedPremium,
        change: premiumChange,
        changePercent: premiumChangePercent,
      },
      claimHistory,
    };
  }

  /**
   * Check compliance
   */
  private async checkCompliance(
    proposal: Proposal,
    tenantId: string,
  ): Promise<ProposalLiabilityAssessment["compliance"]> {
    const violations: string[] = [];
    const requiredActions: string[] = [];
    const regulatoryRequirements: string[] = [];

    // Check for required sections
    const requiredSections = ["TERMS", "PRICING"];
    for (const required of requiredSections) {
      if (!proposal.sections.some((s) => s.type === required)) {
        violations.push(`Missing required section: ${required}`);
        requiredActions.push(`Add ${required} section to proposal`);
      }
    }

    // Check for signature requirement for high-value proposals
    if (
      proposal.totalAmount &&
      proposal.totalAmount > 50000 &&
      !proposal.signature
    ) {
      violations.push("High-value proposal requires digital signature");
      requiredActions.push("Enable digital signature requirement");
    }

    // Check regulatory requirements based on proposal type
    if (
      proposal.type.includes("CUSTOMS") ||
      proposal.type.includes("CLEARANCE")
    ) {
      regulatoryRequirements.push("Customs clearance compliance required");
      regulatoryRequirements.push("Trade compliance verification required");
    }

    return {
      compliant: violations.length === 0,
      violations,
      requiredActions,
      regulatoryRequirements,
    };
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    proposal: Proposal,
    riskFactors: ProposalLiabilityAssessment["riskFactors"],
    liabilityExposure: ProposalLiabilityAssessment["liabilityExposure"],
    insurance: ProposalLiabilityAssessment["insurance"],
    compliance: ProposalLiabilityAssessment["compliance"],
  ): Promise<ProposalLiabilityAssessment["recommendations"]> {
    const recommendations: ProposalLiabilityAssessment["recommendations"] = [];

    // High-risk factor recommendations
    const highRiskFactors = riskFactors.filter(
      (f) => f.severity === "HIGH" || f.severity === "CRITICAL",
    );
    for (const factor of highRiskFactors) {
      recommendations.push({
        priority: factor.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
        category: "RISK",
        recommendation: factor.mitigation,
        impact: `Reduces ${factor.factor} risk`,
        implementation: `Update proposal to address ${factor.factor}`,
      });
    }

    // Insurance recommendations
    if (insurance.premiumImpact.changePercent > 10) {
      recommendations.push({
        priority: "MEDIUM",
        category: "INSURANCE",
        recommendation:
          "Consider risk mitigation measures to reduce insurance premium",
        impact: `Could reduce premium by up to ${insurance.premiumImpact.changePercent.toFixed(1)}%`,
        implementation: "Implement recommended risk mitigation measures",
      });
    }

    // Compliance recommendations
    if (!compliance.compliant) {
      recommendations.push({
        priority: "HIGH",
        category: "COMPLIANCE",
        recommendation: "Address compliance violations before sending proposal",
        impact: "Ensures legal protection and reduces liability exposure",
        implementation: compliance.requiredActions.join("; "),
      });
    }

    // Liability cap recommendations
    if (liabilityExposure.potentialExposure > 100000) {
      recommendations.push({
        priority: "HIGH",
        category: "LIABILITY",
        recommendation: "Include liability cap clause in proposal",
        impact: "Limits maximum liability exposure",
        implementation: "Add liability cap section to terms and conditions",
      });
    }

    return recommendations;
  }

  /**
   * Determine overall risk level
   */
  private determineRiskLevel(
    riskFactors: ProposalLiabilityAssessment["riskFactors"],
    liabilityExposure: ProposalLiabilityAssessment["liabilityExposure"],
    compliance: ProposalLiabilityAssessment["compliance"],
  ): ProposalLiabilityAssessment["riskLevel"] {
    const criticalFactors = riskFactors.filter(
      (f) => f.severity === "CRITICAL",
    ).length;
    const highFactors = riskFactors.filter((f) => f.severity === "HIGH").length;
    const exposureHigh = liabilityExposure.potentialExposure > 500000;
    const nonCompliant = !compliance.compliant;

    if (
      criticalFactors > 0 ||
      (highFactors >= 2 && exposureHigh) ||
      (nonCompliant && exposureHigh)
    ) {
      return "CRITICAL";
    }
    if (highFactors > 0 || exposureHigh || nonCompliant) {
      return "HIGH";
    }
    if (
      riskFactors.length > 0 ||
      liabilityExposure.potentialExposure > 100000
    ) {
      return "MEDIUM";
    }
    return "LOW";
  }

  /**
   * Calculate risk mitigation
   */
  private calculateRiskMitigation(
    assessment: ProposalLiabilityAssessment,
  ): ProposalInsuranceOptimization["riskMitigation"] {
    const measures: string[] = [];
    let premiumReduction = 0;

    // Add terms and conditions
    if (assessment.compliance.violations.some((v) => v.includes("Terms"))) {
      measures.push("Add comprehensive terms and conditions");
      premiumReduction += 5;
    }

    // Add liability cap
    if (assessment.liabilityExposure.potentialExposure > 100000) {
      measures.push("Include liability cap clause");
      premiumReduction += 10;
    }

    // Add digital signature
    if (assessment.compliance.violations.some((v) => v.includes("signature"))) {
      measures.push("Require digital signature");
      premiumReduction += 3;
    }

    // Address high-risk factors
    const highRiskFactors = assessment.riskFactors.filter(
      (f) => f.severity === "HIGH" || f.severity === "CRITICAL",
    );
    for (const factor of highRiskFactors) {
      measures.push(factor.mitigation);
      premiumReduction += 5;
    }

    return {
      measures,
      impact: `Reduces insurance premium by approximately ${premiumReduction}%`,
      premiumReduction,
    };
  }

  /**
   * Calculate optimized insurance
   */
  private calculateOptimizedInsurance(
    current: ProposalInsuranceOptimization["currentInsurance"],
    assessment: ProposalLiabilityAssessment,
    riskMitigation: ProposalInsuranceOptimization["riskMitigation"],
  ): ProposalInsuranceOptimization["optimizedInsurance"] {
    const basePremium = assessment.insurance.premiumImpact.estimatedPremium;
    const reduction = (basePremium * riskMitigation.premiumReduction) / 100;
    const optimizedPremium = Math.max(
      basePremium - reduction,
      basePremium * 0.7,
    ); // Minimum 30% reduction

    return {
      coverage: assessment.insurance.recommendedCoverage[0].recommendedAmount,
      premium: optimizedPremium,
      deductible: current.deductible,
      savings: basePremium - optimizedPremium,
      savingsPercent: ((basePremium - optimizedPremium) / basePremium) * 100,
    };
  }

  /**
   * Generate insurance recommendations
   */
  private generateInsuranceRecommendations(
    assessment: ProposalLiabilityAssessment,
    riskMitigation: ProposalInsuranceOptimization["riskMitigation"],
  ): string[] {
    const recommendations: string[] = [];

    if (riskMitigation.measures.length > 0) {
      recommendations.push(
        `Implement risk mitigation measures: ${riskMitigation.measures.join(", ")}`,
      );
      recommendations.push(
        `Expected premium reduction: ${riskMitigation.premiumReduction}%`,
      );
    }

    if (assessment.insurance.premiumImpact.changePercent > 0) {
      recommendations.push(
        `Consider bundling with existing policies to reduce premium impact`,
      );
    }

    if (assessment.riskLevel === "LOW" || assessment.riskLevel === "MEDIUM") {
      recommendations.push(
        `Low to medium risk profile - negotiate better premium rates`,
      );
    }

    return recommendations;
  }

  /**
   * Get current insurance baseline
   */
  private async getCurrentInsuranceBaseline(
    tenantId: string,
  ): Promise<ProposalInsuranceOptimization["currentInsurance"]> {
    // In real implementation, fetch from insurance service
    return {
      coverage: 1000000,
      premium: 50000,
      deductible: 10000,
    };
  }

  /**
   * Get claim history
   */
  private async getClaimHistory(
    proposalType: string,
    tenantId: string,
  ): Promise<ProposalLiabilityAssessment["insurance"]["claimHistory"]> {
    // In real implementation, fetch from liability service
    return {
      similarProposals: 50,
      claimRate: 0.02, // 2%
      averageClaimAmount: 25000,
    };
  }

  /**
   * Get current premium
   */
  private async getCurrentPremium(tenantId: string): Promise<number> {
    // In real implementation, fetch from insurance service
    return 50000;
  }

  /**
   * Estimate premium
   */
  private estimatePremium(
    coverage: ProposalLiabilityAssessment["insurance"]["recommendedCoverage"],
    claimHistory: ProposalLiabilityAssessment["insurance"]["claimHistory"],
    liabilityExposure: ProposalLiabilityAssessment["liabilityExposure"],
  ): number {
    const basePremium = coverage[0].recommendedAmount * 0.05; // 5% of coverage
    const riskAdjustment = claimHistory.claimRate * 100; // Adjust for claim rate
    return basePremium + (basePremium * riskAdjustment) / 100;
  }
}

export const proposalLiabilityIntegration =
  ProposalLiabilityIntegration.getInstance();
