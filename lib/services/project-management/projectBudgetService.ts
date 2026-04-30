/**
 * Project Budget Service
 * Project budgeting integrated with Finance budget service
 * LINKS to Finance budget (no duplication)
 */

import { budgetService } from "@/lib/services/finance/budgetService";
import type { ProjectBudget } from "@/types/project-management";

// ============================================================================
// SERVICE
// ============================================================================

class ProjectBudgetService {
  private projectBudgets: Map<string, ProjectBudget> = new Map();

  /**
   * Create project budget
   * LINKS to Finance budget (no duplication)
   */
  async createProjectBudget(input: {
    projectId: string;
    budgetId: string; // References Finance budget
    budgetItems: Array<{
      category: string;
      budgetedAmount: number;
    }>;
    currency: string;
  }): Promise<ProjectBudget> {
    // Get Finance budget (reuse, don't duplicate)
    const financeBudget = await budgetService.getBudget(input.budgetId);
    if (!financeBudget) {
      throw new Error(`Finance budget ${input.budgetId} not found`);
    }

    const totalBudgeted = input.budgetItems.reduce(
      (sum, item) => sum + item.budgetedAmount,
      0,
    );

    const projectBudget: ProjectBudget = {
      id: `pb-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      projectId: input.projectId,
      budgetId: input.budgetId, // Links to Finance budget
      budgetItems: input.budgetItems.map((item) => ({
        ...item,
        actualAmount: 0,
        variance: 0,
      })),
      totalBudgeted,
      totalActual: 0,
      totalVariance: 0,
      currency: input.currency,
    };

    this.projectBudgets.set(projectBudget.id, projectBudget);

    return projectBudget;
  }

  /**
   * Get project budget
   */
  async getProjectBudget(projectId: string): Promise<ProjectBudget | null> {
    const budget = Array.from(this.projectBudgets.values()).find(
      (pb) => pb.projectId === projectId,
    );
    return budget || null;
  }

  /**
   * Update actual costs
   */
  async updateActualCosts(
    projectId: string,
    costs: Record<string, number>,
  ): Promise<ProjectBudget> {
    const projectBudget = Array.from(this.projectBudgets.values()).find(
      (pb) => pb.projectId === projectId,
    );
    if (!projectBudget) {
      throw new Error(`Project budget for project ${projectId} not found`);
    }

    // Update actual amounts
    projectBudget.budgetItems.forEach((item) => {
      if (costs[item.category] !== undefined) {
        item.actualAmount = costs[item.category];
        item.variance = item.actualAmount - item.budgetedAmount;
      }
    });

    projectBudget.totalActual = projectBudget.budgetItems.reduce(
      (sum, item) => sum + item.actualAmount,
      0,
    );
    projectBudget.totalVariance =
      projectBudget.totalActual - projectBudget.totalBudgeted;

    this.projectBudgets.set(projectBudget.id, projectBudget);

    return projectBudget;
  }
}

export const projectBudgetService = new ProjectBudgetService();
