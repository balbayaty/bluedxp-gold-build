/**
 * Manufacturing Vision Service
 * Specialized AI vision for manufacturing: defect detection, quality control,
 * production line monitoring, and equipment condition assessment
 */

import enhancedVisionService, {
  EnhancedVisionAnalysis,
} from "../enhancedVisionService";
import { VisionAnalysisResult } from "../visionService";

// ============================================================================
// TYPES
// ============================================================================

export interface ManufacturingDefect {
  id: string;
  type: DefectType;
  severity: "minor" | "major" | "critical";
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  confidence: number;
  recommendation: string;
  standard?: string; // ISO, ASTM, etc.
}

export type DefectType =
  | "scratch"
  | "dent"
  | "crack"
  | "misalignment"
  | "discoloration"
  | "contamination"
  | "missing_component"
  | "incorrect_dimension"
  | "surface_imperfection"
  | "assembly_error"
  | "packaging_defect"
  | "labeling_error";

export interface QualityControlResult {
  passed: boolean;
  score: number; // 0-100
  defects: ManufacturingDefect[];
  criticalDefects: ManufacturingDefect[];
  qualityGrade: "A" | "B" | "C" | "D" | "F";
  recommendations: string[];
  complianceStatus: {
    iso9001: boolean;
    iso14001: boolean;
    otherStandards: string[];
  };
}

export interface ProductionLineStatus {
  lineId: string;
  status: "operational" | "degraded" | "stopped" | "maintenance";
  throughput: number; // items per hour
  qualityRate: number; // percentage
  defectRate: number; // percentage
  equipmentCondition: "good" | "fair" | "poor" | "critical";
  issues: string[];
  recommendations: string[];
}

export interface EquipmentCondition {
  equipmentId: string;
  condition: "excellent" | "good" | "fair" | "poor" | "critical";
  wearLevel: number; // 0-100
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  maintenanceRequired: boolean;
  nextMaintenanceDate?: string;
  estimatedRemainingLife: number; // percentage
}

export interface ManufacturingVisionAnalysis {
  id: string;
  timestamp: string;
  imageUrl?: string;

  // Defect Detection
  defects: ManufacturingDefect[];

  // Quality Control
  qualityControl: QualityControlResult;

  // Production Line
  productionLine?: ProductionLineStatus;

  // Equipment Condition
  equipmentCondition?: EquipmentCondition;

  // Recommendations
  recommendations: string[];
  urgentActions: string[];

  // Metadata
  metadata: {
    provider: string;
    model: string;
    processingTime: number;
    analysisMode:
      | "defect_detection"
      | "quality_control"
      | "equipment_inspection"
      | "general";
  };
}

// ============================================================================
// MANUFACTURING VISION SERVICE
// ============================================================================

