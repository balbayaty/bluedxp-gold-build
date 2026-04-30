/**
 * Proposal Approval Workflow Service
 * Integrated with compliance/governance system for seamless approvals
 */

import { eventBus } from "@/lib/services/event-bus";
import { notificationService } from "@/lib/services/notifications/notificationService";
import type { Proposal } from "@/types/proposals";
import type { DomainEvent } from "@/types/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  steps: ApprovalStep[];
  autoApproveConditions?: Record<string, any>;
  entityType: "PROPOSAL" | "RFQ";
}

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  name: string;
  approverRole: string;
  approverUserId?: string;
  required: boolean;
  timeout?: number; // hours
  escalationRole?: string;
  conditions?: Record<string, any>;
}

export interface ProposalApprovalRequest {
  id: string;
  proposalId: string;
  workflowId: string;
  status: "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED" | "AUTO_APPROVED";
  currentStep: number;
  steps: ApprovalStepStatus[];
  submittedBy: string;
  submittedAt: Date | string;
  completedAt?: Date | string;
  comments?: string;
}

export interface ApprovalStepStatus {
  stepId: string;
  stepNumber: number;
  status: "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED" | "SKIPPED";
  approverRole: string;
  approverUserId?: string;
  approvedBy?: string;
  approvedAt?: Date | string;
  comments?: string;
  timeout?: number;
  escalated?: boolean;
}

// ============================================================================
// PROPOSAL APPROVAL SERVICE
// ============================================================================

class ProposalApprovalService {
  private workflows: Map<string, ProposalApprovalWorkflow> = new Map();
  private approvals: Map<string, ProposalApprovalRequest> = new Map();

  constructor() {
    this.initializeDefaultWorkflows();
    this.initializeEventHandlers();
  }

  /**
   * Initialize default approval workflows
   */
  private initializeDefaultWorkflows(): void {
    // Standard Proposal Approval Workflow
    const standardProposalWorkflow: ProposalApprovalWorkflow = {
      id: "standard-proposal-approval",
      name: "Standard Proposal Approval",
      description: "Standard workflow for proposal approvals",
      entityType: "PROPOSAL",
      steps: [
        {
          id: "manager-review",
          stepNumber: 1,
          name: "Manager Review",
          approverRole: "MANAGER",
          required: true,
          timeout: 24,
          escalationRole: "DIRECTOR",
        },
        {
          id: "finance-approval",
          stepNumber: 2,
          name: "Finance Approval",
          approverRole: "FINANCE_MANAGER",
          required: true,
          conditions: {
            totalAmount: { $gt: 50000 }, // Only required if amount > 50K
          },
          timeout: 48,
        },
        {
          id: "director-approval",
          stepNumber: 3,
          name: "Director Approval",
          approverRole: "DIRECTOR",
          required: true,
          conditions: {
            totalAmount: { $gt: 100000 }, // Only required if amount > 100K
          },
          timeout: 72,
        },
      ],
      autoApproveConditions: {
        totalAmount: { $lt: 10000 }, // Auto-approve if amount < 10K
      },
    };

    this.workflows.set(standardProposalWorkflow.id, standardProposalWorkflow);

    // High-Value Proposal Approval Workflow
    const highValueWorkflow: ProposalApprovalWorkflow = {
      id: "high-value-proposal-approval",
      name: "High-Value Proposal Approval",
      description: "Multi-level approval for high-value proposals",
      entityType: "PROPOSAL",
      steps: [
        {
          id: "manager-review",
          stepNumber: 1,
          name: "Manager Review",
          approverRole: "MANAGER",
          required: true,
          timeout: 12,
        },
        {
          id: "finance-approval",
          stepNumber: 2,
          name: "Finance Approval",
          approverRole: "FINANCE_MANAGER",
          required: true,
          timeout: 24,
        },
        {
          id: "director-approval",
          stepNumber: 3,
          name: "Director Approval",
          approverRole: "DIRECTOR",
          required: true,
          timeout: 48,
        },
        {
          id: "ceo-approval",
          stepNumber: 4,
          name: "CEO Approval",
          approverRole: "CEO",
          required: true,
          conditions: {
            totalAmount: { $gt: 500000 }, // Only required if amount > 500K
          },
          timeout: 72,
        },
      ],
    };

    this.workflows.set(highValueWorkflow.id, highValueWorkflow);

    // RFQ Approval Workflow
    const rfqWorkflow: ProposalApprovalWorkflow = {
      id: "rfq-approval",
      name: "RFQ Approval",
      description: "Workflow for RFQ approvals",
      entityType: "RFQ",
      steps: [
        {
          id: "manager-review",
          stepNumber: 1,
          name: "Manager Review",
          approverRole: "MANAGER",
          required: true,
          timeout: 24,
        },
        {
          id: "operations-approval",
          stepNumber: 2,
          name: "Operations Approval",
          approverRole: "OPERATIONS_MANAGER",
          required: true,
          timeout: 48,
        },
      ],
      autoApproveConditions: {
        estimatedValue: { $lt: 5000 },
      },
    };

    this.workflows.set(rfqWorkflow.id, rfqWorkflow);
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    // Listen to governance approval events
    eventBus.subscribe(
      "compliance.approval.approved",
      async (event: DomainEvent) => {
        await this.handleApprovalApproved(event);
      },
    );

    eventBus.subscribe(
      "compliance.approval.rejected",
      async (event: DomainEvent) => {
        await this.handleApprovalRejected(event);
      },
    );

    eventBus.subscribe(
      "compliance.approval.step.completed",
      async (event: DomainEvent) => {
        await this.handleApprovalStepCompleted(event);
      },
    );
  }

