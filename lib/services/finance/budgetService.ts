/**
 * Budget Service
 * Comprehensive budget planning and tracking
 * Integrates with Facility utility bills budget and other modules
 */

import { generalLedgerService } from "./generalLedgerService";
import { eventBus } from "@/lib/services/event-store";
import type { Budget, BudgetItem, FinancialPeriod } from "@/types/finance";

// ============================================================================
// TYPES
// ============================================================================

export interface BudgetVariance {
  budgetId: string;
  period: { startDate: Date | string; endDate: Date | string };
  items: Array<{
    category: string;
    budgetedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
    status: "ON_TRACK" | "OVER_BUDGET" | "UNDER_BUDGET";
  }>;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercentage: number;
}

// ============================================================================
// SERVICE
// ============================================================================

class BudgetService {
  private budgets: Map<string, Budget> = new Map();
  private financialPeriods: Map<string, FinancialPeriod> = new Map();

  /**
   * Initialize event handlers to track actuals against budgets
   */
  initializeEventHandlers(): void {
    // Subscribe to GL entry events to update budget actuals
    eventBus.subscribe("finance.gl.entry.created", async (event: any) => {
      await this.updateBudgetActuals(event.payload);
    });

    // Subscribe to facility utility bill events
    eventBus.subscribe("facility.utility-bill.created", async (event: any) => {
      await this.updateUtilityBudgetActuals(event.payload);
    });
  }

