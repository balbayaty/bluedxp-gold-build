/**
 * Proposal Evidence Integration Service
 * Deep integration with Evidence Ledger for immutable proposal tracking
 * Ensures full audit trail, chain of custody, and integrity verification
 *
 * VISION 2040 ALIGNED: Quantum-safe evidence, blockchain-ready, compliance-backed
 */

import { evidenceService } from "@/lib/services/evidence";
import { eventStore } from "@/lib/services/event-store";
import type { Proposal } from "@/types/proposals";
import type { Evidence } from "@/types/evidence";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalEvidence {
  proposalId: string;
  evidenceId: string;
  evidenceType:
    | "PROPOSAL_CREATED"
    | "PROPOSAL_UPDATED"
    | "PROPOSAL_APPROVED"
    | "PROPOSAL_SENT"
    | "PROPOSAL_ACCEPTED"
    | "PROPOSAL_REJECTED"
    | "PROPOSAL_SIGNED"
    | "PROPOSAL_CONVERTED_TO_CONTRACT";
  timestamp: Date | string;
  metadata: {
    version?: number;
    changes?: Record<string, any>;
    approverId?: string;
    recipientEmail?: string;
    contractId?: string;
  };
}

export interface ProposalLineage {
  proposalId: string;
  evidenceChain: Evidence[];
  integrity: {
    valid: boolean;
    hash: string;
    verifiedAt: Date | string;
  };
  chainOfCustody: Array<{
    from: string;
    to: string;
    timestamp: Date | string;
    reason: string;
  }>;
}

// ============================================================================
// PROPOSAL EVIDENCE INTEGRATION SERVICE
// ============================================================================

class ProposalEvidenceIntegration {
  private static instance: ProposalEvidenceIntegration;

  static getInstance(): ProposalEvidenceIntegration {
    if (!ProposalEvidenceIntegration.instance) {
      ProposalEvidenceIntegration.instance = new ProposalEvidenceIntegration();
    }
    return ProposalEvidenceIntegration.instance;
  }

  /**
   * Record proposal creation as evidence
   */
  async recordProposalCreation(
    proposal: Proposal,
    createdBy: string,
    tenantId: string,
  ): Promise<string> {
    const evidenceContent = {
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      title: proposal.title,
      type: proposal.type,
      customerId: proposal.customerId,
      customerName: proposal.customerName,
      totalAmount: proposal.totalAmount,
      currency: proposal.currency,
      sections: proposal.sections.length,
      createdBy,
      createdAt: proposal.createdAt,
    };

    const evidence = await evidenceService.create({
      type: "proposal",
      source: "proposals-rfq",
      sourceId: proposal.id,
      entityId: proposal.id,
      entityType: "Proposal",
      tenantId,
      title: `Proposal Created: ${proposal.proposalNumber}`,
      description: `Proposal "${proposal.title}" was created`,
      content: JSON.stringify(evidenceContent),
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        action: "CREATED",
        createdBy,
      },
      tags: ["proposal", "creation", proposal.type.toLowerCase()],
      verified: true,
      confidence: 100,
    });

    // Publish event
    await eventStore.publish({
      type: "proposals.evidence.recorded",
      aggregateId: proposal.id,
      aggregateType: "Proposal",
      payload: {
        evidenceId: evidence.id,
        evidenceType: "PROPOSAL_CREATED",
        proposalId: proposal.id,
      },
      metadata: {
        tenantId,
        userId: createdBy,
        timestamp: new Date().toISOString(),
      },
    });

