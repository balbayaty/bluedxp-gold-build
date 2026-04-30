/**
 * Healthcare Vision Service
 * Specialized AI vision for healthcare: equipment verification, sterilization compliance,
 * patient safety monitoring, and documentation validation
 */

import enhancedVisionService, {
  EnhancedVisionAnalysis,
} from "../enhancedVisionService";

// ============================================================================
// TYPES
// ============================================================================

export interface EquipmentVerification {
  equipmentId?: string;
  equipmentType: string;
  verified: boolean;
  sterilizationStatus: "verified" | "needs_verification" | "failed" | "unknown";
  condition: "excellent" | "good" | "fair" | "poor" | "unusable";
  issues: string[];
  recommendations: string[];
  complianceScore: number; // 0-100
}

export interface SterilizationCompliance {
  compliant: boolean;
  indicators: Array<{
    type:
      | "autoclave_tape"
      | "chemical_indicator"
      | "biological_indicator"
      | "visual_check";
    detected: boolean;
    confidence: number;
  }>;
  issues: string[];
  recommendations: string[];
}

export interface PatientSafetyAssessment {
  riskLevel: "low" | "medium" | "high" | "critical";
  hazards: Array<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    location?: string;
    recommendation: string;
  }>;
  complianceScore: number; // 0-100
  recommendations: string[];
}

export interface DocumentationValidation {
  complete: boolean;
  verified: boolean;
  missing: string[];
  issues: string[];
  complianceScore: number; // 0-100
}

export interface HealthcareVisionAnalysis {
  id: string;
  timestamp: string;
  imageUrl?: string;

  // Equipment
  equipmentVerification?: EquipmentVerification;

  // Sterilization
  sterilizationCompliance?: SterilizationCompliance;

  // Patient Safety
  patientSafety?: PatientSafetyAssessment;

  // Documentation
  documentation?: DocumentationValidation;

  // Overall
  overallCompliance: {
    compliant: boolean;
    score: number; // 0-100
    criticalIssues: number;
  };

  // Recommendations
  recommendations: string[];
  urgentActions: string[];

  // Metadata
  metadata: {
    provider: string;
    model: string;
    processingTime: number;
    analysisMode:
      | "equipment_verification"
      | "sterilization_check"
      | "patient_safety"
      | "documentation"
      | "general";
  };
}

// ============================================================================
// HEALTHCARE VISION SERVICE
// ============================================================================

