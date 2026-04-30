/**
 * Compliance Service
 *
 * Manages compliance checking and risk assessment:
 * - Requirement checking
 * - Compliance scoring
 * - Risk assessment
 * - Missing document detection
 */

import type {
  CustomsDeclaration,
  ComplianceIssue,
  DocumentRequirement,
  DocumentType,
  CountryCode,
  CustomsDeclarationType,
} from "@/types/customs";
import { documentService } from "./documentService";

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceCheckResult {
  compliant: boolean;
  score: number; // 0-100
  issues: ComplianceIssue[];
  missingDocuments: string[];
  missingLicenses: string[];
  missingCertificates: string[];
  recommendations: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface RequirementCheckResult {
  requirements: DocumentRequirement[];
  met: DocumentRequirement[];
  missing: DocumentRequirement[];
  partial: DocumentRequirement[];
}

// ============================================================================
// COMPLIANCE SERVICE
// ============================================================================

export class ComplianceService {
  private requirements: Map<string, DocumentRequirement[]> = new Map();

  constructor() {
    this.initializeDefaultRequirements();
  }

  // ========================================================================
  // REQUIREMENT CHECKING
  // ========================================================================

  /**
   * Check requirements for declaration
   */
  async checkRequirements(
    declaration: Partial<CustomsDeclaration>,
  ): Promise<RequirementCheckResult> {
    const country = declaration.country!;
    const type = declaration.type!;

    // Get requirements
    const allRequirements = this.getRequirements(country, type);

    // Get documents for declaration
    const documents = declaration.id
      ? documentService.getDocumentsForDeclaration(declaration.id)
      : [];

    // Check which requirements are met
    const met: DocumentRequirement[] = [];
    const missing: DocumentRequirement[] = [];
    const partial: DocumentRequirement[] = [];

    for (const requirement of allRequirements) {
      const document = documents.find(
        (d) => d.type === requirement.documentType,
      );

      if (document && document.isValid) {
        met.push(requirement);
      } else if (document && !document.isValid) {
        partial.push(requirement);
      } else {
        missing.push(requirement);
      }
    }

    return {
      requirements: allRequirements,
      met,
      missing,
      partial,
    };
  }

  /**
   * Get requirements for country and declaration type
   */
  private getRequirements(
    country: CountryCode,
    type: CustomsDeclarationType,
  ): DocumentRequirement[] {
    const key = `${country}-${type}`;
    return this.requirements.get(key) || [];
  }

  /**
   * Register requirements
   */
  registerRequirements(
    country: CountryCode,
    type: CustomsDeclarationType,
    requirements: DocumentRequirement[],
  ): void {
    const key = `${country}-${type}`;
    this.requirements.set(key, requirements);
  }

  // ========================================================================
  // COMPLIANCE CHECKING
  // ========================================================================

  /**
   * Check compliance for declaration
   */
  async checkCompliance(
    declaration: Partial<CustomsDeclaration>,
  ): Promise<ComplianceCheckResult> {
    const issues: ComplianceIssue[] = [];
    let score = 100;

    // Check documents
    const requirementCheck = await this.checkRequirements(declaration);
    const missingDocuments = requirementCheck.missing
      .filter((r) => r.required)
      .map((r) => r.documentType);

    if (missingDocuments.length > 0) {
      score -= missingDocuments.length * 10;
      issues.push({
        id: `issue-doc-${Date.now()}`,
        severity: "ERROR",
        category: "DOCUMENT",
        description: `Missing required documents: ${missingDocuments.join(", ")}`,
        recommendation: "Upload missing documents before submission",
        relatedField: "documents",
      });
    }

    // Check licenses
    const missingLicenses: string[] = [];
    for (const product of declaration.products || []) {
      if (product.requiresLicense && !product.licenseNumber) {
        missingLicenses.push(product.hsCode);
        score -= 5;
        issues.push({
          id: `issue-license-${Date.now()}`,
          severity: "ERROR",
          category: "LICENSE",
          description: `Product ${product.hsCode} requires license but none provided`,
          recommendation: "Obtain required license for product",
          relatedField: `products.${product.id}.licenseNumber`,
        });
      }
    }

    // Check certificates
    const missingCertificates: string[] = [];
    for (const product of declaration.products || []) {
      if (product.requiresCertificate && !product.certificateNumber) {
        missingCertificates.push(product.hsCode);
        score -= 5;
        issues.push({
          id: `issue-cert-${Date.now()}`,
          severity: "WARNING",
          category: "REGULATORY",
          description: `Product ${product.hsCode} requires certificate but none provided`,
          recommendation: "Obtain required certificate for product",
          relatedField: `products.${product.id}.certificateNumber`,
        });
      }
    }

    // Check value declaration
    if (declaration.totalValue === undefined || declaration.totalValue <= 0) {
      score -= 15;
      issues.push({
        id: `issue-value-${Date.now()}`,
        severity: "ERROR",
        category: "VALUE",
        description: "Total value is missing or invalid",
        recommendation: "Provide valid total value",
        relatedField: "totalValue",
      });
    }

    // Check HS code classification
    for (const product of declaration.products || []) {
      if (!product.hsCode || product.hsCode.length < 6) {
        score -= 5;
        issues.push({
          id: `issue-hs-${Date.now()}`,
          severity: "WARNING",
          category: "CLASSIFICATION",
          description: `Product ${product.id} has invalid or incomplete HS code`,
          recommendation: "Provide valid HS code (minimum 6 digits)",
          relatedField: `products.${product.id}.hsCode`,
        });
      }
    }

    // Determine risk level
    const riskLevel = this.determineRiskLevel(score, issues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      issues,
      missingDocuments,
    );

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return {
      compliant:
        score >= 70 &&
        issues.filter((i) => i.severity === "ERROR").length === 0,
      score,
      issues,
      missingDocuments,
      missingLicenses,
      missingCertificates,
      recommendations,
      riskLevel,
    };
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(
    score: number,
    issues: ComplianceIssue[],
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const criticalIssues = issues.filter(
      (i) => i.severity === "CRITICAL",
    ).length;
    const errorIssues = issues.filter((i) => i.severity === "ERROR").length;

    if (criticalIssues > 0 || score < 50) {
      return "CRITICAL";
    }
    if (errorIssues > 0 || score < 70) {
      return "HIGH";
    }
    if (score < 85 || issues.length > 3) {
      return "MEDIUM";
    }
    return "LOW";
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    issues: ComplianceIssue[],
    missingDocuments: string[],
  ): string[] {
    const recommendations: string[] = [];

    if (missingDocuments.length > 0) {
      recommendations.push(
        `Upload missing documents: ${missingDocuments.join(", ")}`,
      );
    }

    for (const issue of issues) {
      if (
        issue.recommendation &&
        !recommendations.includes(issue.recommendation)
      ) {
        recommendations.push(issue.recommendation);
      }
    }

    return recommendations;
  }

  // ========================================================================
  // RISK ASSESSMENT
  // ========================================================================

  /**
   * Assess risk for declaration
   */
  async assessRisk(declaration: Partial<CustomsDeclaration>): Promise<{
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    riskScore: number; // 0-100
    factors: string[];
  }> {
    let riskScore = 0;
    const factors: string[] = [];

    // High value shipments
    if (declaration.totalValue && declaration.totalValue > 100000) {
      riskScore += 20;
      factors.push("High value shipment");
    }

    // Restricted items
    const restrictedProducts =
      declaration.products?.filter((p) => p.restrictedItem) || [];
    if (restrictedProducts.length > 0) {
      riskScore += 30;
      factors.push(`${restrictedProducts.length} restricted product(s)`);
    }

    // Hazardous materials
    const hazmatProducts =
      declaration.products?.filter((p) => p.hazardousMaterial) || [];
    if (hazmatProducts.length > 0) {
      riskScore += 25;
      factors.push(`${hazmatProducts.length} hazardous material(s)`);
    }

    // Missing documents
    const compliance = await this.checkCompliance(declaration);
    if (compliance.missingDocuments.length > 0) {
      riskScore += 15;
      factors.push(`${compliance.missingDocuments.length} missing document(s)`);
    }

    // New importer/exporter
    // (Would check against historical data)
    riskScore += 10;
    factors.push("New trading partner");

    // Determine risk level
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    if (riskScore >= 70) {
      riskLevel = "CRITICAL";
    } else if (riskScore >= 50) {
      riskLevel = "HIGH";
    } else if (riskScore >= 30) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "LOW";
    }

    return {
      riskLevel,
      riskScore: Math.min(100, riskScore),
      factors,
    };
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * Initialize default requirements
   */
  private initializeDefaultRequirements(): void {
    // Egypt requirements
    this.registerRequirements("EG", "IMPORT", [
      {
        documentType: "COMMERCIAL_INVOICE",
        required: true,
        country: "EG",
        applicableTo: ["IMPORT"],
        description: "Commercial invoice required",
      },
      {
        documentType: "PACKING_LIST",
        required: true,
        country: "EG",
        applicableTo: ["IMPORT"],
        description: "Packing list required",
      },
      {
        documentType: "BILL_OF_LADING",
        required: true,
        country: "EG",
        applicableTo: ["IMPORT"],
        description: "Bill of lading required",
      },
      {
        documentType: "ACID_DECLARATION",
        required: true,
        country: "EG",
        applicableTo: ["IMPORT"],
        description: "ACID declaration required for Egypt",
      },
    ]);

    // Saudi Arabia requirements
    this.registerRequirements("SA", "IMPORT", [
      {
        documentType: "COMMERCIAL_INVOICE",
        required: true,
        country: "SA",
        applicableTo: ["IMPORT"],
        description: "Commercial invoice required",
      },
      {
        documentType: "CERTIFICATE_OF_ORIGIN",
        required: true,
        country: "SA",
        applicableTo: ["IMPORT"],
        description: "Certificate of origin required",
      },
    ]);

    // Add more countries as needed
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const complianceService = new ComplianceService();