class ManufacturingVisionService {
  /**
   * Analyze manufacturing image for defects and quality
   */
  async analyzeManufacturingImage(
    imageFile: File | string,
    context?: string,
    options?: {
      mode?:
        | "defect_detection"
        | "quality_control"
        | "equipment_inspection"
        | "general";
      checkStandards?: boolean;
      enableQualityGrading?: boolean;
    },
  ): Promise<ManufacturingVisionAnalysis> {
    const startTime = Date.now();
    const analysisId = `mfg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const mode = options?.mode || "defect_detection";
    const defaultOptions = {
      checkStandards: true,
      enableQualityGrading: true,
      ...options,
    };

    // Use enhanced vision service with manufacturing context
    const enhancedResult = await enhancedVisionService.analyzeWithRAG(
      imageFile,
      this.getContextForMode(mode, context),
      {
        enableRAG: true,
        enableLearning: true,
        enableIndustryAnalysis: true,
        industryContext: "manufacturing",
        extractText: true,
        searchSimilarCases: true,
      },
    );

    // Extract defects from analysis
    const defects = this.extractDefects(enhancedResult, mode);

    // Perform quality control analysis
    const qualityControl = this.performQualityControl(defects, defaultOptions);

    // Analyze equipment condition if applicable
    const equipmentCondition =
      mode === "equipment_inspection"
        ? this.analyzeEquipmentCondition(enhancedResult)
        : undefined;

    // Generate recommendations
    const { recommendations, urgentActions } = this.generateRecommendations(
      defects,
      qualityControl,
      equipmentCondition,
    );

    return {
      id: analysisId,
      timestamp: new Date().toISOString(),
      imageUrl: enhancedResult.imageUrl,
      defects,
      qualityControl,
      equipmentCondition,
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
   * Get context for analysis mode
   */
  private getContextForMode(mode: string, customContext?: string): string {
    const baseContext = customContext || "";

    const modeContexts: Record<string, string> = {
      defect_detection:
        "Manufacturing defect detection. Identify scratches, dents, cracks, misalignment, discoloration, contamination, missing components, incorrect dimensions, surface imperfections, assembly errors, packaging defects, and labeling errors. Provide precise locations and severity assessments.",
      quality_control:
        "Manufacturing quality control inspection. Verify product quality, detect defects, assess compliance with quality standards (ISO 9001, ISO 14001, ASTM), and provide quality grading. Check for dimensional accuracy, surface finish, assembly correctness, and packaging quality.",
      equipment_inspection:
        "Manufacturing equipment condition assessment. Evaluate equipment wear, identify maintenance issues, assess operational condition, detect signs of failure, and recommend maintenance actions. Check for corrosion, wear, damage, misalignment, and operational issues.",
      general:
        "General manufacturing analysis. Identify all manufacturing-related issues including defects, quality concerns, equipment condition, and compliance issues.",
    };

    return `${baseContext}\n\n${modeContexts[mode] || modeContexts.general}`;
  }

  /**
   * Extract defects from vision analysis
   */
  private extractDefects(
    analysis: EnhancedVisionAnalysis,
    mode: string,
  ): ManufacturingDefect[] {
    const defects: ManufacturingDefect[] = [];

    // Extract from quality issues
    const qualityIssues = analysis.analysis.qualityIssues || [];
    for (const issue of qualityIssues) {
      const defectType = this.mapIssueToDefectType(issue.type, issue.issue);

      defects.push({
        id: `defect-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: defectType,
        severity:
          issue.severity === "critical"
            ? "critical"
            : issue.severity === "major"
              ? "major"
              : "minor",
        location: issue.location || { x: 0, y: 0, width: 0, height: 0 },
        description: issue.issue,
        confidence: issue.confidence,
        recommendation: this.getDefectRecommendation(
          defectType,
          issue.severity,
        ),
        standard: this.getRelevantStandard(defectType),
      });
    }

    // Extract from detected objects that might indicate defects
    const detectedObjects = analysis.analysis.detectedObjects || [];
    for (const obj of detectedObjects) {
      const defectKeywords = [
        "crack",
        "scratch",
        "dent",
        "damage",
        "defect",
        "imperfection",
      ];
      if (
        defectKeywords.some((keyword) =>
          obj.object.toLowerCase().includes(keyword),
        )
      ) {
        const defectType = this.mapObjectToDefectType(obj.object);
        if (defectType) {
          defects.push({
            id: `defect-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: defectType,
            severity: "minor",
            location: obj.boundingBox || { x: 0, y: 0, width: 0, height: 0 },
            description: `Detected ${obj.object}`,
            confidence: obj.confidence,
            recommendation: this.getDefectRecommendation(defectType, "minor"),
          });
        }
      }
    }

    return defects;
  }

  /**
   * Map issue type to defect type
   */
  private mapIssueToDefectType(
    issueType: string,
    issueDescription: string,
  ): DefectType {
    const lowerType = issueType.toLowerCase();
    const lowerDesc = issueDescription.toLowerCase();

    if (lowerDesc.includes("scratch") || lowerType === "scratch")
      return "scratch";
    if (lowerDesc.includes("dent") || lowerType === "dent") return "dent";
    if (lowerDesc.includes("crack") || lowerType === "crack") return "crack";
    if (lowerDesc.includes("misalign") || lowerDesc.includes("alignment"))
      return "misalignment";
    if (lowerDesc.includes("discolor") || lowerDesc.includes("color"))
      return "discoloration";
    if (lowerDesc.includes("contaminat") || lowerType === "contamination")
      return "contamination";
    if (lowerDesc.includes("missing") || lowerDesc.includes("absent"))
      return "missing_component";
    if (lowerDesc.includes("dimension") || lowerDesc.includes("size"))
      return "incorrect_dimension";
    if (lowerDesc.includes("surface")) return "surface_imperfection";
    if (lowerDesc.includes("assembly") || lowerDesc.includes("assemble"))
      return "assembly_error";
    if (lowerDesc.includes("packaging") || lowerDesc.includes("package"))
      return "packaging_defect";
    if (lowerDesc.includes("label") || lowerDesc.includes("labeling"))
      return "labeling_error";

    return "surface_imperfection"; // Default
  }

  /**
   * Map detected object to defect type
   */
  private mapObjectToDefectType(objectName: string): DefectType | null {
    const lower = objectName.toLowerCase();

    if (lower.includes("scratch")) return "scratch";
    if (lower.includes("crack")) return "crack";
    if (lower.includes("dent")) return "dent";
    if (lower.includes("damage")) return "surface_imperfection";

    return null;
  }

  /**
   * Get defect recommendation
   */
  private getDefectRecommendation(
    defectType: DefectType,
    severity: string,
  ): string {
    const recommendations: Record<DefectType, string> = {
      scratch:
        "Review surface finish requirements. Consider polishing or refinishing.",
      dent: "Assess structural impact. May require repair or rejection.",
      crack:
        "CRITICAL: Inspect for structural integrity. Likely rejection required.",
      misalignment:
        "Verify dimensional tolerances. Adjust assembly process if needed.",
      discoloration: "Check material quality and processing conditions.",
      contamination: "Identify contamination source. Clean and verify removal.",
      missing_component: "Verify assembly process. Check for missing parts.",
      incorrect_dimension:
        "Measure against specifications. Adjust manufacturing process.",
      surface_imperfection:
        "Assess impact on function. May require surface treatment.",
      assembly_error: "Review assembly procedures. Verify component placement.",
      packaging_defect: "Check packaging process. Ensure proper protection.",
      labeling_error: "Verify label information. Correct labeling process.",
    };

    const base = recommendations[defectType] || "Review and address defect";

    if (severity === "critical") {
      return `URGENT: ${base} Immediate action required.`;
    } else if (severity === "major") {
      return `HIGH PRIORITY: ${base} Address within 24 hours.`;
    }

    return base;
  }

  /**
   * Get relevant standard for defect type
   */
  private getRelevantStandard(defectType: DefectType): string | undefined {
    const standards: Record<DefectType, string> = {
      scratch: "ISO 9001 - Quality Management",
      dent: "ISO 9001 - Quality Management",
      crack: "ISO 9001, ASTM E1820 - Fracture Testing",
      misalignment: "ISO 9001, ISO 2768 - Geometric Tolerances",
      discoloration: "ISO 9001 - Quality Management",
      contamination: "ISO 14001 - Environmental Management",
      missing_component: "ISO 9001 - Quality Management",
      incorrect_dimension: "ISO 9001, ISO 2768 - Dimensional Tolerances",
      surface_imperfection: "ISO 9001 - Quality Management",
      assembly_error: "ISO 9001 - Quality Management",
      packaging_defect: "ISO 9001 - Quality Management",
      labeling_error: "ISO 9001, GHS - Labeling Standards",
    };

    return standards[defectType];
  }

  /**
   * Perform quality control analysis
   */
  private performQualityControl(
    defects: ManufacturingDefect[],
    options: { checkStandards: boolean; enableQualityGrading: boolean },
  ): QualityControlResult {
    const criticalDefects = defects.filter((d) => d.severity === "critical");
    const majorDefects = defects.filter((d) => d.severity === "major");
    const minorDefects = defects.filter((d) => d.severity === "minor");

    // Calculate quality score
    let score = 100;
    score -= criticalDefects.length * 30;
    score -= majorDefects.length * 15;
    score -= minorDefects.length * 5;
    score = Math.max(0, Math.min(100, score));

    // Determine quality grade
    let qualityGrade: "A" | "B" | "C" | "D" | "F";
    if (score >= 90) qualityGrade = "A";
    else if (score >= 80) qualityGrade = "B";
    else if (score >= 70) qualityGrade = "C";
    else if (score >= 60) qualityGrade = "D";
    else qualityGrade = "F";

    // Compliance status
    const complianceStatus = {
      iso9001: criticalDefects.length === 0 && majorDefects.length <= 1,
      iso14001: defects.filter((d) => d.type === "contamination").length === 0,
      otherStandards: defects
        .filter((d) => d.standard)
        .map((d) => d.standard!)
        .filter((v, i, a) => a.indexOf(v) === i), // Unique standards
    };

    // Recommendations
    const recommendations: string[] = [];
    if (criticalDefects.length > 0) {
      recommendations.push(
        `URGENT: Address ${criticalDefects.length} critical defect(s) immediately`,
      );
    }
    if (majorDefects.length > 0) {
      recommendations.push(
        `Review ${majorDefects.length} major defect(s) within 24 hours`,
      );
    }
    if (score < 70) {
      recommendations.push(
        "Quality score below acceptable threshold - review manufacturing process",
      );
    }
    if (!complianceStatus.iso9001) {
      recommendations.push(
        "ISO 9001 compliance at risk - take corrective action",
      );
    }

    return {
      passed: score >= 70 && criticalDefects.length === 0,
      score,
      defects,
      criticalDefects,
      qualityGrade,
      recommendations,
      complianceStatus,
    };
  }

  /**
   * Analyze equipment condition
   */
  private analyzeEquipmentCondition(
    analysis: EnhancedVisionAnalysis,
  ): EquipmentCondition {
    const qualityIssues = analysis.analysis.qualityIssues || [];
    const safetyIssues = analysis.analysis.safetyIssues || [];

    const issues = [
      ...qualityIssues.map((q) => ({
        type: q.type,
        severity: q.severity,
        description: q.issue,
        recommendation: `Address ${q.type} issue`,
      })),
      ...safetyIssues.map((s) => ({
        type: "safety",
        severity: s.severity,
        description: s.issue,
        recommendation: `Address safety concern: ${s.issue}`,
      })),
    ];

    // Calculate wear level
    const wearLevel = Math.min(100, issues.length * 15);

    // Determine condition
    let condition: EquipmentCondition["condition"] = "excellent";
    if (wearLevel >= 80) condition = "critical";
    else if (wearLevel >= 60) condition = "poor";
    else if (wearLevel >= 40) condition = "fair";
    else if (wearLevel >= 20) condition = "good";
    else condition = "excellent";

    const maintenanceRequired =
      wearLevel >= 50 || issues.some((i) => i.severity === "critical");

    return {
      equipmentId: "equipment-1",
      condition,
      wearLevel,
      issues,
      maintenanceRequired,
      estimatedRemainingLife: Math.max(0, 100 - wearLevel),
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    defects: ManufacturingDefect[],
    qualityControl: QualityControlResult,
    equipmentCondition?: EquipmentCondition,
  ): { recommendations: string[]; urgentActions: string[] } {
    const recommendations: string[] = [];
    const urgentActions: string[] = [];

    // Defect-based recommendations
    if (defects.length > 0) {
      const criticalDefects = defects.filter((d) => d.severity === "critical");
      if (criticalDefects.length > 0) {
        urgentActions.push(
          `URGENT: ${criticalDefects.length} critical defect(s) require immediate attention`,
        );
      }

      const defectTypes = new Set(defects.map((d) => d.type));
      for (const type of defectTypes) {
        const count = defects.filter((d) => d.type === type).length;
        recommendations.push(
          `Address ${count} ${type} defect(s) - review manufacturing process`,
        );
      }
    }

    // Quality control recommendations
    if (!qualityControl.passed) {
      urgentActions.push(
        `Quality control failed (score: ${qualityControl.score}) - review required`,
      );
    }
    recommendations.push(...qualityControl.recommendations);

    // Equipment recommendations
    if (equipmentCondition && equipmentCondition.maintenanceRequired) {
      urgentActions.push(
        `Equipment maintenance required - condition: ${equipmentCondition.condition}`,
      );
    }

    return { recommendations, urgentActions };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const manufacturingVisionService = new ManufacturingVisionService();
export default manufacturingVisionService;
