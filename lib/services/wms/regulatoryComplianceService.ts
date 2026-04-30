/**
 * Regulatory Compliance Service
 * Comprehensive compliance tracking and verification across multiple jurisdictions
 * BlueDXP Platform - 4IR & 5IR Aligned • Global Support
 */

import { eventBus } from "@/lib/services/event-store";
import type {
  StorageLocation,
  ComplianceStatus,
} from "@/types/warehouseLocation";

/**
 * Regulatory Authority
 */
export interface RegulatoryAuthority {
  id: string;
  name: string;
  countryCode: string;
  jurisdiction: string;
  standards: string[];
  inspectionFrequency: "Monthly" | "Quarterly" | "Semi-Annually" | "Annually";
  certificationRequired: boolean;
}

/**
 * Compliance Requirement
 */
export interface ComplianceRequirement {
  id: string;
  authorityId: string;
  requirement: string;
  category:
    | "FIRE_SAFETY"
    | "ENVIRONMENTAL"
    | "HEALTH"
    | "STRUCTURAL"
    | "OPERATIONAL";
  mandatory: boolean;
  applicableHazardClasses: string[];
}

/**
 * Compliance Check Result
 */
export interface ComplianceCheckResult {
  locationId: string;
  authorityId: string;
  compliant: boolean;
  complianceScore: number; // 0-100
  passedRequirements: string[];
  failedRequirements: string[];
  warnings: string[];
  recommendations: string[];
  lastCheck: string;
  nextCheck: string;
}

/**
 * Global Regulatory Authorities Database
 */
const REGULATORY_AUTHORITIES: RegulatoryAuthority[] = [
  // Saudi Arabia
  {
    id: "sa-civil-defense",
    name: "Civil Defense",
    countryCode: "SAU",
    jurisdiction: "Saudi Arabia",
    standards: ["NFPA", "SBC", "SASO"],
    inspectionFrequency: "Quarterly",
    certificationRequired: true,
  },
  {
    id: "sa-modon",
    name: "MODON",
    countryCode: "SAU",
    jurisdiction: "Saudi Arabia",
    standards: ["MODON Standards"],
    inspectionFrequency: "Annually",
    certificationRequired: true,
  },
  {
    id: "sa-sfda",
    name: "SFDA",
    countryCode: "SAU",
    jurisdiction: "Saudi Arabia",
    standards: ["SFDA Guidelines"],
    inspectionFrequency: "Semi-Annually",
    certificationRequired: true,
  },
  // UAE
  {
    id: "uae-civil-defense",
    name: "Civil Defense UAE",
    countryCode: "UAE",
    jurisdiction: "United Arab Emirates",
    standards: ["UAE Fire Code", "NFPA"],
    inspectionFrequency: "Quarterly",
    certificationRequired: true,
  },
  {
    id: "uae-dubai-municipality",
    name: "Dubai Municipality",
    countryCode: "UAE",
    jurisdiction: "Dubai, UAE",
    standards: ["Dubai Municipality Standards"],
    inspectionFrequency: "Quarterly",
    certificationRequired: true,
  },
  // Iraq
  {
    id: "iq-civil-defense",
    name: "Iraqi Civil Defense",
    countryCode: "IRQ",
    jurisdiction: "Iraq",
    standards: ["Iraqi Fire Code"],
    inspectionFrequency: "Quarterly",
    certificationRequired: true,
  },
  {
    id: "iq-environment",
    name: "Ministry of Environment",
    countryCode: "IRQ",
    jurisdiction: "Iraq",
    standards: ["Iraqi Environmental Standards"],
    inspectionFrequency: "Annually",
    certificationRequired: true,
  },
  // Other GCC Countries
  {
    id: "qa-civil-defense",
    name: "Qatar Civil Defense",
    countryCode: "QAT",
    jurisdiction: "Qatar",
    standards: ["Qatar Fire Code", "NFPA"],
    inspectionFrequency: "Quarterly",
    certificationRequired: true,
  },
  {
    id: "kw-civil-defense",
    name: "Kuwait Civil Defense",
    countryCode: "KWT",
    jurisdiction: "Kuwait",
    standards: ["Kuwait Fire Code"],
    inspectionFrequency: "Quarterly",
    certificationRequired: true,
  },
  {
    id: "om-civil-defense",
    name: "Oman Civil Defense",
    countryCode: "OMN",
    jurisdiction: "Oman",
    standards: ["Oman Fire Code"],
    inspectionFrequency: "Quarterly",
    certificationRequired: true,
  },
  {
    id: "bh-civil-defense",
    name: "Bahrain Civil Defense",
    countryCode: "BHR",
    jurisdiction: "Bahrain",
    standards: ["Bahrain Fire Code"],
    inspectionFrequency: "Quarterly",
    certificationRequired: true,
  },
];

