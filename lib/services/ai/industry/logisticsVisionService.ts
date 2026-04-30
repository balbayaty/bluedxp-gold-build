/**
 * Logistics Vision Service
 * Specialized AI vision for logistics: package damage, loading verification,
 * inventory counting, and shipment compliance
 */

import enhancedVisionService, {
  EnhancedVisionAnalysis,
} from "../enhancedVisionService";

// ============================================================================
// TYPES
// ============================================================================

export interface PackageDamage {
  id: string;
  type: DamageType;
  severity: "minor" | "major" | "severe" | "critical";
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  confidence: number;
  impact: "cosmetic" | "functional" | "structural" | "critical";
  recommendation: string;
}

export type DamageType =
  | "crush"
  | "tear"
  | "puncture"
  | "water_damage"
  | "corner_damage"
  | "label_damage"
  | "seal_breach"
  | "deformation"
  | "missing_handling_markings"
  | "improper_packaging";

export interface LoadingVerification {
  verified: boolean;
  compliance: {
    weightDistribution: boolean;
    securement: boolean;
    segregation: boolean;
    labeling: boolean;
    documentation: boolean;
  };
  issues: string[];
  recommendations: string[];
  complianceScore: number; // 0-100
}

export interface InventoryCount {
  itemsDetected: number;
  itemsByType: Record<string, number>;
  confidence: number;
  discrepancies?: {
    expected: number;
    detected: number;
    difference: number;
  };
}

export interface ShipmentCompliance {
  compliant: boolean;
  score: number; // 0-100
  violations: Array<{
    standard: string;
    requirement: string;
    severity: "low" | "medium" | "high" | "critical";
    recommendation: string;
  }>;
  certifications: string[];
  missingRequirements: string[];
}

export interface LogisticsVisionAnalysis {
  id: string;
  timestamp: string;
  imageUrl?: string;

  // Package Analysis
  packageDamage?: PackageDamage[];
  packageCondition: "excellent" | "good" | "fair" | "poor" | "critical";

  // Loading Verification
  loadingVerification?: LoadingVerification;

  // Inventory
  inventoryCount?: InventoryCount;

  // Shipment Compliance
  shipmentCompliance?: ShipmentCompliance;

  // Recommendations
  recommendations: string[];
  urgentActions: string[];

  // Metadata
  metadata: {
    provider: string;
    model: string;
    processingTime: number;
    analysisMode:
      | "damage_assessment"
      | "loading_verification"
      | "inventory_counting"
      | "compliance_check"
      | "general";
  };
}

// ============================================================================
// LOGISTICS VISION SERVICE
// ============================================================================

class LogisticsVisionService {
  /**
   * Analyze logistics image
   */
  async analyzeLogisticsImage(
    imageFile: File | string,
    context?: string,
    options?: {
      mode?:
        | "damage_assessment"
        | "loading_verification"
        | "inventory_counting"
        | "compliance_check"
        | "general";
      checkCompliance?: boolean;
      countInventory?: boolean;
    },
  ): Promise<LogisticsVisionAnalysis> {
    const startTime = Date.now();
    const analysisId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const mode = options?.mode || "damage_assessment";
    const defaultOptions = {
      checkCompliance: true,
      countInventory: false,
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
        industryContext: "logistics",
        extractText: true,
        searchSimilarCases: true,
      },
    );

    // Extract package damage
    const packageDamage =
      mode === "damage_assessment" || mode === "general"
        ? this.extractPackageDamage(enhancedResult)
        : undefined;

    // Determine package condition
    const packageCondition = this.determinePackageCondition(
      packageDamage || [],
    );

    // Loading verification
    const loadingVerification =
      mode === "loading_verification" || mode === "general"
        ? this.verifyLoading(enhancedResult)
        : undefined;

    // Inventory counting
    const inventoryCount =
      defaultOptions.countInventory || mode === "inventory_counting"
        ? this.countInventory(enhancedResult)
        : undefined;

    // Shipment compliance
    const shipmentCompliance = defaultOptions.checkCompliance
      ? this.checkShipmentCompliance(enhancedResult, packageDamage)
      : undefined;

    // Generate recommendations
    const { recommendations, urgentActions } = this.generateRecommendations(
      packageDamage,
      loadingVerification,
      shipmentCompliance,
    );

    return {
      id: analysisId,
      timestamp: new Date().toISOString(),
      imageUrl: enhancedResult.imageUrl,
      packageDamage,
      packageCondition,
      loadingVerification,
      inventoryCount,
      shipmentCompliance,
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
      damage_assessment:
        "Logistics package damage assessment. Identify crush damage, tears, punctures, water damage, corner damage, label damage, seal breaches, deformation, missing handling markings, and improper packaging. Assess severity and impact on shipment integrity.",
      loading_verification:
        "Logistics loading verification. Verify proper weight distribution, securement, segregation of incompatible goods, labeling compliance, and documentation. Check for loading violations and safety concerns.",
      inventory_counting:
        "Logistics inventory counting. Count items, identify item types, verify quantities, and detect discrepancies. Provide accurate inventory counts with confidence scores.",
      compliance_check:
        "Logistics shipment compliance verification. Check compliance with transportation regulations (DOT, IATA, IMO), labeling requirements, documentation, and safety standards.",
      general:
        "General logistics analysis. Assess package condition, loading compliance, inventory, and shipment compliance.",
    };