  /**
   * Start approval process for proposal
   */
  async startApproval(
    proposalId: string,
    workflowId: string,
    proposal: Proposal,
    submittedBy: string,
  ): Promise<ProposalApprovalRequest> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Check auto-approve conditions
    if (workflow.autoApproveConditions) {
      if (
        this.evaluateAutoApproveConditions(
          workflow.autoApproveConditions,
          proposal,
        )
      ) {
        const autoApproval: ProposalApprovalRequest = {
          id: `approval-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          proposalId,
          workflowId,
          status: "AUTO_APPROVED",
          currentStep: workflow.steps.length,
          steps: workflow.steps.map((step) => ({
            stepId: step.id,
            stepNumber: step.stepNumber,
            status: "APPROVED",
            approverRole: step.approverRole,
            approvedAt: new Date().toISOString(),
          })),
          submittedBy,
          submittedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          comments: "Auto-approved based on conditions",
        };

        this.approvals.set(autoApproval.id, autoApproval);

        // Publish event
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "proposals.proposal.auto-approved",
          aggregateId: proposalId,
          aggregateType: "PROPOSAL",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
            proposalId,
            approvalId: autoApproval.id,
            reason: "Auto-approve conditions met",
          },
        });

        return autoApproval;
      }
    }

    // Determine which steps are required based on conditions
    const requiredSteps = workflow.steps.filter((step) => {
      if (!step.conditions) return step.required;
      return this.evaluateStepConditions(step.conditions, proposal);
    });

    // Create approval request
    const approval: ProposalApprovalRequest = {
      id: `approval-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      proposalId,
      workflowId,
      status: "IN_PROGRESS",
      currentStep: 0,
      steps: workflow.steps.map((step) => {
        const isRequired = requiredSteps.some((s) => s.id === step.id);
        return {
          stepId: step.id,
          stepNumber: step.stepNumber,
          status:
            step.stepNumber === 1 && isRequired
              ? "IN_PROGRESS"
              : isRequired
                ? "PENDING"
                : "SKIPPED",
          approverRole: step.approverRole,
          approverUserId: step.approverUserId,
          timeout: step.timeout,
        };
      }),
      submittedBy,
      submittedAt: new Date().toISOString(),
    };

    this.approvals.set(approval.id, approval);

    // Notify first approver
    if (requiredSteps.length > 0) {
      await this.notifyApprover(approval, requiredSteps[0]);
    }

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.submitted-for-approval",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        proposalId,
        approvalId: approval.id,
        workflowId,
      },
    });

    return approval;
  }

  /**
   * Process approval step
   */
  async processApprovalStep(
    approvalId: string,
    stepIndex: number,
    action: "APPROVE" | "REJECT",
    approverId: string,
    comments?: string,
  ): Promise<ProposalApprovalRequest> {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    const step = approval.steps[stepIndex];
    if (!step) {
      throw new Error(`Step ${stepIndex} not found`);
    }

    if (step.status !== "IN_PROGRESS" && step.status !== "PENDING") {
      throw new Error(`Step ${stepIndex} already processed`);
    }

    // Update step
    step.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    step.approvedBy = approverId;
    step.approvedAt = new Date().toISOString();
    step.comments = comments;

    if (action === "REJECT") {
      approval.status = "REJECTED";
      approval.completedAt = new Date().toISOString();
      approval.comments = comments;
      this.approvals.set(approvalId, approval);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "proposals.proposal.approval.rejected",
        aggregateId: approval.proposalId,
        aggregateType: "PROPOSAL",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          proposalId: approval.proposalId,
          approvalId,
          stepIndex,
          approverId,
          comments,
        },
      });

      return approval;
    }

    // Check if all required steps completed
    const requiredSteps = approval.steps.filter((s) => s.status !== "SKIPPED");
    const allStepsCompleted = requiredSteps.every(
      (s) => s.status === "APPROVED",
    );

    if (allStepsCompleted) {
      approval.status = "APPROVED";
      approval.completedAt = new Date().toISOString();
    } else {
      // Move to next required step
      const nextStepIndex = this.findNextRequiredStep(approval, stepIndex);
      if (nextStepIndex !== -1) {
        approval.currentStep = nextStepIndex;
        approval.steps[nextStepIndex].status = "IN_PROGRESS";
        await this.notifyApprover(approval, approval.steps[nextStepIndex]);
      }
    }

    this.approvals.set(approvalId, approval);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.approval.step.completed",
      aggregateId: approval.proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        proposalId: approval.proposalId,
        approvalId,
        stepIndex,
        action,
        approverId,
      },
    });

    if (approval.status === "APPROVED") {
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "proposals.proposal.approval.approved",
        aggregateId: approval.proposalId,
        aggregateType: "PROPOSAL",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          proposalId: approval.proposalId,
          approvalId,
        },
      });
    }

    return approval;
  }

  /**
   * Find next required step
   */
  private findNextRequiredStep(
    approval: ProposalApprovalRequest,
    currentIndex: number,
  ): number {
    for (let i = currentIndex + 1; i < approval.steps.length; i++) {
      if (approval.steps[i].status === "PENDING") {
        return i;
      }
    }
    return -1;
  }

  /**
   * Notify approver
   */
  private async notifyApprover(
    approval: ProposalApprovalRequest,
    step: ApprovalStepStatus,
  ): Promise<void> {
    // In production, would fetch user email from user service
    const approverEmail = `approver-${step.approverRole.toLowerCase()}@example.com`;

    await notificationService.send({
      type: "approval_required",
      channel: "email",
      recipient: approverEmail,
      title: "Proposal Approval Required",
      message: `You have a pending approval for proposal ${approval.proposalId}. Step: ${step.stepNumber}`,
      data: {
        approvalId: approval.id,
        proposalId: approval.proposalId,
        stepId: step.stepId,
        stepNumber: step.stepNumber,
        approvalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/proposals/${approval.proposalId}/approve`,
      },
    });
  }

  /**
   * Evaluate auto-approve conditions
   */
  private evaluateAutoApproveConditions(
    conditions: Record<string, any>,
    proposal: Proposal,
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (typeof value === "object" && value !== null) {
        // Handle operators like { $lt: 10000 }
        if ("$lt" in value) {
          const proposalValue = (proposal as any)[key];
          if (typeof proposalValue === "number" && proposalValue >= value.$lt) {
            return false;
          }
        } else if ("$gt" in value) {
          const proposalValue = (proposal as any)[key];
          if (typeof proposalValue === "number" && proposalValue <= value.$gt) {
            return false;
          }
        }
      } else {
        const proposalValue = (proposal as any)[key];
        if (proposalValue !== value) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Evaluate step conditions
   */
  private evaluateStepConditions(
    conditions: Record<string, any>,
    proposal: Proposal,
  ): boolean {
    // Similar to evaluateAutoApproveConditions but returns true if conditions match
    for (const [key, value] of Object.entries(conditions)) {
      if (typeof value === "object" && value !== null) {
        if ("$gt" in value) {
          const proposalValue = (proposal as any)[key];
          if (typeof proposalValue === "number" && proposalValue <= value.$gt) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Get approval by ID
   */
  getApproval(id: string): ProposalApprovalRequest | undefined {
    return this.approvals.get(id);
  }

  /**
   * Get approvals for proposal
   */
  getApprovalsForProposal(proposalId: string): ProposalApprovalRequest[] {
    return Array.from(this.approvals.values()).filter(
      (a) => a.proposalId === proposalId,
    );
  }

  /**
   * Get pending approvals for user
   */
  getPendingApprovalsForUser(
    userId: string,
    userRoles: string[],
  ): ProposalApprovalRequest[] {
    return Array.from(this.approvals.values()).filter((approval) => {
      if (approval.status !== "IN_PROGRESS") return false;

      const currentStep = approval.steps[approval.currentStep];
      if (!currentStep) return false;

      return (
        currentStep.status === "IN_PROGRESS" &&
        (userRoles.includes(currentStep.approverRole) ||
          currentStep.approverUserId === userId)
      );
    });
  }

  /**
   * Register workflow
   */
  registerWorkflow(workflow: ProposalApprovalWorkflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Get workflow
   */
  getWorkflow(id: string): ProposalApprovalWorkflow | undefined {
    return this.workflows.get(id);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): ProposalApprovalWorkflow[] {
    return Array.from(this.workflows.values());
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  private async handleApprovalApproved(event: DomainEvent): Promise<void> {
    const { entityId } = event.payload || {};
    const approval = Array.from(this.approvals.values()).find(
      (a) => a.proposalId === entityId,
    );
    if (approval) {
      approval.status = "APPROVED";
      approval.completedAt = new Date().toISOString();
      this.approvals.set(approval.id, approval);
    }
  }

  private async handleApprovalRejected(event: DomainEvent): Promise<void> {
    const { entityId } = event.payload || {};
    const approval = Array.from(this.approvals.values()).find(
      (a) => a.proposalId === entityId,
    );
    if (approval) {
      approval.status = "REJECTED";
      approval.completedAt = new Date().toISOString();
      this.approvals.set(approval.id, approval);
    }
  }

  private async handleApprovalStepCompleted(event: DomainEvent): Promise<void> {
    // Handle step completion
    console.log("Approval step completed:", event.payload);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalApprovalService = new ProposalApprovalService();
