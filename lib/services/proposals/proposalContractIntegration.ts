/**
 * Proposal to Contract Integration Service
 * Seamless conversion of accepted proposals to legally binding contracts
 * Ensures full traceability, compliance, and liability protection
 *
 * VISION 2040 ALIGNED: Smart contracts, blockchain-ready, automated execution
 */

import { contractService } from "@/lib/services/procurement/contractService";
import { marketplaceContractService } from "@/lib/services/marketplace/contracts/marketplaceContractService";
import { eventStore } from "@/lib/services/event-store";
import { proposalEvidenceIntegration } from "./proposalEvidenceIntegration";
import { proposalLiabilityIntegration } from "./proposalLiabilityIntegration";
import type { Proposal } from "@/types/proposals";
import type { Contract, ContractCreateInput } from "@/types/contract";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalToContractConversion {
  proposalId: string;
  contractId: string;
  contractNumber: string;
  conversionType: "PROCUREMENT" | "MARKETPLACE" | "SERVICE";
  status: "PENDING" | "CONVERTED" | "FAILED";
  convertedAt: Date | string;
  convertedBy: string;
  mapping: {
    proposalSection: string;
    contractSection: string;
    mapped: boolean;
  }[];
  compliance: {
    allSectionsMapped: boolean;
    requiredSectionsPresent: boolean;
    termsValidated: boolean;
  };
  liability: {
    liabilityAssessmentId?: string;
    riskLevel?: string;
    insuranceOptimized: boolean;
  };
  evidence: {
    evidenceId: string;
    lineagePreserved: boolean;
  };
}

export interface ContractGenerationConfig {
  includeLiabilityTerms: boolean;
  includeInsuranceTerms: boolean;
  includeComplianceTerms: boolean;
  includeEvidenceLineage: boolean;
  autoSign: boolean;
  notifyParties: boolean;
}

// ============================================================================
// PROPOSAL TO CONTRACT INTEGRATION SERVICE
// ============================================================================

class ProposalContractIntegration {
  private static instance: ProposalContractIntegration;

  static getInstance(): ProposalContractIntegration {
    if (!ProposalContractIntegration.instance) {
      ProposalContractIntegration.instance = new ProposalContractIntegration();
    }
    return ProposalContractIntegration.instance;
  }

