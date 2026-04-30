/**
 * 🔄 ENHANCED WORKFLOW SERVICE
 * Complete workflow management with templates, instances, SLA tracking, and benchmarks
 *
 * Features:
 * - Workflow templates
 * - Workflow instances
 * - Progress tracking
 * - SLA management
 * - Filtering and statistics
 * - Workflow benchmarks
 *
 * Source: Adapted from chemcheck-analysis/lib/workflows/WorkflowService.ts
 * Architecture: Deep layer integration with Event Bus and existing workflow service
 */

import { eventBus } from "@/lib/services/event-bus";
import { workflowService } from "../process-lifecycle/workflow/workflowService";
import type {
  Workflow,
  WorkflowExecution,
} from "../process-lifecycle/workflow/workflowService";

// ============================================================================
// ENHANCED WORKFLOW TYPES
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt">;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  averageExecutionTime: number; // ms
  successRate: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowInstance {
  id: string;
  templateId?: string;
  workflowId: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  executions: WorkflowExecution[];
  statistics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecutionDate?: Date;
  };
  sla?: {
    targetCompletionTime: number; // ms
    warningThreshold: number; // percentage
    criticalThreshold: number; // percentage
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowSLA {
  workflowId: string;
  instanceId?: string;
  targetCompletionTime: number; // ms
  warningThreshold: number; // percentage (e.g., 80 = warn at 80% of target time)
  criticalThreshold: number; // percentage (e.g., 100 = critical at 100% of target time)
  currentExecutionTime?: number;
  status: "on_track" | "warning" | "critical" | "breached";
  lastChecked: Date;
}

export interface WorkflowBenchmark {
  id: string;
  workflowId: string;
  metric: string;
  value: number;
  unit: string;
  benchmark: number;
  performance: "excellent" | "good" | "average" | "poor";
  timestamp: Date;
}

export interface WorkflowStatistics {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  slaCompliance: number; // percentage
  topPerformingWorkflows: Array<{
    workflowId: string;
    name: string;
    successRate: number;
    averageTime: number;
  }>;
}

// ============================================================================
// ENHANCED WORKFLOW SERVICE
// ============================================================================

export class EnhancedWorkflowService {
  private static instance: EnhancedWorkflowService;
  private templates: Map<string, WorkflowTemplate> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private slas: Map<string, WorkflowSLA> = new Map();
  private benchmarks: Map<string, WorkflowBenchmark[]> = new Map();

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): EnhancedWorkflowService {
    if (!EnhancedWorkflowService.instance) {
      EnhancedWorkflowService.instance = new EnhancedWorkflowService();
    }
    return EnhancedWorkflowService.instance;
  }

  private async initializeService(): Promise<void> {
    console.log("🔄 Initializing Enhanced Workflow Service...");

    await eventBus.publish({
      type: "workflow.enhanced.initialized",
      data: {
        timestamp: new Date(),
        service: "EnhancedWorkflowService",
      },
    });
  }

  /**
   * Create workflow template
   */
  async createTemplate(
    template: Omit<
      WorkflowTemplate,
      | "id"
      | "usageCount"
      | "averageExecutionTime"
      | "successRate"
      | "createdAt"
      | "updatedAt"
    >,
  ): Promise<WorkflowTemplate> {
    const newTemplate: WorkflowTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      ...template,
      usageCount: 0,
      averageExecutionTime: 0,
      successRate: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(newTemplate.id, newTemplate);

    await eventBus.publish({
      type: "workflow.template.created",
      data: {
        templateId: newTemplate.id,
        name: newTemplate.name,
        timestamp: new Date(),
      },
    });

    return newTemplate;
  }

  /**
   * Create workflow instance from template
   */
  async createInstanceFromTemplate(
    templateId: string,
    instanceName: string,
    sla?: WorkflowSLA["sla"],
  ): Promise<WorkflowInstance> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Create workflow from template
    const workflow = await workflowService.createWorkflow({
      ...template.workflow,
      name: instanceName,
    });

    // Create instance
    const instance: WorkflowInstance = {
      id: `instance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      templateId,
      workflowId: workflow.id,
      name: instanceName,
      status: "draft",
      executions: [],
      statistics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
      },
      sla,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.instances.set(instance.id, instance);

    // Update template usage
    template.usageCount++;
    template.updatedAt = new Date();

    // Create SLA if provided
    if (sla) {
      await this.createSLA(workflow.id, instance.id, sla);
    }

    await eventBus.publish({
      type: "workflow.instance.created",
      data: {
        instanceId: instance.id,
        templateId,
        workflowId: workflow.id,
        timestamp: new Date(),
      },
    });

    return instance;
  }

  /**
   * Create SLA for workflow
   */
  async createSLA(
    workflowId: string,
    instanceId: string | undefined,
    sla: WorkflowSLA["sla"],
  ): Promise<WorkflowSLA> {
    const workflowSLA: WorkflowSLA = {
      workflowId,
      instanceId,
      targetCompletionTime: sla.targetCompletionTime,
      warningThreshold: sla.warningThreshold,
      criticalThreshold: sla.criticalThreshold,
      status: "on_track",
      lastChecked: new Date(),
    };

    this.slas.set(workflowId, workflowSLA);

    await eventBus.publish({
      type: "workflow.sla.created",
      data: {
        workflowId,
        instanceId,
        targetCompletionTime: sla.targetCompletionTime,
        timestamp: new Date(),
      },
    });

    return workflowSLA;
  }

  /**
   * Execute workflow and track progress
   */
  async executeWorkflowWithTracking(
    workflowId: string,
    recordId: string,
    context: Record<string, any> = {},
  ): Promise<WorkflowExecution> {
    const startTime = Date.now();

    // Execute workflow
    const execution = await workflowService.executeWorkflow(
      workflowId,
      recordId,
      context,
    );

    const executionTime = Date.now() - startTime;

    // Update instance statistics
    const instance = Array.from(this.instances.values()).find(
      (inst) => inst.workflowId === workflowId,
    );

    if (instance) {
      instance.executions.push(execution);
      instance.statistics.totalExecutions++;
      if (execution.status === "completed") {
        instance.statistics.successfulExecutions++;
      } else if (execution.status === "failed") {
        instance.statistics.failedExecutions++;
      }
      instance.statistics.averageExecutionTime = Math.round(
        (instance.statistics.averageExecutionTime *
          (instance.statistics.totalExecutions - 1) +
          executionTime) /
          instance.statistics.totalExecutions,
      );
      instance.statistics.lastExecutionDate = new Date();
      instance.updatedAt = new Date();
    }

    // Check SLA
    const sla = this.slas.get(workflowId);
    if (sla) {
      await this.checkSLA(workflowId, executionTime);
    }

    // Update template statistics
    if (instance?.templateId) {
      const template = this.templates.get(instance.templateId);
      if (template) {
        template.averageExecutionTime = Math.round(
          (template.averageExecutionTime * template.usageCount +
            executionTime) /
            (template.usageCount + 1),
        );
        if (execution.status === "completed") {
          template.successRate = Math.round(
            (template.successRate * template.usageCount + 100) /
              (template.usageCount + 1),
          );
        }
        template.updatedAt = new Date();
      }
    }

    // Record benchmark
    await this.recordBenchmark(
      workflowId,
      "execution_time",
      executionTime,
      "ms",
    );

    await eventBus.publish({
      type: "workflow.execution.tracked",
      data: {
        executionId: execution.id,
        workflowId,
        executionTime,
        status: execution.status,
        timestamp: new Date(),
      },
    });

    return execution;
  }

  /**
   * Check SLA compliance
   */
  private async checkSLA(
    workflowId: string,
    executionTime: number,
  ): Promise<void> {
    const sla = this.slas.get(workflowId);
    if (!sla) return;

    sla.currentExecutionTime = executionTime;
    sla.lastChecked = new Date();

    const percentage = (executionTime / sla.targetCompletionTime) * 100;

    if (percentage >= sla.criticalThreshold) {
      sla.status = "breached";
    } else if (percentage >= sla.warningThreshold) {
      sla.status = "critical";
    } else if (percentage >= sla.warningThreshold * 0.8) {
      sla.status = "warning";
    } else {
      sla.status = "on_track";
    }

    await eventBus.publish({
      type: "workflow.sla.checked",
      data: {
        workflowId,
        status: sla.status,
        executionTime,
        targetTime: sla.targetCompletionTime,
        percentage,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Record workflow benchmark
   */
  async recordBenchmark(
    workflowId: string,
    metric: string,
    value: number,
    unit: string,
    benchmark?: number,
  ): Promise<WorkflowBenchmark> {
    const benchmarkValue: WorkflowBenchmark = {
      id: `benchmark-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workflowId,
      metric,
      value,
      unit,
      benchmark: benchmark || value,
      performance:
        value <= (benchmark || value) * 1.1
          ? "excellent"
          : value <= (benchmark || value) * 1.3
            ? "good"
            : value <= (benchmark || value) * 1.5
              ? "average"
              : "poor",
      timestamp: new Date(),
    };

    if (!this.benchmarks.has(workflowId)) {
      this.benchmarks.set(workflowId, []);
    }
    this.benchmarks.get(workflowId)!.push(benchmarkValue);

    // Keep only last 100 benchmarks per workflow
    const benchmarks = this.benchmarks.get(workflowId)!;
    if (benchmarks.length > 100) {
      benchmarks.shift();
    }

    return benchmarkValue;
  }

  /**
   * Get workflow statistics
   */
  async getStatistics(tenantId?: string): Promise<WorkflowStatistics> {
    const allInstances = Array.from(this.instances.values());
    const allExecutions = allInstances.flatMap((inst) => inst.executions);

    const successful = allExecutions.filter(
      (e) => e.status === "completed",
    ).length;
    const failed = allExecutions.filter((e) => e.status === "failed").length;

    const totalExecutionTime = allExecutions.reduce((sum, e) => {
      if (e.completedAt && e.startedAt) {
        return (
          sum +
          (new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime())
        );
      }
      return sum;
    }, 0);

    const averageExecutionTime =
      allExecutions.length > 0
        ? Math.round(totalExecutionTime / allExecutions.length)
        : 0;

    // Calculate SLA compliance
    const slasWithStatus = Array.from(this.slas.values());
    const compliant = slasWithStatus.filter(
      (s) => s.status === "on_track",
    ).length;
    const slaCompliance =
      slasWithStatus.length > 0
        ? Math.round((compliant / slasWithStatus.length) * 100)
        : 100;

    // Top performing workflows
    const topPerforming = allInstances
      .map((inst) => ({
        workflowId: inst.workflowId,
        name: inst.name,
        successRate:
          inst.statistics.totalExecutions > 0
            ? Math.round(
                (inst.statistics.successfulExecutions /
                  inst.statistics.totalExecutions) *
                  100,
              )
            : 100,
        averageTime: inst.statistics.averageExecutionTime,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);

    return {
      totalWorkflows: allInstances.length,
      activeWorkflows: allInstances.filter((inst) => inst.status === "active")
        .length,
      totalExecutions: allExecutions.length,
      successfulExecutions: successful,
      failedExecutions: failed,
      averageExecutionTime,
      slaCompliance,
      topPerformingWorkflows: topPerforming,
    };
  }

  /**
   * Get workflow templates
   */
  async getTemplates(filters?: {
    category?: string;
    isPublic?: boolean;
    tags?: string[];
  }): Promise<WorkflowTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.category) {
        templates = templates.filter((t) => t.category === filters.category);
      }
      if (filters.isPublic !== undefined) {
        templates = templates.filter((t) => t.isPublic === filters.isPublic);
      }
      if (filters.tags?.length) {
        templates = templates.filter((t) =>
          filters.tags!.some((tag) => t.tags.includes(tag)),
        );
      }
    }

    return templates.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Get workflow instances
   */
  async getInstances(filters?: {
    status?: WorkflowInstance["status"];
    templateId?: string;
  }): Promise<WorkflowInstance[]> {
    let instances = Array.from(this.instances.values());

    if (filters) {
      if (filters.status) {
        instances = instances.filter((inst) => inst.status === filters.status);
      }
      if (filters.templateId) {
        instances = instances.filter(
          (inst) => inst.templateId === filters.templateId,
        );
      }
    }

    return instances.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  /**
   * Get SLA for workflow
   */
  async getSLA(workflowId: string): Promise<WorkflowSLA | null> {
    return this.slas.get(workflowId) || null;
  }

  /**
   * Get benchmarks for workflow
   */
  async getBenchmarks(workflowId: string): Promise<WorkflowBenchmark[]> {
    return this.benchmarks.get(workflowId) || [];
  }
}

// Singleton instance
export const enhancedWorkflowService = EnhancedWorkflowService.getInstance();
