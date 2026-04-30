/**
 * Proposal Compliance Integration Service
 * Validates proposals against regulatory requirements, ensures compliance,
 * and integrates with the Compliance Module for comprehensive governance
 */

import { complianceService } from "@/lib/services/compliance/complianceService";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-bus";
import type { Proposal } from "@/types/proposals";
import type {
  RegulatoryRequirement,
  ComplianceRecord,
  ComplianceStatus,
} from "@/types/compliance";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalComplianceCheck {
  proposalId: string;
  compliant: boolean;
  complianceScore: number; // 0-100
  requirements: Array<{
    requirementId: string;
    requirementCode: string;
    requirementTitle: string;
    compliant: boolean;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    violations: string[];
    recommendations: string[];
    evidence: string[];
  }>;
  missingDocuments: string[];
  missingCertifications: string[];
  regulatoryGaps: string[];
  recommendations: string[];
  checkedAt: Date | string;
  checkedBy?: string;
}

export interface ProposalComplianceValidation {
  proposalId: string;
  validationStatus:
    | "COMPLIANT"
    | "PARTIALLY_COMPLIANT"
    | "NON_COMPLIANT"
    | "PENDING";
  overallScore: number; // 0-100
  checks: ProposalComplianceCheck[];
  criticalIssues: number;
  highPriorityIssues: number;
  mediumPriorityIssues: number;
  lowPriorityIssues: number;
  autoApproved: boolean;
  requiresManualReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  validatedAt: Date | string;
}

// ============================================================================
// COMPLIANCE INTEGRATION SERVICE
// ============================================================================

class ProposalComplianceIntegration {
  private complianceChecks: Map<string, ProposalComplianceCheck> = new Map();
  private validations: Map<string, ProposalComplianceValidation> = new Map();

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    eventBus.subscribe(
      "proposals.proposal.created",
      async (event: DomainEvent) => {
        await this.handleProposalCreated(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.updated",
      async (event: DomainEvent) => {
        await this.handleProposalUpdated(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.sent",
      async (event: DomainEvent) => {
        await this.handleProposalSent(event);
      },
    );
  }

  /**
   * Perform comprehensive compliance check on proposal
   */
  async checkProposalCompliance(
    proposal: Proposal,
    tenantId: string,
    userId?: string,
  ): Promise<ProposalComplianceCheck> {
    const requirements: ProposalComplianceCheck["requirements"] = [];
    const missingDocuments: string[] = [];
    const missingCertifications: string[] = [];
    const regulatoryGaps: string[] = [];
    const recommendations: string[] = [];

    // Get applicable regulatory requirements
    const applicableRequirements = await this.getApplicableRequirements(
      proposal,
      tenantId,
    );

    // Check each requirement
    for (const requirement of applicableRequirements) {
      const check = await this.checkRequirement(
        proposal,
        requirement,
        tenantId,
      );
      requirements.push(check);

      if (!check.compliant) {
        if (check.severity === "CRITICAL" || check.severity === "HIGH") {
          regulatoryGaps.push(check.requirementTitle);
        }
        recommendations.push(...check.recommendations);
      }
    }

    // Check for required documents
    const documentCheck = await this.checkRequiredDocuments(proposal, tenantId);
    missingDocuments.push(...documentCheck.missing);

    // Check for required certifications
    const certificationCheck = await this.checkRequiredCertifications(
      proposal,
      tenantId,
    );
    missingCertifications.push(...certificationCheck.missing);

    // Calculate compliance score
    const compliantCount = requirements.filter((r) => r.compliant).length;
    const totalCount = requirements.length;
    const complianceScore =
      totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 100;

    // Determine overall compliance
    const criticalViolations = requirements.filter(
      (r) => !r.compliant && r.severity === "CRITICAL",
    );
    const compliant = criticalViolations.length === 0 && complianceScore >= 80;

    const complianceCheck: ProposalComplianceCheck = {
      proposalId: proposal.id,
      compliant,
      complianceScore,
      requirements,
      missingDocuments,
      missingCertifications,
      regulatoryGaps,
      recommendations,
      checkedAt: new Date().toISOString(),
      checkedBy: userId,
    };

    // Store check
    this.complianceChecks.set(proposal.id, complianceCheck);

    // Record evidence
    await evidenceService.recordEvidence({
      entityType: "PROPOSAL_COMPLIANCE_CHECK",
      entityId: proposal.id,
      action: "COMPLIANCE_CHECKED",
      actorId: userId || "system",
      actorType: "USER",
      metadata: {
        compliant,
        complianceScore,
        criticalIssues: criticalViolations.length,
        totalRequirements: totalCount,
      },
      tenantId,
    });

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.compliance.checked",
      aggregateId: proposal.id,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        proposalId: proposal.id,
        compliant,
        complianceScore,
        criticalIssues: criticalViolations.length,
      },
    });

    return complianceCheck;
  }

