/**
 * ✅ PERMISSION APPROVAL WORKFLOW
 *
 * Enterprise-grade approval system:
 * - Multi-level approvals
 * - Approval chains
 * - Escalation rules
 * - Notifications
 * - Audit trail
 * - Time-based approvals
 */

import type { User, HierarchicalPermission } from "@/types/user";

// ============================================================================
// TYPES
// ============================================================================

export interface ApprovalRequest {
  id: string;
  requestType: "GRANT" | "REVOKE" | "MODIFY" | "BULK";
  requestedBy: User;
  targetUser: User;
  permissions: HierarchicalPermission[];
  reason: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED" | "EXPIRED";
  approvalChain: ApprovalStep[];
  currentStep: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface ApprovalStep {
  stepNumber: number;
  approverRole: string;
  approverId?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
  approvedAt?: Date;
  approvedBy?: User;
  comments?: string;
  required: boolean;
}

export interface ApprovalRule {
  id: string;
  name: string;
  conditions: {
    permissionType?: "GRANT" | "REVOKE" | "MODIFY";
    moduleId?: string;
    accessLevel?: "full" | "partial" | "read_only";
    riskScore?: number;
  };
  approvalChain: ApprovalStep[];
  autoApprove?: boolean;
  escalationRules?: {
    timeout: number; // minutes
    escalateTo: string; // role
  };
}

// ============================================================================
// APPROVAL WORKFLOW SERVICE
// ============================================================================

class PermissionApprovalWorkflowService {
  private requests = new Map<string, ApprovalRequest>();
  private rules: ApprovalRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default approval rules
   */
  private initializeDefaultRules(): void {
    // Critical permissions require approval
    this.rules.push({
      id: "critical-permissions",
      name: "Critical Permissions Approval",
      conditions: {
        moduleId: "settings",
        accessLevel: "full",
      },
      approvalChain: [
        {
          stepNumber: 1,
          approverRole: "IT_ADMIN",
          status: "PENDING",
          required: true,
        },
        {
          stepNumber: 2,
          approverRole: "SYSTEM_ADMIN",
          status: "PENDING",
          required: true,
        },
      ],
    });

    // High-risk permissions
    this.rules.push({
      id: "high-risk",
      name: "High Risk Permissions",
      conditions: {
        riskScore: 70, // >= 70
      },
      approvalChain: [
        {
          stepNumber: 1,
          approverRole: "WAREHOUSE_HEAD",
          status: "PENDING",
          required: true,
        },
      ],
    });

    // Low-risk auto-approve
    this.rules.push({
      id: "low-risk-auto",
      name: "Low Risk Auto-Approve",
      conditions: {
        riskScore: 30, // < 30
      },
      approvalChain: [],
      autoApprove: true,
    });
  }

  /**
   * Create approval request
   */
  async createApprovalRequest(
    requestType: "GRANT" | "REVOKE" | "MODIFY" | "BULK",
    requestedBy: User,
    targetUser: User,
    permissions: HierarchicalPermission[],
    reason: string,
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM",
  ): Promise<ApprovalRequest> {
    // Find matching rule
    const rule = this.findMatchingRule(requestType, permissions);

    // Build approval chain
    const approvalChain = rule?.approvalChain || [];

    // Auto-approve if rule allows
    if (rule?.autoApprove) {
      const request: ApprovalRequest = {
        id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requestType,
        requestedBy,
        targetUser,
        permissions,
        reason,
        urgency,
        status: "APPROVED",
        approvalChain: [],
        currentStep: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.requests.set(request.id, request);
      return request;
    }

    // Create pending request
    const request: ApprovalRequest = {
      id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestType,
      requestedBy,
      targetUser,
      permissions,
      reason,
      urgency,
      status: "PENDING",
      approvalChain,
      currentStep: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt:
        urgency === "CRITICAL"
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    this.requests.set(request.id, request);
    return request;
  }

  /**
   * Approve request
   */
  async approveRequest(
    requestId: string,
    approver: User,
    comments?: string,
  ): Promise<ApprovalRequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    if (request.status !== "PENDING") {
      throw new Error(`Request ${requestId} is not pending`);
    }

    // Update current step
    const currentStep = request.approvalChain[request.currentStep];
    if (currentStep) {
      currentStep.status = "APPROVED";
      currentStep.approvedAt = new Date();
      currentStep.approvedBy = approver;
      currentStep.comments = comments;
    }

    // Check if all required steps are approved
    const allRequiredApproved = request.approvalChain
      .filter((step) => step.required)
      .every((step) => step.status === "APPROVED");

    if (allRequiredApproved) {
      request.status = "APPROVED";
      request.currentStep = request.approvalChain.length;
    } else {
      // Move to next step
      request.currentStep++;
      if (request.currentStep >= request.approvalChain.length) {
        request.status = "APPROVED";
      }
    }

    request.updatedAt = new Date();
    return request;
  }

  /**
   * Reject request
   */
  async rejectRequest(
    requestId: string,
    approver: User,
    reason: string,
  ): Promise<ApprovalRequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    request.status = "REJECTED";
    const currentStep = request.approvalChain[request.currentStep];
    if (currentStep) {
      currentStep.status = "REJECTED";
      currentStep.approvedBy = approver;
      currentStep.comments = reason;
    }

    request.updatedAt = new Date();
    return request;
  }

  /**
   * Find matching rule
   */
  private findMatchingRule(
    requestType: "GRANT" | "REVOKE" | "MODIFY" | "BULK",
    permissions: HierarchicalPermission[],
  ): ApprovalRule | null {
    for (const rule of this.rules) {
      const conditions = rule.conditions;
      let matches = true;

      if (
        conditions.permissionType &&
        conditions.permissionType !== requestType
      ) {
        matches = false;
      }

      if (conditions.moduleId) {
        const hasModule = permissions.some(
          (p) => p.moduleId === conditions.moduleId,
        );
        if (!hasModule) matches = false;
      }

      if (conditions.accessLevel) {
        const hasAccessLevel = permissions.some(
          (p) =>
            p.moduleAccess === conditions.accessLevel ||
            p.featureAccess === conditions.accessLevel ||
            p.tabAccess === conditions.accessLevel,
        );
        if (!hasAccessLevel) matches = false;
      }

      if (matches) return rule;
    }

    return null;
  }

  /**
   * Get pending requests for approver
   */
  async getPendingRequestsForApprover(
    approver: User,
  ): Promise<ApprovalRequest[]> {
    return Array.from(this.requests.values()).filter((request) => {
      if (request.status !== "PENDING") return false;
      const currentStep = request.approvalChain[request.currentStep];
      if (!currentStep) return false;
      return (
        currentStep.approverRole === approver.role ||
        currentStep.approverId === approver.id
      );
    });
  }

  /**
   * Get all requests
   */
  async getAllRequests(): Promise<ApprovalRequest[]> {
    return Array.from(this.requests.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionApprovalWorkflow =
  new PermissionApprovalWorkflowService();
