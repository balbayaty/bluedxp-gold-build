/**
 * Period End Closing Service
 * Closing procedures, period locks, closing entries, automated closing tasks
 */

import { eventBus } from "@/lib/services/event-store";
import { generalLedgerService } from "./generalLedgerService";
import { fixedAssetsService } from "./fixedAssetsService";
import { taxManagementService } from "./taxManagementService";
import type { DomainEvent } from "@/types/cqrs";
import type {
  FinancialPeriod,
  ClosingTask,
  PeriodClosing,
} from "@/types/finance";

export class PeriodClosingService {
  private periods: Map<string, FinancialPeriod> = new Map();
  private closings: Map<string, PeriodClosing> = new Map();
  private tasks: Map<string, ClosingTask> = new Map();

  /**
   * Create financial period
   */
  async createPeriod(
    tenantId: string,
    periodData: Omit<
      FinancialPeriod,
      "id" | "status" | "closedAt" | "closedBy"
    >,
  ): Promise<FinancialPeriod> {
    const periodId = `period-${Date.now()}`;
    const period: FinancialPeriod = {
      ...periodData,
      id: periodId,
      status: "OPEN",
    };

    this.periods.set(periodId, period);

    await eventBus.publish({
      type: "finance.period.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        periodId,
        periodName: period.periodName,
      },
    } as DomainEvent);

    return period;
  }

  /**
   * Initialize period closing
   */
  async initializePeriodClosing(
    tenantId: string,
    periodId: string,
  ): Promise<PeriodClosing> {
    const period = this.periods.get(periodId);
    if (!period) {
      throw new Error("Period not found");
    }

    // Create default closing tasks
    const defaultTasks: ClosingTask[] = [
      {
        id: `task-accruals-${Date.now()}`,
        tenantId,
        taskName: "Accruals",
        taskType: "ACCRUAL",
        description: "Record accruals for expenses and revenues",
        status: "PENDING",
        order: 1,
      },
      {
        id: `task-depreciation-${Date.now()}`,
        tenantId,
        taskName: "Depreciation",
        taskType: "DEPRECIATION",
        description: "Calculate and post depreciation for fixed assets",
        status: "PENDING",
        order: 2,
      },
      {
        id: `task-revaluation-${Date.now()}`,
        tenantId,
        taskName: "Currency Revaluation",
        taskType: "REVALUATION",
        description: "Revalue foreign currency balances",
        status: "PENDING",
        order: 3,
      },
      {
        id: `task-provisions-${Date.now()}`,
        tenantId,
        taskName: "Provisions",
        taskType: "PROVISION",
        description: "Record provisions and reserves",
        status: "PENDING",
        order: 4,
      },
      {
        id: `task-reversals-${Date.now()}`,
        tenantId,
        taskName: "Reversals",
        taskType: "REVERSAL",
        description: "Reverse temporary entries",
        status: "PENDING",
        order: 5,
      },
    ];

    const closingId = `closing-${Date.now()}`;
    const closing: PeriodClosing = {
      id: closingId,
      tenantId,
      periodId,
      closingDate: new Date().toISOString(),
      tasks: defaultTasks,
      status: "NOT_STARTED",
    };

    defaultTasks.forEach((t) => this.tasks.set(t.id, t));
    this.closings.set(closingId, closing);

    await eventBus.publish({
      type: "finance.period-closing.initialized",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        closingId,
        periodId,
      },
    } as DomainEvent);

    return closing;
  }

  /**
   * Execute closing task
   */
  async executeClosingTask(
    tenantId: string,
    closingId: string,
    taskId: string,
    executedBy: string,
  ): Promise<ClosingTask> {
    const closing = this.closings.get(closingId);
    if (!closing) {
      throw new Error("Closing not found");
    }

    const task = closing.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    task.status = "IN_PROGRESS";

    // Execute task based on type
    switch (task.taskType) {
      case "DEPRECIATION":
        // TODO: Calculate depreciation for all assets
        // const assets = await fixedAssetsService.getAssetRegister(tenantId, { status: 'ACTIVE' })
        // for (const asset of assets) {
        //   const schedule = await fixedAssetsService.calculateDepreciation(tenantId, asset.id, {
        //     startDate: period.startDate,
        //     endDate: period.endDate,
        //   })
        //   await fixedAssetsService.postDepreciation(tenantId, schedule.id)
        // }
        task.status = "COMPLETED";
        break;

      case "ACCRUAL":
        // TODO: Calculate and post accruals
        task.status = "COMPLETED";
        break;

      case "REVALUATION":
        // TODO: Revalue foreign currency balances
        task.status = "COMPLETED";
        break;

      case "PROVISION":
        // TODO: Calculate and post provisions
        task.status = "COMPLETED";
        break;

      case "REVERSAL":
        // TODO: Reverse temporary entries
        task.status = "COMPLETED";
        break;

      default:
        task.status = "COMPLETED";
    }

    task.completedAt = new Date().toISOString();
    task.completedBy = executedBy;

    // Check if all tasks are completed
    const allCompleted = closing.tasks.every((t) => t.status === "COMPLETED");
    if (allCompleted) {
      closing.status = "COMPLETED";
      closing.completedAt = new Date().toISOString();
      closing.completedBy = executedBy;
    } else {
      closing.status = "IN_PROGRESS";
      if (!closing.startedAt) {
        closing.startedAt = new Date().toISOString();
      }
    }

    await eventBus.publish({
      type: "finance.closing-task.completed",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        closingId,
        taskId,
        taskType: task.taskType,
      },
    } as DomainEvent);

    return task;
  }

  /**
   * Lock period
   */
  async lockPeriod(
    tenantId: string,
    periodId: string,
    lockedBy: string,
  ): Promise<FinancialPeriod> {
    const period = this.periods.get(periodId);
    if (!period) {
      throw new Error("Period not found");
    }

    if (period.status === "LOCKED") {
      throw new Error("Period is already locked");
    }

    // Verify closing is completed
    const closing = Array.from(this.closings.values()).find(
      (c) => c.tenantId === tenantId && c.periodId === periodId,
    );

    if (!closing || closing.status !== "COMPLETED") {
      throw new Error("Period closing must be completed before locking");
    }

    period.status = "LOCKED";
    period.closedAt = new Date().toISOString();
    period.closedBy = lockedBy;

    await eventBus.publish({
      type: "finance.period.locked",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        periodId,
        lockedBy,
      },
    } as DomainEvent);

    return period;
  }

  /**
   * Get closing status
   */
  async getClosingStatus(
    tenantId: string,
    periodId: string,
  ): Promise<{
    closing: PeriodClosing | null;
    progress: number;
    completedTasks: number;
    totalTasks: number;
  }> {
    const closing = Array.from(this.closings.values()).find(
      (c) => c.tenantId === tenantId && c.periodId === periodId,
    );

    if (!closing) {
      return {
        closing: null,
        progress: 0,
        completedTasks: 0,
        totalTasks: 0,
      };
    }

    const completedTasks = closing.tasks.filter(
      (t) => t.status === "COMPLETED",
    ).length;
    const totalTasks = closing.tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      closing,
      progress,
      completedTasks,
      totalTasks,
    };
  }
}

// Singleton instance
export const periodClosingService = new PeriodClosingService();
