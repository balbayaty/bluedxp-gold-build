/**
 * QHSE Approval Workflow Service
 * Multi-step approval workflows for incidents, inspections, and training
 * Integrated with platform approval system
 */

import { eventBus } from "@/lib/services/event-store";
import type { Incident, Inspection, TrainingRecord } from "@/types/qhse";

// ============================================================================
// APPROVAL WORKFLOW TYPES
// ============================================================================

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ApprovalAction =
  | "APPROVE"
  | "REJECT"
  | "DELEGATE"
  | "REQUEST_CHANGES";

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverRole: string;
  approverId?: string;
  approverName?: string;
  required: boolean;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: Date | string;
  rejectedAt?: Date | string;
  timeout?: number; // Hours
  escalationRole?: string;
  autoApproveConditions?: Record<string, any>;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  entityType:
    | "INCIDENT"
    | "INSPECTION"
    | "TRAINING"
    | "ENVIRONMENTAL_METRIC"
    | "AUDIT";
  steps: ApprovalStep[];
  autoApproveConditions?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PendingApproval {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  currentStep: number;
  status: ApprovalStatus;
  steps: ApprovalStep[];
  submittedBy: string;
  submittedAt: Date | string;
  completedAt?: Date | string;
  metadata?: Record<string, any>;
}

// ============================================================================
// APPROVAL WORKFLOW SERVICE
// ============================================================================

class QHSEApprovalWorkflowService {
  private workflows: Map<string, ApprovalWorkflow> = new Map();
  private pendingApprovals: Map<string, PendingApproval> = new Map();

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: ApprovalWorkflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Start approval workflow for an entity
   */
  async startApproval(
    workflowId: string,
    entityType: string,
    entityId: string,
    entityTitle: string,
    submittedBy: string,
    metadata?: Record<string, any>,
  ): Promise<PendingApproval> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Check auto-approve conditions
    if (
      workflow.autoApproveConditions &&
      (await this.evaluateAutoApprove(workflow.autoApproveConditions, metadata))
    ) {
      // Auto-approve
      const approval: PendingApproval = {
        id: `approval-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        workflowId,
        entityType,
        entityId,
        entityTitle,
        currentStep: workflow.steps.length,
        status: "APPROVED",
        steps: workflow.steps.map((step) => ({
          ...step,
          status: "APPROVED" as ApprovalStatus,
        })),
        submittedBy,
        submittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        metadata,
      };
      this.pendingApprovals.set(approval.id, approval);
      return approval;
    }

    // Create pending approval
    const approval: PendingApproval = {
      id: `approval-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workflowId,
      entityType,
      entityId,
      entityTitle,
      currentStep: 0,
      status: "PENDING",
      steps: workflow.steps.map((step) => ({
        ...step,
        status: "PENDING" as ApprovalStatus,
      })),
      submittedBy,
      submittedAt: new Date().toISOString(),
      metadata,
    };

    this.pendingApprovals.set(approval.id, approval);

    // Notify first approver
    if (workflow.steps.length > 0) {
      await this.notifyApprover(approval, 0);
    }

    // Publish event
    await eventBus.publish({
      type: "qhse.approval.started",
      payload: { approvalId: approval.id, entityType, entityId },
      timestamp: new Date().toISOString(),
    });

    return approval;
  }

  /**
   * Process approval step
   */
  async processApproval(
    approvalId: string,
    stepIndex: number,
    action: ApprovalAction,
    approverId: string,
    comments?: string,
  ): Promise<PendingApproval> {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    const step = approval.steps[stepIndex];
    if (!step) {
      throw new Error(`Step ${stepIndex} not found`);
    }

    if (step.status !== "PENDING") {
      throw new Error(`Step ${stepIndex} already processed`);
    }

    // Update step
    if (action === "APPROVE") {
      step.status = "APPROVED";
      step.approvedAt = new Date().toISOString();
      step.approverId = approverId;
      step.comments = comments;
    } else if (action === "REJECT") {
      step.status = "REJECTED";
      approval.status = "REJECTED";
      step.rejectedAt = new Date().toISOString();
      step.approverId = approverId;
      step.comments = comments;
      this.pendingApprovals.set(approvalId, approval);

      await eventBus.publish({
        type: "qhse.approval.rejected",
        payload: { approvalId, stepIndex, approverId },
        timestamp: new Date().toISOString(),
      });

      return approval;
    } else if (action === "DELEGATE") {
      // Handle delegation
      // Would update approver
    } else if (action === "REQUEST_CHANGES") {
      // Handle change request
      // Would notify submitter
    }

    // Check if all steps completed
    const allStepsCompleted = approval.steps.every(
      (s) => s.status === "APPROVED" || s.status === "REJECTED",
    );
    if (allStepsCompleted && approval.status !== "REJECTED") {
      approval.status = "APPROVED";
      approval.completedAt = new Date().toISOString();
    } else {
      // Move to next step
      const nextStepIndex = stepIndex + 1;
      if (nextStepIndex < approval.steps.length) {
        approval.currentStep = nextStepIndex;
        await this.notifyApprover(approval, nextStepIndex);
      }
    }

    approval.updatedAt = new Date().toISOString();
    this.pendingApprovals.set(approvalId, approval);

    await eventBus.publish({
      type: "qhse.approval.updated",
      payload: { approvalId, stepIndex, action, approverId },
      timestamp: new Date().toISOString(),
    });

    return approval;
  }