  /**
   * Validate proposal for compliance (comprehensive validation)
   */
  async validateProposalCompliance(
    proposal: Proposal,
    tenantId: string,
    userId?: string,
  ): Promise<ProposalComplianceValidation> {
    // Perform all compliance checks
    const checks: ProposalComplianceCheck[] = [];

    // Main compliance check
    const mainCheck = await this.checkProposalCompliance(
      proposal,
      tenantId,
      userId,
    );
    checks.push(mainCheck);

    // Additional specialized checks
    const pricingCheck = await this.checkPricingCompliance(proposal, tenantId);
    if (pricingCheck) checks.push(pricingCheck);

    const termsCheck = await this.checkTermsCompliance(proposal, tenantId);
    if (termsCheck) checks.push(termsCheck);

    // Aggregate results
    const allRequirements = checks.flatMap((c) => c.requirements);
    const criticalIssues = allRequirements.filter(
      (r) => !r.compliant && r.severity === "CRITICAL",
    ).length;
    const highPriorityIssues = allRequirements.filter(
      (r) => !r.compliant && r.severity === "HIGH",
    ).length;
    const mediumPriorityIssues = allRequirements.filter(
      (r) => !r.compliant && r.severity === "MEDIUM",
    ).length;
    const lowPriorityIssues = allRequirements.filter(
      (r) => !r.compliant && r.severity === "LOW",
    ).length;

    // Calculate overall score (weighted average)
    const totalScore = checks.reduce((sum, c) => sum + c.complianceScore, 0);
    const overallScore = Math.round(totalScore / checks.length);

    // Determine validation status
    let validationStatus: ProposalComplianceValidation["validationStatus"];
    if (criticalIssues > 0) {
      validationStatus = "NON_COMPLIANT";
    } else if (highPriorityIssues > 0 || overallScore < 80) {
      validationStatus = "PARTIALLY_COMPLIANT";
    } else if (overallScore >= 95) {
      validationStatus = "COMPLIANT";
    } else {
      validationStatus = "PENDING";
    }

    // Auto-approval logic (only for low-risk proposals)
    const autoApproved =
      validationStatus === "COMPLIANT" &&
      criticalIssues === 0 &&
      highPriorityIssues === 0 &&
      overallScore >= 95;

    const requiresManualReview =
      !autoApproved &&
      (criticalIssues > 0 || highPriorityIssues > 0 || overallScore < 90);

    const validation: ProposalComplianceValidation = {
      proposalId: proposal.id,
      validationStatus,
      overallScore,
      checks,
      criticalIssues,
      highPriorityIssues,
      mediumPriorityIssues,
      lowPriorityIssues,
      autoApproved,
      requiresManualReview,
      validatedAt: new Date().toISOString(),
    };

    // Store validation
    this.validations.set(proposal.id, validation);

    // Create compliance record
    await this.createComplianceRecord(proposal, validation, tenantId, userId);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.compliance.validated",
      aggregateId: proposal.id,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        proposalId: proposal.id,
        validationStatus,
        overallScore,
        autoApproved,
        requiresManualReview,
      },
    });

    return validation;
  }

  /**
   * Get compliance check for proposal
   */
  async getComplianceCheck(
    proposalId: string,
  ): Promise<ProposalComplianceCheck | null> {
    return this.complianceChecks.get(proposalId) || null;
  }

  /**
   * Get compliance validation for proposal
   */
  async getComplianceValidation(
    proposalId: string,
  ): Promise<ProposalComplianceValidation | null> {
    return this.validations.get(proposalId) || null;
  }

  /**
   * Get applicable regulatory requirements for proposal
   */
  private async getApplicableRequirements(
    proposal: Proposal,
    tenantId: string,
  ): Promise<RegulatoryRequirement[]> {
    // In production, would query compliance service
    // For now, return common requirements based on proposal type

    const requirements: RegulatoryRequirement[] = [];

    // Check service categories in proposal
    const serviceCategories = proposal.services?.map((s) => s.category) || [];

    // Transportation requirements
    if (
      serviceCategories.includes("TRANSPORTATION") ||
      serviceCategories.includes("FREIGHT_FORWARDING")
    ) {
      // Would fetch TGA, MOT requirements
    }

    // Customs requirements
    if (
      serviceCategories.includes("CUSTOMS") ||
      serviceCategories.includes("CLEARANCE")
    ) {
      // Would fetch ZATCA, customs requirements
    }

    // Warehousing requirements
    if (
      serviceCategories.includes("WAREHOUSING") ||
      serviceCategories.includes("STORAGE")
    ) {
      // Would fetch MODON, warehousing requirements
    }

    // General business requirements
    // Would fetch general regulatory requirements

    return requirements;
  }

  /**
   * Check single requirement compliance
   */
  private async checkRequirement(
    proposal: Proposal,
    requirement: RegulatoryRequirement,
    tenantId: string,
  ): Promise<ProposalComplianceCheck["requirements"][0]> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    const evidence: string[] = [];

    // Check if requirement is met
    let compliant = true;

    // Check validation criteria
    for (const criteria of requirement.validationCriteria || []) {
      const meetsCriteria = await this.evaluateCriteria(
        proposal,
        criteria,
        tenantId,
      );
      if (!meetsCriteria) {
        compliant = false;
        violations.push(criteria.description || criteria.field);
        recommendations.push(
          `Address ${criteria.field}: ${criteria.description}`,
        );
      } else {
        // Get evidence for this criteria
        const evidenceList = await evidenceService.getEvidence({
          entityType: "PROPOSAL",
          entityId: proposal.id,
          tenantId,
        });
        evidence.push(...evidenceList.map((e) => e.id));
      }
    }

    // Determine severity based on requirement priority
    let severity: ProposalComplianceCheck["requirements"][0]["severity"] =
      "LOW";
    if (requirement.priority === "CRITICAL") {
      severity = "CRITICAL";
    } else if (requirement.priority === "HIGH") {
      severity = "HIGH";
    } else if (requirement.priority === "MEDIUM") {
      severity = "MEDIUM";
    }

    return {
      requirementId: requirement.id,
      requirementCode: requirement.code,
      requirementTitle: requirement.title,
      compliant,
      severity,
      violations,
      recommendations,
      evidence,
    };
  }

  /**
   * Evaluate validation criteria
   */
  private async evaluateCriteria(
    proposal: Proposal,
    criteria: any,
    tenantId: string,
  ): Promise<boolean> {
    // In production, would evaluate criteria against proposal data
    // For now, return true (would implement actual validation logic)
    return true;
  }

  /**
   * Check required documents
   */
  private async checkRequiredDocuments(
    proposal: Proposal,
    tenantId: string,
  ): Promise<{ missing: string[]; present: string[] }> {
    const missing: string[] = [];
    const present: string[] = [];

    // Check if proposal has required attachments
    const attachments = proposal.attachments || [];

    // Would check against regulatory document requirements
    // For now, return empty arrays

    return { missing, present };
  }

  /**
   * Check required certifications
   */
  private async checkRequiredCertifications(
    proposal: Proposal,
    tenantId: string,
  ): Promise<{ missing: string[]; present: string[] }> {
    const missing: string[] = [];
    const present: string[] = [];

    // Would check against regulatory certification requirements
    // For now, return empty arrays

    return { missing, present };
  }

  /**
   * Check pricing compliance
   */
  private async checkPricingCompliance(
    proposal: Proposal,
    tenantId: string,
  ): Promise<ProposalComplianceCheck | null> {
    // Would check pricing against regulatory requirements
    // (e.g., minimum pricing, fair pricing, anti-dumping)
    return null;
  }

  /**
   * Check terms compliance
   */
  private async checkTermsCompliance(
    proposal: Proposal,
    tenantId: string,
  ): Promise<ProposalComplianceCheck | null> {
    // Would check terms against regulatory requirements
    // (e.g., payment terms, delivery terms, liability terms)
    return null;
  }

  /**
   * Create compliance record
   */
  private async createComplianceRecord(
    proposal: Proposal,
    validation: ProposalComplianceValidation,
    tenantId: string,
    userId?: string,
  ): Promise<void> {
    try {
      // Create compliance record in compliance service
      await complianceService.createComplianceRecord({
        tenantId,
        requirementId: "PROPOSAL_COMPLIANCE", // Would be actual requirement ID
        entityType: "PROPOSAL",
        entityId: proposal.id,
        status:
          validation.validationStatus === "COMPLIANT"
            ? "COMPLIANT"
            : validation.validationStatus === "NON_COMPLIANT"
              ? "NON_COMPLIANT"
              : "PENDING",
        complianceScore: validation.overallScore,
        findings: validation.checks.flatMap((c) =>
          c.requirements
            .filter((r) => !r.compliant)
            .map((r) => ({
              type: "VIOLATION",
              severity: r.severity,
              description: `${r.requirementTitle}: ${r.violations.join(", ")}`,
              recommendation: r.recommendations.join("; "),
            })),
        ),
        evidence: validation.checks.flatMap((c) =>
          c.requirements.flatMap((r) => r.evidence),
        ),
        metadata: {
          proposalId: proposal.id,
          autoApproved: validation.autoApproved,
          requiresManualReview: validation.requiresManualReview,
        },
        createdBy: userId || "system",
      });
    } catch (error) {
      console.error("Error creating compliance record:", error);
      // Don't throw - compliance record creation is not critical
    }
  }

  /**
   * Event handlers
   */
  private async handleProposalCreated(event: DomainEvent): Promise<void> {
    // Auto-check compliance on creation
    const proposal = event.payload as Proposal;
    if (proposal) {
      await this.checkProposalCompliance(
        proposal,
        event.tenantId || "",
        event.userId,
      );
    }
  }

  private async handleProposalUpdated(event: DomainEvent): Promise<void> {
    // Re-check compliance on update
    const proposal = event.payload as Proposal;
    if (proposal) {
      await this.checkProposalCompliance(
        proposal,
        event.tenantId || "",
        event.userId,
      );
    }
  }

  private async handleProposalSent(event: DomainEvent): Promise<void> {
    // Validate compliance before sending
    const proposal = event.payload as Proposal;
    if (proposal) {
      await this.validateProposalCompliance(
        proposal,
        event.tenantId || "",
        event.userId,
      );
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const proposalComplianceIntegration =
  new ProposalComplianceIntegration();
