/**
 * Liability Engine
 * Automatically assesses liability from damage photos and context
 * Determines fault, calculates claims, tracks compliance
 */

import { selfLearningVisionService } from "../ai/vision/v2/selfLearningVisionService";
import { eventBus } from "../event-bus";

// ============================================================================
// TYPES
// ============================================================================

export type LiabilityParty =
  | "warehouse"
  | "carrier"
  | "supplier"
  | "customer"
  | "third_party"
  | "shared"
  | "undetermined";

export type LiabilityStatus =
  | "pending"
  | "assessed"
  | "disputed"
  | "resolved"
  | "closed";

export interface LiabilityAssessment {
  id: string;
  damageRecordId: string;
  assessmentDate: Date | string;

  // Parties involved
  parties: {
    warehouse?: { name: string; percentage: number };
    carrier?: { name: string; percentage: number };
    supplier?: { name: string; percentage: number };
    customer?: { name: string; percentage: number };
    thirdParty?: { name: string; percentage: number };
  };

  // Primary fault
  primaryFault: LiabilityParty;
  faultPercentage: Record<LiabilityParty, number>;

  // Assessment details
  assessmentDetails: {
    damageAnalysis: string;
    rootCause: string;
    contributingFactors: string[];
    evidence: string[];
  };

  // Financial impact
  financialImpact: {
    totalValue: number;
    claimableAmount: number;
    deductible: number;
    netClaim: number;
    currency: string;
  };

  // Insurance
  insurance: {
    claimable: boolean;
    claimNumber?: string;
    insuranceProvider?: string;
    policyNumber?: string;
    claimStatus?:
      | "not_submitted"
      | "submitted"
      | "approved"
      | "rejected"
      | "pending";
  };

  // Legal compliance
  compliance: {
    compliant: boolean;
    violations: string[];
    requiredActions: string[];
    regulatoryRequirements: string[];
  };

  // Status
  status: LiabilityStatus;
  assessedBy?: string;
  reviewedBy?: string;
  notes?: string;

