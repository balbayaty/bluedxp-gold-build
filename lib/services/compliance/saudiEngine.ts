/**
 * 🇸🇦 SAUDI COMPLIANCE ENGINE
 * Comprehensive Saudi Arabia regulatory compliance system
 *
 * Features:
 * - ZATCA Compliance (E-Invoicing, VAT)
 * - SFDA Compliance (Facility License, Product Registration, GMP)
 * - Civil Defense Compliance (Fire Safety, Emergency Plans)
 * - Vision 2030 Alignment (National Programs, Saudi Green, Digitization)
 * - Automated compliance checking
 * - Compliance reporting
 * - Action item generation
 * - Deadline tracking
 *
 * Source: Adapted from chemcheck-analysis/lib/compliance/SaudiComplianceEngine.ts
 * Architecture: Deep layer integration with Event Bus, CQRS, and multi-tenant support
 */

import { eventBus } from "@/lib/services/event-bus";
import type {
  RegulatoryAuthority,
  ComplianceStatus,
  CompliancePriority,
} from "@/types/compliance";

// ============================================================================
// SAUDI COMPLIANCE TYPES
// ============================================================================

export interface ZATCACompliance {
  // E-Invoicing Compliance
  einvoicingEnabled: boolean;
  einvoicingPhase: "phase1" | "phase2" | "phase3" | "not_applicable";
  qrCodeGeneration: boolean;
  uuidGeneration: boolean;
  cryptographicStamp: boolean;
  einvoicingIntegration: boolean;

  // VAT Compliance
  vatRegistrationNumber: string | null;
  vatRegistrationDate: Date | null;
  vatReturnFiling: boolean;
  vatReturnFrequency: "monthly" | "quarterly" | "annually" | null;
  lastVATReturnDate: Date | null;
  nextVATReturnDate: Date | null;
  vatComplianceScore: number; // 0-100

  // Tax Compliance
  taxClearanceCertificate: boolean;
  taxClearanceExpiry: Date | null;
  withholdingTaxCompliance: boolean;
}

export interface SFDACompliance {
  // Facility License
  facilityLicenseNumber: string | null;
  facilityLicenseType:
    | "manufacturing"
    | "warehouse"
    | "distribution"
    | "retail"
    | null;
  facilityLicenseStatus: "active" | "expired" | "suspended" | "pending" | null;
  facilityLicenseExpiry: Date | null;
  facilityLicenseRenewalRequired: boolean;

  // Product Registration
  productRegistrations: ProductRegistration[];
  productRegistrationCompliance: number; // 0-100

  // GMP (Good Manufacturing Practices)
  gmpCertification: boolean;
  gmpCertificationNumber: string | null;
  gmpCertificationExpiry: Date | null;
  gmpAuditDate: Date | null;
  gmpAuditStatus: "passed" | "failed" | "pending" | null;
  gmpComplianceScore: number; // 0-100

  // Food Safety
  haccpCertification: boolean;
  haccpCertificationExpiry: Date | null;
  foodSafetyCompliance: number; // 0-100
}

export interface ProductRegistration {
  productId: string;
  productName: string;
  registrationNumber: string;
  registrationDate: Date;
  expiryDate: Date;
  status: "active" | "expired" | "pending" | "suspended";
  category: string;
}

export interface CivilDefenseCompliance {
  // Fire Safety
  fireSafetyCertificate: boolean;
  fireSafetyCertificateNumber: string | null;
  fireSafetyCertificateExpiry: Date | null;
  fireSafetyInspectionDate: Date | null;
  fireSafetyInspectionStatus: "passed" | "failed" | "pending" | null;
  fireExtinguishersCount: number;
  fireExtinguishersLastInspection: Date | null;
  fireAlarmSystem: boolean;
  fireAlarmSystemLastTest: Date | null;
  sprinklerSystem: boolean;
  sprinklerSystemLastInspection: Date | null;

  // Emergency Plans
  emergencyPlanExists: boolean;
  emergencyPlanLastUpdated: Date | null;
  emergencyDrillConducted: boolean;
  emergencyDrillLastDate: Date | null;
  emergencyDrillFrequency: "monthly" | "quarterly" | "annually" | null;
  evacuationPlanExists: boolean;
  evacuationPlanLastUpdated: Date | null;

