/**
 * Workflow Automation Service
 * Visual workflow builder and process automation
 * Enhanced for unified Process & Lifecycle Management module
 */

import { workflowDatabaseAdapter } from "../database/workflowDatabaseAdapter";

export interface WorkflowStep {
  id: string;
  name: string;
  type: "action" | "condition" | "approval" | "notification" | "integration";
  config: {
    action?: string;
    condition?: string;
    approver?: string;
    notification?: string;
    integration?: string;
    [key: string]: any;
  };
  position: { x: number; y: number };
  connections: string[]; // IDs of connected steps
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: {
    event: string;
    conditions?: Record<string, any>;
  }[];
  status: "draft" | "active" | "paused" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  recordId: string;
  status: "running" | "completed" | "failed" | "paused";
  currentStep: string;
  startedAt: string;
  completedAt?: string;
  steps: {
    stepId: string;
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    startedAt?: string;
    completedAt?: string;
    result?: any;
  }[];
  context?: Record<string, any>;
  progress?: number; // 0-100
  slaStatus?: "on_time" | "at_risk" | "breached";
  slaDeadline?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt">;
  sla?: {
    targetDuration: number; // milliseconds
    warningThreshold: number; // percentage
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStatistics {
  totalWorkflows: number;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  slaCompliance: number; // percentage
  topWorkflows: Array<{
    workflowId: string;
    name: string;
    executionCount: number;
  }>;
}

class WorkflowService {
  // Database adapter handles workflows and executions
  private dbAdapter = workflowDatabaseAdapter;
  // Templates kept in-memory for now (can be moved to DB later)
  private templates: Map<string, WorkflowTemplate> = new Map();

  /**
   * Create a new workflow
   */
  async createWorkflow(
    data: Omit<Workflow, "id" | "createdAt" | "updatedAt">,
    tenantId: string = "default",
  ): Promise<Workflow> {
    const workflow: Workflow = {
      id: `wf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.dbAdapter.storeWorkflow(tenantId, workflow);
    return workflow;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(
    id: string,
    tenantId: string = "default",
  ): Promise<Workflow | null> {
    return await this.dbAdapter.getWorkflow(tenantId, id);
  }

  /**
   * Get all workflows
   */
  async getWorkflows(tenantId: string): Promise<Workflow[]> {
    return await this.dbAdapter.getAllWorkflows(tenantId);
  }

  /**
   * Update workflow
   */
  async updateWorkflow(
    id: string,
    updates: Partial<Workflow>,
    tenantId: string = "default",
  ): Promise<Workflow | null> {
    const workflow = await this.dbAdapter.getWorkflow(tenantId, id);
    if (!workflow) return null;

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.dbAdapter.storeWorkflow(tenantId, updated);
    return updated;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowId: string,
    recordId: string,
    context: Record<string, any> = {},
    tenantId: string = "default",
  ): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(workflowId, tenantId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workflowId,
      recordId,
      status: "running",
      currentStep: workflow.steps[0]?.id || "",
      startedAt: new Date().toISOString(),
      steps: workflow.steps.map((step) => ({
        stepId: step.id,
        status: "pending",
      })),
      context,
    };

    await this.dbAdapter.storeExecution(tenantId, execution);

    // Execute workflow steps asynchronously
    this.executeSteps(execution, workflow, context, tenantId).catch(
      async (error) => {
        execution.status = "failed";
        execution.completedAt = new Date().toISOString();
        await this.dbAdapter.storeExecution(tenantId, execution);
        console.error("Workflow execution failed:", error);
      },
    );

    return execution;
  }

  /**
   * Execute workflow steps
   */
  private async executeSteps(
    execution: WorkflowExecution,
    workflow: Workflow,
    context: Record<string, any>,
    tenantId: string = "default",
  ): Promise<void> {
    for (const step of workflow.steps) {
      const stepExecution = execution.steps.find((s) => s.stepId === step.id);
      if (!stepExecution) continue;

      stepExecution.status = "running";
      stepExecution.startedAt = new Date().toISOString();
      execution.currentStep = step.id;
      await this.dbAdapter.storeExecution(tenantId, execution);

      try {
        const result = await this.executeStep(step, context);
        stepExecution.status = "completed";
        stepExecution.completedAt = new Date().toISOString();
        stepExecution.result = result;

        // Check if we should continue based on step type
        if (step.type === "condition" && !result.shouldContinue) {
          stepExecution.status = "skipped";
          break;
        }
      } catch (error) {
        stepExecution.status = "failed";
        stepExecution.completedAt = new Date().toISOString();
        execution.status = "failed";
        execution.completedAt = new Date().toISOString();
        await this.dbAdapter.storeExecution(tenantId, execution);
        throw error;
      }
    }

    execution.status = "completed";
    execution.completedAt = new Date().toISOString();
    await this.dbAdapter.storeExecution(tenantId, execution);
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    context: Record<string, any>,
  ): Promise<any> {
    switch (step.type) {
      case "action":
        return this.executeAction(step, context);
      case "condition":
        return this.evaluateCondition(step, context);
      case "approval":
        return this.requestApproval(step, context);
      case "notification":
        return this.sendNotification(step, context);
      case "integration":
        return this.callIntegration(step, context);
      default:
        return { success: true };
    }
  }

  /**
   * Execute action step
   */
  private async executeAction(
    step: WorkflowStep,
    context: Record<string, any>,
  ): Promise<any> {
    const action = step.config.action;
    // In production, this would execute actual actions
    return { success: true, action, message: `Action ${action} executed` };
  }

  /**
   * Evaluate condition step
   */
  private async evaluateCondition(
    step: WorkflowStep,
    context: Record<string, any>,
  ): Promise<any> {
    const condition = step.config.condition;
    // In production, this would evaluate actual conditions
    const result = true; // Simplified
    return { shouldContinue: result, condition };
  }

  /**
   * Request approval step
   */
  private async requestApproval(
    step: WorkflowStep,
    context: Record<string, any>,
  ): Promise<any> {
    const approver = step.config.approver;
    // In production, this would create an approval request
    return { success: true, approver, pending: true };
  }

  /**
   * Send notification step
   */
  private async sendNotification(
    step: WorkflowStep,
    context: Record<string, any>,
  ): Promise<any> {
    const notification = step.config.notification;
    // In production, this would send actual notifications
    return { success: true, notification, sent: true };
  }

  /**
   * Call integration step
   */
  private async callIntegration(
    step: WorkflowStep,
    context: Record<string, any>,
  ): Promise<any> {
    const integration = step.config.integration;
    // In production, this would call actual integrations
    return { success: true, integration, result: {} };
  }

  /**
   * Get execution by ID
   */
  async getExecution(
    id: string,
    tenantId: string = "default",
  ): Promise<WorkflowExecution | null> {
    return await this.dbAdapter.getExecution(tenantId, id);
  }

  /**
   * Get executions for a specific workflow
   */
  async getExecutionsForWorkflow(
    workflowId: string,
  ): Promise<WorkflowExecution[]> {
    return Array.from(this.executions.values()).filter(
      (exec) => exec.workflowId === workflowId,
    );
  }

  /**
   * Get executions for a specific record
   */
  async getExecutionsForRecord(recordId: string): Promise<WorkflowExecution[]> {
    return Array.from(this.executions.values()).filter(
      (e) => e.recordId === recordId,
    );
  }

  /**
   * Create workflow template
   */
  async createTemplate(
    template: Omit<WorkflowTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<WorkflowTemplate> {
    const newTemplate: WorkflowTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      ...template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<WorkflowTemplate | null> {
    return this.templates.get(id) || null;
  }

  /**
   * Get all templates
   */
  async getTemplates(category?: string): Promise<WorkflowTemplate[]> {
    let templates = Array.from(this.templates.values());
    if (category) {
      templates = templates.filter((t) => t.category === category);
    }
    return templates;
  }

  /**
   * Create workflow from template
   */
  async createWorkflowFromTemplate(
    templateId: string,
    overrides?: Partial<Workflow>,
  ): Promise<Workflow> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return this.createWorkflow({
      ...template.workflow,
      ...overrides,
    });
  }

  /**
   * Get workflow statistics
   */
  async getStatistics(tenantId?: string): Promise<WorkflowStatistics> {
    const allWorkflows = Array.from(this.workflows.values());
    const allExecutions = Array.from(this.executions.values());

    const completed = allExecutions.filter((e) => e.status === "completed");
    const failed = allExecutions.filter((e) => e.status === "failed");

    // Calculate average duration
    const durations = completed
      .filter((e) => e.completedAt && e.startedAt)
      .map(
        (e) =>
          new Date(e.completedAt!).getTime() - new Date(e.startedAt).getTime(),
      );
    const avgDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    // Calculate SLA compliance
    const slaCompliant = allExecutions.filter(
      (e) => e.slaStatus === "on_time",
    ).length;
    const slaCompliance =
      allExecutions.length > 0
        ? (slaCompliant / allExecutions.length) * 100
        : 100;

    // Get top workflows
    const workflowCounts = new Map<string, number>();
    allExecutions.forEach((e) => {
      workflowCounts.set(
        e.workflowId,
        (workflowCounts.get(e.workflowId) || 0) + 1,
      );
    });

    const topWorkflows = Array.from(workflowCounts.entries())
      .map(([workflowId, count]) => {
        const workflow = allWorkflows.find((w) => w.id === workflowId);
        return {
          workflowId,
          name: workflow?.name || "Unknown",
          executionCount: count,
        };
      })
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 10);

    return {
      totalWorkflows: allWorkflows.length,
      totalExecutions: allExecutions.length,
      completedExecutions: completed.length,
      failedExecutions: failed.length,
      averageDuration: avgDuration,
      slaCompliance,
      topWorkflows,
    };
  }

  /**
   * Filter workflows
   */
  async filterWorkflows(filters: {
    status?: Workflow["status"];
    category?: string;
    search?: string;
  }): Promise<Workflow[]> {
    let workflows = Array.from(this.workflows.values());

    if (filters.status) {
      workflows = workflows.filter((w) => w.status === filters.status);
    }

    if (filters.category) {
      workflows = workflows.filter((w) =>
        w.name.toLowerCase().includes(filters.category!.toLowerCase()),
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      workflows = workflows.filter(
        (w) =>
          w.name.toLowerCase().includes(searchLower) ||
          w.description.toLowerCase().includes(searchLower),
      );
    }

    return workflows;
  }

  /**
   * Update execution progress and SLA
   */
  async updateExecutionProgress(
    executionId: string,
    progress: number,
    tenantId: string = "default",
  ): Promise<void> {
    const execution = await this.dbAdapter.getExecution(tenantId, executionId);
    if (!execution) return;

    execution.progress = progress;

    // Check SLA if workflow has SLA
    const workflow = await this.dbAdapter.getWorkflow(
      tenantId,
      execution.workflowId,
    );
    if (workflow) {
      // Would check against SLA from template
      // For now, simple check
      const elapsed = Date.now() - new Date(execution.startedAt).getTime();
      // Assume 1 hour SLA for demo
      const slaDuration = 60 * 60 * 1000;
      const progressPercent = elapsed / slaDuration;

      if (progressPercent > 1) {
        execution.slaStatus = "breached";
      } else if (progressPercent > 0.8) {
        execution.slaStatus = "at_risk";
      } else {
        execution.slaStatus = "on_time";
      }
    }

    await this.dbAdapter.storeExecution(tenantId, execution);
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(
    id: string,
    tenantId: string = "default",
  ): Promise<boolean> {
    const workflow = await this.dbAdapter.getWorkflow(tenantId, id);
    if (!workflow) return false;

    // Note: Database adapter doesn't have delete method yet
    // Would need to add it for full functionality
    return true;
  }
}

export const workflowService = new WorkflowService();

export default workflowService;

// Export types
export type { WorkflowTemplate, WorkflowStatistics };
