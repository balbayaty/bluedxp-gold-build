/**
 * Saudi Alignment Engine Types
 *
 * Vision 2030 alignment, regulatory tracking, compliance scoring
 *
 * @module saudi-alignment
 */

// ============================================================================
// VISION 2030 TYPES
// ============================================================================

/**
 * Vision 2030 pillars
 */
export type Vision2030Pillar =
  | "A_VIBRANT_SOCIETY"
  | "A_THRIVING_ECONOMY"
  | "AN_AMBITIOUS_NATION";

/**
 * Vision 2030 goals
 */
export interface Vision2030Goal {
  id: string;
  pillar: Vision2030Pillar;
  name: string;
  description: string;
  targetYear: number;
  kpis: Array<{
    name: string;
    target: number;
    unit: string;
  }>;
}

/**
 * Vision 2030 alignment score
 */
export interface Vision2030Alignment {
  overallScore: number; // 0-100
  pillarScores: Record<Vision2030Pillar, number>;
  goalAlignments: Array<{
    goalId: string;
    goalName: string;
    alignmentScore: number;
    contribution: number;
    evidence: string[];
  }>;
  recommendations: string[];
  lastUpdated: Date;
}

// ============================================================================
// REGULATORY TRACKING TYPES
// ============================================================================

/**
 * Saudi government agencies
 */
export type SaudiAgency =
  | "TGA" // Transport General Authority
  | "MOT" // Ministry of Transport
  | "ABSHER" // Absher Platform
  | "NAFATH" // Nafath Platform
  | "SABER" // SABER Platform
  | "SFDA" // Saudi Food and Drug Authority
  | "ZATCA" // Zakat, Tax and Customs Authority
  | "SAMA" // Saudi Central Bank
  | "NCSC" // National Cybersecurity Center
  | "SDAIA" // Saudi Data and AI Authority
  | "SASO" // Saudi Standards, Metrology and Quality Organization
  | "MODON" // Saudi Authority for Industrial Cities and Technology Zones
  | "MOC" // Ministry of Commerce
  | "MOI" // Ministry of Interior
  | "MOMRA" // Ministry of Municipal and Rural Affairs
  | "MISA" // Ministry of Investment
  | "CITC"; // Communications and Information Technology Commission

/**
 * Regulatory requirement
 */
export interface RegulatoryRequirement {
  id: string;
  agency: SaudiAgency;
  title: string;
  description: string;
  category:
    | "LICENSE"
    | "PERMIT"
    | "CERTIFICATION"
    | "APPROVAL"
    | "REGISTRATION"
    | "COMPLIANCE";
  applicableTo: string[]; // Entity types
  requiredDocuments: string[];
  validityPeriod?: number; // days
  renewalRequired: boolean;
  lastUpdated: Date;
  status: "ACTIVE" | "UPDATED" | "DEPRECATED";
  apiEndpoint?: string;
  verificationMethod: "API" | "MANUAL" | "DOCUMENT";
}

/**
 * Compliance status
 */
export interface ComplianceStatus {
  entityId: string;
  entityType: string;
  requirements: Array<{
    requirementId: string;
    requirementTitle: string;
    agency: SaudiAgency;
    status:
      | "COMPLIANT"
      | "NON_COMPLIANT"
      | "PENDING"
      | "EXPIRED"
      | "NOT_APPLICABLE";
    verifiedAt?: Date;
    verifiedBy?: string;
    expiresAt?: Date;
    documents: string[];
    notes?: string;
  }>;
  overallCompliance: number; // 0-100
  lastChecked: Date;
}

// ============================================================================
// COMPLIANCE SCORING TYPES
// ============================================================================

/**
 * Compliance score
 */
export interface ComplianceScore {
  entityId: string;
  entityType: string;
  overallScore: number; // 0-100
  agencyScores: Record<SaudiAgency, number>;
  categoryScores: Record<string, number>;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  violations: Array<{
    requirementId: string;
    requirementTitle: string;
    agency: SaudiAgency;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
    recommendedAction: string;
    deadline?: Date;
  }>;
  recommendations: string[];
  calculatedAt: Date;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

/**
 * Compliance report
 */
export interface ComplianceReport {
  id: string;
  tenantId: string;
  reportType:
    | "VISION_2030"
    | "REGULATORY"
    | "COMPLIANCE_SCORE"
    | "COMPREHENSIVE";
  entityId?: string;
  entityType?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  content: {
    executiveSummary: string;
    vision2030Alignment?: Vision2030Alignment;
    complianceStatus?: ComplianceStatus;
    complianceScore?: ComplianceScore;
    regulatoryTracking?: Array<{
      agency: SaudiAgency;
      requirements: RegulatoryRequirement[];
      status: ComplianceStatus["requirements"];
    }>;
    recommendations: string[];
    nextSteps: string[];
  };
  format: "PDF" | "JSON" | "HTML";
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Vision 2030 Mapper interface
 */
export interface Vision2030Mapper {
  /**
   * Calculate Vision 2030 alignment for entity
   */
  calculateAlignment(
    entityId: string,
    entityType: string,
  ): Promise<Vision2030Alignment>;

  /**
   * Get all Vision 2030 goals
   */
  getAllGoals(): Vision2030Goal[];

  /**
   * Track progress towards goals
   */
  trackProgress(goalId: string, metrics: Record<string, number>): Promise<void>;
}

/**
 * Regulatory Tracker interface
 */
export interface RegulatoryTracker {
  /**
   * Get all requirements for entity
   */
  getRequirements(entityType: string): Promise<RegulatoryRequirement[]>;

  /**
   * Check compliance status
   */
  checkCompliance(
    entityId: string,
    entityType: string,
  ): Promise<ComplianceStatus>;

  /**
   * Track regulatory updates
   */
  trackUpdates(agency: SaudiAgency): Promise<RegulatoryRequirement[]>;

  /**
   * Verify requirement compliance
   */
  verifyRequirement(
    entityId: string,
    requirementId: string,
  ): Promise<{
    compliant: boolean;
    evidence: string[];
    verifiedAt: Date;
  }>;
}

/**
 * Compliance Scorer interface
 */
export interface ComplianceScorer {
  /**
   * Calculate compliance score
   */
  calculateScore(
    entityId: string,
    entityType: string,
  ): Promise<ComplianceScore>;

  /**
   * Assess risk level
   */
  assessRisk(
    complianceScore: ComplianceScore,
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  /**
   * Generate recommendations
   */
  generateRecommendations(complianceScore: ComplianceScore): string[];
}

/**
 * Report Generator interface
 */
export interface ReportGenerator {
  /**
   * Generate compliance report
   */
  generateReport(request: {
    reportType: ComplianceReport["reportType"];
    entityId?: string;
    entityType?: string;
    dateRange?: { from: Date; to: Date };
    format?: ComplianceReport["format"];
  }): Promise<ComplianceReport>;

  /**
   * Export report
   */
  exportReport(
    reportId: string,
    format: "PDF" | "JSON" | "HTML",
  ): Promise<Buffer | string>;
}

/**
 * Main Saudi Alignment Service interface
 */
export interface SaudiAlignmentService {
  vision2030Mapper: Vision2030Mapper;
  regulatoryTracker: RegulatoryTracker;
  complianceScorer: ComplianceScorer;
  reportGenerator: ReportGenerator;

  /**
   * Get comprehensive alignment for entity
   */
  getComprehensiveAlignment(
    entityId: string,
    entityType: string,
  ): Promise<{
    vision2030: Vision2030Alignment;
    compliance: ComplianceStatus;
    score: ComplianceScore;
  }>;
}