class HealthcareVisionService {
  /**
   * Analyze healthcare image
   */
  async analyzeHealthcareImage(
    imageFile: File | string,
    context?: string,
    options?: {
      mode?:
        | "equipment_verification"
        | "sterilization_check"
        | "patient_safety"
        | "documentation"
        | "general";
      checkSterilization?: boolean;
      assessPatientSafety?: boolean;
      validateDocumentation?: boolean;
    },
  ): Promise<HealthcareVisionAnalysis> {
    const startTime = Date.now();
    const analysisId = `hc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const mode = options?.mode || "equipment_verification";
    const defaultOptions = {
      checkSterilization: true,
      assessPatientSafety: true,
      validateDocumentation: true,
      ...options,
    };

    // Use enhanced vision service
    const enhancedResult = await enhancedVisionService.analyzeWithRAG(
      imageFile,
      this.getContextForMode(mode, context),
      {
        enableRAG: true,
        enableLearning: true,
        enableIndustryAnalysis: true,
        industryContext: "healthcare",
        extractText: true,
        searchSimilarCases: true,
      },
    );

    // Equipment verification
    const equipmentVerification =
      mode === "equipment_verification" || mode === "general"
        ? this.verifyEquipment(enhancedResult)
        : undefined;

    // Sterilization compliance
    const sterilizationCompliance = defaultOptions.checkSterilization
      ? this.checkSterilization(enhancedResult)
      : undefined;

    // Patient safety
    const patientSafety = defaultOptions.assessPatientSafety
      ? this.assessPatientSafety(enhancedResult)
      : undefined;

    // Documentation validation
    const documentation = defaultOptions.validateDocumentation
      ? this.validateDocumentation(enhancedResult)
      : undefined;

    // Calculate overall compliance
    const overallCompliance = this.calculateOverallCompliance(
      equipmentVerification,
      sterilizationCompliance,
      patientSafety,
      documentation,
    );

    // Generate recommendations
    const { recommendations, urgentActions } = this.generateRecommendations(
      equipmentVerification,
      sterilizationCompliance,
      patientSafety,
      documentation,
      overallCompliance,
    );

    return {
      id: analysisId,
      timestamp: new Date().toISOString(),
      imageUrl: enhancedResult.imageUrl,
      equipmentVerification,
      sterilizationCompliance,
      patientSafety,
      documentation,
      overallCompliance,
      recommendations,
      urgentActions,
      metadata: {
        provider: enhancedResult.metadata.provider,
        model: enhancedResult.metadata.model,
        processingTime: Date.now() - startTime,
        analysisMode: mode,
      },
    };
  }

  /**
   * Get context for mode
   */
  private getContextForMode(mode: string, customContext?: string): string {
    const baseContext = customContext || "";

    const modeContexts: Record<string, string> = {
      equipment_verification:
        "Healthcare equipment verification. Verify equipment type, condition, sterilization status, and compliance with healthcare standards. Check for damage, wear, contamination, and proper labeling.",
      sterilization_check:
        "Healthcare sterilization compliance check. Verify sterilization indicators (autoclave tape, chemical indicators, biological indicators), check for proper sterilization procedures, and ensure compliance with infection control standards.",
      patient_safety:
        "Healthcare patient safety assessment. Identify safety hazards, verify proper equipment setup, check for contamination risks, verify medication safety, and assess overall patient safety compliance.",
      documentation:
        "Healthcare documentation validation. Verify documentation completeness, check for required labels, verify expiration dates, check batch numbers, and ensure regulatory compliance.",
      general:
        "General healthcare analysis. Verify equipment, check sterilization, assess patient safety, and validate documentation.",
    };

    return `${baseContext}\n\n${modeContexts[mode] || modeContexts.general}`;
  }

  /**
   * Verify equipment
   */
  private verifyEquipment(
    analysis: EnhancedVisionAnalysis,
  ): EquipmentVerification {
    const detectedObjects = analysis.analysis.detectedObjects || [];
    const qualityIssues = analysis.analysis.qualityIssues || [];
    const safetyIssues = analysis.analysis.safetyIssues || [];

    // Identify equipment type
    const equipmentKeywords = [
      "scalpel",
      "syringe",
      "needle",
      "forceps",
      "scissors",
      "equipment",
      "device",
      "instrument",
    ];
    const equipmentType =
      detectedObjects.find((obj) =>
        equipmentKeywords.some((keyword) =>
          obj.object.toLowerCase().includes(keyword),
        ),
      )?.object || "Medical Equipment";

    // Check for issues
    const issues: string[] = [];
    if (qualityIssues.length > 0) {
      issues.push(...qualityIssues.map((q) => q.issue));
    }
    if (safetyIssues.length > 0) {
      issues.push(...safetyIssues.map((s) => s.issue));
    }

    // Determine condition
    let condition: EquipmentVerification["condition"] = "good";
    if (qualityIssues.some((q) => q.severity === "critical"))
      condition = "unusable";
    else if (qualityIssues.some((q) => q.severity === "major"))
      condition = "poor";
    else if (qualityIssues.length > 0) condition = "fair";
    else condition = "good";

    // Check sterilization
    const sterilizationStatus = this.checkSterilizationStatus(analysis);

    // Calculate compliance score
    let score = 100;
    if (condition === "unusable") score -= 50;
    else if (condition === "poor") score -= 30;
    else if (condition === "fair") score -= 15;
    if (sterilizationStatus === "failed") score -= 40;
    else if (sterilizationStatus === "needs_verification") score -= 20;
    score = Math.max(0, Math.min(100, score));

    return {
      equipmentType,
      verified: condition !== "unusable" && sterilizationStatus !== "failed",
      sterilizationStatus,
      condition,
      issues,
      recommendations: this.getEquipmentRecommendations(
        condition,
        sterilizationStatus,
        issues,
      ),
      complianceScore: score,
    };
  }

  /**
   * Check sterilization status
   */
  private checkSterilizationStatus(
    analysis: EnhancedVisionAnalysis,
  ): EquipmentVerification["sterilizationStatus"] {
    const description = (analysis.analysis.description || "").toLowerCase();
    const detectedObjects = analysis.analysis.detectedObjects || [];
    const extractedText = analysis.extractedText?.text.toLowerCase() || "";

    const allText = `${description} ${extractedText}`;

    // Check for sterilization indicators
    const sterilizationKeywords = [
      "sterilized",
      "autoclave",
      "sterile",
      "sterilization",
      "indicator",
    ];
    const hasSterilizationMention = sterilizationKeywords.some(
      (keyword) =>
        allText.includes(keyword) ||
        detectedObjects.some((obj) =>
          obj.object.toLowerCase().includes(keyword),
        ),
    );

    // Check for sterilization indicators
    const indicatorKeywords = ["tape", "indicator", "strip", "label"];
    const hasIndicators = indicatorKeywords.some(
      (keyword) =>
        allText.includes(keyword) ||
        detectedObjects.some((obj) =>
          obj.object.toLowerCase().includes(keyword),
        ),
    );

    if (hasSterilizationMention && hasIndicators) {
      // Check if indicators show sterilization
      if (
        allText.includes("verified") ||
        allText.includes("passed") ||
        allText.includes("sterile")
      ) {
        return "verified";
      }
      return "needs_verification";
    }

    if (
      allText.includes("failed") ||
      allText.includes("not sterile") ||
      allText.includes("contaminated")
    ) {
      return "failed";
    }

    return "unknown";
  }

  /**
   * Check sterilization compliance
   */
  private checkSterilization(
    analysis: EnhancedVisionAnalysis,
  ): SterilizationCompliance {
    const indicators: SterilizationCompliance["indicators"] = [];
    const description = (analysis.analysis.description || "").toLowerCase();
    const detectedObjects = analysis.analysis.detectedObjects || [];
    const extractedText = analysis.extractedText?.text.toLowerCase() || "";
    const allText = `${description} ${extractedText}`;

    // Check for autoclave tape
    const autoclaveTape =
      allText.includes("autoclave") ||
      allText.includes("tape") ||
      detectedObjects.some((obj) => obj.object.toLowerCase().includes("tape"));
    indicators.push({
      type: "autoclave_tape",
      detected: autoclaveTape,
      confidence: autoclaveTape ? 80 : 0,
    });

    // Check for chemical indicator
    const chemicalIndicator =
      allText.includes("chemical") || allText.includes("indicator");
    indicators.push({
      type: "chemical_indicator",
      detected: chemicalIndicator,
      confidence: chemicalIndicator ? 75 : 0,
    });

    // Check for biological indicator
    const biologicalIndicator =
      allText.includes("biological") || allText.includes("spore");
    indicators.push({
      type: "biological_indicator",
      detected: biologicalIndicator,
      confidence: biologicalIndicator ? 70 : 0,
    });

    // Visual check
    const visualCheck =
      detectedObjects.length > 0 &&
      !analysis.analysis.qualityIssues?.some(
        (q) =>
          q.issue.toLowerCase().includes("contaminat") ||
          q.issue.toLowerCase().includes("dirty"),
      );
    indicators.push({
      type: "visual_check",
      detected: visualCheck,
      confidence: visualCheck ? 85 : 0,
    });

    const compliant = indicators.filter((i) => i.detected).length >= 2;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!compliant) {
      issues.push("Insufficient sterilization indicators detected");
      recommendations.push("Verify sterilization procedures and indicators");
    }

    return {
      compliant,
      indicators,
      issues,
      recommendations,
    };
  }

  /**
   * Assess patient safety
   */
  private assessPatientSafety(
    analysis: EnhancedVisionAnalysis,
  ): PatientSafetyAssessment {
    const safetyIssues = analysis.analysis.safetyIssues || [];
    const qualityIssues = analysis.analysis.qualityIssues || [];
    const complianceIssues = analysis.analysis.complianceIssues || [];

    const hazards = [
      ...safetyIssues.map((s) => ({
        type: "safety",
        severity: s.severity,
        description: s.issue,
        location: s.location,
        recommendation: `Address safety concern: ${s.issue}`,
      })),
      ...qualityIssues
        .filter((q) => q.severity === "critical" || q.severity === "major")
        .map((q) => ({
          type: "quality",
          severity: q.severity === "critical" ? "critical" : "high",
          description: q.issue,
          recommendation: `Address quality issue: ${q.issue}`,
        })),
      ...complianceIssues.map((c) => ({
        type: "compliance",
        severity: "high",
        description: c.violation,
        recommendation: c.recommendation,
      })),
    ];

    // Determine risk level
    const criticalHazards = hazards.filter(
      (h) => h.severity === "critical",
    ).length;
    const highHazards = hazards.filter((h) => h.severity === "high").length;

    let riskLevel: PatientSafetyAssessment["riskLevel"] = "low";
    if (criticalHazards > 0) riskLevel = "critical";
    else if (highHazards > 2) riskLevel = "high";
    else if (highHazards > 0 || hazards.length > 3) riskLevel = "medium";
    else riskLevel = "low";

    // Calculate compliance score
    let score = 100;
    score -= criticalHazards * 30;
    score -= highHazards * 15;
    score -= hazards.length * 5;
    score = Math.max(0, Math.min(100, score));

    const recommendations = hazards
      .filter((h) => h.severity === "critical" || h.severity === "high")
      .map((h) => h.recommendation);

    return {
      riskLevel,
      hazards,
      complianceScore: score,
      recommendations,
    };
  }

  /**
   * Validate documentation
   */
  private validateDocumentation(
    analysis: EnhancedVisionAnalysis,
  ): DocumentationValidation {
    const extractedText = analysis.extractedText?.text || "";
    const complianceIssues = analysis.analysis.complianceIssues || [];

    const requiredFields = [
      "label",
      "expiration",
      "batch",
      "lot",
      "date",
      "manufacturer",
    ];
    const missing: string[] = [];
    const issues: string[] = [];

    // Check for required fields
    for (const field of requiredFields) {
      if (!extractedText.toLowerCase().includes(field)) {
        missing.push(field);
      }
    }

    // Check compliance issues
    for (const issue of complianceIssues) {
      if (
        issue.standard.toLowerCase().includes("documentation") ||
        issue.standard.toLowerCase().includes("labeling")
      ) {
        issues.push(issue.violation);
      }
    }

    // Calculate compliance score
    let score = 100;
    score -= missing.length * 10;
    score -= issues.length * 15;
    score = Math.max(0, Math.min(100, score));

    return {
      complete: missing.length === 0,
      verified: issues.length === 0,
      missing,
      issues,
      complianceScore: score,
    };
  }

  /**
   * Calculate overall compliance
   */
  private calculateOverallCompliance(
    equipment?: EquipmentVerification,
    sterilization?: SterilizationCompliance,
    patientSafety?: PatientSafetyAssessment,
    documentation?: DocumentationValidation,
  ): HealthcareVisionAnalysis["overallCompliance"] {
    const scores: number[] = [];
    let criticalIssues = 0;

    if (equipment) {
      scores.push(equipment.complianceScore);
      if (
        equipment.condition === "unusable" ||
        equipment.sterilizationStatus === "failed"
      ) {
        criticalIssues++;
      }
    }

    if (sterilization) {
      scores.push(sterilization.compliant ? 100 : 50);
      if (!sterilization.compliant) criticalIssues++;
    }

    if (patientSafety) {
      scores.push(patientSafety.complianceScore);
      if (patientSafety.riskLevel === "critical") criticalIssues++;
    }

    if (documentation) {
      scores.push(documentation.complianceScore);
      if (!documentation.verified) criticalIssues++;
    }

    const avgScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 100;

    return {
      compliant: avgScore >= 80 && criticalIssues === 0,
      score: Math.round(avgScore),
      criticalIssues,
    };
  }

  /**
   * Get equipment recommendations
   */
  private getEquipmentRecommendations(
    condition: EquipmentVerification["condition"],
    sterilizationStatus: EquipmentVerification["sterilizationStatus"],
    issues: string[],
  ): string[] {
    const recommendations: string[] = [];

    if (condition === "unusable") {
      recommendations.push(
        "URGENT: Equipment is unusable - remove from service immediately",
      );
    } else if (condition === "poor") {
      recommendations.push(
        "Equipment condition is poor - schedule maintenance or replacement",
      );
    }

    if (sterilizationStatus === "failed") {
      recommendations.push(
        "URGENT: Sterilization failed - do not use equipment",
      );
    } else if (sterilizationStatus === "needs_verification") {
      recommendations.push("Verify sterilization status before use");
    }

    if (issues.length > 0) {
      recommendations.push(`Address ${issues.length} equipment issue(s)`);
    }

    return recommendations;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    equipment?: EquipmentVerification,
    sterilization?: SterilizationCompliance,
    patientSafety?: PatientSafetyAssessment,
    documentation?: DocumentationValidation,
    overallCompliance?: HealthcareVisionAnalysis["overallCompliance"],
  ): { recommendations: string[]; urgentActions: string[] } {
    const recommendations: string[] = [];
    const urgentActions: string[] = [];

    // Equipment recommendations
    if (equipment && !equipment.verified) {
      if (
        equipment.condition === "unusable" ||
        equipment.sterilizationStatus === "failed"
      ) {
        urgentActions.push(
          "URGENT: Equipment verification failed - do not use",
        );
      }
      recommendations.push(...equipment.recommendations);
    }

    // Sterilization recommendations
    if (sterilization && !sterilization.compliant) {
      urgentActions.push("Sterilization compliance issues detected");
      recommendations.push(...sterilization.recommendations);
    }

    // Patient safety recommendations
    if (patientSafety && patientSafety.riskLevel === "critical") {
      urgentActions.push(
        "CRITICAL: Patient safety risk detected - immediate action required",
      );
    }
    if (patientSafety) {
      recommendations.push(...patientSafety.recommendations);
    }

    // Documentation recommendations
    if (documentation && !documentation.verified) {
      recommendations.push("Documentation validation failed - review required");
    }

    // Overall compliance
    if (overallCompliance && !overallCompliance.compliant) {
      if (overallCompliance.criticalIssues > 0) {
        urgentActions.push(
          `URGENT: ${overallCompliance.criticalIssues} critical compliance issue(s)`,
        );
      }
      recommendations.push(
        `Overall compliance score: ${overallCompliance.score}% - review required`,
      );
    }

    return { recommendations, urgentActions };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const healthcareVisionService = new HealthcareVisionService();
export default healthcareVisionService;