  // Metadata
  tenantId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LiabilityRule {
  id: string;
  name: string;
  description: string;
  conditions: LiabilityRuleCondition[];
  actions: LiabilityRuleAction[];
  priority: number;
  enabled: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LiabilityRuleCondition {
  field: string; // 'damageType', 'area', 'equipment', 'carrier', etc.
  operator:
    | "equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: any;
}

export interface LiabilityRuleAction {
  type:
    | "assign_fault"
    | "calculate_percentage"
    | "set_claimable"
    | "add_violation"
    | "require_action";
  parameters: Record<string, any>;
}

// ============================================================================
// LIABILITY ENGINE
// ============================================================================

class LiabilityEngine {
  private assessments: Map<string, LiabilityAssessment> = new Map();
  private rules: Map<string, LiabilityRule> = new Map();

  /**
   * Assess liability from damage photo and context
   */
  async assessLiability(
    damageRecordId: string,
    context: {
      damagePhoto?: File | string;
      damageType: string;
      severity: string;
      area?: string;
      equipment?: string[];
      carrier?: string;
      supplier?: string;
      customer?: string;
      totalValue: number;
      reportedAt: Date | string;
      tenantId?: string;
    },
  ): Promise<LiabilityAssessment> {
    const assessmentId = `liability-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Step 1: Analyze damage photo (if provided)
    let visionAnalysis = null;
    if (context.damagePhoto) {
      const analysis = await selfLearningVisionService.analyzeDamagePhoto(
        context.damagePhoto,
        {
          damageRecordId,
          area: context.area,
          equipment: context.equipment,
          carrier: context.carrier,
          tenantId: context.tenantId,
        },
      );
      visionAnalysis = analysis;
    }

    // Step 2: Apply liability rules
    const ruleResults = await this.applyLiabilityRules(context, visionAnalysis);

    // Step 3: Determine fault
    const faultAssessment = this.determineFault(
      context,
      ruleResults,
      visionAnalysis,
    );

    // Step 4: Calculate financial impact
    const financialImpact = this.calculateFinancialImpact(
      context.totalValue,
      faultAssessment,
      context.tenantId,
    );

    // Step 5: Check insurance eligibility
    const insurance = await this.checkInsuranceEligibility(
      faultAssessment,
      financialImpact,
      context,
    );

    // Step 6: Check legal compliance
    const compliance = await this.checkCompliance(faultAssessment, context);

    // Step 7: Create assessment
    const assessment: LiabilityAssessment = {
      id: assessmentId,
      damageRecordId,
      assessmentDate: new Date().toISOString(),
      parties: faultAssessment.parties,
      primaryFault: faultAssessment.primaryFault,
      faultPercentage: faultAssessment.faultPercentage,
      assessmentDetails: {
        damageAnalysis:
          visionAnalysis?.analysis?.analysis?.description ||
          "Damage analysis pending",
        rootCause: this.determineRootCause(
          context,
          ruleResults,
          visionAnalysis,
        ),
        contributingFactors: this.identifyContributingFactors(
          context,
          ruleResults,
        ),
        evidence: this.collectEvidence(context, visionAnalysis),
      },
      financialImpact,
      insurance,
      compliance,
      status: "assessed",
      tenantId: context.tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.assessments.set(assessmentId, assessment);

    // Publish event
    await eventBus.publish("liability.assessed", {
      assessmentId,
      damageRecordId,
      primaryFault: assessment.primaryFault,
      claimableAmount: financialImpact.claimableAmount,
    });

    return assessment;
  }

  /**
   * Apply liability rules
   */
  private async applyLiabilityRules(
    context: any,
    visionAnalysis: any,
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {
      faultAssignments: {},
      percentages: {},
      violations: [],
      requiredActions: [],
    };

    for (const rule of this.rules.values()) {
      if (!rule.enabled) {
        continue;
      }

      // Check if rule conditions match
      const matches = this.evaluateRuleConditions(
        rule.conditions,
        context,
        visionAnalysis,
      );

      if (matches) {
        // Execute rule actions
        for (const action of rule.actions) {
          this.executeRuleAction(action, results, context, visionAnalysis);
        }
      }
    }

    return results;
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateRuleConditions(
    conditions: LiabilityRuleCondition[],
    context: any,
    visionAnalysis: any,
  ): boolean {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(
        condition.field,
        context,
        visionAnalysis,
      );
      const matches = this.evaluateCondition(condition, fieldValue);

      if (!matches) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get field value from context or vision analysis
   */
  private getFieldValue(field: string, context: any, visionAnalysis: any): any {
    // Check context first
    if (context[field] !== undefined) {
      return context[field];
    }

    // Check vision analysis
    if (visionAnalysis?.analysis?.analysis) {
      const analysis = visionAnalysis.analysis.analysis;
      if (analysis[field] !== undefined) {
        return analysis[field];
      }

      // Check quality issues
      if (field === "damageType" && analysis.qualityIssues?.length > 0) {
        return analysis.qualityIssues[0].type;
      }
      if (field === "severity" && analysis.qualityIssues?.length > 0) {
        return analysis.qualityIssues[0].severity;
      }
    }

    return null;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    condition: LiabilityRuleCondition,
    fieldValue: any,
  ): boolean {
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }

    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value;
      case "contains":
        return String(fieldValue)
          .toLowerCase()
          .includes(String(condition.value).toLowerCase());
      case "greater_than":
        return Number(fieldValue) > Number(condition.value);
      case "less_than":
        return Number(fieldValue) < Number(condition.value);
      case "in":
        return (
          Array.isArray(condition.value) && condition.value.includes(fieldValue)
        );
      case "not_in":
        return (
          Array.isArray(condition.value) &&
          !condition.value.includes(fieldValue)
        );
      default:
        return false;
    }
  }

  /**
   * Execute rule action
   */
  private executeRuleAction(
    action: LiabilityRuleAction,
    results: Record<string, any>,
    context: any,
    visionAnalysis: any,
  ): void {
    switch (action.type) {
      case "assign_fault":
        const party = action.parameters.party as LiabilityParty;
        const percentage = action.parameters.percentage || 0;
        if (!results.faultAssignments[party]) {
          results.faultAssignments[party] = 0;
        }
        results.faultAssignments[party] += percentage;
        break;

      case "calculate_percentage":
        // Calculate percentage based on parameters
        break;

      case "set_claimable":
        results.claimable = action.parameters.claimable === true;
        break;

      case "add_violation":
        results.violations.push(action.parameters.violation);
        break;

      case "require_action":
        results.requiredActions.push(action.parameters.action);
        break;
    }
  }

  /**
   * Determine fault
   */
  private determineFault(
    context: any,
    ruleResults: any,
    visionAnalysis: any,
  ): {
    parties: LiabilityAssessment["parties"];
    primaryFault: LiabilityParty;
    faultPercentage: Record<LiabilityParty, number>;
  } {
    const faultPercentage: Record<LiabilityParty, number> = {
      warehouse: 0,
      carrier: 0,
      supplier: 0,
      customer: 0,
      third_party: 0,
      shared: 0,
      undetermined: 0,
    };

    // Apply rule results
    for (const [party, percentage] of Object.entries(
      ruleResults.faultAssignments || {},
    )) {
      faultPercentage[party as LiabilityParty] = Math.min(100, percentage);
    }

    // Default rules if no rules matched
    if (Object.values(faultPercentage).every((v) => v === 0)) {
      // Default: Warehouse is responsible if damage occurred in warehouse
      if (
        context.area &&
        ["storage", "loading_dock", "warehouse"].some((a) =>
          context.area.includes(a),
        )
      ) {
        faultPercentage.warehouse = 100;
      } else if (context.carrier) {
        // If carrier is involved, split responsibility
        faultPercentage.warehouse = 50;
        faultPercentage.carrier = 50;
      } else {
        faultPercentage.undetermined = 100;
      }
    }

    // Normalize percentages (ensure they sum to 100)
    const total = Object.values(faultPercentage).reduce((sum, v) => sum + v, 0);
    if (total > 0) {
      for (const party of Object.keys(faultPercentage) as LiabilityParty[]) {
        faultPercentage[party] = Math.round(
          (faultPercentage[party] / total) * 100,
        );
      }
    }

    // Determine primary fault
    const primaryFault = Object.entries(faultPercentage).sort(
      ([, a], [, b]) => b - a,
    )[0][0] as LiabilityParty;

    // Build parties object
    const parties: LiabilityAssessment["parties"] = {};
    if (faultPercentage.warehouse > 0) {
      parties.warehouse = {
        name: "Warehouse",
        percentage: faultPercentage.warehouse,
      };
    }
    if (faultPercentage.carrier > 0 && context.carrier) {
      parties.carrier = {
        name: context.carrier,
        percentage: faultPercentage.carrier,
      };
    }
    if (faultPercentage.supplier > 0 && context.supplier) {
      parties.supplier = {
        name: context.supplier,
        percentage: faultPercentage.supplier,
      };
    }

    return {
      parties,
      primaryFault,
      faultPercentage,
    };
  }

  /**
   * Calculate financial impact
   */
  private calculateFinancialImpact(
    totalValue: number,
    faultAssessment: any,
    tenantId?: string,
  ): LiabilityAssessment["financialImpact"] {
    // Calculate claimable amount based on fault percentage
    const warehouseFault = faultAssessment.faultPercentage.warehouse || 0;
    const claimablePercentage =
      warehouseFault > 0 ? (100 - warehouseFault) / 100 : 0;
    const claimableAmount = totalValue * claimablePercentage;

    // Deductible (typically 5% of claimable amount)
    const deductible = claimableAmount * 0.05;

    // Net claim
    const netClaim = Math.max(0, claimableAmount - deductible);

    return {
      totalValue,
      claimableAmount,
      deductible,
      netClaim,
      currency: "AED", // Default, should come from tenant config
    };
  }

  /**
   * Check insurance eligibility
   */
  private async checkInsuranceEligibility(
    faultAssessment: any,
    financialImpact: any,
    context: any,
  ): Promise<LiabilityAssessment["insurance"]> {
    // Check if claimable amount exceeds threshold (e.g., $1000)
    const claimThreshold = 1000;
    const claimable = financialImpact.claimableAmount >= claimThreshold;

    return {
      claimable,
      claimStatus: claimable ? "not_submitted" : undefined,
    };
  }

  /**
   * Check compliance
   */
  private async checkCompliance(
    faultAssessment: any,
    context: any,
  ): Promise<LiabilityAssessment["compliance"]> {
    const violations: string[] = [];
    const requiredActions: string[] = [];

    // Check if warehouse is at fault
    if (faultAssessment.faultPercentage.warehouse > 50) {
      violations.push(
        "Warehouse liability exceeds 50% - requires management review",
      );
      requiredActions.push("Notify insurance provider");
      requiredActions.push("Document incident for compliance");
    }

    // Check severity
    if (context.severity === "CRITICAL" || context.severity === "MAJOR") {
      requiredActions.push("Immediate investigation required");
      requiredActions.push("Notify regulatory authorities if applicable");
    }

    return {
      compliant: violations.length === 0,
      violations,
      requiredActions,
      regulatoryRequirements: [
        "Document all damage incidents",
        "Maintain insurance coverage",
        "Report critical incidents within 24 hours",
      ],
    };
  }

  /**
   * Determine root cause
   */
  private determineRootCause(
    context: any,
    ruleResults: any,
    visionAnalysis: any,
  ): string {
    if (visionAnalysis?.patternMatches?.length > 0) {
      const topMatch = visionAnalysis.patternMatches[0];
      return (
        topMatch.pattern.description || "Pattern-based root cause identified"
      );
    }

    // Fallback to context-based root cause
    if (context.equipment?.includes("forklift")) {
      return "Forklift handling damage";
    }
    if (context.area === "loading_dock") {
      return "Loading dock handling issue";
    }
    if (context.damageType === "WET") {
      return "Water damage - storage or transport issue";
    }

    return "Root cause requires investigation";
  }

  /**
   * Identify contributing factors
   */
  private identifyContributingFactors(
    context: any,
    ruleResults: any,
  ): string[] {
    const factors: string[] = [];

    if (context.equipment?.length > 0) {
      factors.push(`Equipment involved: ${context.equipment.join(", ")}`);
    }
    if (context.area) {
      factors.push(`Location: ${context.area}`);
    }
    if (context.carrier) {
      factors.push(`Carrier: ${context.carrier}`);
    }
    if (ruleResults.violations?.length > 0) {
      factors.push(...ruleResults.violations);
    }

    return factors;
  }

  /**
   * Collect evidence
   */
  private collectEvidence(context: any, visionAnalysis: any): string[] {
    const evidence: string[] = [];

    if (context.damagePhoto) {
      evidence.push("Damage photo available");
    }
    if (visionAnalysis?.analysis) {
      evidence.push("AI vision analysis completed");
    }
    if (visionAnalysis?.patternMatches?.length > 0) {
      evidence.push(
        `${visionAnalysis.patternMatches.length} pattern matches found`,
      );
    }

    return evidence;
  }

  /**
   * Get assessment
   */
  getAssessment(assessmentId: string): LiabilityAssessment | undefined {
    return this.assessments.get(assessmentId);
  }

  /**
   * Get assessments by damage record
   */
  getAssessmentsByDamageRecord(damageRecordId: string): LiabilityAssessment[] {
    return Array.from(this.assessments.values()).filter(
      (a) => a.damageRecordId === damageRecordId,
    );
  }

  /**
   * Add liability rule
   */
  addRule(rule: LiabilityRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Get rules
   */
  getRules(): LiabilityRule[] {
    return Array.from(this.rules.values());
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const liabilityEngine = new LiabilityEngine();
export default liabilityEngine;
