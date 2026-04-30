/**
 * Contract Service
 * Comprehensive contract management - creation, negotiation, execution, compliance
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type {
  Contract,
  ContractCreateInput,
  ContractFilter,
  ContractAmendment,
} from "@/types/contract";
import type { ContractStatus, ContractType } from "@/types/procurement";

// In-memory storage
const contracts = new Map<string, Contract>();
const amendments = new Map<string, ContractAmendment>();

// Contract number generator
let contractCounter = 1;

function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const number = String(contractCounter++).padStart(6, "0");
  return `CNT-${year}-${number}`;
}

export class ContractService {
  /**
   * Create contract
   */
  async createContract(
    input: ContractCreateInput,
    userId: string,
  ): Promise<Contract> {
    const contractNumber = generateContractNumber();
    const contractId = `contract-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const contract: Contract = {
      id: contractId,
      tenantId: input.tenantId,
      contractNumber,
      type: input.type,
      status: "DRAFT",
      vendorId: input.vendorId,
      vendorName: "", // Will be fetched from vendor service
      buyerId: input.tenantId, // TODO: Get actual buyer ID
      buyerName: "", // TODO: Get actual buyer name
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      autoRenewal: input.autoRenewal || false,
      pricingType: input.pricingType,
      pricingDetails: input.pricingDetails,
      currency: input.currency,
      paymentTerms: input.paymentTerms,
      deliveryTerms: input.deliveryTerms,
      warrantyTerms: input.warrantyTerms,
      items: input.items?.map((item, index) => ({
        id: `item-${contractId}-${index + 1}`,
        contractId,
        ...item,
      })),
      totalValue: input.totalValue,
      quantityLimit: input.quantityLimit,
      amountLimit: input.amountLimit,
      projectId: input.projectId,
      serviceLevelAgreements: input.serviceLevelAgreements?.map(
        (sla, index) => ({
          id: `sla-${contractId}-${index + 1}`,
          contractId,
          ...sla,
        }),
      ),
      complianceRequirements: input.complianceRequirements?.map(
        (req, index) => ({
          id: `req-${contractId}-${index + 1}`,
          contractId,
          ...req,
        }),
      ),
      tags: input.tags || [],
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };

    contracts.set(contractId, contract);

    // Publish event
    await eventBus.publish({
      type: "procurement.contract.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        contractId,
        contractNumber,
        tenantId: input.tenantId,
        vendorId: input.vendorId,
        type: input.type,
        totalValue: input.totalValue,
        currency: input.currency,
      },
    } as DomainEvent);

    return contract;
  }

  /**
   * Approve contract
   */
  async approveContract(
    contractId: string,
    tenantId: string,
    approverId: string,
  ): Promise<Contract> {
    const contract = contracts.get(contractId);
    if (!contract || contract.tenantId !== tenantId) {
      throw new Error("Contract not found");
    }

    if (contract.status !== "DRAFT" && contract.status !== "NEGOTIATION") {
      throw new Error("Contract is not in draft or negotiation status");
    }

    contract.status = "APPROVED";
    contract.approvedBy = approverId;
    contract.approvedAt = new Date().toISOString();
    contract.updatedAt = new Date().toISOString();

    contracts.set(contractId, contract);

    // Publish event
    await eventBus.publish({
      type: "procurement.contract.approved",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        contractId,
        contractNumber: contract.contractNumber,
        tenantId,
        approverId,
      },
    } as DomainEvent);

    return contract;
  }

  /**
   * Activate contract (after signing)
   */
  async activateContract(
    contractId: string,
    tenantId: string,
    signedBy: string[],
  ): Promise<Contract> {
    const contract = contracts.get(contractId);
    if (!contract || contract.tenantId !== tenantId) {
      throw new Error("Contract not found");
    }

    if (contract.status !== "APPROVED") {
      throw new Error("Contract must be approved before activation");
    }

    contract.status = "ACTIVE";
    contract.signedBy = signedBy;
    contract.signedAt = [new Date().toISOString()];
    contract.updatedAt = new Date().toISOString();

    contracts.set(contractId, contract);

    // Publish event
    await eventBus.publish({
      type: "procurement.contract.activated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        contractId,
        contractNumber: contract.contractNumber,
        tenantId,
        signedBy,
      },
    } as DomainEvent);

    return contract;
  }

  /**
   * Create contract amendment
   */
  async createAmendment(
    contractId: string,
    tenantId: string,
    amendmentType: ContractAmendment["amendmentType"],
    description: string,
    effectiveDate: Date | string,
    originalValue?: number,
    amendedValue?: number,
    userId: string = "system",
  ): Promise<ContractAmendment> {
    const contract = contracts.get(contractId);
    if (!contract || contract.tenantId !== tenantId) {
      throw new Error("Contract not found");
    }

    if (contract.status !== "ACTIVE") {
      throw new Error("Contract must be active to create amendment");
    }

    const amendmentNumber = `AM-${contract.contractNumber}-${amendments.size + 1}`;
    const amendmentId = `amendment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const netChange =
      originalValue && amendedValue ? amendedValue - originalValue : 0;

    const amendment: ContractAmendment = {
      id: amendmentId,
      contractId,
      amendmentNumber,
      amendmentType,
      description,
      effectiveDate,
      originalValue,
      amendedValue,
      netChange,
      currency: contract.currency,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    amendments.set(amendmentId, amendment);

    // Publish event
    await eventBus.publish({
      type: "procurement.contract.amendment.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        amendmentId,
        amendmentNumber,
        contractId,
        tenantId,
        amendmentType,
        netChange,
        currency: contract.currency,
      },
    } as DomainEvent);

    return amendment;
  }

  /**
   * Get contract by ID
   */
  async getContract(
    contractId: string,
    tenantId: string,
  ): Promise<Contract | null> {
    const contract = contracts.get(contractId);
    if (!contract || contract.tenantId !== tenantId) {
      return null;
    }
    return contract;
  }

  /**
   * List contracts with filters
   */
  async listContracts(filter: ContractFilter): Promise<Contract[]> {
    let results = Array.from(contracts.values()).filter(
      (c) => c.tenantId === filter.tenantId,
    );

    // Apply filters
    if (filter.status && filter.status.length > 0) {
      results = results.filter((c) => filter.status!.includes(c.status));
    }

    if (filter.type && filter.type.length > 0) {
      results = results.filter((c) => filter.type!.includes(c.type));
    }

    if (filter.vendorId) {
      results = results.filter((c) => c.vendorId === filter.vendorId);
    }

    if (filter.projectId) {
      results = results.filter((c) => c.projectId === filter.projectId);
    }

    if (filter.startDateFrom) {
      const fromDate = new Date(filter.startDateFrom);
      results = results.filter((c) => new Date(c.startDate) >= fromDate);
    }

    if (filter.startDateTo) {
      const toDate = new Date(filter.startDateTo);
      results = results.filter((c) => new Date(c.startDate) <= toDate);
    }

    if (filter.endDateFrom) {
      const fromDate = new Date(filter.endDateFrom);
      results = results.filter(
        (c) => c.endDate && new Date(c.endDate) >= fromDate,
      );
    }

    if (filter.endDateTo) {
      const toDate = new Date(filter.endDateTo);
      results = results.filter(
        (c) => c.endDate && new Date(c.endDate) <= toDate,
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.contractNumber.toLowerCase().includes(searchLower) ||
          c.title.toLowerCase().includes(searchLower) ||
          c.vendorName.toLowerCase().includes(searchLower),
      );
    }

    // Sort by created date (newest first)
    results.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return results;
  }

  /**
   * Renew contract
   */
  async renewContract(
    contractId: string,
    tenantId: string,
    newEndDate: Date | string,
    userId: string,
  ): Promise<Contract> {
    const contract = contracts.get(contractId);
    if (!contract || contract.tenantId !== tenantId) {
      throw new Error("Contract not found");
    }

    if (contract.status !== "ACTIVE" && contract.status !== "EXPIRED") {
      throw new Error("Contract must be active or expired to renew");
    }

    contract.status = "RENEWED";
    contract.endDate = newEndDate;
    contract.renewalDate = new Date().toISOString();
    contract.updatedAt = new Date().toISOString();
    contract.updatedBy = userId;

    contracts.set(contractId, contract);

    // Publish event
    await eventBus.publish({
      type: "procurement.contract.renewed",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        contractId,
        contractNumber: contract.contractNumber,
        tenantId,
        newEndDate,
      },
    } as DomainEvent);

    return contract;
  }

  /**
   * Terminate contract
   */
  async terminateContract(
    contractId: string,
    tenantId: string,
    terminationReason: string,
    userId: string,
  ): Promise<Contract> {
    const contract = contracts.get(contractId);
    if (!contract || contract.tenantId !== tenantId) {
      throw new Error("Contract not found");
    }

    contract.status = "TERMINATED";
    contract.terminationReason = terminationReason;
    contract.terminatedAt = new Date().toISOString();
    contract.updatedAt = new Date().toISOString();
    contract.updatedBy = userId;

    contracts.set(contractId, contract);

    // Publish event
    await eventBus.publish({
      type: "procurement.contract.terminated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        contractId,
        contractNumber: contract.contractNumber,
        tenantId,
        terminationReason,
      },
    } as DomainEvent);

    return contract;
  }
}

// Singleton instance
export const contractService = new ContractService();
