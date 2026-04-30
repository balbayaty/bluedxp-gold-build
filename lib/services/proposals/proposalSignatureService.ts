/**
 * Proposal E-Signature Integration Service
 * Integrates digital signature module with proposals
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalSignatureConfig {
  proposalId: string;
  signers: Array<{
    email: string;
    name: string;
    role: string;
    signingOrder: number;
    signatureType?:
      | "simple_electronic"
      | "advanced_electronic"
      | "qualified_electronic";
  }>;
  workflowType?: "sequential" | "parallel" | "any_order";
  expiryDays?: number;
  reminderFrequencyHours?: number;
  messageToSigners?: string;
}

export interface ProposalSignatureStatus {
  proposalId: string;
  workflowId?: string;
  documentId?: string;
  pdfShareUrl?: string;
  pdfReady?: boolean;
  status:
    | "NOT_INITIATED"
    | "PDF_READY"
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "EXPIRED"
    | "CANCELLED";
  signers: Array<{
    email: string;
    name: string;
    status: "pending" | "signed" | "declined";
    signedAt?: Date | string;
    signatureId?: string;
  }>;
  completedAt?: Date | string;
  initiatedAt?: Date | string;
  pdfPreparedAt?: Date | string;
}

// ============================================================================
// SIGNATURE SERVICE
// ============================================================================

class ProposalSignatureService {
  private signatures: Map<string, ProposalSignatureStatus> = new Map();
  private pdfShareTokens: Map<string, string> = new Map(); // proposalId -> shareToken

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    eventBus.subscribe(
      "digital-signature.workflow.completed",
      async (event: DomainEvent) => {
        await this.handleSignatureWorkflowCompleted(event);
      },
    );

    eventBus.subscribe(
      "digital-signature.signature.completed",
      async (event: DomainEvent) => {
        await this.handleSignatureCompleted(event);
      },
    );
  }

  /**
   * Prepare PDF for sharing - Export proposal as PDF and upload to Digital Signature Module
   */
  async preparePDFForSharing(
    proposalId: string,
    proposal: any,
    organizationId: string = "default",
    userId: string = "system",
  ): Promise<{
    documentId: string;
    shareUrl: string;
    status: ProposalSignatureStatus;
  }> {
    try {
      // Import services dynamically
      const { enhancedExportService } = await import("./enhancedExportService");
      const { documentService } =
        await import("@/lib/services/digital-signature/documentService");

      // Export proposal as PDF
      const exportResult = await enhancedExportService.export({
        proposal,
        format: "PDF",
        options: {
          includeCharts: true,
          includeInteractiveElements: false,
          branding: {
            companyName: "BlueDXP",
            primaryColor: "#3B82F6",
            secondaryColor: "#10B981",
            footerText: "Confidential - For Review Only",
          },
          pageNumbers: true,
          tableOfContents: true,
        },
      });

      if (!exportResult.success || !exportResult.blob) {
        throw new Error(
          exportResult.error || "Failed to export proposal as PDF",
        );
      }

      // Convert blob to Buffer
      const arrayBuffer = await exportResult.blob.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      // Upload PDF to Digital Signature Module
      const document = await documentService.uploadDocument(pdfBuffer, {
        organizationId,
        createdByUserId: userId,
        documentType: "proposal",
        title: `Proposal ${proposal.proposalNumber || proposalId}`,
        fileName: exportResult.fileName || `proposal-${proposalId}.pdf`,
        mimeType: "application/pdf",
      });

      // Generate share token
      const shareToken = `share-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      this.pdfShareTokens.set(proposalId, shareToken);

      // Create or update signature status
      const existingStatus = this.signatures.get(proposalId);
      const status: ProposalSignatureStatus = {
        proposalId,
        documentId: document.id,
        pdfShareUrl: `/client/proposals/${proposalId}/view?token=${shareToken}`,
        pdfReady: true,
        status: "PDF_READY",
        workflowId: existingStatus?.workflowId,
        signers: existingStatus?.signers || [],
        pdfPreparedAt: new Date().toISOString(),
        initiatedAt: existingStatus?.initiatedAt,
      };

      this.signatures.set(proposalId, status);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "proposals.pdf.prepared",
        aggregateId: proposalId,
        aggregateType: "PROPOSAL",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          proposalId,
          documentId: document.id,
          shareUrl: status.pdfShareUrl,
        },
      });

      return {
        documentId: document.id,
        shareUrl: status.pdfShareUrl,
        status,
      };
    } catch (error) {
      console.error("Error preparing PDF for sharing:", error);
      throw new Error(
        `Failed to prepare PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get PDF share URL for customer review
   */
  getPDFShareUrl(proposalId: string): string | null {
    const status = this.signatures.get(proposalId);
    return status?.pdfShareUrl || null;
  }

  /**
   * Verify PDF share token
   */
  verifyPDFShareToken(proposalId: string, token: string): boolean {
    const storedToken = this.pdfShareTokens.get(proposalId);
    return storedToken === token;
  }

  /**
   * Initiate signature workflow for proposal (uses prepared PDF document)
   */
  async initiateSignature(
    config: ProposalSignatureConfig,
  ): Promise<{ workflowId: string; status: ProposalSignatureStatus }> {
    try {
      // Import workflow service dynamically
      const { workflowService } =
        await import("@/lib/services/digital-signature/workflowService");

      // Get existing status to find documentId
      const existingStatus = this.signatures.get(config.proposalId);
      if (!existingStatus || !existingStatus.documentId) {
        throw new Error(
          "PDF must be prepared before initiating signatures. Please prepare PDF first.",
        );
      }

      const documentId = existingStatus.documentId;

      // Create signature workflow
      const workflow = await workflowService.createWorkflow({
        workflowName: `Proposal ${config.proposalId} Signature`,
        workflowType: config.workflowType || "sequential",
        documentId,
        signers: config.signers.map((s) => ({
          userId: s.email, // Would get actual user ID
          email: s.email,
          name: s.name,
          signerType: s.role === "customer" ? "customer" : "provider",
          signingOrder: s.signingOrder,
          roleInDocument: s.role,
          signatureTypeRequired: s.signatureType || "any",
        })),
        expiryDate: config.expiryDays
          ? new Date(Date.now() + config.expiryDays * 24 * 60 * 60 * 1000)
          : undefined,
        reminderFrequencyHours: config.reminderFrequencyHours || 24,
        messageToSigners: config.messageToSigners,
      });

      // Update signature status
      const status: ProposalSignatureStatus = {
        ...existingStatus,
        workflowId: workflow.id,
        status: "PENDING",
        signers: config.signers.map((s) => ({
          email: s.email,
          name: s.name,
          status: "pending",
        })),
        initiatedAt: new Date().toISOString(),
      };

      this.signatures.set(config.proposalId, status);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "proposals.signature.initiated",
        aggregateId: config.proposalId,
        aggregateType: "PROPOSAL",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          proposalId: config.proposalId,
          workflowId: workflow.id,
          documentId,
        },
      });

      return { workflowId: workflow.id, status };
    } catch (error) {
      console.error("Error initiating signature workflow:", error);
      throw error;
    }
  }

  /**
   * Get signature status
   */
  getSignatureStatus(proposalId: string): ProposalSignatureStatus | undefined {
    return this.signatures.get(proposalId);
  }

  /**
   * Cancel signature workflow
   */
  async cancelSignature(proposalId: string): Promise<void> {
    const status = this.signatures.get(proposalId);
    if (!status || !status.workflowId) return;

    try {
      const { workflowService } =
        await import("@/lib/services/digital-signature/workflowService");
      await workflowService.cancelWorkflow(status.workflowId);

      status.status = "CANCELLED";
      this.signatures.set(proposalId, status);

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "proposals.signature.cancelled",
        aggregateId: proposalId,
        aggregateType: "PROPOSAL",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: { proposalId },
      });
    } catch (error) {
      console.error("Error cancelling signature:", error);
      throw error;
    }
  }

  /**
   * Get signing URL for recipient
   */
  async getSigningUrl(
    proposalId: string,
    recipientEmail: string,
  ): Promise<string | null> {
    const status = this.signatures.get(proposalId);
    if (!status || !status.workflowId) return null;

    try {
      const { workflowService } =
        await import("@/lib/services/digital-signature/workflowService");
      const requests = workflowService.getRequestsByWorkflow(status.workflowId);
      const request = requests.find((r) => r.signerEmail === recipientEmail);

      if (!request || !request.accessToken) return null;

      // Generate signing URL
      return `/client/proposals/${proposalId}/sign?token=${request.accessToken}`;
    } catch (error) {
      console.error("Error getting signing URL:", error);
      return null;
    }
  }

  /**
   * Event handlers
   */
  private async handleSignatureWorkflowCompleted(
    event: DomainEvent,
  ): Promise<void> {
    const { workflowId, documentId } = event.payload || {};
    if (!workflowId) return;

    // Find proposal by workflow ID
    for (const [proposalId, status] of this.signatures.entries()) {
      if (status.workflowId === workflowId) {
        status.status = "COMPLETED";
        status.completedAt = new Date().toISOString();
        this.signatures.set(proposalId, status);

        // Update proposal status
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "proposals.proposal.signed",
          aggregateId: proposalId,
          aggregateType: "PROPOSAL",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: { proposalId, workflowId },
        });
        break;
      }
    }
  }

  private async handleSignatureCompleted(event: DomainEvent): Promise<void> {
    const { signatureRequestId, signerEmail } = event.payload || {};
    if (!signatureRequestId || !signerEmail) return;

    // Update signer status
    for (const [proposalId, status] of this.signatures.entries()) {
      const signer = status.signers.find((s) => s.email === signerEmail);
      if (signer) {
        signer.status = "signed";
        signer.signedAt = new Date().toISOString();
        this.signatures.set(proposalId, status);
        break;
      }
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalSignatureService = new ProposalSignatureService();
