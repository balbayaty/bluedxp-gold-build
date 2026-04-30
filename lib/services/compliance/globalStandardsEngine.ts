/**
 * 🌍 GLOBAL STANDARDS ENGINE
 * Comprehensive global regulatory standards compliance system
 *
 * Features:
 * - ISO Standards compliance
 * - FDA Standards compliance
 * - EU Regulations compliance
 * - International standards tracking
 * - Cross-regional compliance mapping
 *
 * Source: Adapted from chemcheck-analysis/lib/compliance/GlobalStandardsEngine.ts
 * Architecture: Deep layer integration with Event Bus and compliance services
 */

import { eventBus } from "@/lib/services/event-bus";
import type {
  RegulatoryAuthority,
  ComplianceStatus,
  CompliancePriority,
} from "@/types/compliance";

// ============================================================================
// GLOBAL STANDARDS TYPES
// ============================================================================

export interface ISOStandard {
  code: string;
  name: string;
  version: string;
  category:
    | "quality"
    | "environmental"
    | "safety"
    | "security"
    | "energy"
    | "food_safety"
    | "business_continuity"
    | "medical_devices"
    | "supply_chain"
    | "information_security"
    | "risk_management"
    | "asset_management"
    | "facility_management";
  requirements: ISORequirement[];
  certificationRequired: boolean;
  certificationBody?: string;
  lastUpdated: Date;
}

export interface ISORequirement {
  id: string;
  clause: string;
  title: string;
  description: string;
  mandatory: boolean;
  evidenceRequired: string[];
  applicableTo: string[];
}

export interface FDAStandard {
  code: string;
  name: string;
  part: string;
  category:
    | "drugs"
    | "devices"
    | "food"
    | "cosmetics"
    | "tobacco"
    | "electronic_records";
  requirements: FDARequirement[];
  lastUpdated: Date;
}

export interface FDARequirement {
  id: string;
  section: string;
  title: string;
  description: string;
  mandatory: boolean;
  evidenceRequired: string[];
  applicableTo: string[];
}

export interface EURegulation {
  code: string;
  name: string;
  category:
    | "data_protection"
    | "product_safety"
    | "environmental"
    | "chemical"
    | "food_safety"
    | "medical_devices";
  requirements: EURegulationRequirement[];
  effectiveDate: Date;
  lastUpdated: Date;
}

export interface EURegulationRequirement {
  id: string;
  article: string;
  title: string;
  description: string;
  mandatory: boolean;
  evidenceRequired: string[];
  applicableTo: string[];
}

export interface GlobalStandardsCompliance {
  id: string;
  tenantId: string;
  checkDate: Date;
  isoStandards: Map<string, ISOStandardCompliance>;
  fdaStandards: Map<string, FDAStandardCompliance>;
  euRegulations: Map<string, EURegulationCompliance>;
  overallComplianceScore: number;
  overallStatus: ComplianceStatus;
  actionItems: ComplianceActionItem[];
  nextReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISOStandardCompliance {
  standardCode: string;
  complianceScore: number;
  status: ComplianceStatus;
  requirementsMet: number;
  requirementsTotal: number;
  certifications: Array<{
    type: string;
    number: string;
    issuedBy: string;
    issueDate: Date;
    expiryDate: Date;
    status: "active" | "expired" | "pending";
  }>;
  gaps: string[];
}

export interface FDAStandardCompliance {
  standardCode: string;
  complianceScore: number;
  status: ComplianceStatus;
  requirementsMet: number;
  requirementsTotal: number;
  registrations: Array<{
    type: string;
    number: string;
    status: "active" | "expired" | "pending";
    expiryDate?: Date;
  }>;
  gaps: string[];
}

export interface EURegulationCompliance {
  regulationCode: string;
  complianceScore: number;
  status: ComplianceStatus;
  requirementsMet: number;
  requirementsTotal: number;
  certifications: Array<{
    type: string;
    number: string;
    issuedBy: string;
    issueDate: Date;
    expiryDate: Date;
    status: "active" | "expired" | "pending";
  }>;
  gaps: string[];
}

export interface ComplianceActionItem {
  id: string;
  title: string;
  description: string;
  priority: CompliancePriority;
  standard: string;
  category: "ISO" | "FDA" | "EU";
  dueDate: Date;
  status: "pending" | "in_progress" | "completed" | "overdue";
  assignedTo: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

// ============================================================================
// GLOBAL STANDARDS ENGINE
// ============================================================================

export class GlobalStandardsEngine {
  private static instance: GlobalStandardsEngine;
  private isoStandards: Map<string, ISOStandard> = new Map();
  private fdaStandards: Map<string, FDAStandard> = new Map();
  private euRegulations: Map<string, EURegulation> = new Map();
  private complianceChecks: Map<string, GlobalStandardsCompliance> = new Map();
  private actionItems: Map<string, ComplianceActionItem> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): GlobalStandardsEngine {
    if (!GlobalStandardsEngine.instance) {
      GlobalStandardsEngine.instance = new GlobalStandardsEngine();
    }
    return GlobalStandardsEngine.instance;
  }

