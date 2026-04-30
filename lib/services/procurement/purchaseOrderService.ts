/**
 * Purchase Order Service
 * Comprehensive purchase order management with lifecycle and Finance integration
 * Integrates with Process Lifecycle system and Finance module
 */

import { eventBus } from "@/lib/services/event-store";
import { lifecycleService } from "@/lib/services/process-lifecycle/lifecycle/lifecycleService";
import { purchaseOrderLifecycleConfig } from "@/lib/services/process-lifecycle/lifecycle/configurations/purchaseOrderLifecycle";
import { financeIntegrationService } from "./integration/financeIntegration";
import type { DomainEvent } from "@/types/cqrs";
import type {
  PurchaseOrder,
  PurchaseOrderCreateInput,
  PurchaseOrderUpdateInput,
  PurchaseOrderFilter,
  PurchaseOrderChangeOrder,
  PurchaseOrderItem,
  ApprovalHistory,
} from "@/types/purchaseOrder";
import type { BudgetCheckResult, Commitment } from "@/types/procurement";

// In-memory storage (replace with database in production)
const purchaseOrders = new Map<string, PurchaseOrder>();
const changeOrders = new Map<string, PurchaseOrderChangeOrder>();

// PO number generator
let poCounter = 1;

function generatePONumber(): string {
  const year = new Date().getFullYear();
  const number = String(poCounter++).padStart(6, "0");
  return `PO-${year}-${number}`;
}

export class PurchaseOrderService {
  private initialized = false;
  
