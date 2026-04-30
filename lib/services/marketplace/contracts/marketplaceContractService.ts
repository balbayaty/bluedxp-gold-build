/**
 * Marketplace Contract Service
 * Manages service agreements and contracts for marketplace bookings
 * Integrates with digital signature service for e-signatures
 */

import type {
  MarketplaceContract,
  ContractCreationRequest,
  ContractUpdateRequest,
  ContractTemplate,
  ServiceLevelAgreement,
  Milestone,
  PaymentSchedule,
} from "@/types/marketplace-contracts";
import type { MarketplaceBooking } from "@/types/marketplace";
import { marketplaceService } from "../marketplaceService";
import {
  signatureService,
  workflowService,
} from "@/lib/services/digital-signature";
import { eventBus } from "@/lib/services/event-store";
import { marketplaceNotificationService } from "../marketplaceNotificationService";

// In-memory storage (replace with database)
const contracts: Map<string, MarketplaceContract> = new Map();
const templates: Map<string, ContractTemplate> = new Map();

export class MarketplaceContractService {
  /**
   * Create contract from booking
   */
  async createContract(
    bookingId: string,
    request: ContractCreationRequest,
  ): Promise<MarketplaceContract> {
    // Get booking details
    const booking = await marketplaceService.getBooking(bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    // Get listing details
    const listing = await marketplaceService.getListing(booking.serviceId);
    if (!listing) {
      throw new Error(`Listing not found: ${booking.serviceId}`);
    }

    // Get or create template
    let template: ContractTemplate | undefined;
    if (request.templateId) {
      template = templates.get(request.templateId);
    } else {
      template = await this.getDefaultTemplate(listing.category);
    }

    // Generate contract number
    const contractNumber = `MKT-CONTRACT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create contract
    const contract: MarketplaceContract = {
      id: `contract-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      bookingId,
      serviceId: booking.serviceId,
      providerId: booking.providerId,
      customerId: booking.customerId,
      contractNumber,
      title: `Service Agreement - ${listing.title}`,
      description: listing.description,
      type: "SERVICE_AGREEMENT",
      status: "DRAFT",
      startDate: booking.startDate || new Date().toISOString(),
      endDate:
        booking.endDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      providerName: listing.providerName,
      customerName: booking.customerName || "Customer",
      terms: {
        paymentTerms: request.terms?.paymentTerms || "NET_30",
        deliveryTerms: request.terms?.deliveryTerms,
        warrantyTerms: request.terms?.warrantyTerms,
        liabilityTerms: request.terms?.liabilityTerms,
        cancellationTerms:
          request.terms?.cancellationTerms ||
          "Standard cancellation policy applies",
        forceMajeure: request.terms?.forceMajeure,
        disputeResolution:
          request.terms?.disputeResolution ||
          "Arbitration in accordance with Saudi law",
        governingLaw: request.terms?.governingLaw || "Saudi Arabia",
        jurisdiction: request.terms?.jurisdiction || "Riyadh, Saudi Arabia",
      },
      serviceLevelAgreements: request.serviceLevelAgreements?.map((sla) => ({
        ...sla,
        id: `sla-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: "PENDING" as const,
      })),
      totalValue: booking.totalPrice || 0,
      currency: booking.currency || "SAR",
      paymentTerms: request.terms?.paymentTerms || "NET_30",
      paymentSchedule: request.paymentSchedule?.map((ps) => ({
        ...ps,
        id: `payment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: "PENDING" as const,
      })),
      scopeOfWork: listing.description || "Service delivery as per listing",
      deliverables: request.milestones?.flatMap((m) => m.deliverables || []),
      milestones: request.milestones?.map((m) => ({
        ...m,
        id: `milestone-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: "PENDING" as const,
      })),
      signatures: [
        {
          id: `sig-${Date.now()}-provider`,
          signerId: booking.providerId,
          signerName: listing.providerName,
          signerRole: "PROVIDER",
          signatureType: "ELECTRONIC",
          status: "PENDING",
        },
        {
          id: `sig-${Date.now()}-customer`,
          signerId: booking.customerId,
          signerName: booking.customerName || "Customer",
          signerRole: "CUSTOMER",
          signatureType: "ELECTRONIC",
          status: "PENDING",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    contracts.set(contract.id, contract);

    // Publish event
    await eventBus.publish("marketplace.contract.created", {
      contractId: contract.id,
      bookingId,
      providerId: booking.providerId,
      customerId: booking.customerId,
    });

    // Send notifications
    await marketplaceNotificationService.notifyContractCreated(
      contract.id,
      booking.providerId,
      booking.customerId,
    );

    return contract;
  }

  /**
   * Get contract by ID
   */
  async getContract(contractId: string): Promise<MarketplaceContract | null> {
    return contracts.get(contractId) || null;
  }

  /**
   * Get contracts by booking ID
   */
  async getContractsByBooking(
    bookingId: string,
  ): Promise<MarketplaceContract[]> {
    return Array.from(contracts.values()).filter(
      (c) => c.bookingId === bookingId,
    );
  }

  /**
   * Update contract
   */
  async updateContract(
    contractId: string,
    request: ContractUpdateRequest,
  ): Promise<MarketplaceContract> {
    const contract = contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    if (
      contract.status !== "DRAFT" &&
      contract.status !== "PENDING_SIGNATURE"
    ) {
      throw new Error(`Cannot update contract in status: ${contract.status}`);
    }

    const updated: MarketplaceContract = {
      ...contract,
      ...(request.terms && { terms: { ...contract.terms, ...request.terms } }),
      ...(request.serviceLevelAgreements && {
        serviceLevelAgreements: request.serviceLevelAgreements,
      }),
      ...(request.milestones && { milestones: request.milestones }),
      ...(request.notes !== undefined && { notes: request.notes }),
      ...(request.attachments && {
        attachments: [
          ...(contract.attachments || []),
          ...request.attachments.map((att) => ({
            ...att,
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            uploadedAt: new Date().toISOString(),
            uploadedBy: request.userId || "system",
          })),
        ],
      }),
      updatedAt: new Date().toISOString(),
    };

    contracts.set(contractId, updated);

    // Publish event
    await eventBus.publish("marketplace.contract.updated", {
      contractId,
      changes: Object.keys(request),
    });

    return updated;
  }

  /**
   * Initiate signature workflow
   */
  async initiateSignature(contractId: string): Promise<MarketplaceContract> {
    const contract = contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    if (contract.status !== "DRAFT") {
      throw new Error(
        `Cannot initiate signature for contract in status: ${contract.status}`,
      );
    }

    // Create signature workflow using digital signature service
    const workflow = await workflowService.createWorkflow({
      workflowName: `Contract ${contract.contractNumber}`,
      workflowType: "contract",
      documentId: contractId,
      signers: contract.signatures.map((sig) => ({
        userId: sig.signerId,
        email: sig.signerEmail || `${sig.signerId}@example.com`,
        name: sig.signerName,
        signerType: sig.signerRole === "PROVIDER" ? "provider" : "customer",
        signingOrder: sig.signerRole === "PROVIDER" ? 1 : 2,
        roleInDocument: sig.signerRole.toLowerCase(),
        signatureTypeRequired:
          sig.signatureType === "QUALIFIED_ELECTRONIC"
            ? "qualified_electronic"
            : "any",
      })),
    });

    const updated: MarketplaceContract = {
      ...contract,
      status: "PENDING_SIGNATURE",
      signatureWorkflowId: workflow.id,
      updatedAt: new Date().toISOString(),
    };

    contracts.set(contractId, updated);

    // Publish event
    await eventBus.publish("marketplace.contract.signature.initiated", {
      contractId,
      workflowId: workflow.id,
    });

    // Send notifications
    await marketplaceNotificationService.notifyContractSignatureRequested(
      contractId,
      contract.providerId,
      contract.customerId,
    );

    return updated;
  }

  /**
   * Record signature
   */
  async recordSignature(
    contractId: string,
    signatureId: string,
    signerId: string,
  ): Promise<MarketplaceContract> {
    const contract = contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    const signature = contract.signatures.find(
      (s) => s.id === signatureId && s.signerId === signerId,
    );
    if (!signature) {
      throw new Error(`Signature not found: ${signatureId}`);
    }

    // Update signature
    signature.status = "SIGNED";
    signature.signedAt = new Date().toISOString();
    signature.signatureId = signatureId;

    // Check if all signatures are complete
    const allSigned = contract.signatures.every((s) => s.status === "SIGNED");

    const updated: MarketplaceContract = {
      ...contract,
      signatures: contract.signatures.map((s) =>
        s.id === signatureId ? signature : s,
      ),
      status: allSigned ? "SIGNED" : contract.status,
      signedAt: allSigned
        ? [...(contract.signedAt || []), new Date().toISOString()]
        : contract.signedAt,
      updatedAt: new Date().toISOString(),
    };

    if (allSigned) {
      updated.status = "ACTIVE";
    }

    contracts.set(contractId, updated);

    // Publish event
    await eventBus.publish("marketplace.contract.signed", {
      contractId,
      signatureId,
      signerId,
      allSigned,
    });

    // Send notifications
    if (allSigned) {
      await marketplaceNotificationService.notifyContractActivated(
        contractId,
        contract.providerId,
        contract.customerId,
      );
    } else {
      await marketplaceNotificationService.notifyContractSignatureReceived(
        contractId,
        signerId,
      );
    }

    return updated;
  }

  /**
   * Update SLA performance
   */
  async updateSLAPerformance(
    contractId: string,
    slaId: string,
    currentPerformance: number,
  ): Promise<MarketplaceContract> {
    const contract = contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    if (!contract.serviceLevelAgreements) {
      throw new Error(`No SLAs defined for contract: ${contractId}`);
    }

    const sla = contract.serviceLevelAgreements.find((s) => s.id === slaId);
    if (!sla) {
      throw new Error(`SLA not found: ${slaId}`);
    }

    sla.currentPerformance = currentPerformance;
    sla.status = currentPerformance >= sla.target ? "MET" : "BELOW_TARGET";

    const updated: MarketplaceContract = {
      ...contract,
      serviceLevelAgreements: contract.serviceLevelAgreements.map((s) =>
        s.id === slaId ? sla : s,
      ),
      updatedAt: new Date().toISOString(),
    };

    contracts.set(contractId, updated);

    // Publish event
    await eventBus.publish("marketplace.contract.sla.updated", {
      contractId,
      slaId,
      currentPerformance,
      status: sla.status,
    });

    return updated;
  }

  /**
   * Get default template for category
   */
  async getDefaultTemplate(
    category: string,
  ): Promise<ContractTemplate | undefined> {
    return Array.from(templates.values()).find(
      (t) => t.category === category && t.isDefault,
    );
  }

  /**
   * Create contract template
   */
  async createTemplate(
    template: Omit<ContractTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<ContractTemplate> {
    const newTemplate: ContractTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    templates.set(newTemplate.id, newTemplate);

    return newTemplate;
  }

  /**
   * Get all templates
   */
  async getTemplates(category?: string): Promise<ContractTemplate[]> {
    const allTemplates = Array.from(templates.values());
    return category
      ? allTemplates.filter((t) => t.category === category)
      : allTemplates;
  }
}

export const marketplaceContractService = new MarketplaceContractService();