  /**
   * Get pending approvals for user
   */
  getPendingApprovalsForUser(userId: string, role: string): PendingApproval[] {
    return Array.from(this.pendingApprovals.values()).filter((approval) => {
      if (approval.status !== "PENDING") return false;
      const currentStep = approval.steps[approval.currentStep];
      return (
        currentStep?.approverRole === role || currentStep?.approverId === userId
      );
    });
  }

  /**
   * Get approval by entity
   */
  getApprovalByEntity(
    entityType: string,
    entityId: string,
  ): PendingApproval | null {
    const approval = Array.from(this.pendingApprovals.values()).find(
      (a) => a.entityType === entityType && a.entityId === entityId,
    );
    return approval || null;
  }

  /**
   * Evaluate auto-approve conditions
   */
  private async evaluateAutoApprove(
    conditions: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    // Simple evaluation - can be enhanced
    if (!metadata) return false;

    for (const [key, value] of Object.entries(conditions)) {
      if (metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Notify approver
   */
  private async notifyApprover(
    approval: PendingApproval,
    stepIndex: number,
  ): Promise<void> {
    const step = approval.steps[stepIndex];
    if (!step) return;

    // Would send notification via notification service
    await eventBus.publish({
      type: "qhse.approval.notify",
      payload: {
        approvalId: approval.id,
        stepIndex,
        approverRole: step.approverRole,
        entityType: approval.entityType,
        entityId: approval.entityId,
        entityTitle: approval.entityTitle,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// DEFAULT WORKFLOWS
// ============================================================================

const service = new QHSEApprovalWorkflowService();

// Critical Incident Approval Workflow
service.registerWorkflow({
  id: "critical-incident-approval",
  name: "Critical Incident Approval",
  description: "Multi-step approval for critical incidents",
  entityType: "INCIDENT",
  steps: [
    {
      id: "step-1",
      stepNumber: 1,
      approverRole: "QHSE_MANAGER",
      required: true,
      status: "PENDING",
      timeout: 4, // 4 hours
      escalationRole: "QHSE_DIRECTOR",
    },
    {
      id: "step-2",
      stepNumber: 2,
      approverRole: "QHSE_DIRECTOR",
      required: true,
      status: "PENDING",
      timeout: 8,
    },
    {
      id: "step-3",
      stepNumber: 3,
      approverRole: "GENERAL_MANAGER",
      required: false, // Optional for critical incidents
      status: "PENDING",
    },
  ],
  autoApproveConditions: {
    severity: "LOW",
  },
});

// Inspection Approval Workflow
service.registerWorkflow({
  id: "inspection-approval",
  name: "Inspection Approval",
  description: "Approval workflow for inspections",
  entityType: "INSPECTION",
  steps: [
    {
      id: "step-1",
      stepNumber: 1,
      approverRole: "QHSE_OFFICER",
      required: true,
      status: "PENDING",
      timeout: 24,
    },
    {
      id: "step-2",
      stepNumber: 2,
      approverRole: "QHSE_MANAGER",
      required: true,
      status: "PENDING",
      timeout: 48,
    },
  ],
});

// Training Certification Approval
service.registerWorkflow({
  id: "training-certification-approval",
  name: "Training Certification Approval",
  description: "Approval for training certifications",
  entityType: "TRAINING",
  steps: [
    {
      id: "step-1",
      stepNumber: 1,
      approverRole: "TRAINING_MANAGER",
      required: true,
      status: "PENDING",
      timeout: 48,
    },
  ],
});

export const qhseApprovalWorkflowService = service;