  private async initializeEngine(): Promise<void> {
    console.log("🌍 Initializing Global Standards Engine...");

    // Initialize standard definitions
    this.initializeISOStandards();
    this.initializeFDAStandards();
    this.initializeEURegulations();

    await eventBus.publish({
      type: "compliance.global.engine.initialized",
      data: {
        timestamp: new Date(),
        engine: "GlobalStandardsEngine",
        isoStandards: this.isoStandards.size,
        fdaStandards: this.fdaStandards.size,
        euRegulations: this.euRegulations.size,
      },
    });
  }

  /**
   * Initialize ISO Standards
   */
  private initializeISOStandards(): void {
    const standards: ISOStandard[] = [
      {
        code: "ISO_9001",
        name: "Quality Management Systems",
        version: "2015",
        category: "quality",
        requirements: [
          {
            id: "iso9001-4.1",
            clause: "4.1",
            title: "Understanding the organization and its context",
            description:
              "Determine external and internal issues relevant to the organization",
            mandatory: true,
            evidenceRequired: ["context_analysis", "stakeholder_analysis"],
            applicableTo: ["all"],
          },
          {
            id: "iso9001-4.2",
            clause: "4.2",
            title:
              "Understanding the needs and expectations of interested parties",
            description: "Determine interested parties and their requirements",
            mandatory: true,
            evidenceRequired: ["stakeholder_register", "requirements_analysis"],
            applicableTo: ["all"],
          },
          {
            id: "iso9001-5.1",
            clause: "5.1",
            title: "Leadership and commitment",
            description:
              "Top management must demonstrate leadership and commitment",
            mandatory: true,
            evidenceRequired: ["leadership_commitment", "policy_statement"],
            applicableTo: ["management"],
          },
          {
            id: "iso9001-6.2",
            clause: "6.2",
            title: "Quality objectives and planning",
            description:
              "Establish quality objectives at relevant functions and levels",
            mandatory: true,
            evidenceRequired: ["quality_objectives", "planning_documents"],
            applicableTo: ["all"],
          },
          {
            id: "iso9001-7.1",
            clause: "7.1",
            title: "Resources",
            description: "Determine and provide resources needed for QMS",
            mandatory: true,
            evidenceRequired: ["resource_allocation", "competency_records"],
            applicableTo: ["all"],
          },
          {
            id: "iso9001-8.2",
            clause: "8.2",
            title: "Requirements for products and services",
            description: "Determine requirements for products and services",
            mandatory: true,
            evidenceRequired: ["customer_requirements", "contract_review"],
            applicableTo: ["sales", "operations"],
          },
          {
            id: "iso9001-9.1",
            clause: "9.1",
            title: "Monitoring, measurement, analysis and evaluation",
            description:
              "Monitor, measure, analyze and evaluate QMS performance",
            mandatory: true,
            evidenceRequired: [
              "monitoring_plans",
              "measurement_records",
              "analysis_reports",
            ],
            applicableTo: ["all"],
          },
        ],
        certificationRequired: true,
        certificationBody: "Accredited Certification Body",
        lastUpdated: new Date("2015-09-15"),
      },
      {
        code: "ISO_14001",
        name: "Environmental Management Systems",
        version: "2015",
        category: "environmental",
        requirements: [
          {
            id: "iso14001-4.1",
            clause: "4.1",
            title: "Understanding the organization and its context",
            description:
              "Determine external and internal issues relevant to environmental management",
            mandatory: true,
            evidenceRequired: ["environmental_context_analysis"],
            applicableTo: ["all"],
          },
          {
            id: "iso14001-6.1",
            clause: "6.1",
            title: "Actions to address risks and opportunities",
            description:
              "Plan actions to address environmental aspects and compliance obligations",
            mandatory: true,
            evidenceRequired: [
              "environmental_aspects_register",
              "risk_assessment",
            ],
            applicableTo: ["environmental", "operations"],
          },
          {
            id: "iso14001-9.1",
            clause: "9.1",
            title: "Monitoring, measurement, analysis and evaluation",
            description: "Monitor environmental performance and compliance",
            mandatory: true,
            evidenceRequired: ["monitoring_plans", "measurement_records"],
            applicableTo: ["environmental"],
          },
        ],
        certificationRequired: true,
        lastUpdated: new Date("2015-09-15"),
      },
      {
        code: "ISO_45001",
        name: "Occupational Health and Safety Management",
        version: "2018",
        category: "safety",
        requirements: [
          {
            id: "iso45001-6.1",
            clause: "6.1",
            title: "Actions to address risks and opportunities",
            description: "Plan actions to address OH&S risks and opportunities",
            mandatory: true,
            evidenceRequired: ["hazard_identification", "risk_assessment"],
            applicableTo: ["safety", "operations"],
          },
          {
            id: "iso45001-8.1",
            clause: "8.1",
            title: "Operational planning and control",
            description:
              "Plan, implement and control processes needed to meet OH&S requirements",
            mandatory: true,
            evidenceRequired: ["operational_controls", "emergency_procedures"],
            applicableTo: ["safety", "operations"],
          },
        ],
        certificationRequired: true,
        lastUpdated: new Date("2018-03-12"),
      },
    ];

    for (const standard of standards) {
      this.isoStandards.set(standard.code, standard);
    }
  }