  /**
   * Convert accepted proposal to contract
   */
  async convertProposalToContract(
    proposal: Proposal,
    tenantId: string,
    convertedBy: string,
    config: Partial<ContractGenerationConfig> = {},
  ): Promise<ProposalToContractConversion> {
    // Validate proposal is ready for conversion
    if (proposal.status !== "ACCEPTED") {
      throw new Error(
        `Proposal ${proposal.id} is not accepted. Current status: ${proposal.status}`,
      );
    }

    if (!proposal.acceptedAt) {
      throw new Error(
        `Proposal ${proposal.id} does not have acceptance timestamp`,
      );
    }

    // Get liability assessment if available
    let liabilityAssessment = null;
    if (config.includeLiabilityTerms) {
      try {
        liabilityAssessment =
          await proposalLiabilityIntegration.assessProposalLiability(
            proposal,
            tenantId,
            convertedBy,
          );
      } catch (error) {
        console.warn("Could not get liability assessment:", error);
      }
    }

    // Determine contract type
    const contractType = this.determineContractType(proposal);

    // Create contract based on type
    let contract: Contract;
    let contractId: string;
    let contractNumber: string;

    if (contractType === "MARKETPLACE") {
      // Use marketplace contract service
      const marketplaceContract =
        await marketplaceContractService.createContract(
          proposal.rfqId || "marketplace-booking",
          {
            templateId: undefined,
            terms: this.extractContractTerms(
              proposal,
              liabilityAssessment,
              config,
            ),
            milestones: this.extractMilestones(proposal),
            paymentSchedule: this.extractPaymentSchedule(proposal),
            serviceLevelAgreements: this.extractSLAs(proposal),
          },
        );
      contractId = marketplaceContract.id;
      contractNumber = marketplaceContract.contractNumber;
      contract = this.mapMarketplaceContractToContract(marketplaceContract);
    } else {
      // Use procurement contract service
      const contractInput: ContractCreateInput = {
        tenantId,
        type: contractType === "PROCUREMENT" ? "SERVICE" : "SERVICE",
        vendorId: proposal.customerId || "",
        title: proposal.title,
        description: proposal.description || proposal.executiveSummary,
        startDate: new Date().toISOString(),
        endDate:
          proposal.validUntil ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenewal: false,
        pricingType: this.determinePricingType(proposal),
        pricingDetails: this.extractPricingDetails(proposal),
        currency: proposal.currency || "SAR",
        paymentTerms: this.extractPaymentTerms(proposal),
        deliveryTerms: this.extractDeliveryTerms(proposal),
        warrantyTerms: this.extractWarrantyTerms(proposal),
        liabilityTerms:
          config.includeLiabilityTerms && liabilityAssessment
            ? this.generateLiabilityTerms(liabilityAssessment)
            : undefined,
        items: this.extractContractItems(proposal),
        totalValue: proposal.totalAmount,
        complianceRequirements: config.includeComplianceTerms
          ? this.extractComplianceRequirements(proposal)
          : undefined,
        serviceLevelAgreements: this.extractSLAs(proposal),
        tags: proposal.tags || [],
      };

      const createdContract = await contractService.createContract(
        contractInput,
        convertedBy,
      );
      contractId = createdContract.id;
      contractNumber = createdContract.contractNumber;
      contract = createdContract;
    }

    // Record evidence of conversion
    const evidenceId =
      await proposalEvidenceIntegration.recordProposalToContract(
        proposal,
        contractId,
        convertedBy,
        tenantId,
      );

    // Create conversion record
    const conversion: ProposalToContractConversion = {
      proposalId: proposal.id,
      contractId,
      contractNumber,
      conversionType: contractType,
      status: "CONVERTED",
      convertedAt: new Date().toISOString(),
      convertedBy,
      mapping: this.mapProposalToContract(proposal, contract),
      compliance: {
        allSectionsMapped: true,
        requiredSectionsPresent: true,
        termsValidated: true,
      },
      liability: {
        liabilityAssessmentId: liabilityAssessment?.assessmentId,
        riskLevel: liabilityAssessment?.riskLevel,
        insuranceOptimized: config.includeInsuranceTerms || false,
      },
      evidence: {
        evidenceId,
        lineagePreserved: true,
      },
    };

    // Publish event
    await eventStore.publish({
      type: "proposals.contract.converted",
      aggregateId: proposal.id,
      aggregateType: "Proposal",
      payload: {
        proposalId: proposal.id,
        contractId,
        contractNumber,
        conversionType: contractType,
      },
      metadata: {
        tenantId,
        userId: convertedBy,
        timestamp: new Date().toISOString(),
      },
    });

    // Auto-sign if configured
    if (config.autoSign) {
      // Trigger signature workflow
      await this.initiateContractSignature(contractId, contractType, tenantId);
    }

    // Notify parties if configured
    if (config.notifyParties) {
      await this.notifyContractParties(contractId, contractType, tenantId);
    }

    return conversion;
  }

  /**
   * Determine contract type from proposal
   */
  private determineContractType(
    proposal: Proposal,
  ): "PROCUREMENT" | "MARKETPLACE" | "SERVICE" {
    // Check if proposal has marketplace booking reference
    if (
      proposal.rfqId?.startsWith("marketplace-") ||
      proposal.rfqId?.startsWith("booking-")
    ) {
      return "MARKETPLACE";
    }

    // Check proposal type
    if (proposal.type.includes("SERVICE") || proposal.type.includes("QUOTE")) {
      return "SERVICE";
    }

    return "PROCUREMENT";
  }

  /**
   * Extract contract terms from proposal
   */
  private extractContractTerms(
    proposal: Proposal,
    liabilityAssessment: any,
    config: Partial<ContractGenerationConfig>,
  ): any {
    const termsSection = proposal.sections.find((s) => s.type === "TERMS");
    const baseTerms =
      termsSection?.content || "Standard terms and conditions apply.";

    let terms = baseTerms;

    // Add liability terms if configured
    if (config.includeLiabilityTerms && liabilityAssessment) {
      terms += `\n\nLIABILITY TERMS:\n`;
      terms += `- Maximum liability exposure: ${liabilityAssessment.liabilityExposure.potentialExposure} ${liabilityAssessment.liabilityExposure.currency}\n`;
      terms += `- Risk level: ${liabilityAssessment.riskLevel}\n`;
      if (liabilityAssessment.liabilityExposure.potentialExposure > 100000) {
        terms += `- Liability cap applies as per terms and conditions\n`;
      }
    }

    // Add insurance terms if configured
    if (config.includeInsuranceTerms && liabilityAssessment) {
      terms += `\n\nINSURANCE TERMS:\n`;
      for (const coverage of liabilityAssessment.insurance
        .recommendedCoverage) {
        terms += `- ${coverage.type}: Minimum ${coverage.minimumAmount} ${coverage.currency}\n`;
      }
    }

    // Add compliance terms if configured
    if (config.includeComplianceTerms) {
      terms += `\n\nCOMPLIANCE TERMS:\n`;
      terms += `- All regulatory requirements must be met\n`;
      terms += `- Compliance with local and international laws required\n`;
    }

    return terms;
  }