  // Civil Defense License
  civilDefenseLicense: boolean;
  civilDefenseLicenseNumber: string | null;
  civilDefenseLicenseExpiry: Date | null;

  // Compliance Score
  civilDefenseComplianceScore: number; // 0-100
}

export interface Vision2030Alignment {
  // National Programs
  saudiMadeProgram: boolean;
  saudiMadeCertification: string | null;
  localContentProgram: boolean;
  localContentPercentage: number; // 0-100
  nationalTransformationProgram: boolean;
  qualityOfLifeProgram: boolean;

  // Saudi Green Initiative
  carbonFootprintTracking: boolean;
  carbonFootprintReduction: number; // percentage
  renewableEnergyUsage: boolean;
  renewableEnergyPercentage: number; // 0-100
  wasteReductionProgram: boolean;
  wasteReductionPercentage: number; // 0-100
  waterConservationProgram: boolean;
  waterConservationPercentage: number; // 0-100

  // Digitization
  digitalTransformation: boolean;
  digitalServicesAdoption: number; // 0-100
  automationLevel: number; // 0-100
  iotIntegration: boolean;
  aiAdoption: boolean;
  cloudAdoption: boolean;

  // Overall Score
  vision2030AlignmentScore: number; // 0-100
}

export interface SaudiComplianceCheck {
  id: string;
  tenantId: string;
  checkDate: Date;
  zatca: ZATCACompliance;
  sfda: SFDACompliance;
  civilDefense: CivilDefenseCompliance;
  vision2030: Vision2030Alignment;
  overallComplianceScore: number; // 0-100
  overallStatus: ComplianceStatus;
  actionItems: ComplianceActionItem[];
  nextReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceActionItem {
  id: string;
  title: string;
  description: string;
  priority: CompliancePriority;
  authority: RegulatoryAuthority;
  category: "ZATCA" | "SFDA" | "CIVIL_DEFENSE" | "VISION_2030";
  dueDate: Date;
  status: "pending" | "in_progress" | "completed" | "overdue";
  assignedTo: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface ComplianceReport {
  id: string;
  tenantId: string;
  reportDate: Date;
  period: {
    start: Date;
    end: Date;
  };
  zatcaScore: number;
  sfdaScore: number;
  civilDefenseScore: number;
  vision2030Score: number;
  overallScore: number;
  status: ComplianceStatus;
  actionItems: ComplianceActionItem[];
  recommendations: string[];
  nextReviewDate: Date;
  generatedAt: Date;
}

// ============================================================================
// SAUDI COMPLIANCE ENGINE
// ============================================================================

export class SaudiComplianceEngine {
  private static instance: SaudiComplianceEngine;
  private complianceChecks: Map<string, SaudiComplianceCheck> = new Map();
  private actionItems: Map<string, ComplianceActionItem> = new Map();
  private reports: Map<string, ComplianceReport> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): SaudiComplianceEngine {
    if (!SaudiComplianceEngine.instance) {
      SaudiComplianceEngine.instance = new SaudiComplianceEngine();
    }
    return SaudiComplianceEngine.instance;
  }

  private async initializeEngine(): Promise<void> {
    console.log("🇸🇦 Initializing Saudi Compliance Engine...");

    // Publish initialization event
    await eventBus.publish({
      type: "compliance.saudi.engine.initialized",
      data: {
        timestamp: new Date(),
        engine: "SaudiComplianceEngine",
      },
    });
  }

  /**
   * Perform comprehensive Saudi compliance check
   */
  async performComplianceCheck(
    tenantId: string,
    data: {
      zatca?: Partial<ZATCACompliance>;
      sfda?: Partial<SFDACompliance>;
      civilDefense?: Partial<CivilDefenseCompliance>;
      vision2030?: Partial<Vision2030Alignment>;
    },
  ): Promise<SaudiComplianceCheck> {
    console.log(`🔍 Performing Saudi compliance check for tenant: ${tenantId}`);

    // Gather compliance data
    const zatca = await this.checkZATCACompliance(tenantId, data.zatca);
    const sfda = await this.checkSFDACompliance(tenantId, data.sfda);
    const civilDefense = await this.checkCivilDefenseCompliance(
      tenantId,
      data.civilDefense,
    );
    const vision2030 = await this.checkVision2030Alignment(
      tenantId,
      data.vision2030,
    );

    // Calculate overall scores
    const overallScore = this.calculateOverallScore({
      zatca: zatca.vatComplianceScore,
      sfda: sfda.gmpComplianceScore,
      civilDefense: civilDefense.civilDefenseComplianceScore,
      vision2030: vision2030.vision2030AlignmentScore,
    });

    // Generate action items
    const actionItems = await this.generateActionItems(tenantId, {
      zatca,
      sfda,
      civilDefense,
      vision2030,
    });

    // Determine overall status
    const overallStatus = this.determineComplianceStatus(overallScore);

    // Create compliance check record
    const check: SaudiComplianceCheck = {
      id: `saudi-compliance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId,
      checkDate: new Date(),
      zatca,
      sfda,
      civilDefense,
      vision2030,
      overallComplianceScore: overallScore,
      overallStatus,
      actionItems,
      nextReviewDate: this.calculateNextReviewDate(overallStatus),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store check
    this.complianceChecks.set(check.id, check);

    // Store action items
    for (const item of actionItems) {
      this.actionItems.set(item.id, item);
    }

    // Publish compliance check completed event
    await eventBus.publish({
      type: "compliance.saudi.check.completed",
      data: {
        checkId: check.id,
        tenantId,
        overallScore,
        overallStatus,
        actionItemsCount: actionItems.length,
        timestamp: new Date(),
      },
    });

    console.log(`✅ Saudi compliance check completed: ${check.id}`);
    return check;
  }

  /**
   * Check ZATCA (Zakat, Tax and Customs Authority) compliance
   */
  private async checkZATCACompliance(
    tenantId: string,
    data?: Partial<ZATCACompliance>,
  ): Promise<ZATCACompliance> {
    // Default compliance data
    const compliance: ZATCACompliance = {
      einvoicingEnabled: data?.einvoicingEnabled ?? false,
      einvoicingPhase: data?.einvoicingPhase ?? "not_applicable",
      qrCodeGeneration: data?.qrCodeGeneration ?? false,
      uuidGeneration: data?.uuidGeneration ?? false,
      cryptographicStamp: data?.cryptographicStamp ?? false,
      einvoicingIntegration: data?.einvoicingIntegration ?? false,
      vatRegistrationNumber: data?.vatRegistrationNumber ?? null,
      vatRegistrationDate: data?.vatRegistrationDate ?? null,
      vatReturnFiling: data?.vatReturnFiling ?? false,
      vatReturnFrequency: data?.vatReturnFrequency ?? null,
      lastVATReturnDate: data?.lastVATReturnDate ?? null,
      nextVATReturnDate: data?.nextVATReturnDate ?? null,
      vatComplianceScore: 0,
      taxClearanceCertificate: data?.taxClearanceCertificate ?? false,
      taxClearanceExpiry: data?.taxClearanceExpiry ?? null,
      withholdingTaxCompliance: data?.withholdingTaxCompliance ?? false,
    };

    // Calculate VAT compliance score
    let score = 0;
    let maxScore = 0;

    // E-Invoicing compliance (30 points)
    maxScore += 30;
    if (compliance.einvoicingEnabled) score += 10;
    if (compliance.qrCodeGeneration) score += 5;
    if (compliance.uuidGeneration) score += 5;
    if (compliance.cryptographicStamp) score += 5;
    if (compliance.einvoicingIntegration) score += 5;

    // VAT registration (20 points)
    maxScore += 20;
    if (compliance.vatRegistrationNumber) score += 20;

    // VAT return filing (30 points)
    maxScore += 30;
    if (compliance.vatReturnFiling) score += 15;
    if (compliance.lastVATReturnDate) {
      const daysSinceLastReturn = Math.floor(
        (Date.now() - new Date(compliance.lastVATReturnDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysSinceLastReturn <= 30) score += 15;
      else if (daysSinceLastReturn <= 60) score += 10;
      else if (daysSinceLastReturn <= 90) score += 5;
    }

    // Tax clearance (20 points)
    maxScore += 20;
    if (compliance.taxClearanceCertificate) {
      score += 10;
      if (
        compliance.taxClearanceExpiry &&
        new Date(compliance.taxClearanceExpiry) > new Date()
      ) {
        score += 10;
      }
    }

    compliance.vatComplianceScore = Math.round((score / maxScore) * 100);

    return compliance;
  }

  /**
   * Check SFDA (Saudi Food and Drug Authority) compliance
   */
  private async checkSFDACompliance(
    tenantId: string,
    data?: Partial<SFDACompliance>,
  ): Promise<SFDACompliance> {
    const compliance: SFDACompliance = {
      facilityLicenseNumber: data?.facilityLicenseNumber ?? null,
      facilityLicenseType: data?.facilityLicenseType ?? null,
      facilityLicenseStatus: data?.facilityLicenseStatus ?? null,
      facilityLicenseExpiry: data?.facilityLicenseExpiry ?? null,
      facilityLicenseRenewalRequired: false,
      productRegistrations: data?.productRegistrations ?? [],
      productRegistrationCompliance: 0,
      gmpCertification: data?.gmpCertification ?? false,
      gmpCertificationNumber: data?.gmpCertificationNumber ?? null,
      gmpCertificationExpiry: data?.gmpCertificationExpiry ?? null,
      gmpAuditDate: data?.gmpAuditDate ?? null,
      gmpAuditStatus: data?.gmpAuditStatus ?? null,
      gmpComplianceScore: 0,
      haccpCertification: data?.haccpCertification ?? false,
      haccpCertificationExpiry: data?.haccpCertificationExpiry ?? null,
      foodSafetyCompliance: 0,
    };

    // Check facility license renewal requirement
    if (compliance.facilityLicenseExpiry) {
      const daysUntilExpiry = Math.floor(
        (new Date(compliance.facilityLicenseExpiry).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      compliance.facilityLicenseRenewalRequired = daysUntilExpiry <= 90;
    }

    // Calculate product registration compliance
    if (compliance.productRegistrations.length > 0) {
      const activeRegistrations = compliance.productRegistrations.filter(
        (r) => r.status === "active" && new Date(r.expiryDate) > new Date(),
      );
      compliance.productRegistrationCompliance = Math.round(
        (activeRegistrations.length / compliance.productRegistrations.length) *
          100,
      );
    }

    // Calculate GMP compliance score
    let score = 0;
    let maxScore = 0;

    // Facility license (40 points)
    maxScore += 40;
    if (compliance.facilityLicenseNumber) {
      score += 20;
      if (compliance.facilityLicenseStatus === "active") score += 20;
    }

    // GMP certification (40 points)
    maxScore += 40;
    if (compliance.gmpCertification) {
      score += 20;
      if (
        compliance.gmpCertificationExpiry &&
        new Date(compliance.gmpCertificationExpiry) > new Date()
      ) {
        score += 20;
      }
    }

    // HACCP certification (20 points)
    maxScore += 20;
    if (compliance.haccpCertification) {
      score += 10;
      if (
        compliance.haccpCertificationExpiry &&
        new Date(compliance.haccpCertificationExpiry) > new Date()
      ) {
        score += 10;
      }
    }

    compliance.gmpComplianceScore = Math.round((score / maxScore) * 100);

    // Calculate food safety compliance
    compliance.foodSafetyCompliance = Math.round(
      (compliance.gmpComplianceScore +
        compliance.productRegistrationCompliance) /
        2,
    );

    return compliance;
  }

  /**
   * Check Civil Defense compliance
   */
  private async checkCivilDefenseCompliance(
    tenantId: string,
    data?: Partial<CivilDefenseCompliance>,
  ): Promise<CivilDefenseCompliance> {
    const compliance: CivilDefenseCompliance = {
      fireSafetyCertificate: data?.fireSafetyCertificate ?? false,
      fireSafetyCertificateNumber: data?.fireSafetyCertificateNumber ?? null,
      fireSafetyCertificateExpiry: data?.fireSafetyCertificateExpiry ?? null,
      fireSafetyInspectionDate: data?.fireSafetyInspectionDate ?? null,
      fireSafetyInspectionStatus: data?.fireSafetyInspectionStatus ?? null,
      fireExtinguishersCount: data?.fireExtinguishersCount ?? 0,
      fireExtinguishersLastInspection:
        data?.fireExtinguishersLastInspection ?? null,
      fireAlarmSystem: data?.fireAlarmSystem ?? false,
      fireAlarmSystemLastTest: data?.fireAlarmSystemLastTest ?? null,
      sprinklerSystem: data?.sprinklerSystem ?? false,
      sprinklerSystemLastInspection:
        data?.sprinklerSystemLastInspection ?? null,
      emergencyPlanExists: data?.emergencyPlanExists ?? false,
      emergencyPlanLastUpdated: data?.emergencyPlanLastUpdated ?? null,
      emergencyDrillConducted: data?.emergencyDrillConducted ?? false,
      emergencyDrillLastDate: data?.emergencyDrillLastDate ?? null,
      emergencyDrillFrequency: data?.emergencyDrillFrequency ?? null,
      evacuationPlanExists: data?.evacuationPlanExists ?? false,
      evacuationPlanLastUpdated: data?.evacuationPlanLastUpdated ?? null,
      civilDefenseLicense: data?.civilDefenseLicense ?? false,
      civilDefenseLicenseNumber: data?.civilDefenseLicenseNumber ?? null,
      civilDefenseLicenseExpiry: data?.civilDefenseLicenseExpiry ?? null,
      civilDefenseComplianceScore: 0,
    };

    // Calculate compliance score
    let score = 0;
    let maxScore = 0;

    // Fire safety certificate (30 points)
    maxScore += 30;
    if (compliance.fireSafetyCertificate) {
      score += 15;
      if (
        compliance.fireSafetyCertificateExpiry &&
        new Date(compliance.fireSafetyCertificateExpiry) > new Date()
      ) {
        score += 15;
      }
    }

    // Fire safety equipment (30 points)
    maxScore += 30;
    if (compliance.fireExtinguishersCount > 0) score += 10;
    if (compliance.fireAlarmSystem) score += 10;
    if (compliance.sprinklerSystem) score += 10;

    // Emergency plans (25 points)
    maxScore += 25;
    if (compliance.emergencyPlanExists) score += 10;
    if (compliance.evacuationPlanExists) score += 10;
    if (compliance.emergencyDrillConducted) score += 5;

    // Civil Defense license (15 points)
    maxScore += 15;
    if (compliance.civilDefenseLicense) {
      score += 10;
      if (
        compliance.civilDefenseLicenseExpiry &&
        new Date(compliance.civilDefenseLicenseExpiry) > new Date()
      ) {
        score += 5;
      }
    }

    compliance.civilDefenseComplianceScore = Math.round(
      (score / maxScore) * 100,
    );

    return compliance;
  }

  /**
   * Check Vision 2030 alignment
   */
  private async checkVision2030Alignment(
    tenantId: string,
    data?: Partial<Vision2030Alignment>,
  ): Promise<Vision2030Alignment> {
    const alignment: Vision2030Alignment = {
      saudiMadeProgram: data?.saudiMadeProgram ?? false,
      saudiMadeCertification: data?.saudiMadeCertification ?? null,
      localContentProgram: data?.localContentProgram ?? false,
      localContentPercentage: data?.localContentPercentage ?? 0,
      nationalTransformationProgram:
        data?.nationalTransformationProgram ?? false,
      qualityOfLifeProgram: data?.qualityOfLifeProgram ?? false,
      carbonFootprintTracking: data?.carbonFootprintTracking ?? false,
      carbonFootprintReduction: data?.carbonFootprintReduction ?? 0,
      renewableEnergyUsage: data?.renewableEnergyUsage ?? false,
      renewableEnergyPercentage: data?.renewableEnergyPercentage ?? 0,
      wasteReductionProgram: data?.wasteReductionProgram ?? false,
      wasteReductionPercentage: data?.wasteReductionPercentage ?? 0,
      waterConservationProgram: data?.waterConservationProgram ?? false,
      waterConservationPercentage: data?.waterConservationPercentage ?? 0,
      digitalTransformation: data?.digitalTransformation ?? false,
      digitalServicesAdoption: data?.digitalServicesAdoption ?? 0,
      automationLevel: data?.automationLevel ?? 0,
      iotIntegration: data?.iotIntegration ?? false,
      aiAdoption: data?.aiAdoption ?? false,
      cloudAdoption: data?.cloudAdoption ?? false,
      vision2030AlignmentScore: 0,
    };

    // Calculate alignment score
    let score = 0;
    let maxScore = 0;

    // National Programs (30 points)
    maxScore += 30;
    if (alignment.saudiMadeProgram) score += 10;
    if (alignment.localContentProgram) score += 10;
    if (alignment.nationalTransformationProgram) score += 5;
    if (alignment.qualityOfLifeProgram) score += 5;

    // Saudi Green Initiative (35 points)
    maxScore += 35;
    if (alignment.carbonFootprintTracking) score += 10;
    if (alignment.renewableEnergyUsage) score += 10;
    if (alignment.wasteReductionProgram) score += 5;
    if (alignment.waterConservationProgram) score += 5;
    score += Math.min(alignment.carbonFootprintReduction / 10, 5); // Max 5 points

    // Digitization (35 points)
    maxScore += 35;
    if (alignment.digitalTransformation) score += 10;
    if (alignment.iotIntegration) score += 5;
    if (alignment.aiAdoption) score += 10;
    if (alignment.cloudAdoption) score += 5;
    score += Math.min(alignment.digitalServicesAdoption / 10, 5); // Max 5 points

    alignment.vision2030AlignmentScore = Math.round((score / maxScore) * 100);

    return alignment;
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallScore(scores: {
    zatca: number;
    sfda: number;
    civilDefense: number;
    vision2030: number;
  }): number {
    // Weighted average (ZATCA and SFDA are more critical)
    const weights = {
      zatca: 0.35,
      sfda: 0.35,
      civilDefense: 0.2,
      vision2030: 0.1,
    };

    return Math.round(
      scores.zatca * weights.zatca +
        scores.sfda * weights.sfda +
        scores.civilDefense * weights.civilDefense +
        scores.vision2030 * weights.vision2030,
    );
  }

  /**
   * Determine compliance status based on score
   */
  private determineComplianceStatus(score: number): ComplianceStatus {
    if (score >= 90) return "COMPLIANT";
    if (score >= 70) return "AT_RISK";
    if (score >= 50) return "PENDING_REVIEW";
    return "NON_COMPLIANT";
  }

  /**
   * Generate action items based on compliance gaps
   */
  private async generateActionItems(
    tenantId: string,
    compliance: {
      zatca: ZATCACompliance;
      sfda: SFDACompliance;
      civilDefense: CivilDefenseCompliance;
      vision2030: Vision2030Alignment;
    },
  ): Promise<ComplianceActionItem[]> {
    const actionItems: ComplianceActionItem[] = [];

    // ZATCA action items
    if (!compliance.zatca.einvoicingEnabled) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Enable E-Invoicing System",
        description:
          "ZATCA requires E-Invoicing for all businesses. Enable E-Invoicing system and integrate with ZATCA platform.",
        priority: "CRITICAL",
        authority: "ZATCA",
        category: "ZATCA",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    if (!compliance.zatca.vatRegistrationNumber) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Register for VAT",
        description: "Register for VAT with ZATCA to ensure tax compliance.",
        priority: "CRITICAL",
        authority: "ZATCA",
        category: "ZATCA",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    if (
      !compliance.zatca.taxClearanceCertificate ||
      (compliance.zatca.taxClearanceExpiry &&
        new Date(compliance.zatca.taxClearanceExpiry) <= new Date())
    ) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Renew Tax Clearance Certificate",
        description:
          "Tax Clearance Certificate is expired or missing. Renew immediately to maintain compliance.",
        priority: "HIGH",
        authority: "ZATCA",
        category: "ZATCA",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    // SFDA action items
    if (
      !compliance.sfda.facilityLicenseNumber ||
      compliance.sfda.facilityLicenseStatus !== "active"
    ) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Obtain/Renew SFDA Facility License",
        description:
          "SFDA Facility License is required for food and drug operations. Obtain or renew the license.",
        priority: "CRITICAL",
        authority: "SFDA",
        category: "SFDA",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    if (compliance.sfda.facilityLicenseRenewalRequired) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Renew SFDA Facility License",
        description: `SFDA Facility License expires on ${compliance.sfda.facilityLicenseExpiry?.toLocaleDateString()}. Renew before expiry.`,
        priority: "HIGH",
        authority: "SFDA",
        category: "SFDA",
        dueDate: compliance.sfda.facilityLicenseExpiry || new Date(),
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    if (!compliance.sfda.gmpCertification) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Obtain GMP Certification",
        description:
          "GMP (Good Manufacturing Practices) certification is required for manufacturing facilities.",
        priority: "HIGH",
        authority: "SFDA",
        category: "SFDA",
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    // Civil Defense action items
    if (!compliance.civilDefense.fireSafetyCertificate) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Obtain Fire Safety Certificate",
        description:
          "Civil Defense requires a valid Fire Safety Certificate for all facilities.",
        priority: "CRITICAL",
        authority: "MOI",
        category: "CIVIL_DEFENSE",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    if (!compliance.civilDefense.emergencyPlanExists) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Create Emergency Plan",
        description:
          "Civil Defense requires a comprehensive emergency plan for all facilities.",
        priority: "HIGH",
        authority: "MOI",
        category: "CIVIL_DEFENSE",
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    // Vision 2030 action items
    if (!compliance.vision2030.digitalTransformation) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Initiate Digital Transformation",
        description:
          "Vision 2030 emphasizes digital transformation. Develop and implement a digital transformation strategy.",
        priority: "MEDIUM",
        authority: "SDAIA",
        category: "VISION_2030",
        dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    if (!compliance.vision2030.carbonFootprintTracking) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: "Implement Carbon Footprint Tracking",
        description:
          "Saudi Green Initiative requires carbon footprint tracking. Implement tracking and reduction measures.",
        priority: "MEDIUM",
        authority: "MOMRA",
        category: "VISION_2030",
        dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
        status: "pending",
        assignedTo: null,
        completedAt: null,
        createdAt: new Date(),
      });
    }

    return actionItems;
  }

  /**
   * Calculate next review date based on compliance status
   */
  private calculateNextReviewDate(status: ComplianceStatus): Date {
    const now = Date.now();
    const daysUntilReview =
      {
        COMPLIANT: 90, // Review every 3 months if compliant
        AT_RISK: 30, // Review monthly if at risk
        PENDING_REVIEW: 14, // Review bi-weekly if pending
        NON_COMPLIANT: 7, // Review weekly if non-compliant
      }[status] || 30;

    return new Date(now + daysUntilReview * 24 * 60 * 60 * 1000);
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<ComplianceReport> {
    console.log(`📊 Generating compliance report for tenant: ${tenantId}`);

    // Get all compliance checks in the period
    const checks = Array.from(this.complianceChecks.values()).filter(
      (check) =>
        check.tenantId === tenantId &&
        check.checkDate >= period.start &&
        check.checkDate <= period.end,
    );

    if (checks.length === 0) {
      throw new Error("No compliance checks found for the specified period");
    }

    // Get the latest check
    const latestCheck = checks[checks.length - 1];

    // Aggregate scores
    const zatcaScores = checks.map((c) => c.zatca.vatComplianceScore);
    const sfdaScores = checks.map((c) => c.sfda.gmpComplianceScore);
    const civilDefenseScores = checks.map(
      (c) => c.civilDefense.civilDefenseComplianceScore,
    );
    const vision2030Scores = checks.map(
      (c) => c.vision2030.vision2030AlignmentScore,
    );
    const overallScores = checks.map((c) => c.overallComplianceScore);

    const zatcaScore = Math.round(
      zatcaScores.reduce((a, b) => a + b, 0) / zatcaScores.length,
    );
    const sfdaScore = Math.round(
      sfdaScores.reduce((a, b) => a + b, 0) / sfdaScores.length,
    );
    const civilDefenseScore = Math.round(
      civilDefenseScores.reduce((a, b) => a + b, 0) / civilDefenseScores.length,
    );
    const vision2030Score = Math.round(
      vision2030Scores.reduce((a, b) => a + b, 0) / vision2030Scores.length,
    );
    const overallScore = Math.round(
      overallScores.reduce((a, b) => a + b, 0) / overallScores.length,
    );

    // Collect all action items
    const allActionItems = checks.flatMap((c) => c.actionItems);

    // Generate recommendations
    const recommendations = this.generateRecommendations(latestCheck);

    // Create report
    const report: ComplianceReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId,
      reportDate: new Date(),
      period,
      zatcaScore,
      sfdaScore,
      civilDefenseScore,
      vision2030Score,
      overallScore,
      status: this.determineComplianceStatus(overallScore),
      actionItems: allActionItems,
      recommendations,
      nextReviewDate: latestCheck.nextReviewDate,
      generatedAt: new Date(),
    };

    // Store report
    this.reports.set(report.id, report);

    // Publish report generated event
    await eventBus.publish({
      type: "compliance.saudi.report.generated",
      data: {
        reportId: report.id,
        tenantId,
        overallScore,
        status: report.status,
        actionItemsCount: allActionItems.length,
        timestamp: new Date(),
      },
    });

    console.log(`✅ Compliance report generated: ${report.id}`);
    return report;
  }

  /**
   * Generate recommendations based on compliance check
   */
  private generateRecommendations(check: SaudiComplianceCheck): string[] {
    const recommendations: string[] = [];

    if (check.zatca.vatComplianceScore < 70) {
      recommendations.push(
        "Improve ZATCA compliance by enabling E-Invoicing, ensuring VAT returns are filed on time, and maintaining valid tax clearance certificate.",
      );
    }

    if (check.sfda.gmpComplianceScore < 70) {
      recommendations.push(
        "Enhance SFDA compliance by obtaining/renewing facility license, maintaining GMP certification, and ensuring product registrations are up to date.",
      );
    }

    if (check.civilDefense.civilDefenseComplianceScore < 70) {
      recommendations.push(
        "Strengthen Civil Defense compliance by obtaining fire safety certificate, implementing emergency plans, and conducting regular fire safety drills.",
      );
    }

    if (check.vision2030.vision2030AlignmentScore < 50) {
      recommendations.push(
        "Align with Vision 2030 by implementing digital transformation initiatives, tracking carbon footprint, and participating in national programs like Saudi Made.",
      );
    }

    if (check.overallComplianceScore >= 90) {
      recommendations.push(
        "Maintain excellent compliance standards and continue regular monitoring.",
      );
    }

    return recommendations;
  }

  /**
   * Get compliance check by ID
   */
  async getComplianceCheck(
    checkId: string,
  ): Promise<SaudiComplianceCheck | null> {
    return this.complianceChecks.get(checkId) || null;
  }

  /**
   * Get all compliance checks for a tenant
   */
  async getComplianceChecks(tenantId: string): Promise<SaudiComplianceCheck[]> {
    return Array.from(this.complianceChecks.values()).filter(
      (check) => check.tenantId === tenantId,
    );
  }

  /**
   * Get action items for a tenant
   */
  async getActionItems(
    tenantId: string,
    status?: ComplianceActionItem["status"],
  ): Promise<ComplianceActionItem[]> {
    const checks = await this.getComplianceChecks(tenantId);
    let items = checks.flatMap((check) => check.actionItems);

    if (status) {
      items = items.filter((item) => item.status === status);
    }

    return items.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Update action item status
   */
  async updateActionItem(
    itemId: string,
    updates: Partial<ComplianceActionItem>,
  ): Promise<ComplianceActionItem | null> {
    const item = this.actionItems.get(itemId);
    if (!item) return null;

    const updated: ComplianceActionItem = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.status === "completed" && !updated.completedAt) {
      updated.completedAt = new Date();
    }

    this.actionItems.set(itemId, updated);

    // Update in compliance checks
    for (const check of this.complianceChecks.values()) {
      const index = check.actionItems.findIndex((i) => i.id === itemId);
      if (index !== -1) {
        check.actionItems[index] = updated;
        check.updatedAt = new Date();
      }
    }

    // Publish action item updated event
    await eventBus.publish({
      type: "compliance.saudi.actionitem.updated",
      data: {
        itemId,
        status: updated.status,
        timestamp: new Date(),
      },
    });

    return updated;
  }

  /**
   * Get compliance report by ID
   */
  async getComplianceReport(
    reportId: string,
  ): Promise<ComplianceReport | null> {
    return this.reports.get(reportId) || null;
  }

  /**
   * Get all compliance reports for a tenant
   */
  async getComplianceReports(tenantId: string): Promise<ComplianceReport[]> {
    return Array.from(this.reports.values())
      .filter((report) => report.tenantId === tenantId)
      .sort((a, b) => b.reportDate.getTime() - a.reportDate.getTime());
  }
}

// Singleton instance
export const saudiComplianceEngine = SaudiComplianceEngine.getInstance();