  /**
   * Initialize FDA Standards
   */
  private initializeFDAStandards(): void {
    const standards: FDAStandard[] = [
      {
        code: "FDA_21_CFR_PART_11",
        name: "Electronic Records; Electronic Signatures",
        part: "21 CFR Part 11",
        category: "electronic_records",
        requirements: [
          {
            id: "fda11-11.10",
            section: "11.10",
            title: "Controls for closed systems",
            description:
              "Persons who use closed systems to create, modify, maintain, or transmit electronic records shall employ procedures and controls",
            mandatory: true,
            evidenceRequired: [
              "system_validation",
              "access_controls",
              "audit_trails",
            ],
            applicableTo: ["it", "quality"],
          },
          {
            id: "fda11-11.30",
            section: "11.30",
            title: "Controls for identification codes/passwords",
            description:
              "Persons who use electronic signatures based upon use of identification codes in combination with passwords",
            mandatory: true,
            evidenceRequired: ["password_policy", "access_management"],
            applicableTo: ["it", "all"],
          },
          {
            id: "fda11-11.50",
            section: "11.50",
            title: "Signature manifestations",
            description:
              "Signed electronic records shall contain information associated with the signing",
            mandatory: true,
            evidenceRequired: ["signature_metadata", "timestamping"],
            applicableTo: ["it", "quality"],
          },
        ],
        lastUpdated: new Date("2023-08-29"),
      },
      {
        code: "FDA_21_CFR_PART_211",
        name: "Current Good Manufacturing Practice for Finished Pharmaceuticals",
        part: "21 CFR Part 211",
        category: "drugs",
        requirements: [
          {
            id: "fda211-211.22",
            section: "211.22",
            title: "Responsibilities of quality control unit",
            description:
              "Quality control unit shall have responsibility and authority to approve or reject all components, drug product containers, closures, in-process materials, packaging materials, labeling, and drug products",
            mandatory: true,
            evidenceRequired: [
              "qc_organization_chart",
              "qc_procedures",
              "approval_records",
            ],
            applicableTo: ["quality", "manufacturing"],
          },
          {
            id: "fda211-211.42",
            section: "211.42",
            title: "Design and construction features",
            description:
              "Buildings used in the manufacture, processing, packing, or holding of a drug product shall be of suitable size, construction and location",
            mandatory: true,
            evidenceRequired: ["facility_design_docs", "validation_records"],
            applicableTo: ["facilities", "manufacturing"],
          },
          {
            id: "fda211-211.84",
            section: "211.84",
            title:
              "Testing and approval or rejection of components, drug product containers, and closures",
            description:
              "Each lot of components, drug product containers, and closures shall be tested or examined",
            mandatory: true,
            evidenceRequired: [
              "testing_procedures",
              "test_results",
              "approval_records",
            ],
            applicableTo: ["quality", "procurement"],
          },
        ],
        lastUpdated: new Date("2023-08-29"),
      },
    ];

    for (const standard of standards) {
      this.fdaStandards.set(standard.code, standard);
    }
  }