    return `${baseContext}\n\n${modeContexts[mode] || modeContexts.general}`;
  }

  /**
   * Extract package damage
   */
  private extractPackageDamage(
    analysis: EnhancedVisionAnalysis,
  ): PackageDamage[] {
    const damages: PackageDamage[] = [];
    const qualityIssues = analysis.analysis.qualityIssues || [];

    for (const issue of qualityIssues) {
      if (issue.type === "damage") {
        const damageType = this.mapIssueToDamageType(issue.issue);
        const severity = this.mapSeverity(issue.severity);
        const impact = this.determineImpact(damageType, severity);

        damages.push({
          id: `damage-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: damageType,
          severity,
          location: issue.location || { x: 0, y: 0, width: 0, height: 0 },
          description: issue.issue,
          confidence: issue.confidence,
          impact,
          recommendation: this.getDamageRecommendation(
            damageType,
            severity,
            impact,
          ),
        });
      }
    }

    return damages;
  }

  /**
   * Map issue to damage type
   */
  private mapIssueToDamageType(issueDescription: string): DamageType {
    const lower = issueDescription.toLowerCase();

    if (lower.includes("crush") || lower.includes("compressed")) return "crush";
    if (lower.includes("tear") || lower.includes("ripped")) return "tear";
    if (lower.includes("puncture") || lower.includes("hole")) return "puncture";
    if (
      lower.includes("water") ||
      lower.includes("wet") ||
      lower.includes("moisture")
    )
      return "water_damage";
    if (lower.includes("corner")) return "corner_damage";
    if (lower.includes("label")) return "label_damage";
    if (lower.includes("seal") || lower.includes("tamper"))
      return "seal_breach";
    if (lower.includes("deform") || lower.includes("bent"))
      return "deformation";
    if (lower.includes("missing") && lower.includes("marking"))
      return "missing_handling_markings";
    if (lower.includes("improper") || lower.includes("inadequate"))
      return "improper_packaging";

    return "deformation"; // Default
  }

  /**
   * Map severity
   */
  private mapSeverity(severity: string): PackageDamage["severity"] {
    switch (severity) {
      case "critical":
        return "critical";
      case "major":
        return "severe";
      case "minor":
        return "minor";
      default:
        return "major";
    }
  }

  /**
   * Determine impact
   */
  private determineImpact(
    damageType: DamageType,
    severity: PackageDamage["severity"],
  ): PackageDamage["impact"] {
    if (severity === "critical" || damageType === "seal_breach")
      return "critical";
    if (
      severity === "severe" ||
      damageType === "puncture" ||
      damageType === "crush"
    )
      return "structural";
    if (severity === "major" || damageType === "water_damage")
      return "functional";
    return "cosmetic";
  }

  /**
   * Get damage recommendation
   */
  private getDamageRecommendation(
    damageType: DamageType,
    severity: PackageDamage["severity"],
    impact: PackageDamage["impact"],
  ): string {
    if (impact === "critical" || severity === "critical") {
      return "URGENT: Package integrity compromised. Do not ship. Transfer contents to new package.";
    }
    if (impact === "structural" || severity === "severe") {
      return "Package structural integrity at risk. Reinforce packaging or repackage before shipping.";
    }
    if (impact === "functional") {
      return "Package functional integrity may be compromised. Inspect contents before shipping.";
    }
    return "Cosmetic damage only. Document and proceed with caution.";
  }

  /**
   * Determine package condition
   */
  private determinePackageCondition(
    damages: PackageDamage[],
  ): LogisticsVisionAnalysis["packageCondition"] {
    if (damages.length === 0) return "excellent";

    const critical = damages.filter(
      (d) => d.severity === "critical" || d.impact === "critical",
    ).length;
    const severe = damages.filter(
      (d) => d.severity === "severe" || d.impact === "structural",
    ).length;
    const major = damages.filter((d) => d.severity === "major").length;

    if (critical > 0) return "critical";
    if (severe > 0) return "poor";
    if (major > 0) return "fair";
    return "good";
  }

  /**
   * Verify loading
   */
  private verifyLoading(analysis: EnhancedVisionAnalysis): LoadingVerification {
    const compliance = {
      weightDistribution: true,
      securement: true,
      segregation: true,
      labeling: true,
      documentation: true,
    };

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for loading issues
    const safetyIssues = analysis.analysis.safetyIssues || [];
    const qualityIssues = analysis.analysis.qualityIssues || [];
    const complianceIssues = analysis.analysis.complianceIssues || [];

    // Weight distribution
    if (
      safetyIssues.some(
        (s) =>
          s.issue.toLowerCase().includes("weight") ||
          s.issue.toLowerCase().includes("balance"),
      )
    ) {
      compliance.weightDistribution = false;
      issues.push("Weight distribution concerns detected");
      recommendations.push("Verify weight distribution and center of gravity");
    }

    // Securement
    if (
      safetyIssues.some(
        (s) =>
          s.issue.toLowerCase().includes("secure") ||
          s.issue.toLowerCase().includes("straps"),
      )
    ) {
      compliance.securement = false;
      issues.push("Securement issues detected");
      recommendations.push("Verify all cargo is properly secured");
    }

    // Segregation
    if (
      complianceIssues.some((c) =>
        c.standard.toLowerCase().includes("segregation"),
      )
    ) {
      compliance.segregation = false;
      issues.push("Segregation compliance issues");
      recommendations.push("Review cargo segregation requirements");
    }

    // Labeling
    if (qualityIssues.some((q) => q.type === "mislabeling")) {
      compliance.labeling = false;
      issues.push("Labeling issues detected");
      recommendations.push("Verify all labels are correct and visible");
    }

    // Calculate compliance score
    const complianceCount = Object.values(compliance).filter((v) => v).length;
    const complianceScore =
      (complianceCount / Object.keys(compliance).length) * 100;

    return {
      verified: complianceCount === Object.keys(compliance).length,
      compliance,
      issues,
      recommendations,
      complianceScore,
    };
  }

  /**
   * Count inventory
   */
  private countInventory(analysis: EnhancedVisionAnalysis): InventoryCount {
    const detectedObjects = analysis.analysis.detectedObjects || [];

    const itemsByType: Record<string, number> = {};
    for (const obj of detectedObjects) {
      itemsByType[obj.object] = (itemsByType[obj.object] || 0) + 1;
    }

    const itemsDetected = detectedObjects.length;
    const avgConfidence =
      detectedObjects.length > 0
        ? detectedObjects.reduce((sum, obj) => sum + obj.confidence, 0) /
          detectedObjects.length
        : 0;

    return {
      itemsDetected,
      itemsByType,
      confidence: avgConfidence,
    };
  }

  /**
   * Check shipment compliance
   */
  private checkShipmentCompliance(
    analysis: EnhancedVisionAnalysis,
    damages?: PackageDamage[],
  ): ShipmentCompliance {
    const violations: ShipmentCompliance["violations"] = [];
    const complianceIssues = analysis.analysis.complianceIssues || [];

    // Extract violations
    for (const issue of complianceIssues) {
      violations.push({
        standard: issue.standard,
        requirement: issue.violation,
        severity: issue.confidence >= 80 ? "high" : "medium",
        recommendation: issue.recommendation,
      });
    }

    // Check for damage-related violations
    if (
      damages &&
      damages.some((d) => d.impact === "critical" || d.severity === "critical")
    ) {
      violations.push({
        standard: "DOT - Package Integrity",
        requirement: "Packages must maintain structural integrity",
        severity: "critical",
        recommendation: "Do not ship damaged packages",
      });
    }

    // Calculate compliance score
    const criticalViolations = violations.filter(
      (v) => v.severity === "critical",
    ).length;
    const highViolations = violations.filter(
      (v) => v.severity === "high",
    ).length;
    let score = 100;
    score -= criticalViolations * 30;
    score -= highViolations * 15;
    score -= violations.length * 5;
    score = Math.max(0, Math.min(100, score));

    return {
      compliant: violations.length === 0 && (!damages || damages.length === 0),
      score,
      violations,
      certifications: [],
      missingRequirements: violations.map((v) => v.requirement),
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    damages?: PackageDamage[],
    loadingVerification?: LoadingVerification,
    shipmentCompliance?: ShipmentCompliance,
  ): { recommendations: string[]; urgentActions: string[] } {
    const recommendations: string[] = [];
    const urgentActions: string[] = [];

    // Damage recommendations
    if (damages && damages.length > 0) {
      const critical = damages.filter(
        (d) => d.severity === "critical" || d.impact === "critical",
      );
      if (critical.length > 0) {
        urgentActions.push(
          `URGENT: ${critical.length} critical package damage(s) - do not ship`,
        );
      }
      recommendations.push(
        `Document ${damages.length} package damage(s) and assess impact`,
      );
    }

    // Loading recommendations
    if (loadingVerification && !loadingVerification.verified) {
      urgentActions.push(
        `Loading verification failed (score: ${loadingVerification.complianceScore})`,
      );
      recommendations.push(...loadingVerification.recommendations);
    }

    // Compliance recommendations
    if (shipmentCompliance && !shipmentCompliance.compliant) {
      const critical = shipmentCompliance.violations.filter(
        (v) => v.severity === "critical",
      );
      if (critical.length > 0) {
        urgentActions.push(
          `URGENT: ${critical.length} critical compliance violation(s)`,
        );
      }
      recommendations.push(
        `Address ${shipmentCompliance.violations.length} compliance violation(s)`,
      );
    }

    return { recommendations, urgentActions };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const logisticsVisionService = new LogisticsVisionService();
export default logisticsVisionService;