  /**
   * Create budget
   */
  async createBudget(input: {
    tenantId: string;
    name: string;
    description?: string;
    budgetType: Budget["budgetType"];
    period: {
      startDate: Date | string;
      endDate: Date | string;
      frequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
    };
    budgetItems: Array<{
      category: string;
      accountCode?: string;
      description: string;
      budgetedAmount: number;
    }>;
    currency: string;
    createdBy: string;
  }): Promise<Budget> {
    const totalBudget = input.budgetItems.reduce(
      (sum, item) => sum + item.budgetedAmount,
      0,
    );

    const budget: Budget = {
      id: `budget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      budgetType: input.budgetType,
      period: input.period,
      budgetItems: input.budgetItems.map((item) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        budgetId: "", // Will be set after budget creation
        category: item.category,
        accountCode: item.accountCode,
        description: item.description,
        budgetedAmount: item.budgetedAmount,
        actualAmount: 0,
        variance: 0,
        variancePercentage: 0,
      })),
      totalBudget,
      currency: input.currency,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
      updatedAt: new Date().toISOString(),
    };

    // Set budget ID in items
    budget.budgetItems.forEach((item) => {
      item.budgetId = budget.id;
    });

    this.budgets.set(budget.id, budget);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "finance.budget.created",
      aggregateId: budget.id,
      aggregateType: "budget",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: budget,
    });

    return budget;
  }

  /**
   * Approve budget
   */
  async approveBudget(budgetId: string, approvedBy: string): Promise<Budget> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    budget.status = "APPROVED";
    budget.approvedBy = approvedBy;
    budget.approvedAt = new Date().toISOString();
    this.budgets.set(budgetId, budget);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "finance.budget.approved",
      aggregateId: budgetId,
      aggregateType: "budget",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: budget,
    });

    return budget;
  }

  /**
   * Activate budget
   */
  async activateBudget(budgetId: string): Promise<Budget> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    if (budget.status !== "APPROVED") {
      throw new Error("Budget must be approved before activation");
    }

    budget.status = "ACTIVE";
    budget.updatedAt = new Date().toISOString();
    this.budgets.set(budgetId, budget);

    return budget;
  }

  /**
   * Update budget actuals from GL entries
   */
  private async updateBudgetActuals(glEntry: any): Promise<void> {
    const activeBudgets = Array.from(this.budgets.values()).filter(
      (b) =>
        b.status === "ACTIVE" &&
        new Date(glEntry.entryDate) >= new Date(b.period.startDate) &&
        new Date(glEntry.entryDate) <= new Date(b.period.endDate),
    );

    for (const budget of activeBudgets) {
      // Find matching budget item by account code
      const matchingItem = budget.budgetItems.find(
        (item) =>
          item.accountCode === glEntry.debitAccount ||
          item.accountCode === glEntry.creditAccount,
      );

      if (matchingItem) {
        // Update actual amount
        matchingItem.actualAmount += glEntry.amount;

        // Calculate variance
        matchingItem.variance =
          matchingItem.actualAmount - matchingItem.budgetedAmount;
        matchingItem.variancePercentage =
          matchingItem.budgetedAmount > 0
            ? (matchingItem.variance / matchingItem.budgetedAmount) * 100
            : 0;

        budget.updatedAt = new Date().toISOString();
        this.budgets.set(budget.id, budget);
      }
    }
  }

  /**
   * Update utility budget actuals
   */
  private async updateUtilityBudgetActuals(bill: any): Promise<void> {
    const activeBudgets = Array.from(this.budgets.values()).filter(
      (b) =>
        b.status === "ACTIVE" &&
        b.budgetType === "OPERATIONAL" &&
        new Date(bill.billDate || bill.createdAt) >=
          new Date(b.period.startDate) &&
        new Date(bill.billDate || bill.createdAt) <= new Date(b.period.endDate),
    );

    for (const budget of activeBudgets) {
      // Find utility expense budget item
      const utilityItem = budget.budgetItems.find(
        (item) => item.category === "UTILITY" || item.accountCode === "6200",
      );

      if (utilityItem) {
        utilityItem.actualAmount += bill.totalAmount || 0;
        utilityItem.variance =
          utilityItem.actualAmount - utilityItem.budgetedAmount;
        utilityItem.variancePercentage =
          utilityItem.budgetedAmount > 0
            ? (utilityItem.variance / utilityItem.budgetedAmount) * 100
            : 0;

        budget.updatedAt = new Date().toISOString();
        this.budgets.set(budget.id, budget);
      }
    }
  }

  /**
   * Get budget variance report
   */
  async getBudgetVariance(budgetId: string): Promise<BudgetVariance> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    const items = budget.budgetItems.map((item) => {
      const status =
        item.variancePercentage > 10
          ? "OVER_BUDGET"
          : item.variancePercentage < -10
            ? "UNDER_BUDGET"
            : "ON_TRACK";

      return {
        category: item.category,
        budgetedAmount: item.budgetedAmount,
        actualAmount: item.actualAmount,
        variance: item.variance,
        variancePercentage: item.variancePercentage,
        status,
      };
    });

    const totalBudgeted = budget.totalBudget;
    const totalActual = items.reduce((sum, item) => sum + item.actualAmount, 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePercentage =
      totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

    return {
      budgetId,
      period: budget.period,
      items,
      totalBudgeted,
      totalActual,
      totalVariance,
      totalVariancePercentage,
    };
  }

  /**
   * Get budgets
   */
  async getBudgets(filters: {
    tenantId: string;
    budgetType?: Budget["budgetType"];
    status?: Budget["status"];
  }): Promise<Budget[]> {
    let budgets = Array.from(this.budgets.values()).filter(
      (b) => b.tenantId === filters.tenantId,
    );

    if (filters.budgetType) {
      budgets = budgets.filter((b) => b.budgetType === filters.budgetType);
    }

    if (filters.status) {
      budgets = budgets.filter((b) => b.status === filters.status);
    }

    return budgets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Get budget by ID
   */
  async getBudget(budgetId: string): Promise<Budget | null> {
    return this.budgets.get(budgetId) || null;
  }

  /**
   * Create financial period
   */
  async createFinancialPeriod(input: {
    tenantId: string;
    periodName: string;
    startDate: Date | string;
    endDate: Date | string;
  }): Promise<FinancialPeriod> {
    const period: FinancialPeriod = {
      id: `period-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      periodName: input.periodName,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "OPEN",
    };

    this.financialPeriods.set(period.id, period);
    return period;
  }

  /**
   * Close financial period
   */
  async closeFinancialPeriod(
    periodId: string,
    closedBy: string,
  ): Promise<FinancialPeriod> {
    const period = this.financialPeriods.get(periodId);
    if (!period) {
      throw new Error(`Financial period ${periodId} not found`);
    }

    period.status = "CLOSED";
    period.closedAt = new Date().toISOString();
    period.closedBy = closedBy;
    this.financialPeriods.set(periodId, period);

    return period;
  }
}

export const budgetService = new BudgetService();

// Initialize event handlers on service creation
if (typeof window === "undefined") {
  budgetService.initializeEventHandlers();
}