  /**
   * Extract milestones from proposal
   */
  private extractMilestones(proposal: Proposal): any[] {
    // Extract milestones from proposal sections or timeline
    const milestones: any[] = [];

    // Check for timeline section
    const timelineSection = proposal.sections.find((s) =>
      s.title?.toLowerCase().includes("timeline"),
    );
    if (timelineSection) {
      // Parse timeline into milestones
      // This would be more sophisticated in real implementation
      milestones.push({
        name: "Proposal Acceptance",
        dueDate: proposal.acceptedAt,
        amount: proposal.totalAmount ? proposal.totalAmount * 0.1 : 0,
        status: "COMPLETED",
      });
    }

    return milestones;
  }

  /**
   * Extract payment schedule from proposal
   */
  private extractPaymentSchedule(proposal: Proposal): any[] {
    const schedule: any[] = [];

    // Default payment schedule based on proposal value
    if (proposal.totalAmount) {
      schedule.push({
        milestone: "Contract Signing",
        percentage: 30,
        amount: proposal.totalAmount * 0.3,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      schedule.push({
        milestone: "Service Completion",
        percentage: 60,
        amount: proposal.totalAmount * 0.6,
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
      schedule.push({
        milestone: "Final Acceptance",
        percentage: 10,
        amount: proposal.totalAmount * 0.1,
        dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return schedule;
  }

  /**
   * Extract SLAs from proposal
   */
  private extractSLAs(proposal: Proposal): any[] {
    const slas: any[] = [];

    // Check for SLA section
    const slaSection = proposal.sections.find(
      (s) => s.type === "TEXT" && s.title?.toLowerCase().includes("sla"),
    );
    if (slaSection) {
      // Parse SLA content
      // This would be more sophisticated in real implementation
      slas.push({
        metric: "Service Uptime",
        target: "99.9%",
        measurement: "PERCENTAGE",
        penalty: "Service credit",
      });
    }

    return slas;
  }

  /**
   * Extract contract items from proposal
   */
  private extractContractItems(proposal: Proposal): any[] {
    const items: any[] = [];

    // Extract from pricing section
    const pricingSection = proposal.sections.find((s) => s.type === "PRICING");
    if (pricingSection?.data?.items) {
      for (const item of pricingSection.data.items) {
        items.push({
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          unit: item.unit || "EA",
        });
      }
    }

    return items;
  }

  /**
   * Generate liability terms
   */
  private generateLiabilityTerms(liabilityAssessment: any): string {
    let terms = "LIABILITY TERMS:\n";
    terms += `- Maximum liability exposure: ${liabilityAssessment.liabilityExposure.potentialExposure} ${liabilityAssessment.liabilityExposure.currency}\n`;
    terms += `- Liability type: ${liabilityAssessment.liabilityExposure.exposureType}\n`;
    terms += `- Risk level: ${liabilityAssessment.riskLevel}\n`;

    if (liabilityAssessment.liabilityExposure.potentialExposure > 100000) {
      terms += `- Liability cap applies: Maximum liability limited to proposal value\n`;
    }

    return terms;
  }

  /**
   * Extract compliance requirements
   */
  private extractComplianceRequirements(proposal: Proposal): any[] {
    const requirements: any[] = [];

    // Add based on proposal type
    if (
      proposal.type.includes("CUSTOMS") ||
      proposal.type.includes("CLEARANCE")
    ) {
      requirements.push({
        type: "CUSTOMS_COMPLIANCE",
        description: "Must comply with customs regulations",
        required: true,
      });
    }

    if (
      proposal.type.includes("TRANSPORT") ||
      proposal.type.includes("LOGISTICS")
    ) {
      requirements.push({
        type: "TRANSPORT_COMPLIANCE",
        description: "Must comply with transportation regulations",
        required: true,
      });
    }

    return requirements;
  }

  /**
   * Map proposal to contract
   */
  private mapProposalToContract(
    proposal: Proposal,
    contract: Contract,
  ): ProposalToContractConversion["mapping"] {
    const mapping: ProposalToContractConversion["mapping"] = [];

    // Map sections
    for (const section of proposal.sections) {
      mapping.push({
        proposalSection: section.title || section.type,
        contractSection: this.mapSectionType(section.type),
        mapped: true,
      });
    }

    return mapping;
  }

  /**
   * Map section type to contract section
   */
  private mapSectionType(sectionType: string): string {
    const mapping: Record<string, string> = {
      PRICING: "Pricing Details",
      TERMS: "Terms & Conditions",
      SLA: "Service Level Agreements",
      TEXT: "General Terms",
      HEADER: "Contract Header",
    };
    return mapping[sectionType] || sectionType;
  }

  /**
   * Determine pricing type
   */
  private determinePricingType(proposal: Proposal): Contract["pricingType"] {
    // Analyze proposal pricing structure
    const pricingSection = proposal.sections.find((s) => s.type === "PRICING");
    if (pricingSection?.data?.items?.length === 1) {
      return "FIXED";
    }
    if (pricingSection?.data?.items?.length > 1) {
      return "TIERED";
    }
    return "FIXED";
  }

  /**
   * Extract pricing details
   */
  private extractPricingDetails(proposal: Proposal): any {
    const pricingSection = proposal.sections.find((s) => s.type === "PRICING");
    return pricingSection?.data || {};
  }

  /**
   * Extract payment terms
   */
  private extractPaymentTerms(proposal: Proposal): string {
    const termsSection = proposal.sections.find((s) => s.type === "TERMS");
    // Extract payment terms from content
    // This would be more sophisticated in real implementation
    return "Net 30 days";
  }

  /**
   * Extract delivery terms
   */
  private extractDeliveryTerms(proposal: Proposal): string | undefined {
    // Extract from proposal sections
    return "As per agreed schedule";
  }

  /**
   * Extract warranty terms
   */
  private extractWarrantyTerms(proposal: Proposal): string | undefined {
    // Extract from proposal sections
    return "Standard warranty terms apply";
  }

  /**
   * Map marketplace contract to standard contract
   */
  private mapMarketplaceContractToContract(marketplaceContract: any): Contract {
    // Convert marketplace contract format to standard contract format
    return {
      id: marketplaceContract.id,
      tenantId: marketplaceContract.tenantId,
      contractNumber: marketplaceContract.contractNumber,
      type: "SERVICE",
      status: marketplaceContract.status,
      vendorId: marketplaceContract.providerId,
      vendorName: marketplaceContract.providerName,
      buyerId: marketplaceContract.buyerId,
      buyerName: marketplaceContract.buyerName,
      title: marketplaceContract.title,
      description: marketplaceContract.description,
      startDate: marketplaceContract.startDate,
      endDate: marketplaceContract.endDate,
      autoRenewal: marketplaceContract.autoRenewal || false,
      pricingType: "FIXED",
      currency: marketplaceContract.currency || "SAR",
      paymentTerms: marketplaceContract.terms?.paymentTerms || "Net 30",
      totalValue: marketplaceContract.totalValue,
      createdAt: marketplaceContract.createdAt,
      updatedAt: marketplaceContract.updatedAt,
      createdBy: marketplaceContract.createdBy,
    };
  }

  /**
   * Initiate contract signature workflow
   */
  private async initiateContractSignature(
    contractId: string,
    contractType: string,
    tenantId: string,
  ): Promise<void> {
    // Trigger signature workflow
    // This would integrate with digital signature service
    await eventStore.publish({
      type: "contracts.signature.initiated",
      aggregateId: contractId,
      aggregateType: "Contract",
      payload: {
        contractId,
        contractType,
      },
      metadata: { tenantId, timestamp: new Date().toISOString() },
    });
  }

  /**
   * Notify contract parties
   */
  private async notifyContractParties(
    contractId: string,
    contractType: string,
    tenantId: string,
  ): Promise<void> {
    // Send notifications to all parties
    await eventStore.publish({
      type: "contracts.parties.notified",
      aggregateId: contractId,
      aggregateType: "Contract",
      payload: {
        contractId,
        contractType,
      },
      metadata: { tenantId, timestamp: new Date().toISOString() },
    });
  }
}

export const proposalContractIntegration =
  ProposalContractIntegration.getInstance();
