/**
 * Warehouse Workflow Integration Service
 * Integrates warehouse operations with workflow automation
 */

import { workflowService } from "@/lib/services/process-lifecycle";
import type {
  Workflow,
  WorkflowExecution,
  WorkflowStep,
} from "@/lib/services/process-lifecycle/workflow/workflowService";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface WarehouseWorkflow {
  id: string;
  warehouseId: string;
  workflowId: string;
  name: string;
  description: string;
  type:
    | "putaway"
    | "picking"
    | "cycle_count"
    | "replenishment"
    | "transfer"
    | "approval"
    | "custom";
  status: "active" | "paused" | "archived";
  executions: WarehouseWorkflowExecution[];
}

export interface WarehouseWorkflowExecution {
  id: string;
  warehouseId: string;
  executionId: string;
  workflowId: string;
  recordId: string;
  status: "running" | "completed" | "failed" | "paused";
  startedAt: string;
  completedAt?: string;
}

export interface WarehouseWorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  byType: Record<string, number>;
  averageExecutionTime: number;
}

// ============================================================================
// SERVICE
// ============================================================================

class WarehouseWorkflowIntegration {
  private warehouseWorkflows: Map<string, WarehouseWorkflow> = new Map();
  private executions: Map<string, WarehouseWorkflowExecution> = new Map();

  /**
   * Create warehouse workflow
   */
  async createWorkflow(
    warehouseId: string,
    workflow: {
      name: string;
      description: string;
      type: WarehouseWorkflow["type"];
      steps: WorkflowStep[];
      triggers: Array<{ event: string; conditions?: Record<string, any> }>;
    },
  ): Promise<WarehouseWorkflow> {
    // Create workflow using workflow service
    const createdWorkflow = await workflowService.createWorkflow({
      name: workflow.name,
      description: workflow.description,
      steps: workflow.steps,
      triggers: workflow.triggers,
      status: "active",
    });

    const warehouseWorkflow: WarehouseWorkflow = {
      id: `wwf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      workflowId: createdWorkflow.id,
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
      status: "active",
      executions: [],
    };

    this.warehouseWorkflows.set(warehouseWorkflow.id, warehouseWorkflow);

    // Publish event
    await eventBus.publish({
      id: `warehouse-workflow-created-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.workflow.created",
      aggregateId: warehouseId,
      payload: {
        workflowId: warehouseWorkflow.id,
        type: workflow.type,
      },
      timestamp: new Date().toISOString(),
    });

    return warehouseWorkflow;
  }

  /**
   * Execute warehouse workflow
   */
  async executeWorkflow(
    warehouseId: string,
    workflowId: string,
    recordId: string,
    context?: Record<string, any>,
  ): Promise<WarehouseWorkflowExecution> {
    const warehouseWorkflow = Array.from(this.warehouseWorkflows.values()).find(
      (w) => w.warehouseId === warehouseId && w.id === workflowId,
    );

    if (!warehouseWorkflow) {
      throw new Error(
        `Workflow ${workflowId} not found for warehouse ${warehouseId}`,
      );
    }

    // Execute workflow using workflow service
    const execution = await workflowService.executeWorkflow(
      warehouseWorkflow.workflowId,
      recordId,
      {
        ...context,
        warehouseId,
      },
    );

    const warehouseExecution: WarehouseWorkflowExecution = {
      id: `wwe-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      executionId: execution.id,
      workflowId: warehouseWorkflow.id,
      recordId,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
    };

    this.executions.set(warehouseExecution.id, warehouseExecution);
    warehouseWorkflow.executions.push(warehouseExecution);
    this.warehouseWorkflows.set(warehouseWorkflow.id, warehouseWorkflow);

    // Publish event
    await eventBus.publish({
      id: `warehouse-workflow-executed-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.workflow.executed",
      aggregateId: warehouseId,
      payload: {
        executionId: warehouseExecution.id,
        workflowId,
        recordId,
        status: execution.status,
      },
      timestamp: new Date().toISOString(),
    });

    return warehouseExecution;
  }

  /**
   * Get workflow statistics
   */
  async getStats(warehouseId: string): Promise<WarehouseWorkflowStats> {
    const warehouseWorkflows = Array.from(
      this.warehouseWorkflows.values(),
    ).filter((w) => w.warehouseId === warehouseId);

    const warehouseExecutions = Array.from(this.executions.values()).filter(
      (e) => e.warehouseId === warehouseId,
    );

    const stats: WarehouseWorkflowStats = {
      totalWorkflows: warehouseWorkflows.length,
      activeWorkflows: warehouseWorkflows.filter((w) => w.status === "active")
        .length,
      totalExecutions: warehouseExecutions.length,
      successfulExecutions: warehouseExecutions.filter(
        (e) => e.status === "completed",
      ).length,
      failedExecutions: warehouseExecutions.filter((e) => e.status === "failed")
        .length,
      byType: {},
      averageExecutionTime: 0,
    };

    // Count by type
    warehouseWorkflows.forEach((w) => {
      stats.byType[w.type] = (stats.byType[w.type] || 0) + 1;
    });

    // Calculate average execution time
    const completedExecutions = warehouseExecutions.filter(
      (e) => e.status === "completed" && e.completedAt && e.startedAt,
    );

    if (completedExecutions.length > 0) {
      const totalTime = completedExecutions.reduce((sum, e) => {
        const start = new Date(e.startedAt).getTime();
        const end = new Date(e.completedAt!).getTime();
        return sum + (end - start);
      }, 0);
      stats.averageExecutionTime = totalTime / completedExecutions.length;
    }

    return stats;
  }

  /**
   * Get workflows by type
   */
  async getWorkflowsByType(
    warehouseId: string,
    type: WarehouseWorkflow["type"],
  ): Promise<WarehouseWorkflow[]> {
    return Array.from(this.warehouseWorkflows.values()).filter(
      (w) => w.warehouseId === warehouseId && w.type === type,
    );
  }

  /**
   * Get recent executions
   */
  async getRecentExecutions(
    warehouseId: string,
    limit: number = 50,
  ): Promise<WarehouseWorkflowExecution[]> {
    return Array.from(this.executions.values())
      .filter((e) => e.warehouseId === warehouseId)
      .sort((a, b) => {
        const aTime = new Date(a.startedAt).getTime();
        const bTime = new Date(b.startedAt).getTime();
        return bTime - aTime;
      })
      .slice(0, limit);
  }
}

export const warehouseWorkflowIntegration = new WarehouseWorkflowIntegration();