/**
 * Regulatory Compliance Service Interface
 */
export interface RegulatoryComplianceService {
  // Authority Management
  getAuthoritiesByCountry(countryCode: string): RegulatoryAuthority[];
  getAllAuthorities(): RegulatoryAuthority[];
  getAuthority(id: string): RegulatoryAuthority | null;

  // Compliance Checking
  checkCompliance(
    location: StorageLocation,
    authorityId: string,
  ): Promise<ComplianceCheckResult>;
  checkAllCompliance(
    location: StorageLocation,
  ): Promise<ComplianceCheckResult[]>;
  calculateOverallComplianceScore(location: StorageLocation): Promise<number>;

  // AI-Powered Compliance (5IR)
  aiVerifyCompliance(
    location: StorageLocation,
  ): Promise<AIComplianceVerification>;
  getComplianceRecommendations(location: StorageLocation): Promise<string[]>;
}

export interface AIComplianceVerification {
  locationId: string;
  overallCompliant: boolean;
  complianceScore: number;
  verifiedBy: "AI" | "MANUAL" | "HYBRID";
  verificationDate: string;
  details: {
    fireSafety: { compliant: boolean; score: number; issues: string[] };
    environmental: { compliant: boolean; score: number; issues: string[] };
    structural: { compliant: boolean; score: number; issues: string[] };
    operational: { compliant: boolean; score: number; issues: string[] };
  };
  recommendations: string[];
}

// ============================================================================
// REGULATORY COMPLIANCE SERVICE IMPLEMENTATION
// ============================================================================

class RegulatoryComplianceServiceImpl implements RegulatoryComplianceService {
  getAuthoritiesByCountry(countryCode: string): RegulatoryAuthority[] {
    return REGULATORY_AUTHORITIES.filter(
      (auth) => auth.countryCode === countryCode,
    );
  }

  getAllAuthorities(): RegulatoryAuthority[] {
    return REGULATORY_AUTHORITIES;
  }

  getAuthority(id: string): RegulatoryAuthority | null {
    return REGULATORY_AUTHORITIES.find((auth) => auth.id === id) || null;
  }

