/**
 * Proposals Service - Unified Export
 * Re-exports all proposal-related services for easy access
 */

// Core Services
export { rfiService } from "./RFIService";
export { rfiAutomationService } from "./rfiAutomationService";

// Database Adapters
export { getServiceCatalogDatabaseAdapter } from "./database/serviceCatalogDatabaseAdapter";
export { UniversalProposalDatabaseAdapter } from "./database/universalProposalDatabaseAdapter";

// Integration Services
export { proposalComplianceIntegration } from "./proposalComplianceIntegration";
export { proposalLiabilityIntegration } from "./proposalLiabilityIntegration";
export { proposalContractIntegration } from "./proposalContractIntegration";
export { proposalEvidenceIntegration } from "./proposalEvidenceIntegration";

// Types
export type { RFI, RFIAnalysis } from "./RFIService";
export type {
  AutomationRule,
  AutomationCondition,
  AutomationAction,
} from "./rfiAutomationService";
export type {
  ProposalComplianceCheck,
  ProposalComplianceValidation,
} from "./proposalComplianceIntegration";
export type {
  ProposalLiabilityAssessment,
  ProposalInsuranceOptimization,
} from "./proposalLiabilityIntegration";
export type {
  ProposalToContractConversion,
  ContractGenerationConfig,
} from "./proposalContractIntegration";
export type {
  ProposalEvidence,
  ProposalLineage,
} from "./proposalEvidenceIntegration";

// Convenience wrapper for common operations
export const proposalsService = {
  /**
   * Create a new proposal from an RFI
   */
  async createProposal(rfiId: string, tenantId: string, userId: string) {
    const { rfiService } = await import("./RFIService");
    const { UniversalProposalDatabaseAdapter } =
      await import("./database/universalProposalDatabaseAdapter");

    const rfi = await rfiService.getRFI(rfiId, tenantId);
    if (!rfi) {
      throw new Error(`RFI not found: ${rfiId}`);
    }

    const adapter = new UniversalProposalDatabaseAdapter();
    const proposal = await adapter.createProposal({
      tenantId,
      title: rfi.title || `Proposal for ${rfi.customerName}`,
      customerId: rfi.customerId || "",
      customerName: rfi.customerName,
      status: "DRAFT",
      currency: "SAR",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      lineItems: [],
      terms: [],
      metadata: { sourceRfiId: rfiId },
      createdBy: userId,
    });

    return proposal;
  },

  /**
   * Get proposal with full details
   */
  async getProposal(proposalId: string, tenantId: string) {
    const { UniversalProposalDatabaseAdapter } =
      await import("./database/universalProposalDatabaseAdapter");
    const adapter = new UniversalProposalDatabaseAdapter();
    return adapter.getProposal(proposalId, tenantId);
  },

  /**
   * List proposals with filtering
   */
  async listProposals(tenantId: string, filters?: Record<string, any>) {
    const { UniversalProposalDatabaseAdapter } =
      await import("./database/universalProposalDatabaseAdapter");
    const adapter = new UniversalProposalDatabaseAdapter();
    return adapter.listProposals(tenantId, filters);
  },

  /**
   * Assess proposal compliance and liability
   */
  async assessProposal(proposalId: string, tenantId: string) {
    const { proposalComplianceIntegration } =
      await import("./proposalComplianceIntegration");
    const { proposalLiabilityIntegration } =
      await import("./proposalLiabilityIntegration");

    const [compliance, liability] = await Promise.all([
      proposalComplianceIntegration.validateProposalCompliance(
        proposalId,
        tenantId,
      ),
      proposalLiabilityIntegration.assessProposalLiability(
        proposalId,
        tenantId,
      ),
    ]);

    return { compliance, liability };
  },
};