  /**
   * Initialize EU Regulations
   */
  private initializeEURegulations(): void {
    const regulations: EURegulation[] = [
      {
        code: "EU_GDPR",
        name: "General Data Protection Regulation",
        category: "data_protection",
        requirements: [
          {
            id: "gdpr-art5",
            article: "Article 5",
            title: "Principles relating to processing of personal data",
            description:
              "Personal data shall be processed lawfully, fairly and in a transparent manner",
            mandatory: true,
            evidenceRequired: [
              "privacy_policy",
              "consent_management",
              "data_processing_records",
            ],
            applicableTo: ["it", "legal", "all"],
          },
          {
            id: "gdpr-art6",
            article: "Article 6",
            title: "Lawfulness of processing",
            description:
              "Processing shall be lawful only if and to the extent that at least one of the legal bases applies",
            mandatory: true,
            evidenceRequired: ["legal_basis_documentation", "consent_records"],
            applicableTo: ["legal", "it"],
          },
          {
            id: "gdpr-art15",
            article: "Article 15",
            title: "Right of access by the data subject",
            description:
              "Data subject shall have the right to obtain confirmation as to whether or not personal data are being processed",
            mandatory: true,
            evidenceRequired: [
              "access_request_procedures",
              "response_templates",
            ],
            applicableTo: ["legal", "it"],
          },
        ],
        effectiveDate: new Date("2018-05-25"),
        lastUpdated: new Date("2018-05-25"),
      },
      {
        code: "EU_REACH",
        name: "Registration, Evaluation, Authorisation and Restriction of Chemicals",
        category: "chemical",
        requirements: [
          {
            id: "reach-art6",
            article: "Article 6",
            title: "Obligation to register substances",
            description:
              "Manufacturers and importers of substances shall submit a registration to the Agency",
            mandatory: true,
            evidenceRequired: ["registration_documents", "safety_data_sheets"],
            applicableTo: ["chemical", "compliance"],
          },
        ],
        effectiveDate: new Date("2007-06-01"),
        lastUpdated: new Date("2023-01-01"),
      },
    ];

    for (const regulation of regulations) {
      this.euRegulations.set(regulation.code, regulation);
    }
  }