  constructor() {
    // Lifecycle registration is done lazily to avoid build-time errors
  }
  
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    try {
      // Register PO lifecycle configuration
      await lifecycleService.registerLifecycle(
        "PURCHASE_ORDER",
        purchaseOrderLifecycleConfig,
      );
      this.initialized = true;
    } catch (err) {
      console.warn("[PurchaseOrderService] Lifecycle registration warning:", err);
      this.initialized = true; // Continue anyway
    }
  }

  /**
   * Create a new Purchase Order
   * Includes budget checking, lifecycle initialization, and Finance integration
   */
  async createPurchaseOrder(
    input: PurchaseOrderCreateInput,
    userId: string,
  ): Promise<PurchaseOrder> {
    await this.ensureInitialized();
    
    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const items: PurchaseOrderItem[] = input.items.map((item, index) => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemTax = item.taxRate ? (itemSubtotal * item.taxRate) / 100 : 0;
      const itemDiscount = item.discountRate
        ? (itemSubtotal * item.discountRate) / 100
        : item.discountAmount || 0;
      const itemNetAmount = itemSubtotal + itemTax - itemDiscount;

      subtotal += itemSubtotal;
      taxAmount += itemTax;
      discountAmount += itemDiscount;

      return {
        id: `item-${Date.now()}-${index + 1}`,
        purchaseOrderId: "", // Will be set below
        lineNumber: index + 1,
        ...item,
        totalPrice: itemSubtotal,
        taxAmount: itemTax,
        discountAmount: itemDiscount,
        netAmount: itemNetAmount,
        quantityReceived: 0,
        quantityInvoiced: 0,
        quantityPending: item.quantity,
      };
    });

    const totalAmount = subtotal + taxAmount - discountAmount;
    const totalQuantityOrdered = items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Generate PO number
    const poNumber = generatePONumber();
    const poId = `po-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Set purchase order ID on items
    items.forEach((item) => {
      item.purchaseOrderId = poId;
    });

    // Create Purchase Order
    const purchaseOrder: PurchaseOrder = {
      id: poId,
      tenantId: input.tenantId,
      poNumber,
      type: input.type,
      status: "CREATED",
      vendorId: input.vendorId,
      vendorName: "", // Will be fetched from vendor service
      requisitionId: input.requisitionId,
      contractId: input.contractId,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      currency: input.items[0]?.currency || "SAR",
      budgetId: input.budgetId,
      approvalStatus: "PENDING",
      approvalHistory: [],
      paymentTerms: input.paymentTerms,
      deliveryTerms: input.deliveryTerms,
      deliveryAddress: input.deliveryAddress,
      billingAddress: input.billingAddress,
      poDate: new Date().toISOString(),
      requiredDate: input.requiredDate,
      deliveryDate: input.deliveryDate,
      totalQuantityOrdered,
      totalQuantityReceived: 0,
      totalQuantityInvoiced: 0,
      receiptStatus: "PENDING",
      invoiceStatus: "PENDING",
      isMatched: false,
      projectId: input.projectId,
      phaseId: input.phaseId,
      workPackageId: input.workPackageId,
      tags: input.tags || [],
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };

    // Budget checking (if budget is specified)
    if (input.budgetId) {
      const budgetCheck =
        await financeIntegrationService.checkBudgetAvailability(
          input.tenantId,
          input.budgetId,
          totalAmount,
          purchaseOrder.currency,
          input.projectId,
          input.phaseId,
          input.workPackageId,
        );
      purchaseOrder.budgetCheck = budgetCheck;

      if (!budgetCheck.isWithinBudget) {
        // Don't throw error, but flag it for approval workflow
        purchaseOrder.status = "CREATED";
      }
    }

    // Initialize lifecycle
    await lifecycleService.initializeLifecycle({
      entityType: "PURCHASE_ORDER",
      entityId: poId,
      tenantId: input.tenantId,
      metadata: {
        poNumber,
        vendorId: input.vendorId,
        totalAmount,
        currency: purchaseOrder.currency,
      },
    });

    // Save PO
    purchaseOrders.set(poId, purchaseOrder);

    // Publish event
    await eventBus.publish({
      type: "procurement.purchase-order.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        purchaseOrderId: poId,
        poNumber,
        tenantId: input.tenantId,
        vendorId: input.vendorId,
        requisitionId: input.requisitionId,
        type: input.type,
        totalAmount,
        currency: purchaseOrder.currency,
        budgetId: input.budgetId,
        projectId: input.projectId,
      },
    } as DomainEvent);

    return purchaseOrder;
  }

  /**
   * Submit PO for approval
   */
  async submitForApproval(
    poId: string,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrder> {
    const po = purchaseOrders.get(poId);
    if (!po || po.tenantId !== tenantId) {
      throw new Error("Purchase order not found");
    }

    if (po.status !== "CREATED") {
      throw new Error("Purchase order is not in CREATED status");
    }

    // Budget check before submission
    if (po.budgetId) {
      const budgetCheck =
        await financeIntegrationService.checkBudgetAvailability(
          tenantId,
          po.budgetId,
          po.totalAmount,
          po.currency,
          po.projectId,
          po.phaseId,
          po.workPackageId,
        );

      if (!budgetCheck.isWithinBudget) {
        throw new Error(
          `Insufficient budget: Available ${budgetCheck.available} ${po.currency}, Required ${po.totalAmount} ${po.currency}`,
        );
      }

      po.budgetCheck = budgetCheck;
    }

    // Update status and transition lifecycle
    po.status = "PENDING_APPROVAL";
    po.approvalStatus = "PENDING";
    po.updatedAt = new Date().toISOString();
    po.updatedBy = userId;

    // Transition lifecycle to pending_approval stage
    await lifecycleService.transitionStage({
      entityType: "PURCHASE_ORDER",
      entityId: poId,
      targetStageId: "pending_approval",
      tenantId,
      metadata: {
        userId,
      },
    });

    purchaseOrders.set(poId, po);

    // Publish event
    await eventBus.publish({
      type: "procurement.purchase-order.submitted",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        purchaseOrderId: poId,
        poNumber: po.poNumber,
        tenantId,
        totalAmount: po.totalAmount,
        currency: po.currency,
      },
    } as DomainEvent);

    return po;
  }

  /**
   * Approve Purchase Order
   * Creates commitment in Finance module
   */
  async approvePurchaseOrder(
    poId: string,
    tenantId: string,
    approverId: string,
    approverName: string,
    approverRole: string,
    comments?: string,
  ): Promise<PurchaseOrder> {
    const po = purchaseOrders.get(poId);
    if (!po || po.tenantId !== tenantId) {
      throw new Error("Purchase order not found");
    }

    if (po.status !== "PENDING_APPROVAL") {
      throw new Error("Purchase order is not pending approval");
    }

    // Add approval history
    const approvalHistory: ApprovalHistory = {
      id: `approval-${Date.now()}`,
      purchaseOrderId: poId,
      approverId,
      approverName,
      approverRole,
      action: "APPROVED",
      comments,
      approvedAt: new Date().toISOString(),
    };

    po.approvalHistory.push(approvalHistory);
    po.status = "APPROVED";
    po.approvalStatus = "APPROVED";
    po.approvedDate = new Date().toISOString();
    po.updatedAt = new Date().toISOString();
    po.updatedBy = approverId;

    // Create commitment in Finance module
    if (po.budgetId) {
      const commitment = await financeIntegrationService.createCommitment(
        tenantId,
        "PURCHASE_ORDER",
        poId,
        po.budgetId,
        po.totalAmount,
        po.currency,
      );
      po.commitmentId = commitment.id;
    }

    // Post to General Ledger (debit commitments, credit accounts payable)
    if (po.budgetId) {
      await financeIntegrationService.postToGeneralLedger(
        tenantId,
        "PO_CREATED",
        poId,
        [
          {
            accountCode: "COMMITMENTS", // Debit
            debit: po.totalAmount,
            credit: 0,
            description: `PO ${po.poNumber} - Commitment`,
            costCenterId: po.costAllocations?.[0]?.costCenterId,
            projectId: po.projectId,
          },
          {
            accountCode: "ACCOUNTS_PAYABLE", // Credit
            debit: 0,
            credit: po.totalAmount,
            description: `PO ${po.poNumber} - Accounts Payable`,
            costCenterId: po.costAllocations?.[0]?.costCenterId,
            projectId: po.projectId,
          },
        ],
        po.currency,
      );
    }

    // Transition lifecycle to approved stage
    await lifecycleService.transitionStage({
      entityType: "PURCHASE_ORDER",
      entityId: poId,
      targetStageId: "approved",
      tenantId,
      metadata: {
        approverId,
        approverName,
        approverRole,
      },
    });

    purchaseOrders.set(poId, po);

    // Publish event
    await eventBus.publish({
      type: "procurement.purchase-order.approved",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        purchaseOrderId: poId,
        poNumber: po.poNumber,
        tenantId,
        approverId,
        totalAmount: po.totalAmount,
        currency: po.currency,
        commitmentId: po.commitmentId,
      },
    } as DomainEvent);

    return po;
  }

  /**
   * Confirm Purchase Order (vendor confirmation)
   */
  async confirmPurchaseOrder(
    poId: string,
    tenantId: string,
    confirmedBy?: string,
  ): Promise<PurchaseOrder> {
    const po = purchaseOrders.get(poId);
    if (!po || po.tenantId !== tenantId) {
      throw new Error("Purchase order not found");
    }

    if (po.status !== "APPROVED") {
      throw new Error("Purchase order must be approved before confirmation");
    }

    po.status = "CONFIRMED";
    po.confirmedDate = new Date().toISOString();
    po.updatedAt = new Date().toISOString();

    // Transition lifecycle to confirmed stage
    await lifecycleService.transitionStage({
      entityType: "PURCHASE_ORDER",
      entityId: poId,
      targetStageId: "confirmed",
      tenantId,
      metadata: {
        confirmedBy: confirmedBy || "vendor",
      },
    });

    purchaseOrders.set(poId, po);

    // Publish event
    await eventBus.publish({
      type: "procurement.purchase-order.confirmed",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        purchaseOrderId: poId,
        poNumber: po.poNumber,
        tenantId,
        confirmedBy,
      },
    } as DomainEvent);

    return po;
  }

  /**
   * Update goods receipt status
   * Called by Goods Receipt service when goods are received
   */
  async updateGoodsReceiptStatus(
    poId: string,
    tenantId: string,
    receivedQuantities: Array<{ itemId: string; quantity: number }>,
  ): Promise<PurchaseOrder> {
    const po = purchaseOrders.get(poId);
    if (!po || po.tenantId !== tenantId) {
      throw new Error("Purchase order not found");
    }

    // Update item quantities
    let totalReceived = 0;
    receivedQuantities.forEach((rec) => {
      const item = po.items.find((i) => i.id === rec.itemId);
      if (item) {
        item.quantityReceived = (item.quantityReceived || 0) + rec.quantity;
        item.quantityPending = item.quantity - item.quantityReceived;
        totalReceived += rec.quantity;
      }
    });

    po.totalQuantityReceived += totalReceived;

    // Update receipt status
    if (po.totalQuantityReceived >= po.totalQuantityOrdered) {
      po.receiptStatus = "COMPLETE";
      po.status = "RECEIVED";

      // Transition lifecycle to received stage
      await lifecycleService.transitionStage({
        entityType: "PURCHASE_ORDER",
        entityId: poId,
        targetStageId: "received",
        tenantId,
      });

      // Post to GL (debit inventory/assets, credit accounts payable)
      await financeIntegrationService.postToGeneralLedger(
        tenantId,
        "GOODS_RECEIPT",
        poId,
        [
          {
            accountCode: "INVENTORY", // Debit
            debit: po.totalAmount,
            credit: 0,
            description: `PO ${po.poNumber} - Goods Receipt`,
            costCenterId: po.costAllocations?.[0]?.costCenterId,
            projectId: po.projectId,
          },
          {
            accountCode: "ACCOUNTS_PAYABLE", // Credit
            debit: 0,
            credit: po.totalAmount,
            description: `PO ${po.poNumber} - Goods Receipt`,
            costCenterId: po.costAllocations?.[0]?.costCenterId,
            projectId: po.projectId,
          },
        ],
        po.currency,
      );
    } else if (po.totalQuantityReceived > 0) {
      po.receiptStatus = "PARTIAL";
      po.status = "PARTIALLY_RECEIVED";

      // Transition lifecycle to partially_received stage
      await lifecycleService.transitionStage({
        entityType: "PURCHASE_ORDER",
        entityId: poId,
        targetStageId: "partially_received",
        tenantId,
      });
    } else {
      po.receiptStatus = "PENDING";
      po.status = "GOODS_RECEIPT";

      // Transition lifecycle to goods_receipt stage
      await lifecycleService.transitionStage({
        entityType: "PURCHASE_ORDER",
        entityId: poId,
        targetStageId: "goods_receipt",
        tenantId,
      });
    }

    po.updatedAt = new Date().toISOString();
    purchaseOrders.set(poId, po);

    // Publish event
    await eventBus.publish({
      type: "procurement.purchase-order.goods-receipt-updated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        purchaseOrderId: poId,
        poNumber: po.poNumber,
        tenantId,
        receiptStatus: po.receiptStatus,
        totalQuantityReceived: po.totalQuantityReceived,
      },
    } as DomainEvent);

    return po;
  }

  /**
   * Get Purchase Order by ID
   */
  async getPurchaseOrder(
    poId: string,
    tenantId: string,
  ): Promise<PurchaseOrder | null> {
    const po = purchaseOrders.get(poId);
    if (!po || po.tenantId !== tenantId) {
      return null;
    }
    return po;
  }

  /**
   * List Purchase Orders with filters
   */
  async listPurchaseOrders(
    filter: PurchaseOrderFilter,
  ): Promise<PurchaseOrder[]> {
    let results = Array.from(purchaseOrders.values()).filter(
      (po) => po.tenantId === filter.tenantId,
    );

    // Apply filters
    if (filter.status && filter.status.length > 0) {
      results = results.filter((po) => filter.status!.includes(po.status));
    }

    if (filter.type && filter.type.length > 0) {
      results = results.filter((po) => filter.type!.includes(po.type));
    }

    if (filter.vendorId) {
      results = results.filter((po) => po.vendorId === filter.vendorId);
    }

    if (filter.requisitionId) {
      results = results.filter(
        (po) => po.requisitionId === filter.requisitionId,
      );
    }

    if (filter.projectId) {
      results = results.filter((po) => po.projectId === filter.projectId);
    }

    if (filter.budgetId) {
      results = results.filter((po) => po.budgetId === filter.budgetId);
    }

    if (filter.dateFrom) {
      const fromDate = new Date(filter.dateFrom);
      results = results.filter((po) => new Date(po.poDate) >= fromDate);
    }

    if (filter.dateTo) {
      const toDate = new Date(filter.dateTo);
      results = results.filter((po) => new Date(po.poDate) <= toDate);
    }

    if (filter.minAmount) {
      results = results.filter((po) => po.totalAmount >= filter.minAmount!);
    }

    if (filter.maxAmount) {
      results = results.filter((po) => po.totalAmount <= filter.maxAmount!);
    }

    if (filter.currency) {
      results = results.filter((po) => po.currency === filter.currency);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      results = results.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(searchLower) ||
          po.vendorName.toLowerCase().includes(searchLower),
      );
    }

    // Sort by created date (newest first)
    results.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return results;
  }

  /**
   * Cancel Purchase Order
   * Releases commitment and updates lifecycle
   */
  async cancelPurchaseOrder(
    poId: string,
    tenantId: string,
    userId: string,
    reason?: string,
  ): Promise<PurchaseOrder> {
    const po = purchaseOrders.get(poId);
    if (!po || po.tenantId !== tenantId) {
      throw new Error("Purchase order not found");
    }

    if (po.status === "COMPLETED" || po.status === "CANCELLED") {
      throw new Error(
        "Cannot cancel completed or already cancelled purchase order",
      );
    }

    // Release commitment if exists
    if (po.commitmentId) {
      await financeIntegrationService.releaseCommitment(
        po.commitmentId,
        tenantId,
        reason || "PO cancelled",
      );
    }

    po.status = "CANCELLED";
    po.cancellationReason = reason;
    po.updatedAt = new Date().toISOString();
    po.updatedBy = userId;

    purchaseOrders.set(poId, po);

    // Publish event
    await eventBus.publish({
      type: "procurement.purchase-order.cancelled",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        purchaseOrderId: poId,
        poNumber: po.poNumber,
        tenantId,
        reason,
      },
    } as DomainEvent);

    return po;
  }
}

// Singleton instance
export const purchaseOrderService = new PurchaseOrderService();
