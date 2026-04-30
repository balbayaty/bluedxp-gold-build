/**
 * FDA Standards Management Service
 * Comprehensive FDA API and pharmaceutical compliance
 *
 * Supports:
 * - 21 CFR Part 11 (Electronic Records and Signatures)
 * - 21 CFR Part 210/211 (cGMP for Pharmaceuticals)
 * - FDA Food Code
 * - ICH Guidelines
 * - Validation Requirements (IQ, OQ, PQ, CSV)
 *
 * Fully integrated with BlueDXP platform
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { evidenceService } from "@/lib/services/evidence";
import type {
  FDAStandard,
  FDARequirement,
  ValidationRequirement,
  DocumentationRequirement,
} from "./comprehensiveStandardsFramework";

// ============================================================================
// FDA STANDARDS DATA
// ============================================================================

export const fdaStandards: Record<string, FDAStandard> = {
  "FDA-21CFR11": {
    code: "21 CFR Part 11",
    name: "Electronic Records and Electronic Signatures",
    regulation: "21 CFR Part 11",
    category: "PHARMACEUTICAL",
    description:
      "FDA regulations for electronic records and electronic signatures",
    requirements: [
      {
        id: "FDA-11.10",
        section: "11.10",
        subsection: "11.10",
        title: "Controls for closed systems",
        description:
          "Persons who use closed systems to create, modify, maintain, or transmit electronic records shall employ procedures and controls designed to ensure the authenticity, integrity, and, when appropriate, the confidentiality of electronic records",
        mandatory: true,
        validationMethod: "VALIDATED_SYSTEM",
        electronicRecords: true,
        electronicSignatures: true,
        auditTrailRequired: true,
        dataIntegrity: true,
      },
      {
        id: "FDA-11.30",
        section: "11.30",
        subsection: "11.30",
        title: "Controls for identification codes/passwords",
        description:
          "Persons who use electronic signatures based upon use of identification codes in combination with passwords shall employ controls to ensure their security and integrity",
        mandatory: true,
        validationMethod: "VALIDATED_SYSTEM",
        electronicRecords: true,
        electronicSignatures: true,
        auditTrailRequired: true,
        dataIntegrity: true,
      },
      {
        id: "FDA-11.50",
        section: "11.50",
        subsection: "11.50",
        title: "Signature manifestations",
        description:
          "Signed electronic records shall contain information associated with the signing that clearly indicates the printed name of the signer, the date and time when the signature was executed, and the meaning (such as review, approval, responsibility, or authorship)",
        mandatory: true,
        validationMethod: "VALIDATED_SYSTEM",
        electronicRecords: true,
        electronicSignatures: true,
        auditTrailRequired: true,
        dataIntegrity: true,
      },
      {
        id: "FDA-11.70",
        section: "11.70",
        subsection: "11.70",
        title: "Signature/record linking",
        description:
          "Electronic signatures and handwritten signatures executed to electronic records shall be linked to their respective electronic records to ensure that the signatures cannot be excised, copied, or otherwise transferred to falsify an electronic record by ordinary means",
        mandatory: true,
        validationMethod: "VALIDATED_SYSTEM",
        electronicRecords: true,
        electronicSignatures: true,
        auditTrailRequired: true,
        dataIntegrity: true,
      },
    ],
    validationRequirements: [
      {
        id: "VAL-21CFR11-1",
        type: "CSV",
        description: "Computer System Validation for electronic records system",
        deliverables: [
          "Validation Plan",
          "User Requirements Specification (URS)",
          "Functional Requirements Specification (FRS)",
          "Design Specification",
          "Installation Qualification (IQ)",
          "Operational Qualification (OQ)",
          "Performance Qualification (PQ)",
          "Validation Report",
        ],
        acceptanceCriteria: [
          "System meets all requirements",
          "All tests passed",
          "Documentation complete",
          "Audit trail functional",
        ],
      },
    ],
    documentationRequirements: [
      {
        id: "DOC-21CFR11-1",
        documentType: "Electronic Record",
        required: true,
        retentionPeriod: "As per record retention policy",
        format: "ELECTRONIC",
        signatureRequired: true,
      },
      {
        id: "DOC-21CFR11-2",
        documentType: "Audit Trail",
        required: true,
        retentionPeriod: "Same as associated record",
        format: "ELECTRONIC",
        signatureRequired: false,
      },
      {
        id: "DOC-21CFR11-3",
        documentType: "Validation Documentation",
        required: true,
        retentionPeriod: "Life of system + retention period",
        format: "HYBRID",
        signatureRequired: true,
      },
    ],
    apiIntegrationPoints: [
      "/api/qhse/fda/electronic-records",
      "/api/qhse/fda/electronic-signatures",
      "/api/qhse/fda/audit-trails",
      "/api/qhse/fda/validation",
    ],
  },

  "FDA-21CFR210211": {
    code: "21 CFR Part 210/211",
    name: "Current Good Manufacturing Practice for Finished Pharmaceuticals",
    regulation: "21 CFR Part 210/211",
    category: "PHARMACEUTICAL",
    description: "FDA regulations for cGMP in pharmaceutical manufacturing",
    requirements: [
      {
        id: "FDA-211.22",
        section: "211.22",
        subsection: "211.22",
        title: "Responsibilities of quality control unit",
        description:
          "There shall be a quality control unit that shall have the responsibility and authority to approve or reject all components, drug product containers, closures, in-process materials, packaging material, labeling, and drug products",
        mandatory: true,
        validationMethod: "VALIDATED_SYSTEM",
        electronicRecords: true,
        electronicSignatures: true,
        auditTrailRequired: true,
        dataIntegrity: true,
      },
      {
        id: "FDA-211.84",
        section: "211.84",
        subsection: "211.84",
        title:
          "Testing and approval or rejection of components, drug product containers, and closures",
        description:
          "Each lot of components, drug product containers, and closures shall be withheld from use until the lot has been sampled, tested, or examined, as appropriate, and released for use by the quality control unit",
        mandatory: true,
        validationMethod: "VALIDATED_SYSTEM",
        electronicRecords: true,
        electronicSignatures: true,
        auditTrailRequired: true,
        dataIntegrity: true,
      },
      {
        id: "FDA-211.100",
        section: "211.100",
        subsection: "211.100",
        title: "Written procedures; deviations",
        description:
          "There shall be written procedures for production and process control designed to assure that the drug products have the identity, strength, quality, and purity they purport or are represented to possess",
        mandatory: true,
        validationMethod: "VALIDATED_SYSTEM",
        electronicRecords: true,
        electronicSignatures: true,
        auditTrailRequired: true,
        dataIntegrity: true,
      },
      {
        id: "FDA-211.165",
        section: "211.165",
        subsection: "211.165",
        title: "Testing and release for distribution",
        description:
          "For each batch of drug product, there shall be appropriate laboratory determination of satisfactory conformance to final specifications for the drug product, including the identity and strength of each active ingredient, prior to release",
        mandatory: true,
        validationMethod: "VALIDATED_SYSTEM",
        electronicRecords: true,
        electronicSignatures: true,
        auditTrailRequired: true,
        dataIntegrity: true,
      },
      {
        id: "FDA-211.188",
        section: "211.188",
        subsection: "211.188",
        title: "Batch production and control records",
        description:
          "Batch production and control records shall be prepared for each batch of drug product produced and shall include complete information relating to the production and control of each batch",
        mandatory: true,
        validationMethod: "VALIDATED_SYSTEM",
        electronicRecords: true,
        electronicSignatures: true,
        auditTrailRequired: true,
        dataIntegrity: true,
      },
    ],
    validationRequirements: [
      {
        id: "VAL-210211-1",
        type: "IQ",
        description: "Installation Qualification for manufacturing equipment",
        deliverables: [
          "IQ Protocol",
          "Equipment Installation Verification",
          "IQ Report",
        ],
        acceptanceCriteria: [
          "Equipment installed per specifications",
          "Utilities connected",
          "Documentation complete",
        ],
      },
      {
        id: "VAL-210211-2",
        type: "OQ",
        description: "Operational Qualification for manufacturing processes",
        deliverables: [
          "OQ Protocol",
          "Functional Testing Results",
          "OQ Report",
        ],
        acceptanceCriteria: [
          "All functions operate as specified",
          "Alarms and interlocks functional",
          "Documentation complete",
        ],
      },
      {
        id: "VAL-210211-3",
        type: "PQ",
        description: "Performance Qualification for manufacturing processes",
        deliverables: ["PQ Protocol", "Process Performance Data", "PQ Report"],
        acceptanceCriteria: [
          "Process meets performance criteria",
          "Consistent results achieved",
          "Documentation complete",
        ],
      },
    ],
    documentationRequirements: [
      {
        id: "DOC-210211-1",
        documentType: "Batch Record",
        required: true,
        retentionPeriod: "1 year after expiration date",
        format: "ELECTRONIC",
        signatureRequired: true,
      },
      {
        id: "DOC-210211-2",
        documentType: "Laboratory Record",
        required: true,
        retentionPeriod: "1 year after expiration date",
        format: "ELECTRONIC",
        signatureRequired: true,
      },
      {
        id: "DOC-210211-3",
        documentType: "Validation Documentation",
        required: true,
        retentionPeriod: "Life of system",
        format: "HYBRID",
        signatureRequired: true,
      },
    ],
    apiIntegrationPoints: [
      "/api/qhse/fda/batch-records",
      "/api/qhse/fda/laboratory-records",
      "/api/qhse/fda/quality-control",
      "/api/qhse/fda/validation",
    ],
  },
};

// ============================================================================
// FDA STANDARDS SERVICE
// ============================================================================

class FDAStandardsService {
  /**
   * Get FDA standard by code
   */
  getStandard(code: string): FDAStandard | undefined {
    return fdaStandards[code];
  }

  /**
   * Get all FDA standards
   */
  getAllStandards(): FDAStandard[] {
    return Object.values(fdaStandards);
  }

  /**
   * Get requirements for a standard
   */
  getRequirements(standardCode: string): FDARequirement[] {
    const standard = this.getStandard(standardCode);
    return standard?.requirements || [];
  }

  /**
   * Get validation requirements
   */
  getValidationRequirements(standardCode: string): ValidationRequirement[] {
    const standard = this.getStandard(standardCode);
    return standard?.validationRequirements || [];
  }

  /**
   * Get documentation requirements
   */
  getDocumentationRequirements(
    standardCode: string,
  ): DocumentationRequirement[] {
    const standard = this.getStandard(standardCode);
    return standard?.documentationRequirements || [];
  }

  /**
   * Check compliance with FDA standard
   */
  async checkCompliance(
    standardCode: string,
    tenantId?: string,
    customerId?: string,
    warehouseId?: string,
  ): Promise<{
    standard: string;
    complianceScore: number;
    requirements: Array<{
      requirement: FDARequirement;
      compliant: boolean;
      evidence: string[];
      gaps: string[];
    }>;
    validationStatus: {
      iq: boolean;
      oq: boolean;
      pq: boolean;
      csv: boolean;
    };
    overallStatus: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
    recommendations: string[];
  }> {
    const standard = this.getStandard(standardCode);
    if (!standard) {
      throw new Error(`FDA standard ${standardCode} not found`);
    }

    // Check requirements
    const requirementChecks = await Promise.all(
      standard.requirements.map(async (req) => {
        const evidence = await evidenceService.getEvidence({
          entityType: "FDA_COMPLIANCE",
          entityId: req.id,
          tenantId,
          customerId,
          warehouseId,
        });

        const compliant = req.evidenceRequired ? evidence.length > 0 : true;

        const gaps = compliant ? [] : ["Evidence required but not found"];

        return {
          requirement: req,
          compliant,
          evidence: evidence.map((e) => e.id),
          gaps,
        };
      }),
    );

    // Check validation status
    const validationStatus = {
      iq: false,
      oq: false,
      pq: false,
      csv: false,
    };

    const validationChecks = await Promise.all(
      standard.validationRequirements.map(async (valReq) => {
        const evidence = await evidenceService.getEvidence({
          entityType: "FDA_VALIDATION",
          entityId: valReq.id,
          tenantId,
          customerId,
          warehouseId,
        });

        if (valReq.type === "IQ") validationStatus.iq = evidence.length > 0;
        if (valReq.type === "OQ") validationStatus.oq = evidence.length > 0;
        if (valReq.type === "PQ") validationStatus.pq = evidence.length > 0;
        if (valReq.type === "CSV") validationStatus.csv = evidence.length > 0;

        return {
          validation: valReq,
          completed: evidence.length > 0,
          evidence: evidence.map((e) => e.id),
        };
      }),
    );

    // Calculate compliance score
    const compliantCount = requirementChecks.filter((r) => r.compliant).length;
    const totalCount = requirementChecks.length;
    const complianceScore =
      totalCount > 0 ? (compliantCount / totalCount) * 100 : 0;

    // Determine overall status
    let overallStatus: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
    const allValidationsComplete = Object.values(validationStatus).every(
      (v) => v,
    );

    if (complianceScore >= 95 && allValidationsComplete) {
      overallStatus = "COMPLIANT";
    } else if (complianceScore >= 70) {
      overallStatus = "PARTIALLY_COMPLIANT";
    } else {
      overallStatus = "NON_COMPLIANT";
    }

    // Generate recommendations
    const recommendations: string[] = [];
    requirementChecks
      .filter((r) => !r.compliant)
      .forEach((r) => {
        recommendations.push(
          `Address requirement ${r.requirement.id}: ${r.requirement.title}`,
        );
      });

    validationChecks
      .filter((v) => !v.completed)
      .forEach((v) => {
        recommendations.push(
          `Complete ${v.validation.type} validation: ${v.validation.description}`,
        );
      });

    // Publish compliance check event
    await eventBus.publish({
      type: "qhse.fda.compliance.checked",
      payload: {
        standardCode,
        complianceScore,
        overallStatus,
        validationStatus,
        tenantId,
        customerId,
        warehouseId,
      },
    });

    return {
      standard: standard.code,
      complianceScore,
      requirements: requirementChecks,
      validationStatus,
      overallStatus,
      recommendations,
    };
  }

  /**
   * Get API integration points
   */
  getAPIIntegrationPoints(standardCode: string): string[] {
    const standard = this.getStandard(standardCode);
    return standard?.apiIntegrationPoints || [];
  }
}

export const fdaStandardsService = new FDAStandardsService();
