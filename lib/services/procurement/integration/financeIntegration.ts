/**
 * Finance Integration Service
 * Deep Finance module integration for Procurement
 * Budget checking, commitments, AP automation, cost accounting, GL posting
 * ZERO DUPLICATION - Reuses Finance services
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type {
  BudgetCheckResult,
  Commitment,
  CostAllocation,
} from "@/types/procurement";

// TODO: Import Finance services when available
// import { budgetService } from '@/lib/services/finance/budgetService'
// import { accountsPayableService } from '@/lib/services/finance/accountsPayableService'
// import { costAccountingService } from '@/lib/services/finance/costAccountingService'
// import { generalLedgerService } from '@/lib/services/finance/generalLedgerService'

export class FinanceIntegrationService {
  /**
   * Check budget availability
   * Real-time budget checking with commitments and spent amounts
   */
  async checkBudgetAvailability(
    tenantId: string,
    budgetId: string,
    amount: number,
    currency: string,
    projectId?: string,
    phaseId?: string,
    workPackageId?: string,
    costCode?: string,
  ): Promise<BudgetCheckResult> {
    // TODO: Call Finance Budget Service
    // const budget = await budgetService.getBudget(budgetId, tenantId)
    // const commitments = await budgetService.getCommitments(budgetId, tenantId)
    // const actuals = await budgetService.getActuals(budgetId, tenantId)

    // Mock implementation for now
    const totalBudget = 100000;
    const committed = 20000;
    const spent = 50000;
    const available = totalBudget - committed - spent;
    const isWithinBudget = available >= amount;
    const variance = isWithinBudget ? 0 : amount - available;
    const variancePercentage =
      available > 0 ? (variance / available) * 100 : 100;

    const alerts: string[] = [];
    if (!isWithinBudget) {
      alerts.push(
        `Insufficient budget: Available ${available} ${currency}, Required ${amount} ${currency}`,
      );
    }
    const utilizationRate = (committed + spent) / totalBudget;
    if (utilizationRate >= 1.0) {
      alerts.push("Budget fully utilized");
    } else if (utilizationRate >= 0.9) {
      alerts.push("Budget utilization exceeds 90%");
    } else if (utilizationRate >= 0.8) {
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
        costCode,
      },
    } as DomainEvent);

    return result;
  }

  /**
   * Create commitment
   * Creates a commitment in Finance module when PO is approved or requisition is approved
   */
  async createCommitment(
    tenantId: string,
    entityType: "REQUISITION" | "PURCHASE_ORDER",
    entityId: string,
    budgetId: string,
    amount: number,
    currency: string,
  ): Promise<Commitment> {
    // TODO: Call Finance Budget Service to create commitment
    // const commitment = await budgetService.createCommitment({
    //   tenantId,
    //   entityType,
    //   entityId,
    //   budgetId,
    //   amount,
    //   currency,
    // })

    const commitmentId = `commit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const commitment: Commitment = {
      id: commitmentId,
      tenantId,
      entityType,
      entityId,
      budgetId,
      amount,
      currency,
      committedAt: new Date().toISOString(),
      status: "ACTIVE",
    };

    // Publish commitment created event
    await eventBus.publish({
      type: "procurement.commitment.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        commitmentId,
        tenantId,
        entityType,
        entityId,
        budgetId,
        amount,
        currency,
      },
    } as DomainEvent);

    return commitment;
  }

  /**
   * Release commitment
   * Releases a commitment when PO is cancelled or requisition is cancelled
   */
  async releaseCommitment(
    commitmentId: string,
    tenantId: string,
    reason?: string,
  ): Promise<void> {
    // TODO: Call Finance Budget Service to release commitment
    // await budgetService.releaseCommitment(commitmentId, tenantId, reason)

    // Publish commitment released event
    await eventBus.publish({
      type: "procurement.commitment.released",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        commitmentId,
        tenantId,
        reason,
      },
    } as DomainEvent);
  }

  /**
   * Create Accounts Payable entry
   * Auto-creates AP entry when goods receipt is posted or service milestone is completed
   */
  async createAccountsPayable(
    tenantId: string,
    purchaseOrderId: string,
    vendorId: string,
    invoiceNumber: string,
    invoiceDate: Date | string,
    amount: number,
    currency: string,
    items: Array<{
      itemId: string;
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>,
  ): Promise<string> {
    // TODO: Call Finance AP Service
    // const apRecord = await accountsPayableService.createAPRecord({
    //   tenantId,
    //   sourceType: 'PURCHASE_ORDER',
    //   sourceId: purchaseOrderId,
    //   vendorId,
    //   invoiceNumber,
    //   invoiceDate,
    //   amount,
    //   currency,
    //   items,
    // })

    const apRecordId = `ap-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Publish AP created event
    await eventBus.publish({
      type: "procurement.accounts-payable.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        apRecordId,
        tenantId,
        purchaseOrderId,
        vendorId,
        invoiceNumber,
        invoiceDate,
        amount,
        currency,
      },
    } as DomainEvent);

    return apRecordId;
  }

  /**
   * Allocate costs
   * Allocates procurement costs to cost centers, projects, phases, work packages
   */
  async allocateCosts(
    tenantId: string,
    procurementEntityId: string,
    procurementEntityType: "REQUISITION" | "PURCHASE_ORDER" | "INVOICE",
    allocations: Array<{
      costCenterId: string;
      projectId?: string;
      phaseId?: string;
      workPackageId?: string;
      costCode?: string;
      amount: number;
      allocationType: "DIRECT" | "PERCENTAGE" | "ACTIVITY_BASED";
    }>,
    currency: string,
  ): Promise<CostAllocation[]> {
    // TODO: Call Finance Cost Accounting Service
    // const costAllocations = await costAccountingService.allocateCosts({
    //   tenantId,
    //   sourceEntityId: procurementEntityId,
    //   sourceEntityType: procurementEntityType,
    //   allocations,
    //   currency,
    // })

    const result: CostAllocation[] = allocations.map((alloc, index) => ({
      id: `alloc-${Date.now()}-${index}`,
      tenantId,
      procurementEntityId,
      procurementEntityType,
      costCenterId: alloc.costCenterId,
      projectId: alloc.projectId,
      phaseId: alloc.phaseId,
      workPackageId: alloc.workPackageId,
      costCode: alloc.costCode,
      amount: alloc.amount,
      currency,
      allocationType: alloc.allocationType,
      allocatedAt: new Date().toISOString(),
    }));

    // Publish cost allocation event
    await eventBus.publish({
      type: "procurement.cost.allocated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        procurementEntityId,
        procurementEntityType,
        allocations: result,
      },
    } as DomainEvent);

    return result;
  }

  /**
   * Post to General Ledger
   * Creates GL entries for procurement transactions
   */
  async postToGeneralLedger(
    tenantId: string,
    transactionType:
      | "PO_CREATED"
      | "GOODS_RECEIPT"
      | "INVOICE_RECEIVED"
      | "PAYMENT",
    transactionId: string,
    entries: Array<{
      accountCode: string;
      debit: number;
      credit: number;
      description: string;
      costCenterId?: string;
      projectId?: string;
    }>,
    currency: string,
  ): Promise<string[]> {
    // TODO: Call Finance GL Service
    // const glEntries = await generalLedgerService.createJournalEntries({
    //   tenantId,
    //   transactionType,
    //   transactionId,
    //   entries,
    //   currency,
    // })

    const glEntryIds = entries.map((_, index) => `gl-${Date.now()}-${index}`);

    // Publish GL posting event
    await eventBus.publish({
      type: "procurement.gl.posting.required",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        transactionType,
        transactionId,
        glEntryIds,
        entries,
        currency,
      },
    } as DomainEvent);

    return glEntryIds;
  }

  /**
   * Subscribe to Finance events
   * Listens to Finance module events for budget updates, payment processing, etc.
   */
  initializeFinanceEventSubscriptions(): void {
    // Subscribe to budget events
    eventBus.subscribe("finance.budget.created", async (event: DomainEvent) => {
      console.log("Finance budget created:", event.data);
      // Handle budget creation - may enable procurement for new budgets
    });

    eventBus.subscribe(
      "finance.budget.approved",
      async (event: DomainEvent) => {
        console.log("Finance budget approved:", event.data);
        // Handle budget approval - enable procurement for approved budgets
      },
    );

    eventBus.subscribe("finance.budget.updated", async (event: DomainEvent) => {
      console.log("Finance budget updated:", event.data);
      // Handle budget updates - may affect pending requisitions/POs
    });

    // Subscribe to payment events
    eventBus.subscribe(
      "finance.accounts-payable.paid",
      async (event: DomainEvent) => {
        console.log("Finance AP paid:", event.data);
        // Update PO payment status
        await eventBus.publish({
          type: "procurement.purchase-order.payment-updated",
          id: `event-${Date.now()}`,
          timestamp: new Date().toISOString(),
          data: {
            purchaseOrderId: event.data.purchaseOrderId,
            paymentStatus: "PAID",
            paidAmount: event.data.amount,
            paidDate: event.data.paidDate,
          },
        } as DomainEvent);
      },
    );

    // Subscribe to cost allocation events
    eventBus.subscribe("finance.cost-allocated", async (event: DomainEvent) => {
      console.log("Finance cost allocated:", event.data);
      // Update procurement cost records
    });
  }
}

// Singleton instance
export const financeIntegrationService = new FinanceIntegrationService();

// Initialize event subscriptions
financeIntegrationService.initializeFinanceEventSubscriptions();