  async checkCompliance(
    location: StorageLocation,
    authorityId: string,
  ): Promise<ComplianceCheckResult> {
    const authority = this.getAuthority(authorityId);
    if (!authority) {
      throw new Error(`Regulatory authority not found: ${authorityId}`);
    }

    const passedRequirements: string[] = [];
    const failedRequirements: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    let complianceScore = 100;

    // Check fire suppression system
    if (location.fireSuppressionType === "None") {
      failedRequirements.push("Fire suppression system required");
      complianceScore -= 30;
    } else {
      passedRequirements.push("Fire suppression system installed");
    }

    // Check compliance status
    if (location.complianceStatus === "Non-Compliant") {
      failedRequirements.push("Location marked as non-compliant");
      complianceScore -= 40;
    } else if (location.complianceStatus === "Compliant with exceptions") {
      warnings.push("Location has compliance exceptions");
      complianceScore -= 15;
    } else {
      passedRequirements.push("Compliance status verified");
    }

    // Check last inspection
    if (location.lastInspection) {
      const lastInspectionDate = new Date(location.lastInspection);
      const daysSinceInspection = Math.floor(
        (Date.now() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceInspection > 365) {
        warnings.push("Last inspection was over 1 year ago");
        complianceScore -= 10;
        recommendations.push("Schedule immediate inspection");
      } else {
        passedRequirements.push("Recent inspection recorded");
      }
    } else {
      warnings.push("No inspection date recorded");
      complianceScore -= 5;
    }

    // Check certifications
    if (
      authority.certificationRequired &&
      (!location.certifications || location.certifications.length === 0)
    ) {
      failedRequirements.push(`${authority.name} certification required`);
      complianceScore -= 25;
    } else if (location.certifications && location.certifications.length > 0) {
      passedRequirements.push("Certifications present");
    }

    // Check hazard class compatibility
    if (location.storageRestrictions.hazardClassesAllowed.length === 0) {
      warnings.push("No hazard classes defined");
      complianceScore -= 5;
    } else {
      passedRequirements.push("Hazard classes defined");
    }

    const compliant = complianceScore >= 70 && failedRequirements.length === 0;

    const nextCheckDate = new Date();
    if (authority.inspectionFrequency === "Quarterly") {
      nextCheckDate.setMonth(nextCheckDate.getMonth() + 3);
    } else if (authority.inspectionFrequency === "Semi-Annually") {
      nextCheckDate.setMonth(nextCheckDate.getMonth() + 6);
    } else if (authority.inspectionFrequency === "Annually") {
      nextCheckDate.setFullYear(nextCheckDate.getFullYear() + 1);
    } else {
      nextCheckDate.setMonth(nextCheckDate.getMonth() + 1);
    }

    return {
      locationId: location.id,
      authorityId,
      compliant,
      complianceScore: Math.max(0, complianceScore),
      passedRequirements,
      failedRequirements,
      warnings,
      recommendations,
      lastCheck: new Date().toISOString(),
      nextCheck: nextCheckDate.toISOString(),
    };
  }

  async checkAllCompliance(
    location: StorageLocation,
  ): Promise<ComplianceCheckResult[]> {
    const authorities = this.getAuthoritiesByCountry(
      location.location.countryCode,
    );
    const results: ComplianceCheckResult[] = [];

    for (const authority of authorities) {
      const result = await this.checkCompliance(location, authority.id);
      results.push(result);
    }

    return results;
  }

  async calculateOverallComplianceScore(
    location: StorageLocation,
  ): Promise<number> {
    const results = await this.checkAllCompliance(location);
    if (results.length === 0) {
      return 0;
    }

    const totalScore = results.reduce((sum, r) => sum + r.complianceScore, 0);
    return Math.round(totalScore / results.length);
  }

  async aiVerifyCompliance(
    location: StorageLocation,
  ): Promise<AIComplianceVerification> {
    // AI-powered compliance verification (5IR feature)
    // In production, this would use ML models to analyze compliance

    const fireSafetyScore = location.fireSuppressionType !== "None" ? 85 : 30;
    const environmentalScore = location.storageRestrictions
      .temperatureControlled
      ? 90
      : 70;
    const structuralScore = location.totalPalletCapacity ? 80 : 60;
    const operationalScore =
      location.complianceStatus === "Compliant" ? 90 : 60;

    const overallScore = Math.round(
      (fireSafetyScore +
        environmentalScore +
        structuralScore +
        operationalScore) /
        4,
    );

    const details = {
      fireSafety: {
        compliant: fireSafetyScore >= 70,
        score: fireSafetyScore,
        issues:
          location.fireSuppressionType === "None"
            ? ["No fire suppression system"]
            : [],
      },
      environmental: {
        compliant: environmentalScore >= 70,
        score: environmentalScore,
        issues: !location.storageRestrictions.temperatureControlled
          ? ["No temperature control"]
          : [],
      },
      structural: {
        compliant: structuralScore >= 70,
        score: structuralScore,
        issues: !location.totalPalletCapacity ? ["Capacity not defined"] : [],
      },
      operational: {
        compliant: operationalScore >= 70,
        score: operationalScore,
        issues:
          location.complianceStatus !== "Compliant"
            ? ["Compliance issues"]
            : [],
      },
    };

    const recommendations: string[] = [];
    if (location.fireSuppressionType === "None") {
      recommendations.push("Install appropriate fire suppression system");
    }
    if (
      !location.storageRestrictions.temperatureControlled &&
      location.storageRestrictions.hazardClassesAllowed.some((hc) =>
        ["Class 2.1", "Class 3"].includes(hc),
      )
    ) {
      recommendations.push(
        "Consider temperature-controlled storage for flammable materials",
      );
    }
    if (!location.lastInspection) {
      recommendations.push("Schedule regulatory inspection");
    }

    return {
      locationId: location.id,
      overallCompliant: overallScore >= 70,
      complianceScore: overallScore,
      verifiedBy: "AI",
      verificationDate: new Date().toISOString(),
      details,
      recommendations,
    };
  }

  async getComplianceRecommendations(
    location: StorageLocation,
  ): Promise<string[]> {
    const verification = await this.aiVerifyCompliance(location);
    return verification.recommendations;
  }
}

// ============================================================================
// EXPORT SERVICE INSTANCE
// ============================================================================

export const regulatoryComplianceService =
  new RegulatoryComplianceServiceImpl();
export default regulatoryComplianceService;
