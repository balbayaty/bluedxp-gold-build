/**
 * Compliance Governance and Approval Workflow Service
 * Manages approval workflows, role-based governance, and compliance policies
 */

import {
  ComplianceRecord,
  ComplianceRecommendation,
  ApprovalStatus,
  ApprovalWorkflow,
  ApprovalStep,
  ComplianceAction,
  AuditLogEntry,
} from "@/types/compliance";

// ============================================================================
// APPROVAL WORKFLOW ENGINE
// ============================================================================

class ApprovalWorkflowEngine {
  private workflows: Map<string, ApprovalWorkflow> = new Map();
  private pendingApprovals: Map<string, PendingApproval> = new Map();

  /**
   * Register approval workflow
   */
  registerWorkflow(workflow: ApprovalWorkflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Start approval process
   */
  async startApprovalProcess(
    workflowId: string,
    entityType: string,
    entityId: string,
    data: any,
  ): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Check auto-approve conditions
    if (workflow.autoApproveConditions) {
      if (
        await this.evaluateAutoApproveConditions(
          workflow.autoApproveConditions,
          data,
        )
      ) {
        return "AUTO_APPROVED";
      }
    }

    // Create pending approval
    const approvalId = `approval-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const pendingApproval: PendingApproval = {
      id: approvalId,
      workflowId,
      entityType,
      entityId,
      data,
      currentStep: 0,
      steps: workflow.steps.map((step) => ({
        stepId: step.id,
        stepNumber: step.stepNumber,
        approverRole: step.approverRole,
        approverUserId: step.approverUserId,
        status: "PENDING",
        startedAt: step.stepNumber === 1 ? new Date().toISOString() : undefined,
        completedAt: undefined,
        approvedBy: undefined,
        comments: undefined,
        timeout: step.timeout,
        escalationRole: step.escalationRole,
      })),
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.pendingApprovals.set(approvalId, pendingApproval);

    // Notify first approver
    await this.notifyApprover(pendingApproval, 0);

    return approvalId;
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
    step.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    step.completedAt = new Date().toISOString();
    step.approvedBy = approverId;
    step.comments = comments;

    if (action === "REJECT") {
      approval.status = "REJECTED";
      approval.updatedAt = new Date().toISOString();
      this.pendingApprovals.set(approvalId, approval);
      return approval;
    }

    // Check if all steps completed
    const allStepsCompleted = approval.steps.every(
      (s) => s.status === "APPROVED" || s.status === "SKIPPED",
    );
    if (allStepsCompleted) {
      approval.status = "APPROVED";
      approval.completedAt = new Date().toISOString();
    } else {
      // Move to next step
      const nextStepIndex = stepIndex + 1;
      if (nextStepIndex < approval.steps.length) {
        const nextStep = approval.steps[nextStepIndex];
        nextStep.startedAt = new Date().toISOString();
        await this.notifyApprover(approval, nextStepIndex);
      }
    }

    approval.updatedAt = new Date().toISOString();
    this.pendingApprovals.set(approvalId, approval);

    return approval;
  }

  /**
   * Evaluate auto-approve conditions
   */
  private async evaluateAutoApproveConditions(
    conditions: Record<string, any>,
    data: any,
  ): Promise<boolean> {
    // Simple condition evaluation (would use JSONLogic or similar in production)
    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) {
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
    // Would send notification via notification service
    console.log(
      `Notifying approver for step ${step.stepNumber}: ${step.approverRole}`,
    );
  }

  /**
   * Get pending approvals for user
   */
  getPendingApprovalsForUser(
    userId: string,
    userRoles: string[],
  ): PendingApproval[] {
    return Array.from(this.pendingApprovals.values()).filter((approval) => {
      if (approval.status !== "IN_PROGRESS") return false;

      const currentStep = approval.steps[approval.currentStep];
      if (!currentStep) return false;

      return (
        currentStep.status === "PENDING" &&
        (userRoles.includes(currentStep.approverRole) ||
          currentStep.approverUserId === userId)
      );
    });
  }

  /**
   * Get approval by ID
   */
  getApproval(id: string): PendingApproval | undefined {
    return this.pendingApprovals.get(id);
  }
}

interface PendingApproval {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  data: any;
  currentStep: number;
  steps: Array<{
    stepId: string;
    stepNumber: number;
    approverRole: string;
    approverUserId?: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
    startedAt?: string;
    completedAt?: string;
    approvedBy?: string;
    comments?: string;
    timeout?: number;
    escalationRole?: string;
  }>;
  status: "IN_PROGRESS" | "APPROVED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const workflowEngine = new ApprovalWorkflowEngine();

// ============================================================================
// GOVERNANCE POLICIES
// ============================================================================

interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  scope: "TENANT" | "CUSTOMER" | "WAREHOUSE" | "GLOBAL";
  rules: PolicyRule[];
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface PolicyRule {
  id: string;
  condition: string;
  action: "ALLOW" | "BLOCK" | "REQUIRE_APPROVAL" | "NOTIFY";
  target: string[];
  parameters?: Record<string, any>;
}

class GovernancePolicyEngine {
  private policies: Map<string, GovernancePolicy> = new Map();

  /**
   * Register governance policy
   */
  registerPolicy(policy: GovernancePolicy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Evaluate policies for action
   */
  async evaluatePolicies(
    action: string,
    context: Record<string, any>,
  ): Promise<PolicyEvaluationResult> {
    const applicablePolicies = Array.from(this.policies.values())
      .filter((p) => p.enabled)
      .sort((a, b) => b.priority - a.priority);

    const results: PolicyEvaluationResult = {
      allowed: true,
      blocked: false,
      requiresApproval: false,
      notifications: [],
      approvalWorkflowId: undefined,
    };

    for (const policy of applicablePolicies) {
      for (const rule of policy.rules) {
        if (this.matchesCondition(rule.condition, context)) {
          if (rule.action === "BLOCK") {
            results.allowed = false;
            results.blocked = true;
            results.blockReason = `Policy ${policy.name} blocks this action`;
            return results;
          } else if (rule.action === "REQUIRE_APPROVAL") {
            results.requiresApproval = true;
            results.approvalWorkflowId = rule.parameters?.workflowId;
          } else if (rule.action === "NOTIFY") {
            results.notifications.push({
              type: "POLICY_NOTIFICATION",
              message: `Policy ${policy.name} triggered`,
              recipients: rule.target,
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Check if condition matches
   */
  private matchesCondition(
    condition: string,
    context: Record<string, any>,
  ): boolean {
    // Simple condition matching (would use JSONLogic in production)
    try {
      const evalCondition = condition.replace(/\$\{(\w+)\}/g, (match, key) => {
        return JSON.stringify(context[key] ?? null);
      });
      return eval(evalCondition); // In production, use safe evaluator
    } catch {
      return false;
    }
  }
}

interface PolicyEvaluationResult {
  allowed: boolean;
  blocked: boolean;
  blockReason?: string;
  requiresApproval: boolean;
  approvalWorkflowId?: string;
  notifications: Array<{
    type: string;
    message: string;
    recipients: string[];
  }>;
}

const policyEngine = new GovernancePolicyEngine();

// ============================================================================
// DEFAULT WORKFLOWS
// ============================================================================

/**
 * Create default approval workflows
 */
export function createDefaultWorkflows(): void {
  // Compliance recommendation approval workflow
  workflowEngine.registerWorkflow({
    id: "compliance-recommendation-approval",
    name: "Compliance Recommendation Approval",
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        approverRole: "COMPLIANCE_MANAGER",
        required: true,
        timeout: 24, // 24 hours
        escalationRole: "COMPLIANCE_DIRECTOR",
      },
      {
        id: "step-2",
        stepNumber: 2,
        approverRole: "COMPLIANCE_DIRECTOR",
        required: false, // Optional second approval
      },
    ],
    autoApproveConditions: {
      confidence: 95,
      priority: "LOW",
    },
  });

  // Regulatory update approval workflow
  workflowEngine.registerWorkflow({
    id: "regulatory-update-approval",
    name: "Regulatory Update Approval",
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        approverRole: "COMPLIANCE_OFFICER",
        required: true,
        timeout: 48,
      },
      {
        id: "step-2",
        stepNumber: 2,
        approverRole: "LEGAL_ADVISOR",
        required: true,
        timeout: 48,
      },
      {
        id: "step-3",
        stepNumber: 3,
        approverRole: "COMPLIANCE_DIRECTOR",
        required: true,
      },
    ],
  });

  // High-risk compliance action approval workflow
  workflowEngine.registerWorkflow({
    id: "high-risk-action-approval",
    name: "High-Risk Compliance Action Approval",
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        approverRole: "COMPLIANCE_MANAGER",
        required: true,
        timeout: 12,
      },
      {
        id: "step-2",
        stepNumber: 2,
        approverRole: "COMPLIANCE_DIRECTOR",
        required: true,
        timeout: 12,
      },
      {
        id: "step-3",
        stepNumber: 3,
        approverRole: "CHIEF_COMPLIANCE_OFFICER",
        required: true,
      },
    ],
  });
}

// ============================================================================
// DEFAULT POLICIES
// ============================================================================

/**
 * Create default governance policies
 */
export function createDefaultPolicies(): void {
  // Auto-block critical violations
  policyEngine.registerPolicy({
    id: "auto-block-critical-violations",
    name: "Auto-Block Critical Violations",
    description:
      "Automatically block operations when critical compliance violations are detected",
    scope: "GLOBAL",
    rules: [
      {
        id: "rule-1",
        condition:
          '${violationSeverity} === "CRITICAL" && ${violationCount} > 0',
        action: "BLOCK",
        target: ["operations"],
      },
    ],
    enabled: true,
    priority: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Require approval for high-risk recommendations
  policyEngine.registerPolicy({
    id: "require-approval-high-risk",
    name: "Require Approval for High-Risk Recommendations",
    description:
      "Require approval workflow for high-risk compliance recommendations",
    scope: "GLOBAL",
    rules: [
      {
        id: "rule-2",
        condition:
          '${recommendationPriority} === "CRITICAL" || ${recommendationPriority} === "HIGH"',
        action: "REQUIRE_APPROVAL",
        target: ["recommendations"],
        parameters: {
          workflowId: "compliance-recommendation-approval",
        },
      },
    ],
    enabled: true,
    priority: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Notify on compliance score drop
  policyEngine.registerPolicy({
    id: "notify-compliance-drop",
    name: "Notify on Compliance Score Drop",
    description:
      "Send notifications when compliance score drops below threshold",
    scope: "GLOBAL",
    rules: [
      {
        id: "rule-3",
        condition: "${complianceScore} < 70",
        action: "NOTIFY",
        target: ["compliance_team", "management"],
      },
    ],
    enabled: true,
    priority: 80,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const governanceService = {
  // Workflows
  registerWorkflow: (workflow: ApprovalWorkflow) =>
    workflowEngine.registerWorkflow(workflow),
  startApprovalProcess: (
    workflowId: string,
    entityType: string,
    entityId: string,
    data: any,
  ) =>
    workflowEngine.startApprovalProcess(workflowId, entityType, entityId, data),
  processApprovalStep: (
    approvalId: string,
    stepIndex: number,
    action: "APPROVE" | "REJECT",
    approverId: string,
    comments?: string,
  ) =>
    workflowEngine.processApprovalStep(
      approvalId,
      stepIndex,
      action,
      approverId,
      comments,
    ),
  getPendingApprovalsForUser: (userId: string, userRoles: string[]) =>
    workflowEngine.getPendingApprovalsForUser(userId, userRoles),
  getApproval: (id: string) => workflowEngine.getApproval(id),

  // Policies
  registerPolicy: (policy: GovernancePolicy) =>
    policyEngine.registerPolicy(policy),
  evaluatePolicies: (action: string, context: Record<string, any>) =>
    policyEngine.evaluatePolicies(action, context),

  // Initialization
  createDefaultWorkflows,
  createDefaultPolicies,
};

// Initialize defaults
createDefaultWorkflows();
createDefaultPolicies();

export default governanceService;
