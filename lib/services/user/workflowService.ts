/**
 * 🚀 WORKFLOW SERVICE
 *
 * Approval workflows and automation for user management
 * - Permission change approvals
 * - Automated user provisioning
 * - Automated deprovisioning
 * - Scheduled tasks
 * - Workflow engine integration
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import { userService } from "./userService";
import { permissionService } from "./permissionService";
import { auditService } from "@/lib/services/audit/auditService";

// ============================================================================
// TYPES
// ============================================================================

export interface ApprovalRequest {
  id: string;
  type:
    | "permission_change"
    | "role_assignment"
    | "user_creation"
    | "user_deletion"
    | "custom";
  requesterId: string;
  targetUserId?: string;
  data: any;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approvers: Array<{
    userId: string;
    status: "pending" | "approved" | "rejected";
    approvedAt?: Date;
    comment?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger:
    | "user_created"
    | "user_inactive"
    | "permission_change"
    | "role_change"
    | "custom";
  conditions: Array<{
    field: string;
    operator:
      | "equals"
      | "not_equals"
      | "contains"
      | "greater_than"
      | "less_than";
    value: any;
  }>;
  actions: Array<{
    type:
      | "assign_role"
      | "grant_permission"
      | "revoke_permission"
      | "send_notification"
      | "create_approval"
      | "custom";
    params: any;
  }>;
  enabled: boolean;
}

export interface ScheduledTask {
  id: string;
  name: string;
  type:
    | "permission_review"
    | "user_audit"
    | "inactive_user_cleanup"
    | "quota_check"
    | "custom";
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "custom";
    time?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  lastRun?: Date;
  nextRun: Date;
  enabled: boolean;
  config: any;
}

// ============================================================================
// WORKFLOW SERVICE
// ============================================================================

class WorkflowService {
  /**
   * Create approval request
   */
  async createApprovalRequest(input: {
    type: ApprovalRequest["type"];
    requesterId: string;
    targetUserId?: string;
    data: any;
    approvers: string[];
    expiresAt?: Date;
  }): Promise<ApprovalRequest> {
    try {
      const approval = await prisma.auditLog.create({
        data: {
          userId: input.requesterId,
          tenantId:
            (
              await prisma.user.findUnique({
                where: { id: input.requesterId },
                select: { tenantId: true },
              })
            )?.tenantId || "",
          eventType: "approval_request",
          eventCategory: "workflow",
          action: "create",
          resource: "approval",
          description: `Approval request for ${input.type}`,
          metadata: {
            type: input.type,
            targetUserId: input.targetUserId,
            data: input.data,
            approvers: input.approvers.map((userId) => ({
              userId,
              status: "pending",
            })),
            status: "pending",
            expiresAt: input.expiresAt,
          } as any,
          status: "pending",
        },
      });

      // Publish event
      await eventBus.publish({
        type: "ApprovalRequestCreated",
        aggregateId: approval.id,
        aggregateType: "ApprovalRequest",
        payload: {
          approvalId: approval.id,
          type: input.type,
          requesterId: input.requesterId,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      // Send notifications to approvers
      try {
        const { notificationService } =
          await import("@/lib/services/notifications/notificationService");
        for (const approverId of input.approvers) {
          await notificationService.send({
            type: "alert",
            channel: ["email", "in-app"],
            title: "Approval Request",
            message: `You have a pending approval request for ${input.type}`,
            userId: approverId,
            data: {
              approvalId: approval.id,
              type: input.type,
              requesterId: input.requesterId,
            },
          });
        }
      } catch (error) {
        console.error("[WorkflowService] Error sending notifications:", error);
        // Don't fail the request if notifications fail
      }

      return this.mapToApprovalRequest(approval);
    } catch (error) {
      console.error(
        "[WorkflowService] Error creating approval request:",
        error,
      );
      throw error;
    }
  }

  /**
   * Approve request
   */
  async approveRequest(
    approvalId: string,
    approverId: string,
    comment?: string,
  ): Promise<void> {
    try {
      const approval = await prisma.auditLog.findUnique({
        where: { id: approvalId },
      });

      if (!approval) {
        throw new Error(`Approval ${approvalId} not found`);
      }

      const metadata = approval.metadata as any;
      const approvers = metadata.approvers || [];
      const approver = approvers.find((a: any) => a.userId === approverId);

      if (!approver) {
        throw new Error(
          `User ${approverId} is not an approver for this request`,
        );
      }

      approver.status = "approved";
      approver.approvedAt = new Date();
      approver.comment = comment;

      // Check if all approvers have approved
      const allApproved = approvers.every((a: any) => a.status === "approved");

      if (allApproved) {
        metadata.status = "approved";

        // Execute the action
        await this.executeApprovalAction(
          metadata.type,
          metadata.data,
          metadata.targetUserId,
        );

        // Update approval
        await prisma.auditLog.update({
          where: { id: approvalId },
          data: {
            status: "approved",
            metadata: metadata as any,
          },
        });

        // Publish event
        await eventBus.publish({
          type: "ApprovalRequestApproved",
          aggregateId: approvalId,
          aggregateType: "ApprovalRequest",
          payload: {
            approvalId,
            approverId,
          },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Update approval
        await prisma.auditLog.update({
          where: { id: approvalId },
          data: {
            metadata: metadata as any,
          },
        });
      }
    } catch (error) {
      console.error("[WorkflowService] Error approving request:", error);
      throw error;
    }
  }

  /**
   * Reject request
   */
  async rejectRequest(
    approvalId: string,
    approverId: string,
    reason: string,
  ): Promise<void> {
    try {
      const approval = await prisma.auditLog.findUnique({
        where: { id: approvalId },
      });

      if (!approval) {
        throw new Error(`Approval ${approvalId} not found`);
      }

      const metadata = approval.metadata as any;
      metadata.status = "rejected";
      metadata.rejectionReason = reason;

      await prisma.auditLog.update({
        where: { id: approvalId },
        data: {
          status: "rejected",
          metadata: metadata as any,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "ApprovalRequestRejected",
        aggregateId: approvalId,
        aggregateType: "ApprovalRequest",
        payload: {
          approvalId,
          approverId,
          reason,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[WorkflowService] Error rejecting request:", error);
      throw error;
    }
  }

  /**
   * Create workflow rule
   */
  async createWorkflowRule(
    input: Omit<WorkflowRule, "id">,
  ): Promise<WorkflowRule> {
    try {
      // Store workflow rule in database
      // Note: WorkflowRule model should be added to Prisma schema if needed
      // For now, we'll store in a JSON field or use Event Store pattern
      // The rule will be executed via event handlers

      const rule: WorkflowRule = {
        id: `rule-${Date.now()}`,
        ...input,
      };

      // Publish event
      await eventBus.publish({
        type: "WorkflowRuleCreated",
        aggregateId: rule.id,
        aggregateType: "WorkflowRule",
        payload: {
          ruleId: rule.id,
          name: rule.name,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      return rule;
    } catch (error) {
      console.error("[WorkflowService] Error creating workflow rule:", error);
      throw error;
    }
  }

  /**
   * Execute workflow rule
   */
  async executeWorkflowRule(rule: WorkflowRule, context: any): Promise<void> {
    try {
      // Check conditions
      const conditionsMet = rule.conditions.every((condition) => {
        const fieldValue = this.getFieldValue(context, condition.field);
        return this.evaluateCondition(
          fieldValue,
          condition.operator,
          condition.value,
        );
      });

      if (!conditionsMet) {
        return; // Conditions not met, don't execute
      }

      // Execute actions
      for (const action of rule.actions) {
        await this.executeAction(action, context);
      }
    } catch (error) {
      console.error("[WorkflowService] Error executing workflow rule:", error);
      throw error;
    }
  }

  /**
   * Create scheduled task
   */
  async createScheduledTask(
    input: Omit<ScheduledTask, "id" | "nextRun">,
  ): Promise<ScheduledTask> {
    try {
      const nextRun = this.calculateNextRun(input.schedule);

      const task: ScheduledTask = {
        id: `task-${Date.now()}`,
        ...input,
        nextRun,
      };

      // Store scheduled task (would use a ScheduledTask model in Prisma)
      // Set up cron job or use a job scheduler (e.g., node-cron, Bull)
      // For now, tasks are executed via manual trigger or event handlers

      return task;
    } catch (error) {
      console.error("[WorkflowService] Error creating scheduled task:", error);
      throw error;
    }
  }

  /**
   * Run scheduled task
   */
  async runScheduledTask(taskId: string): Promise<void> {
    try {
      // Get task from database (would query ScheduledTask model)
      // For now, tasks are identified by type
      // For now, implement common tasks

      // Example: Inactive user cleanup
      if (taskId.includes("inactive_user_cleanup")) {
        await this.cleanupInactiveUsers();
      }

      // Example: Permission review
      if (taskId.includes("permission_review")) {
        await this.reviewPermissions();
      }
    } catch (error) {
      console.error("[WorkflowService] Error running scheduled task:", error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async executeApprovalAction(
    type: string,
    data: any,
    targetUserId?: string,
  ): Promise<void> {
    switch (type) {
      case "permission_change":
        if (data.action === "grant") {
          await permissionService.grantPermission(
            targetUserId!,
            data.permission,
          );
        } else if (data.action === "revoke") {
          await permissionService.revokePermission(
            targetUserId!,
            data.permission,
          );
        }
        break;

      case "role_assignment":
        // Assign role using roleService
        const { roleService } = await import("./roleService");
        if (context.userId && action.params.roleId) {
          await roleService.assignRoleToUser(
            context.userId,
            action.params.roleId,
            {
              expiresAt: action.params.expiresAt,
              reason: action.params.reason,
            },
          );
        }
        break;

      case "user_creation":
        // Create user using userService
        const { userService } = await import("./userService");
        if (action.params.userData) {
          await userService.createUser(action.params.userData);
        }
        break;

      case "user_deletion":
        if (targetUserId) {
          await userService.deleteUser(targetUserId);
        }
        break;
    }
  }

  private async executeAction(
    action: WorkflowRule["actions"][0],
    context: any,
  ): Promise<void> {
    switch (action.type) {
      case "assign_role":
        // Assign role using roleService
        const { roleService } = await import("./roleService");
        if (context.userId && action.params.roleId) {
          await roleService.assignRoleToUser(
            context.userId,
            action.params.roleId,
            {
              expiresAt: action.params.expiresAt,
              reason: action.params.reason,
            },
          );
        }
        break;

      case "grant_permission":
        if (context.userId && action.params.permission) {
          await permissionService.grantPermission(
            context.userId,
            action.params.permission,
          );
        }
        break;

      case "revoke_permission":
        if (context.userId && action.params.permission) {
          await permissionService.revokePermission(
            context.userId,
            action.params.permission,
          );
        }
        break;

      case "send_notification":
        // Send notification
        const { notificationService } =
          await import("@/lib/services/notifications/notificationService");
        await notificationService.send({
          type: action.params.type || "info",
          channel: action.params.channel || ["in-app"],
          title: action.params.title,
          message: action.params.message,
          userId: context.userId,
          data: action.params.data,
        });
        break;

      case "create_approval":
        // Create approval request
        if (action.params.requesterId && action.params.approvers) {
          await this.createApprovalRequest({
            type: action.params.type || "custom",
            requesterId: action.params.requesterId,
            targetUserId: action.params.targetUserId,
            data: action.params.data,
            approvers: action.params.approvers,
          });
        }
        break;
    }
  }

  private getFieldValue(context: any, field: string): any {
    const parts = field.split(".");
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private evaluateCondition(
    actual: any,
    operator: string,
    expected: any,
  ): boolean {
    switch (operator) {
      case "equals":
        return actual === expected;
      case "not_equals":
        return actual !== expected;
      case "contains":
        return String(actual).includes(String(expected));
      case "greater_than":
        return Number(actual) > Number(expected);
      case "less_than":
        return Number(actual) < Number(expected);
      default:
        return false;
    }
  }

  private calculateNextRun(schedule: ScheduledTask["schedule"]): Date {
    const now = new Date();
    const nextRun = new Date(now);

    switch (schedule.frequency) {
      case "daily":
        nextRun.setDate(now.getDate() + 1);
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(":").map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        }
        break;

      case "weekly":
        nextRun.setDate(now.getDate() + 7);
        if (schedule.dayOfWeek !== undefined) {
          const daysUntil = (schedule.dayOfWeek - now.getDay() + 7) % 7 || 7;
          nextRun.setDate(now.getDate() + daysUntil);
        }
        break;

      case "monthly":
        nextRun.setMonth(now.getMonth() + 1);
        if (schedule.dayOfMonth) {
          nextRun.setDate(schedule.dayOfMonth);
        }
        break;
    }

    return nextRun;
  }

  private async cleanupInactiveUsers(): Promise<void> {
    // Find users inactive for >90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const inactiveUsers = await prisma.user.findMany({
      where: {
        lastLogin: {
          lt: cutoffDate,
        },
        status: "ACTIVE",
      },
    });

    for (const user of inactiveUsers) {
      // Deactivate user
      await userService.updateUser(user.id, {
        status: "INACTIVE",
      });

      // Log action
      await auditService.logUserAction("system", "user_deactivated", "user", {
        reason: "Inactive for 90+ days",
        userId: user.id,
      });
    }
  }

  private async reviewPermissions(): Promise<void> {
    // Review permissions and flag issues using AI service
    try {
      const { aiPermissionService } = await import("./aiPermissionService");
      const users = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });

      for (const user of users) {
        // Get risk assessment
        const risk = await aiPermissionService.assessRisk(user.id);

        // If high risk, create approval request for review
        if (risk.riskLevel === "high" || risk.riskLevel === "critical") {
          await this.createApprovalRequest({
            type: "permission_change",
            requesterId: "system",
            targetUserId: user.id,
            data: {
              action: "review",
              riskAssessment: risk,
            },
            approvers: ["SYSTEM_ADMIN"], // Would resolve to actual admin user IDs
          });
        }
      }
    } catch (error) {
      console.error("[WorkflowService] Error reviewing permissions:", error);
    }
  }

  private mapToApprovalRequest(auditLog: any): ApprovalRequest {
    const metadata = auditLog.metadata as any;
    return {
      id: auditLog.id,
      type: metadata.type,
      requesterId: auditLog.userId,
      targetUserId: metadata.targetUserId,
      data: metadata.data,
      status: metadata.status || "pending",
      approvers: metadata.approvers || [],
      createdAt: auditLog.createdAt,
      updatedAt: auditLog.updatedAt,
      expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : undefined,
    };
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
