/**
 * Requisition Service
 * Comprehensive requisition management with deep Finance integration
 * Budget checking, commitment tracking, approval workflows
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type {
  Requisition,
  RequisitionCreateInput,
  RequisitionUpdateInput,
  RequisitionFilter,
  RequisitionTemplate,
  ApprovalHistory,
} from "@/types/requisition";
import type { BudgetCheckResult, Commitment } from "@/types/procurement";

// In-memory storage (replace with database in production)
const requisitions = new Map<string, Requisition>();
const requisitionTemplates = new Map<string, RequisitionTemplate>();
const commitments = new Map<string, Commitment>();

// Requisition number generator
let requisitionCounter = 1;

function generateRequisitionNumber(): string {
  const year = new Date().getFullYear();
  const number = String(requisitionCounter++).padStart(6, "0");
  return `REQ-${year}-${number}`;
}

export class RequisitionService {
  /**
   * Create a new requisition
   * Includes budget checking and optional commitment creation
   */
  async createRequisition(
    input: RequisitionCreateInput,
    userId: string,
  ): Promise<Requisition> {
    // Calculate total amount
    const totalAmount = input.items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice || 0) * item.quantity;
      return sum + itemTotal;
    }, 0);

    // Generate requisition number
    const requisitionNumber = generateRequisitionNumber();
    const requisitionId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Create requisition
    const requisition: Requisition = {
      id: requisitionId,
      tenantId: input.tenantId,
      requisitionNumber,
      type: input.type,
      status: "DRAFT",
      priority: input.priority || "MEDIUM",
      title: input.title,
      description: input.description,
      requestedBy: userId,
      department: input.department,
      projectId: input.projectId,
      phaseId: input.phaseId,
      workPackageId: input.workPackageId,
      items: input.items.map((item, index) => ({
        id: `item-${requisitionId}-${index + 1}`,
        requisitionId,
        lineNumber: index + 1,
        ...item,
        totalPrice: (item.unitPrice || 0) * item.quantity,
      })),
      totalAmount,
      currency: input.items[0]?.currency || "SAR",
      budgetId: input.budgetId,
      sourcingMethod: input.sourcingMethod,
      preferredVendorId: input.preferredVendorId,
      contractId: input.contractId,
      requiredDate: input.requiredDate,
      approvalStatus: "PENDING",
      approvalHistory: [],
      tags: input.tags || [],
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };

    // Budget checking (if budget is specified)
    if (input.budgetId) {
      const budgetCheck = await this.checkBudget(
        input.tenantId,
        input.budgetId,
        totalAmount,
        requisition.currency,
        input.projectId,
        input.phaseId,
        input.workPackageId,
      );
      requisition.budgetCheck = budgetCheck;

      if (!budgetCheck.isWithinBudget) {
        requisition.status = "DRAFT";
        // Don't throw error, but flag it for approval workflow
      }
    }

    // Save requisition
    requisitions.set(requisitionId, requisition);

    // Publish event
    await eventBus.publish({
      type: "procurement.requisition.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requisitionId,
        requisitionNumber,
        tenantId: input.tenantId,
        type: input.type,
        totalAmount,
        currency: requisition.currency,
        budgetId: input.budgetId,
        projectId: input.projectId,
      },
    } as DomainEvent);

    return requisition;
  }

  /**
   * Check budget availability
   * Deep Finance integration - checks budget, commitments, and spent amounts
   */
  async checkBudget(
    tenantId: string,
    budgetId: string,
    amount: number,
    currency: string,
    projectId?: string,
    phaseId?: string,
    workPackageId?: string,
  ): Promise<BudgetCheckResult> {
    // TODO: Integrate with Finance Budget Service
    // For now, return mock data
    // In production, call: budgetService.checkBudgetAvailability(...)

    const totalBudget = 100000; // Mock - get from Finance service
    const committed = Array.from(commitments.values())
      .filter(
        (c) =>
          c.tenantId === tenantId &&
          c.budgetId === budgetId &&
          c.status === "ACTIVE",
      )
      .reduce((sum, c) => sum + c.amount, 0);
    const spent = 50000; // Mock - get from Finance service (actual GL entries)

    const available = totalBudget - committed - spent;
    const isWithinBudget = available >= amount;
    const variance = amount - available;
    const variancePercentage =
      available > 0 ? (variance / available) * 100 : 100;

    const alerts: string[] = [];
    if (!isWithinBudget) {
      alerts.push("Insufficient budget available");
    }
    if (available / totalBudget < 0.1) {
      alerts.push("Budget utilization exceeds 90%");
    }
    if (available / totalBudget < 0.2) {
      alerts.push("Budget utilization exceeds 80%");
    }

    const result: BudgetCheckResult = {
      available,
      committed,
      spent,
      totalBudget,
      isWithinBudget,
      variance: isWithinBudget ? undefined : variance,
      variancePercentage: isWithinBudget ? undefined : variancePercentage,
      alerts: alerts.length > 0 ? alerts : undefined,
    };

    // Publish budget check event
    await eventBus.publish({
      type: "procurement.budget.checked",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        budgetId,
        amount,
        currency,
        result,
        projectId,
        phaseId,
        workPackageId,
      },
    } as DomainEvent);

    return result;
  }

  /**
   * Create commitment (optional for approved requisitions)
   */
  async createCommitment(
    tenantId: string,
    requisitionId: string,
    budgetId: string,
    amount: number,
    currency: string,
  ): Promise<Commitment> {
    const commitmentId = `commit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const commitment: Commitment = {
      id: commitmentId,
      tenantId,
      entityType: "REQUISITION",
      entityId: requisitionId,
      budgetId,
      amount,
      currency,
      committedAt: new Date().toISOString(),
      status: "ACTIVE",
    };

    commitments.set(commitmentId, commitment);

    // Publish commitment event
    await eventBus.publish({
      type: "procurement.commitment.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        commitmentId,
        tenantId,
        entityType: "REQUISITION",
        entityId: requisitionId,
        budgetId,
        amount,
        currency,
      },
    } as DomainEvent);

    return commitment;
  }

  /**
   * Submit requisition for approval
   */
  async submitForApproval(
    requisitionId: string,
    tenantId: string,
    userId: string,
  ): Promise<Requisition> {
    const requisition = requisitions.get(requisitionId);
    if (!requisition || requisition.tenantId !== tenantId) {
      throw new Error("Requisition not found");
    }

    if (requisition.status !== "DRAFT") {
      throw new Error("Requisition is not in DRAFT status");
    }

    // Budget check before submission
    if (requisition.budgetId) {
      const budgetCheck = await this.checkBudget(
        tenantId,
        requisition.budgetId,
        requisition.totalAmount,
        requisition.currency,
        requisition.projectId,
        requisition.phaseId,
        requisition.workPackageId,
      );

      if (!budgetCheck.isWithinBudget) {
        throw new Error(
          `Insufficient budget: Available ${budgetCheck.available} ${requisition.currency}, Required ${requisition.totalAmount} ${requisition.currency}`,
        );
      }

      requisition.budgetCheck = budgetCheck;
    }

    // Update status
    requisition.status = "SUBMITTED";
    requisition.approvalStatus = "PENDING";
    requisition.updatedAt = new Date().toISOString();
    requisition.updatedBy = userId;

    requisitions.set(requisitionId, requisition);

    // Publish event
    await eventBus.publish({
      type: "procurement.requisition.submitted",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requisitionId,
        requisitionNumber: requisition.requisitionNumber,
        tenantId,
        totalAmount: requisition.totalAmount,
        currency: requisition.currency,
      },
    } as DomainEvent);

    return requisition;
  }

  /**
   * Approve requisition
   */
  async approveRequisition(
    requisitionId: string,
    tenantId: string,
    approverId: string,
    approverName: string,
    approverRole: string,
    comments?: string,
  ): Promise<Requisition> {
    const requisition = requisitions.get(requisitionId);
    if (!requisition || requisition.tenantId !== tenantId) {
      throw new Error("Requisition not found");
    }

    if (
      requisition.status !== "SUBMITTED" &&
      requisition.status !== "PENDING_APPROVAL"
    ) {
      throw new Error("Requisition is not pending approval");
    }

    // Add approval history
    const approvalHistory: ApprovalHistory = {
      id: `approval-${Date.now()}`,
      requisitionId,
      approverId,
      approverName,
      approverRole,
      action: "APPROVED",
      comments,
      approvedAt: new Date().toISOString(),
    };

    requisition.approvalHistory.push(approvalHistory);
    requisition.status = "APPROVED";
    requisition.approvalStatus = "APPROVED";
    requisition.approvedDate = new Date().toISOString();
    requisition.updatedAt = new Date().toISOString();
    requisition.updatedBy = approverId;

    // Create commitment if budget is specified
    if (requisition.budgetId) {
      const commitment = await this.createCommitment(
        tenantId,
        requisitionId,
        requisition.budgetId,
        requisition.totalAmount,
        requisition.currency,
      );
      requisition.commitmentId = commitment.id;
    }

    requisitions.set(requisitionId, requisition);

    // Publish event
    await eventBus.publish({
      type: "procurement.requisition.approved",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requisitionId,
        requisitionNumber: requisition.requisitionNumber,
        tenantId,
        approverId,
        totalAmount: requisition.totalAmount,
        currency: requisition.currency,
        commitmentId: requisition.commitmentId,
      },
    } as DomainEvent);

    return requisition;
  }

  /**
   * Reject requisition
   */
  async rejectRequisition(
    requisitionId: string,
    tenantId: string,
    approverId: string,
    approverName: string,
    approverRole: string,
    rejectionReason: string,
  ): Promise<Requisition> {
    const requisition = requisitions.get(requisitionId);
    if (!requisition || requisition.tenantId !== tenantId) {
      throw new Error("Requisition not found");
    }

    // Add approval history
    const approvalHistory: ApprovalHistory = {
      id: `approval-${Date.now()}`,
      requisitionId,
      approverId,
      approverName,
      approverRole,
      action: "REJECTED",
      comments: rejectionReason,
      approvedAt: new Date().toISOString(),
    };

    requisition.approvalHistory.push(approvalHistory);
    requisition.status = "REJECTED";
    requisition.approvalStatus = "REJECTED";
    requisition.rejectionReason = rejectionReason;
    requisition.updatedAt = new Date().toISOString();
    requisition.updatedBy = approverId;

    requisitions.set(requisitionId, requisition);

    // Publish event
    await eventBus.publish({
      type: "procurement.requisition.rejected",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requisitionId,
        requisitionNumber: requisition.requisitionNumber,
        tenantId,
        approverId,
        rejectionReason,
      },
    } as DomainEvent);

    return requisition;
  }

  /**
   * Convert requisition to Purchase Order
   */
  async convertToPurchaseOrder(
    requisitionId: string,
    tenantId: string,
    vendorId: string,
    userId: string,
  ): Promise<{ requisition: Requisition; purchaseOrderId: string }> {
    const requisition = requisitions.get(requisitionId);
    if (!requisition || requisition.tenantId !== tenantId) {
      throw new Error("Requisition not found");
    }

    if (requisition.status !== "APPROVED") {
      throw new Error("Requisition must be approved before converting to PO");
    }

    // Update requisition status
    requisition.status = "CONVERTED_TO_PO";
    requisition.updatedAt = new Date().toISOString();
    requisition.updatedBy = userId;

    requisitions.set(requisitionId, requisition);

    // Publish event - PO service will handle PO creation
    await eventBus.publish({
      type: "procurement.requisition.converted_to_po",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requisitionId,
        requisitionNumber: requisition.requisitionNumber,
        tenantId,
        vendorId,
        items: requisition.items,
        totalAmount: requisition.totalAmount,
        currency: requisition.currency,
        budgetId: requisition.budgetId,
        projectId: requisition.projectId,
      },
    } as DomainEvent);

    // Return requisition - PO service will update requisition with PO ID
    return {
      requisition,
      purchaseOrderId: "", // Will be set by PO service
    };
  }

  /**
   * Get requisition by ID
   */
  async getRequisition(
    requisitionId: string,
    tenantId: string,
  ): Promise<Requisition | null> {
    const requisition = requisitions.get(requisitionId);
    if (!requisition || requisition.tenantId !== tenantId) {
      return null;
    }
    return requisition;
  }

  /**
   * List requisitions with filters
   */
  async listRequisitions(filter: RequisitionFilter): Promise<Requisition[]> {
    let results = Array.from(requisitions.values()).filter(
      (r) => r.tenantId === filter.tenantId,
    );

    // Apply filters
    if (filter.status && filter.status.length > 0) {
      results = results.filter((r) => filter.status!.includes(r.status));
    }

    if (filter.type && filter.type.length > 0) {
      results = results.filter((r) => filter.type!.includes(r.type));
    }

    if (filter.requestedBy) {
      results = results.filter((r) => r.requestedBy === filter.requestedBy);
    }

    if (filter.department) {
      results = results.filter((r) => r.department === filter.department);
    }

    if (filter.projectId) {
      results = results.filter((r) => r.projectId === filter.projectId);
    }

    if (filter.budgetId) {
      results = results.filter((r) => r.budgetId === filter.budgetId);
    }

    if (filter.dateFrom) {
      const fromDate = new Date(filter.dateFrom);
      results = results.filter((r) => new Date(r.createdAt) >= fromDate);
    }

    if (filter.dateTo) {
      const toDate = new Date(filter.dateTo);
      results = results.filter((r) => new Date(r.createdAt) <= toDate);
    }

    if (filter.minAmount) {
      results = results.filter((r) => r.totalAmount >= filter.minAmount!);
    }

    if (filter.maxAmount) {
      results = results.filter((r) => r.totalAmount <= filter.maxAmount!);
    }

    if (filter.currency) {
      results = results.filter((r) => r.currency === filter.currency);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.requisitionNumber.toLowerCase().includes(searchLower) ||
          r.title.toLowerCase().includes(searchLower) ||
          r.description?.toLowerCase().includes(searchLower),
      );
    }

    // Sort by created date (newest first)
    results.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return results;
  }

  /**
   * Update requisition
   */
  async updateRequisition(
    requisitionId: string,
    tenantId: string,
    input: RequisitionUpdateInput,
    userId: string,
  ): Promise<Requisition> {
    const requisition = requisitions.get(requisitionId);
    if (!requisition || requisition.tenantId !== tenantId) {
      throw new Error("Requisition not found");
    }

    if (requisition.status !== "DRAFT") {
      throw new Error("Only DRAFT requisitions can be updated");
    }

    // Update fields
    if (input.title) requisition.title = input.title;
    if (input.description !== undefined)
      requisition.description = input.description;
    if (input.priority) requisition.priority = input.priority;
    if (input.requiredDate) requisition.requiredDate = input.requiredDate;
    if (input.tags) requisition.tags = input.tags;
    if (input.notes !== undefined) requisition.notes = input.notes;

    // Update items if provided
    if (input.items) {
      requisition.items = input.items.map((item, index) => ({
        id: `item-${requisitionId}-${index + 1}`,
        requisitionId,
        lineNumber: index + 1,
        ...item,
        totalPrice: (item.unitPrice || 0) * item.quantity,
      }));

      // Recalculate total
      requisition.totalAmount = requisition.items.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );
    }

    requisition.updatedAt = new Date().toISOString();
    requisition.updatedBy = userId;

    requisitions.set(requisitionId, requisition);

    // Publish event
    await eventBus.publish({
      type: "procurement.requisition.updated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requisitionId,
        requisitionNumber: requisition.requisitionNumber,
        tenantId,
      },
    } as DomainEvent);

    return requisition;
  }

  /**
   * Cancel requisition
   */
  async cancelRequisition(
    requisitionId: string,
    tenantId: string,
    userId: string,
    reason?: string,
  ): Promise<Requisition> {
    const requisition = requisitions.get(requisitionId);
    if (!requisition || requisition.tenantId !== tenantId) {
      throw new Error("Requisition not found");
    }

    if (requisition.status === "CONVERTED_TO_PO") {
      throw new Error(
        "Cannot cancel requisition that has been converted to PO",
      );
    }

    // Release commitment if exists
    if (requisition.commitmentId) {
      const commitment = commitments.get(requisition.commitmentId);
      if (commitment && commitment.status === "ACTIVE") {
        commitment.status = "RELEASED";
        commitment.releasedAt = new Date().toISOString();
        commitments.set(requisition.commitmentId, commitment);

        await eventBus.publish({
          type: "procurement.commitment.released",
          id: `event-${Date.now()}`,
          timestamp: new Date().toISOString(),
          data: {
            commitmentId: requisition.commitmentId,
            tenantId,
            requisitionId,
          },
        } as DomainEvent);
      }
    }

    requisition.status = "CANCELLED";
    requisition.updatedAt = new Date().toISOString();
    requisition.updatedBy = userId;

    requisitions.set(requisitionId, requisition);

    // Publish event
    await eventBus.publish({
      type: "procurement.requisition.cancelled",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requisitionId,
        requisitionNumber: requisition.requisitionNumber,
        tenantId,
        reason,
      },
    } as DomainEvent);

    return requisition;
  }
}

// Singleton instance
export const requisitionService = new RequisitionService();