  /**
   * Perform global standards compliance check
   */
  async performComplianceCheck(
    tenantId: string,
    options: {
      isoStandards?: string[];
      fdaStandards?: string[];
      euRegulations?: string[];
    } = {},
  ): Promise<GlobalStandardsCompliance> {
    console.log(
      `🌍 Performing global standards compliance check for tenant: ${tenantId}`,
    );

    const isoCompliance = new Map<string, ISOStandardCompliance>();
    const fdaCompliance = new Map<string, FDAStandardCompliance>();
    const euCompliance = new Map<string, EURegulationCompliance>();

    // Check ISO Standards
    const isoStandardsToCheck =
      options.isoStandards || Array.from(this.isoStandards.keys());
    for (const standardCode of isoStandardsToCheck) {
      const standard = this.isoStandards.get(standardCode);
      if (standard) {
        const compliance = await this.checkISOStandard(tenantId, standard);
        isoCompliance.set(standardCode, compliance);
      }
    }

    // Check FDA Standards
    const fdaStandardsToCheck =
      options.fdaStandards || Array.from(this.fdaStandards.keys());
    for (const standardCode of fdaStandardsToCheck) {
      const standard = this.fdaStandards.get(standardCode);
      if (standard) {
        const compliance = await this.checkFDAStandard(tenantId, standard);
        fdaCompliance.set(standardCode, compliance);
      }
    }

    // Check EU Regulations
    const euRegulationsToCheck =
      options.euRegulations || Array.from(this.euRegulations.keys());
    for (const regulationCode of euRegulationsToCheck) {
      const regulation = this.euRegulations.get(regulationCode);
      if (regulation) {
        const compliance = await this.checkEURegulation(tenantId, regulation);
        euCompliance.set(regulationCode, compliance);
      }
    }

    // Calculate overall scores
    const isoScore = this.calculateAverageScore(
      Array.from(isoCompliance.values()).map((c) => c.complianceScore),
    );
    const fdaScore = this.calculateAverageScore(
      Array.from(fdaCompliance.values()).map((c) => c.complianceScore),
    );
    const euScore = this.calculateAverageScore(
      Array.from(euCompliance.values()).map((c) => c.complianceScore),
    );

    const overallScore = Math.round((isoScore + fdaScore + euScore) / 3);

    // Generate action items
    const actionItems = await this.generateActionItems(tenantId, {
      isoCompliance,
      fdaCompliance,
      euCompliance,
    });

    // Create compliance check
    const check: GlobalStandardsCompliance = {
      id: `global-compliance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId,
      checkDate: new Date(),
      isoStandards: isoCompliance,
      fdaStandards: fdaCompliance,
      euRegulations: euCompliance,
      overallComplianceScore: overallScore,
      overallStatus: this.determineComplianceStatus(overallScore),
      actionItems,
      nextReviewDate: this.calculateNextReviewDate(overallScore),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.complianceChecks.set(check.id, check);

    // Store action items
    for (const item of actionItems) {
      this.actionItems.set(item.id, item);
    }

    await eventBus.publish({
      type: "compliance.global.check.completed",
      data: {
        checkId: check.id,
        tenantId,
        overallScore,
        overallStatus: check.overallStatus,
        isoScore,
        fdaScore,
        euScore,
        actionItemsCount: actionItems.length,
        timestamp: new Date(),
      },
    });

    return check;
  }

  /**
   * Check ISO Standard compliance
   */
  private async checkISOStandard(
    tenantId: string,
    standard: ISOStandard,
  ): Promise<ISOStandardCompliance> {
    // Simulate compliance checking
    const requirementsMet = Math.floor(standard.requirements.length * 0.7); // 70% compliance
    const complianceScore = Math.round(
      (requirementsMet / standard.requirements.length) * 100,
    );

    const gaps = standard.requirements
      .slice(requirementsMet)
      .map((req) => req.title);

    return {
      standardCode: standard.code,
      complianceScore,
      status: this.determineComplianceStatus(complianceScore),
      requirementsMet,
      requirementsTotal: standard.requirements.length,
      certifications: [],
      gaps,
    };
  }

  /**
   * Check FDA Standard compliance
   */
  private async checkFDAStandard(
    tenantId: string,
    standard: FDAStandard,
  ): Promise<FDAStandardCompliance> {
    const requirementsMet = Math.floor(standard.requirements.length * 0.75); // 75% compliance
    const complianceScore = Math.round(
      (requirementsMet / standard.requirements.length) * 100,
    );

    const gaps = standard.requirements
      .slice(requirementsMet)
      .map((req) => req.title);

    return {
      standardCode: standard.code,
      complianceScore,
      status: this.determineComplianceStatus(complianceScore),
      requirementsMet,
      requirementsTotal: standard.requirements.length,
      registrations: [],
      gaps,
    };
  }

  /**
   * Check EU Regulation compliance
   */
  private async checkEURegulation(
    tenantId: string,
    regulation: EURegulation,
  ): Promise<EURegulationCompliance> {
    const requirementsMet = Math.floor(regulation.requirements.length * 0.8); // 80% compliance
    const complianceScore = Math.round(
      (requirementsMet / regulation.requirements.length) * 100,
    );

    const gaps = regulation.requirements
      .slice(requirementsMet)
      .map((req) => req.title);

    return {
      regulationCode: regulation.code,
      complianceScore,
      status: this.determineComplianceStatus(complianceScore),
      requirementsMet,
      requirementsTotal: regulation.requirements.length,
      certifications: [],
      gaps,
    };
  }

  /**
   * Generate action items
   */
  private async generateActionItems(
    tenantId: string,
    compliance: {
      isoCompliance: Map<string, ISOStandardCompliance>;
      fdaCompliance: Map<string, FDAStandardCompliance>;
      euCompliance: Map<string, EURegulationCompliance>;
    },
  ): Promise<ComplianceActionItem[]> {
    const actionItems: ComplianceActionItem[] = [];

    // ISO action items
    for (const [code, comp] of compliance.isoCompliance.entries()) {
      if (comp.complianceScore < 90) {
        for (const gap of comp.gaps.slice(0, 3)) {
          actionItems.push({
            id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            title: `Address ${code} Gap: ${gap}`,
            description: `Comply with ${code} requirement: ${gap}`,
            priority:
              comp.complianceScore < 50
                ? "CRITICAL"
                : comp.complianceScore < 70
                  ? "HIGH"
                  : "MEDIUM",
            standard: code,
            category: "ISO",
            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            status: "pending",
            assignedTo: null,
            completedAt: null,
            createdAt: new Date(),
          });
        }
      }
    }

    // FDA action items
    for (const [code, comp] of compliance.fdaCompliance.entries()) {
      if (comp.complianceScore < 90) {
        for (const gap of comp.gaps.slice(0, 3)) {
          actionItems.push({
            id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            title: `Address ${code} Gap: ${gap}`,
            description: `Comply with ${code} requirement: ${gap}`,
            priority:
              comp.complianceScore < 50
                ? "CRITICAL"
                : comp.complianceScore < 70
                  ? "HIGH"
                  : "MEDIUM",
            standard: code,
            category: "FDA",
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: "pending",
            assignedTo: null,
            completedAt: null,
            createdAt: new Date(),
          });
        }
      }
    }

    // EU action items
    for (const [code, comp] of compliance.euCompliance.entries()) {
      if (comp.complianceScore < 90) {
        for (const gap of comp.gaps.slice(0, 3)) {
          actionItems.push({
            id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            title: `Address ${code} Gap: ${gap}`,
            description: `Comply with ${code} requirement: ${gap}`,
            priority:
              comp.complianceScore < 50
                ? "CRITICAL"
                : comp.complianceScore < 70
                  ? "HIGH"
                  : "MEDIUM",
            standard: code,
            category: "EU",
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: "pending",
            assignedTo: null,
            completedAt: null,
            createdAt: new Date(),
          });
        }
      }
    }

    return actionItems;
  }

  /**
   * Calculate average score
   */
  private calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  }

  /**
   * Determine compliance status
   */
  private determineComplianceStatus(score: number): ComplianceStatus {
    if (score >= 90) return "COMPLIANT";
    if (score >= 70) return "AT_RISK";
    if (score >= 50) return "PENDING_REVIEW";
    return "NON_COMPLIANT";
  }

  /**
   * Calculate next review date
   */
  private calculateNextReviewDate(score: number): Date {
    const daysUntilReview =
      score >= 90 ? 180 : score >= 70 ? 90 : score >= 50 ? 30 : 14;
    return new Date(Date.now() + daysUntilReview * 24 * 60 * 60 * 1000);
  }

  /**
   * Get ISO standard
   */
  getISOStandard(code: string): ISOStandard | null {
    return this.isoStandards.get(code) || null;
  }

  /**
   * Get all ISO standards
   */
  getAllISOStandards(): ISOStandard[] {
    return Array.from(this.isoStandards.values());
  }

  /**
   * Get FDA standard
   */
  getFDAStandard(code: string): FDAStandard | null {
    return this.fdaStandards.get(code) || null;
  }

  /**
   * Get all FDA standards
   */
  getAllFDAStandards(): FDAStandard[] {
    return Array.from(this.fdaStandards.values());
  }

  /**
   * Get EU regulation
   */
  getEURegulation(code: string): EURegulation | null {
    return this.euRegulations.get(code) || null;
  }

  /**
   * Get all EU regulations
   */
  getAllEURegulations(): EURegulation[] {
    return Array.from(this.euRegulations.values());
  }

  /**
   * Get compliance check
   */
  async getComplianceCheck(
    checkId: string,
  ): Promise<GlobalStandardsCompliance | null> {
    return this.complianceChecks.get(checkId) || null;
  }

  /**
   * Get action items
   */
  async getActionItems(
    tenantId: string,
    status?: ComplianceActionItem["status"],
  ): Promise<ComplianceActionItem[]> {
    const checks = Array.from(this.complianceChecks.values()).filter(
      (c) => c.tenantId === tenantId,
    );
    let items = checks.flatMap((c) => c.actionItems);

    if (status) {
      items = items.filter((item) => item.status === status);
    }

    return items.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

// Singleton instance
export const globalStandardsEngine = GlobalStandardsEngine.getInstance();