    return evidence.id;
  }

  /**
   * Record proposal update as evidence
   */
  async recordProposalUpdate(
    proposal: Proposal,
    previousVersion: Proposal,
    updatedBy: string,
    tenantId: string,
    changes: Record<string, any>,
  ): Promise<string> {
    const evidenceContent = {
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      version: proposal.version,
      changes,
      previousVersion: previousVersion.version,
      updatedBy,
      updatedAt: proposal.updatedAt,
    };

    const evidence = await evidenceService.create({
      type: "proposal",
      source: "proposals-rfq",
      sourceId: proposal.id,
      entityId: proposal.id,
      entityType: "Proposal",
      tenantId,
      title: `Proposal Updated: ${proposal.proposalNumber} (v${proposal.version})`,
      description: `Proposal "${proposal.title}" was updated`,
      content: JSON.stringify(evidenceContent),
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        action: "UPDATED",
        version: proposal.version,
        previousVersion: previousVersion.version,
        updatedBy,
        changes,
      },
      tags: ["proposal", "update", proposal.type.toLowerCase()],
      verified: true,
      confidence: 100,
    });

    // Create derived evidence from previous version
    const previousEvidence = await this.getLatestEvidence(
      proposal.id,
      tenantId,
    );
    if (previousEvidence) {
      await evidenceService.createDerived(
        previousEvidence.id,
        {
          type: "version_update",
          notes: `Proposal updated from v${previousVersion.version} to v${proposal.version}`,
        },
        {
          type: "proposal",
          source: "proposals-rfq",
          sourceId: proposal.id,
          entityId: proposal.id,
          entityType: "Proposal",
          tenantId,
          title: `Proposal Version ${proposal.version}`,
          description: `Version ${proposal.version} of proposal`,
          content: JSON.stringify(evidenceContent),
          metadata: {
            proposalId: proposal.id,
            version: proposal.version,
          },
        },
      );
    }

    return evidence.id;
  }

  /**
   * Record proposal approval as evidence
   */
  async recordProposalApproval(
    proposal: Proposal,
    approverId: string,
    approvalStep: number,
    tenantId: string,
  ): Promise<string> {
    const evidenceContent = {
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      status: proposal.status,
      approverId,
      approvalStep,
      approvedAt: new Date().toISOString(),
    };

    const evidence = await evidenceService.create({
      type: "approval",
      source: "proposals-rfq",
      sourceId: proposal.id,
      entityId: proposal.id,
      entityType: "Proposal",
      tenantId,
      title: `Proposal Approved: ${proposal.proposalNumber}`,
      description: `Proposal "${proposal.title}" was approved by step ${approvalStep}`,
      content: JSON.stringify(evidenceContent),
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        action: "APPROVED",
        approverId,
        approvalStep,
      },
      tags: ["proposal", "approval", proposal.type.toLowerCase()],
      verified: true,
      confidence: 100,
    });

    return evidence.id;
  }

  /**
   * Record proposal sent as evidence
   */
  async recordProposalSent(
    proposal: Proposal,
    recipientEmail: string,
    sentBy: string,
    tenantId: string,
  ): Promise<string> {
    const evidenceContent = {
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      recipientEmail,
      sentBy,
      sentAt: proposal.sentAt || new Date().toISOString(),
      trackingEnabled: proposal.trackingEnabled,
    };

    const evidence = await evidenceService.create({
      type: "communication",
      source: "proposals-rfq",
      sourceId: proposal.id,
      entityId: proposal.id,
      entityType: "Proposal",
      tenantId,
      title: `Proposal Sent: ${proposal.proposalNumber}`,
      description: `Proposal "${proposal.title}" was sent to ${recipientEmail}`,
      content: JSON.stringify(evidenceContent),
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        action: "SENT",
        recipientEmail,
        sentBy,
      },
      tags: ["proposal", "sent", "communication"],
      verified: true,
      confidence: 100,
    });

    return evidence.id;
  }

  /**
   * Record proposal acceptance as evidence
   */
  async recordProposalAcceptance(
    proposal: Proposal,
    acceptedBy: string,
    tenantId: string,
  ): Promise<string> {
    const evidenceContent = {
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      status: "ACCEPTED",
      acceptedBy,
      acceptedAt: proposal.acceptedAt || new Date().toISOString(),
      totalAmount: proposal.totalAmount,
      currency: proposal.currency,
    };

    const evidence = await evidenceService.create({
      type: "acceptance",
      source: "proposals-rfq",
      sourceId: proposal.id,
      entityId: proposal.id,
      entityType: "Proposal",
      tenantId,
      title: `Proposal Accepted: ${proposal.proposalNumber}`,
      description: `Proposal "${proposal.title}" was accepted`,
      content: JSON.stringify(evidenceContent),
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        action: "ACCEPTED",
        acceptedBy,
        totalAmount: proposal.totalAmount,
        currency: proposal.currency,
      },
      tags: ["proposal", "accepted", "contract-ready"],
      verified: true,
      confidence: 100,
    });

    return evidence.id;
  }

  /**
   * Record proposal conversion to contract as evidence
   */
  async recordProposalToContract(
    proposal: Proposal,
    contractId: string,
    convertedBy: string,
    tenantId: string,
  ): Promise<string> {
    const evidenceContent = {
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      contractId,
      convertedBy,
      convertedAt: new Date().toISOString(),
      totalAmount: proposal.totalAmount,
      currency: proposal.currency,
    };

    const evidence = await evidenceService.create({
      type: "conversion",
      source: "proposals-rfq",
      sourceId: proposal.id,
      entityId: proposal.id,
      entityType: "Proposal",
      tenantId,
      title: `Proposal Converted to Contract: ${proposal.proposalNumber}`,
      description: `Proposal "${proposal.title}" was converted to contract ${contractId}`,
      content: JSON.stringify(evidenceContent),
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        action: "CONVERTED_TO_CONTRACT",
        contractId,
        convertedBy,
      },
      tags: ["proposal", "contract", "conversion"],
      verified: true,
      confidence: 100,
    });

    return evidence.id;
  }

  /**
   * Get proposal evidence lineage
   */
  async getProposalLineage(
    proposalId: string,
    tenantId: string,
  ): Promise<ProposalLineage> {
    const evidence = await evidenceService.search({
      entityId: proposalId,
      tenantId,
      source: "proposals-rfq",
    });

    const evidenceChain = evidence.results || [];

    // Get integrity verification
    const integrityResults = await Promise.all(
      evidenceChain.map((ev) => evidenceService.verifyIntegrity(ev.id)),
    );

    const allValid = integrityResults.every((result) => result.valid);
    const latestEvidence = evidenceChain[evidenceChain.length - 1];

    // Get chain of custody
    const custodyChain: ProposalLineage["chainOfCustody"] = [];
    for (const ev of evidenceChain) {
      const changelog = await evidenceService.getChangelog(ev.id);
      for (const entry of changelog) {
        if (entry.type === "CUSTODY_TRANSFER") {
          custodyChain.push({
            from: entry.from || "unknown",
            to: entry.to || "unknown",
            timestamp: entry.timestamp,
            reason: entry.reason || "Custody transfer",
          });
        }
      }
    }

    return {
      proposalId,
      evidenceChain,
      integrity: {
        valid: allValid,
        hash: latestEvidence?.hash || "",
        verifiedAt: new Date().toISOString(),
      },
      chainOfCustody: custodyChain,
    };
  }

  /**
   * Verify proposal integrity
   */
  async verifyProposalIntegrity(
    proposalId: string,
    tenantId: string,
  ): Promise<{ valid: boolean; issues: string[]; evidenceCount: number }> {
    const evidence = await evidenceService.search({
      entityId: proposalId,
      tenantId,
      source: "proposals-rfq",
    });

    const evidenceChain = evidence.results || [];
    const issues: string[] = [];

    // Verify each piece of evidence
    for (const ev of evidenceChain) {
      const verification = await evidenceService.verifyIntegrity(ev.id);
      if (!verification.valid) {
        issues.push(
          `Evidence ${ev.id} integrity check failed: ${verification.issues.join(", ")}`,
        );
      }
    }

    // Check for gaps in evidence chain
    if (evidenceChain.length === 0) {
      issues.push("No evidence found for proposal");
    }

    // Check for missing critical events
    const eventTypes = evidenceChain.map((ev) => ev.metadata?.action);
    const requiredEvents = ["CREATED", "APPROVED", "SENT"];
    for (const required of requiredEvents) {
      if (!eventTypes.includes(required)) {
        issues.push(`Missing evidence for ${required} event`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      evidenceCount: evidenceChain.length,
    };
  }

  /**
   * Get latest evidence for proposal
   */
  private async getLatestEvidence(
    proposalId: string,
    tenantId: string,
  ): Promise<Evidence | null> {
    const evidence = await evidenceService.search({
      entityId: proposalId,
      tenantId,
      source: "proposals-rfq",
      limit: 1,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    return evidence.results?.[0] || null;
  }

  /**
   * Create evidence packet for proposal (court-ready)
   */
  async createProposalEvidencePacket(
    proposalId: string,
    tenantId: string,
    packetType: "FULL" | "SUMMARY" | "COMPLIANCE" = "FULL",
  ): Promise<string> {
    const lineage = await this.getProposalLineage(proposalId, tenantId);

    const packetContent = {
      proposalId,
      packetType,
      generatedAt: new Date().toISOString(),
      evidenceChain: lineage.evidenceChain.map((ev) => ({
        id: ev.id,
        type: ev.type,
        title: ev.title,
        timestamp: ev.timestamp,
        metadata: ev.metadata,
      })),
      integrity: lineage.integrity,
      chainOfCustody: lineage.chainOfCustody,
    };

    // Use evidence packet service to create court-ready packet
    const { evidencePacketService } =
      await import("@/lib/services/evidence/packet-service");
    const packet = await evidencePacketService.createPacket({
      name: `Proposal Evidence Packet: ${proposalId}`,
      description: `Complete evidence packet for proposal ${proposalId}`,
      evidenceIds: lineage.evidenceChain.map((ev) => ev.id),
      packetType:
        packetType === "FULL"
          ? "COMPLETE"
          : packetType === "SUMMARY"
            ? "SUMMARY"
            : "COMPLIANCE",
      tenantId,
    });

    return packet.id;
  }
}

export const proposalEvidenceIntegration =
  ProposalEvidenceIntegration.getInstance();
