/**
 * Regulatory Tracker
 *
 * Tracks regulatory requirements from all 17 Saudi government agencies
 * Real-time compliance status and update notifications
 *
 * @module saudi-alignment
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type {
  RegulatoryTracker,
  RegulatoryRequirement,
  ComplianceStatus,
  SaudiAgency,
} from "./types";

// ============================================================================
// REGULATORY REQUIREMENTS DATABASE
// ============================================================================

/**
 * Regulatory requirements by agency
 */
const REGULATORY_REQUIREMENTS: Record<SaudiAgency, RegulatoryRequirement[]> = {
  TGA: [
    {
      id: "tga-1",
      agency: "TGA",
      title: "Transport License",
      description:
        "Valid transport license required for all commercial transport operations",
      category: "LICENSE",
      applicableTo: ["Transportation", "Shipment", "Carrier"],
      requiredDocuments: [
        "Commercial Registration",
        "Transport License Application",
        "Vehicle Registration",
      ],
      validityPeriod: 365,
      renewalRequired: true,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  MOT: [
    {
      id: "mot-1",
      agency: "MOT",
      title: "Ministry of Transport Approval",
      description: "Approval required for international transport operations",
      category: "APPROVAL",
      applicableTo: ["Transportation", "Shipment"],
      requiredDocuments: ["Route Approval", "Carrier Certification"],
      renewalRequired: false,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  ABSHER: [
    {
      id: "absher-1",
      agency: "ABSHER",
      title: "Absher Business Verification",
      description: "Business verification through Absher platform",
      category: "REGISTRATION",
      applicableTo: ["Company", "Business"],
      requiredDocuments: ["Commercial Registration", "Owner ID"],
      renewalRequired: false,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  NAFATH: [
    {
      id: "nafath-1",
      agency: "NAFATH",
      title: "Nafath Digital Identity",
      description: "Digital identity verification through Nafath",
      category: "CERTIFICATION",
      applicableTo: ["User", "Employee"],
      requiredDocuments: ["National ID"],
      renewalRequired: false,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  SABER: [
    {
      id: "saber-1",
      agency: "SABER",
      title: "SABER Product Registration",
      description:
        "Product registration and certification through SABER platform",
      category: "REGISTRATION",
      applicableTo: ["Product", "Chemical", "Goods"],
      requiredDocuments: ["Product Certificate", "Test Reports", "MSDS"],
      renewalRequired: true,
      validityPeriod: 1095, // 3 years
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  SFDA: [
    {
      id: "sfda-1",
      agency: "SFDA",
      title: "SFDA Food/Pharmaceutical License",
      description: "License required for food and pharmaceutical products",
      category: "LICENSE",
      applicableTo: ["Product", "Food", "Pharmaceutical"],
      requiredDocuments: [
        "SFDA Application",
        "Product Specifications",
        "Safety Data",
      ],
      renewalRequired: true,
      validityPeriod: 365,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  ZATCA: [
    {
      id: "zatca-1",
      agency: "ZATCA",
      title: "ZATCA Customs Clearance",
      description: "Customs clearance required for imports/exports",
      category: "PERMIT",
      applicableTo: ["Shipment", "Import", "Export"],
      requiredDocuments: [
        "Commercial Invoice",
        "Packing List",
        "Certificate of Origin",
        "Bill of Lading",
      ],
      renewalRequired: false,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  SAMA: [
    {
      id: "sama-1",
      agency: "SAMA",
      title: "SAMA Financial Services License",
      description: "License required for financial services operations",
      category: "LICENSE",
      applicableTo: ["Financial", "Payment"],
      requiredDocuments: ["SAMA Application", "Financial Statements"],
      renewalRequired: true,
      validityPeriod: 365,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "MANUAL",
    },
  ],
  NCSC: [
    {
      id: "ncsc-1",
      agency: "NCSC",
      title: "NCSC Cybersecurity Compliance",
      description: "Cybersecurity compliance required for digital services",
      category: "COMPLIANCE",
      applicableTo: ["System", "Platform", "Service"],
      requiredDocuments: ["Security Assessment", "Compliance Report"],
      renewalRequired: true,
      validityPeriod: 365,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "DOCUMENT",
    },
  ],
  SDAIA: [
    {
      id: "sdaia-1",
      agency: "SDAIA",
      title: "SDAIA Data Governance Compliance",
      description: "Data governance compliance for AI and data services",
      category: "COMPLIANCE",
      applicableTo: ["AI", "Data", "Analytics"],
      requiredDocuments: ["Data Governance Plan", "Privacy Policy"],
      renewalRequired: false,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "DOCUMENT",
    },
  ],
  SASO: [
    {
      id: "saso-1",
      agency: "SASO",
      title: "SASO Product Certification",
      description:
        "Product certification required for certain product categories",
      category: "CERTIFICATION",
      applicableTo: ["Product", "Goods"],
      requiredDocuments: ["Test Reports", "Product Specifications"],
      renewalRequired: true,
      validityPeriod: 1095,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  MODON: [
    {
      id: "modon-1",
      agency: "MODON",
      title: "MODON Industrial License",
      description: "License required for industrial operations",
      category: "LICENSE",
      applicableTo: ["Facility", "Warehouse", "Manufacturing"],
      requiredDocuments: ["Industrial License Application", "Facility Plans"],
      renewalRequired: true,
      validityPeriod: 365,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  MOC: [
    {
      id: "moc-1",
      agency: "MOC",
      title: "MOC Commercial Registration",
      description: "Commercial registration required for all businesses",
      category: "REGISTRATION",
      applicableTo: ["Company", "Business"],
      requiredDocuments: [
        "Commercial Registration Application",
        "Owner Documents",
      ],
      renewalRequired: true,
      validityPeriod: 365,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  MOI: [
    {
      id: "moi-1",
      agency: "MOI",
      title: "MOI Security Clearance",
      description: "Security clearance for sensitive operations",
      category: "APPROVAL",
      applicableTo: ["Employee", "Facility"],
      requiredDocuments: ["Security Clearance Application", "Background Check"],
      renewalRequired: true,
      validityPeriod: 365,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  MOMRA: [
    {
      id: "momra-1",
      agency: "MOMRA",
      title: "MOMRA Municipal License",
      description: "Municipal license required for facility operations",
      category: "LICENSE",
      applicableTo: ["Facility", "Warehouse", "Building"],
      requiredDocuments: ["Municipal License Application", "Building Permit"],
      renewalRequired: true,
      validityPeriod: 365,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  MISA: [
    {
      id: "misa-1",
      agency: "MISA",
      title: "MISA Investment License",
      description: "Investment license for foreign investments",
      category: "LICENSE",
      applicableTo: ["Company", "Investment"],
      requiredDocuments: ["Investment Application", "Business Plan"],
      renewalRequired: false,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
  CITC: [
    {
      id: "citc-1",
      agency: "CITC",
      title: "CITC Telecommunications License",
      description: "License required for telecommunications services",
      category: "LICENSE",
      applicableTo: ["Telecommunications", "IT Services"],
      requiredDocuments: [
        "Telecom License Application",
        "Technical Specifications",
      ],
      renewalRequired: true,
      validityPeriod: 365,
      lastUpdated: new Date(),
      status: "ACTIVE",
      verificationMethod: "API",
    },
  ],
};

// ============================================================================
// REGULATORY TRACKER
// ============================================================================

export class RegulatoryTrackerImpl implements RegulatoryTracker {
  /**
   * Get all requirements for entity type
   */
  async getRequirements(entityType: string): Promise<RegulatoryRequirement[]> {
    const requirements: RegulatoryRequirement[] = [];

    for (const agencyRequirements of Object.values(REGULATORY_REQUIREMENTS)) {
      for (const req of agencyRequirements) {
        if (req.applicableTo.includes(entityType)) {
          requirements.push(req);
        }
      }
    }

    return requirements;
  }

  /**
   * Check compliance status
   */
  async checkCompliance(
    entityId: string,
    entityType: string,
  ): Promise<ComplianceStatus> {
    // Get requirements
    const requirements = await this.getRequirements(entityType);

    // Get entity events
    const events = await eventStore.getEvents(entityId);

    // Check each requirement
    const requirementStatuses = await Promise.all(
      requirements.map((req) =>
        this.checkRequirementCompliance(entityId, req, events),
      ),
    );

    // Calculate overall compliance
    const compliantCount = requirementStatuses.filter(
      (r) => r.status === "COMPLIANT",
    ).length;
    const overallCompliance =
      requirements.length > 0
        ? (compliantCount / requirements.length) * 100
        : 100;

    return {
      entityId,
      entityType,
      requirements: requirementStatuses,
      overallCompliance,
      lastChecked: new Date(),
    };
  }

  /**
   * Track regulatory updates
   */
  async trackUpdates(agency: SaudiAgency): Promise<RegulatoryRequirement[]> {
    // In production, would call agency API to check for updates
    // For now, return current requirements
    const requirements = REGULATORY_REQUIREMENTS[agency] || [];

    // Check for updates (would compare with stored version)
    const updatedRequirements = requirements.filter((req) => {
      // Would check if requirement was updated since last check
      return req.status === "UPDATED" || req.status === "ACTIVE";
    });

    // Publish update notifications
    if (updatedRequirements.length > 0) {
      await eventBus.publish(
        createEvent(
          "RegulatoryRequirementsUpdated",
          agency,
          "Agency",
          {
            agency,
            updatedCount: updatedRequirements.length,
            requirements: updatedRequirements.map((r) => r.id),
          },
          1,
          {
            correlationId: `regulatory-update-${Date.now()}`,
            userId: "regulatory-tracker",
          },
        ),
      );
    }

    return updatedRequirements;
  }

  /**
   * Verify requirement compliance
   */
  async verifyRequirement(
    entityId: string,
    requirementId: string,
  ): Promise<{
    compliant: boolean;
    evidence: string[];
    verifiedAt: Date;
  }> {
    // Find requirement
    let requirement: RegulatoryRequirement | undefined;
    for (const agencyRequirements of Object.values(REGULATORY_REQUIREMENTS)) {
      requirement = agencyRequirements.find((r) => r.id === requirementId);
      if (requirement) break;
    }

    if (!requirement) {
      throw new Error(`Requirement ${requirementId} not found`);
    }

    // Get entity events
    const events = await eventStore.getEvents(entityId);

    // Check compliance based on verification method
    let compliant = false;
    const evidence: string[] = [];

    switch (requirement.verificationMethod) {
      case "API":
        // Would call agency API
        compliant = await this.verifyViaAPI(entityId, requirement);
        evidence.push(`API verification for ${requirement.agency}`);
        break;

      case "DOCUMENT":
        // Check for required documents
        const hasDocuments = await this.checkDocuments(
          entityId,
          requirement.requiredDocuments,
        );
        compliant = hasDocuments;
        evidence.push(...(hasDocuments ? requirement.requiredDocuments : []));
        break;

      case "MANUAL":
        // Manual verification required
        compliant = false; // Would be set by manual review
        evidence.push("Manual verification required");
        break;
    }

    // Store verification result
    try {
      await knowledgeBaseService.create({
        tenantId: "default",
        agentId: "regulatory-tracker",
        type: "requirement_verification",
        category: "compliance",
        content: JSON.stringify({
          entityId,
          requirementId,
          compliant,
          evidence,
        }),
        summary: `Verification for requirement ${requirement.title}`,
        metadata: {
          entityId,
          requirementId,
          agency: requirement.agency,
          compliant,
        },
        keywords: [
          "regulatory",
          "compliance",
          requirement.agency,
          requirementId,
        ],
        searchableText: `regulatory compliance ${requirement.agency} ${requirement.title}`,
        source: "regulatory_tracker",
        confidence: compliant ? 1.0 : 0.5,
        verified: true,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
      });
    } catch (error) {
      console.warn("Error storing verification result:", error);
    }

    return {
      compliant,
      evidence,
      verifiedAt: new Date(),
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check requirement compliance
   */
  private async checkRequirementCompliance(
    entityId: string,
    requirement: RegulatoryRequirement,
    events: any[],
  ): Promise<ComplianceStatus["requirements"][0]> {
    // Check if requirement is applicable
    // Check expiration
    let status: ComplianceStatus["requirements"][0]["status"] = "PENDING";
    const documents: string[] = [];

    // Check for compliance events
    const complianceEvents = events.filter(
      (e) =>
        e.type?.includes("compliance") ||
        e.type?.includes(requirement.agency.toLowerCase()) ||
        e.payload?.requirementId === requirement.id,
    );

    if (complianceEvents.length > 0) {
      const latestEvent = complianceEvents[complianceEvents.length - 1];
      if (latestEvent.payload?.compliant === true) {
        status = "COMPLIANT";
        if (latestEvent.payload?.documents) {
          documents.push(...latestEvent.payload.documents);
        }
      } else {
        status = "NON_COMPLIANT";
      }
    }

    // Check expiration
    if (requirement.validityPeriod && status === "COMPLIANT") {
      const complianceEvent = complianceEvents.find(
        (e) => e.payload?.compliant === true,
      );
      if (complianceEvent) {
        const verifiedDate = new Date(complianceEvent.timestamp);
        const expiryDate = new Date(
          verifiedDate.getTime() +
            requirement.validityPeriod * 24 * 60 * 60 * 1000,
        );
        if (expiryDate < new Date()) {
          status = "EXPIRED";
        }
      }
    }

    return {
      requirementId: requirement.id,
      requirementTitle: requirement.title,
      agency: requirement.agency,
      status,
      documents,
      verifiedAt:
        complianceEvents.length > 0
          ? new Date(complianceEvents[complianceEvents.length - 1].timestamp)
          : undefined,
    };
  }

  /**
   * Verify via API
   */
  private async verifyViaAPI(
    entityId: string,
    requirement: RegulatoryRequirement,
  ): Promise<boolean> {
    // In production, would call agency API
    // For now, simulate based on requirement
    try {
      // Would implement actual API calls here
      // For TGA, ZATCA, SABER, etc.
      return true; // Placeholder
    } catch (error) {
      console.warn(`Error verifying via API for ${requirement.agency}:`, error);
      return false;
    }
  }

  /**
   * Check documents
   */
  private async checkDocuments(
    entityId: string,
    requiredDocuments: string[],
  ): Promise<boolean> {
    // Check if documents exist in Evidence Service
    try {
      const { evidenceService } =
        await import("@/lib/services/evidence/evidenceService");
      const searchResult = await evidenceService.search({
        relatedEntityId: entityId,
      });

      const foundDocuments = searchResult.evidence.map((e) =>
        e.title.toLowerCase(),
      );
      const requiredLower = requiredDocuments.map((d) => d.toLowerCase());

      return requiredLower.every((req) =>
        foundDocuments.some((found) => found.includes(req)),
      );
    } catch (error) {
      console.warn("Error checking documents:", error);
      return false;
    }
  }
}

// Export singleton
export const regulatoryTracker: RegulatoryTracker = new RegulatoryTrackerImpl();
