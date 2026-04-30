/**
 * 👥 EMPLOYEE INVITATION SERVICE
 * 
 * Handles employee invitations, approvals, and linking to company subscriptions
 * Inspired by Slack, Microsoft Teams, GitHub workflows
 * 
 * Features:
 * - Secure invitation tokens
 * - Admin approval workflow
 * - Company subscription linking
 * - Email notifications
 * - Settings integration
 * 
 * BlueDXP Platform - Enterprise-Grade Employee Onboarding
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-store";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { settingsService } from "@/lib/services/settings/settingsService";
import crypto from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export interface EmployeeInvitation {
  id: string;
  tenantId: string;
  invitedBy: string;
  email: string;
  name?: string;
  role: string;
  department?: string;
  jobTitle?: string;
  status: "pending" | "approved" | "rejected" | "expired" | "accepted";
  invitationToken: string;
  tokenExpiresAt: Date | string;
  companySubscriptionId?: string;
  subscriptionId?: string;
  approvedBy?: string;
  approvedAt?: Date | string;
  rejectedBy?: string;
  rejectedAt?: Date | string;
  rejectionReason?: string;
  acceptedAt?: Date | string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateInvitationInput {
  tenantId: string;
  invitedBy: string;
  email: string;
  name?: string;
  role?: string;
  department?: string;
  jobTitle?: string;
  companySubscriptionId?: string; // Link to company subscription
  metadata?: Record<string, any>;
}

export interface ApproveInvitationInput {
  invitationId: string;
  approverId: string;
  companySubscriptionId?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// EMPLOYEE INVITATION SERVICE
// ============================================================================

class EmployeeInvitationService {
  /**
   * Check if employee approval is enabled in settings
   */
  private async isEmployeeApprovalEnabled(tenantId: string): Promise<boolean> {
    try {
      const setting = await settingsService.getSetting("employee.approval.enabled", tenantId);
      return setting?.value === true || setting?.value === "true";
    } catch (error) {
      // Default to enabled if setting not found
      return true;
    }
  }

  /**
   * Create employee invitation
   */
  async createInvitation(input: CreateInvitationInput): Promise<EmployeeInvitation> {
    try {
      // Check if employee approval is enabled (default: enabled)
      const approvalEnabled = await this.isEmployeeApprovalEnabled(input.tenantId);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error(`User with email ${input.email} already exists`);
      }

      // Check if invitation already exists and is pending
      const existingInvitation = await prisma.employee_invitations.findFirst({
        where: {
          email: input.email,
          tenantId: input.tenantId,
          status: "pending",
          tokenExpiresAt: { gt: new Date() },
        },
      });

      if (existingInvitation) {
        throw new Error(`Pending invitation already exists for ${input.email}`);
      }

      // Generate secure invitation token
      const invitationToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invitation
      const created = await prisma.employee_invitations.create({
        data: {
          tenantId: input.tenantId,
          invitedBy: input.invitedBy,
          email: input.email.toLowerCase(),
          name: input.name,
          role: input.role || "user",
          department: input.department,
          jobTitle: input.jobTitle,
          status: "pending",
          invitationToken,
          tokenExpiresAt,
          companySubscriptionId: input.companySubscriptionId,
          metadata: input.metadata as any,
        },
      });

      // Create approval request if enabled
      if (approvalEnabled) {
        await this.createApprovalRequest(created.id, input.tenantId, input.invitedBy);
        // Send notification to admin
        await this.notifyAdmin(created.id, input.tenantId, input.invitedBy);
      } else {
        // Auto-approve if approval is disabled (skip approval workflow)
        // Update invitation directly to approved status
        const autoApproved = await prisma.employee_invitations.update({
          where: { id: created.id },
          data: {
            status: "approved",
            approvedBy: input.invitedBy,
            approvedAt: new Date(),
            companySubscriptionId: input.companySubscriptionId,
          },
        });

        // Link to company subscription if provided
        if (input.companySubscriptionId) {
          await this.linkToCompanySubscription(created.id, input.companySubscriptionId);
        }

        // Send approval email to employee
        await this.sendApprovalEmail(autoApproved);
      }

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "employee.invitation.created",
        aggregateId: created.id,
        aggregateType: "employee_invitation",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          invitationId: created.id,
          email: input.email,
          tenantId: input.tenantId,
        },
      });

      return this.mapToInvitation(created);
    } catch (error) {
      console.error("[EmployeeInvitationService] Error creating invitation:", error);
      throw error;
    }
  }

  /**
   * Create approval request for admin
   */
  private async createApprovalRequest(
    invitationId: string,
    tenantId: string,
    invitedBy: string
  ): Promise<void> {
    try {
      // Get invitation details first
      const invitation = await prisma.employee_invitations.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        throw new Error(`Invitation ${invitationId} not found`);
      }

      // Find admin users in tenant
      const admins = await prisma.user.findMany({
        where: {
          tenantId,
          role: { in: ["admin", "super_admin", "tenant_admin"] },
          status: "ACTIVE",
        },
        take: 1, // Get first admin (can be enhanced to support multiple approvers)
      });

      if (admins.length === 0) {
        throw new Error("No admin found for approval");
      }

      const approver = admins[0];

      // Generate approval token
      const approvalToken = crypto.randomBytes(32).toString("hex");
      const approvalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3002"}/admin/approve-employee?token=${approvalToken}`;
      const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create approval record
      await prisma.employee_approvals.create({
        data: {
          tenantId,
          invitationId,
          employeeEmail: invitation.email,
          employeeName: invitation.name,
          requestedBy: invitedBy,
          approverId: approver.id,
          status: "pending",
          approvalLink,
          approvalToken,
          tokenExpiresAt,
        },
      });
    } catch (error) {
      console.error("[EmployeeInvitationService] Error creating approval request:", error);
      throw error;
    }
  }

  /**
   * Notify admin of pending approval
   */
  private async notifyAdmin(
    invitationId: string,
    tenantId: string,
    invitedBy: string
  ): Promise<void> {
    try {
      // Get invitation details
      const invitation = await prisma.employee_invitations.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) return;

      // Get approval details
      const approval = await prisma.employee_approvals.findUnique({
        where: { invitationId },
      });

      if (!approval) return;

      // Get approver
      const approver = await prisma.user.findUnique({
        where: { id: approval.approverId },
      });

      if (!approver) return;

      // Send notification
      await notificationService.send({
        type: "alert",
        priority: "high",
        channel: ["email", "in-app"],
        title: "Employee Approval Required",
        message: `${invitation.email} has requested to join your organization. Please review and approve.`,
        recipient: approver.email,
        userId: approver.id,
        tenantId,
        data: {
          invitationId,
          approvalId: approval.id,
          approvalLink: approval.approvalLink,
          employeeEmail: invitation.email,
          employeeName: invitation.name,
        },
        actionUrl: approval.approvalLink,
        actionLabel: "Review Request",
      });
    } catch (error) {
      console.error("[EmployeeInvitationService] Error notifying admin:", error);
      // Don't throw - notification failure shouldn't block invitation
    }
  }

  /**
   * Approve invitation
   */
  async approveInvitation(input: ApproveInvitationInput): Promise<EmployeeInvitation> {
    try {
      // Get invitation
      const invitation = await prisma.employee_invitations.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation) {
        throw new Error(`Invitation ${input.invitationId} not found`);
      }

      if (invitation.status !== "pending") {
        throw new Error(`Invitation is not pending (current status: ${invitation.status})`);
      }

      // Get approval
      const approval = await prisma.employee_approvals.findUnique({
        where: { invitationId: input.invitationId },
      });

      if (!approval) {
        throw new Error(`Approval request not found for invitation ${input.invitationId}`);
      }

      // Verify approver
      if (approval.approverId !== input.approverId) {
        throw new Error("Unauthorized: You are not the designated approver");
      }

      // Update invitation
      const updated = await prisma.employee_invitations.update({
        where: { id: input.invitationId },
        data: {
          status: "approved",
          approvedBy: input.approverId,
          approvedAt: new Date(),
          companySubscriptionId: input.companySubscriptionId || invitation.companySubscriptionId,
          metadata: {
            ...((invitation.metadata as any) || {}),
            ...(input.metadata || {}),
          },
        },
      });

      // Update approval
      await prisma.employee_approvals.update({
        where: { invitationId: input.invitationId },
        data: {
          status: "approved",
          approvedAt: new Date(),
          companySubscriptionId: input.companySubscriptionId || invitation.companySubscriptionId,
        },
      });

      // Link to company subscription if provided
      if (input.companySubscriptionId || invitation.companySubscriptionId) {
        await this.linkToCompanySubscription(
          input.invitationId,
          input.companySubscriptionId || invitation.companySubscriptionId!
        );
      }

      // Send approval email to employee
      await this.sendApprovalEmail(invitation);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "employee.invitation.approved",
        aggregateId: updated.id,
        aggregateType: "employee_invitation",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          invitationId: updated.id,
          email: invitation.email,
          tenantId: invitation.tenantId,
        },
      });

      return this.mapToInvitation(updated);
    } catch (error) {
      console.error("[EmployeeInvitationService] Error approving invitation:", error);
      throw error;
    }
  }

  /**
   * Reject invitation
   */
  async rejectInvitation(
    invitationId: string,
    approverId: string,
    reason?: string
  ): Promise<EmployeeInvitation> {
    try {
      const invitation = await prisma.employee_invitations.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        throw new Error(`Invitation ${invitationId} not found`);
      }

      const updated = await prisma.employee_invitations.update({
        where: { id: invitationId },
        data: {
          status: "rejected",
          rejectedBy: approverId,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });

      // Update approval
      await prisma.employee_approvals.updateMany({
        where: { invitationId },
        data: {
          status: "rejected",
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });

      // Send rejection email
      await this.sendRejectionEmail(invitation, reason);

      return this.mapToInvitation(updated);
    } catch (error) {
      console.error("[EmployeeInvitationService] Error rejecting invitation:", error);
      throw error;
    }
  }

  /**
   * Link employee to company subscription
   */
  private async linkToCompanySubscription(
    invitationId: string,
    companySubscriptionId: string
  ): Promise<void> {
    try {
      // Get company subscription
      const subscription = await prisma.billing_subscriptions.findUnique({
        where: { id: companySubscriptionId },
      });

      if (!subscription) {
        throw new Error(`Company subscription ${companySubscriptionId} not found`);
      }

      // Get assigned user IDs
      const assignedUserIds = ((subscription.assignedUserIds as any) || []) as string[];

      // Update invitation with subscription ID
      await prisma.employee_invitations.update({
        where: { id: invitationId },
        data: {
          subscriptionId: companySubscriptionId,
        },
      });

      // Note: User will be added to assignedUserIds when they accept invitation
    } catch (error) {
      console.error("[EmployeeInvitationService] Error linking to subscription:", error);
      throw error;
    }
  }

  /**
   * Accept invitation (employee completes signup)
   */
  async acceptInvitation(
    invitationToken: string,
    userData: {
      name: string;
      passwordHash: string;
      phone?: string;
      department?: string;
      jobTitle?: string;
    }
  ): Promise<{ userId: string; invitation: EmployeeInvitation }> {
    try {
      // Find invitation by token
      const invitation = await prisma.employee_invitations.findUnique({
        where: { invitationToken },
      });

      if (!invitation) {
        throw new Error("Invalid invitation token");
      }

      if (invitation.status !== "approved") {
        throw new Error(`Invitation is not approved (current status: ${invitation.status})`);
      }

      if (new Date(invitation.tokenExpiresAt) < new Date()) {
        throw new Error("Invitation token has expired");
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: invitation.email,
          name: userData.name,
          passwordHash: userData.passwordHash,
          tenantId: invitation.tenantId,
          role: invitation.role,
          phone: userData.phone,
          department: userData.department || invitation.department,
          jobTitle: userData.jobTitle || invitation.jobTitle,
          status: "ACTIVE",
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      // Update invitation
      const updated = await prisma.employee_invitations.update({
        where: { id: invitation.id },
        data: {
          status: "accepted",
          userId: user.id,
          acceptedAt: new Date(),
        },
      });

      // Link to company subscription if exists
      if (invitation.companySubscriptionId || invitation.subscriptionId) {
        const subscriptionId = invitation.subscriptionId || invitation.companySubscriptionId!;
        await this.addEmployeeToCompanySubscription(user.id, subscriptionId);
      }

      // Send welcome email
      await this.sendWelcomeEmail(user, invitation);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "employee.invitation.accepted",
        aggregateId: updated.id,
        aggregateType: "employee_invitation",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          invitationId: updated.id,
          userId: user.id,
          email: invitation.email,
          tenantId: invitation.tenantId,
        },
      });

      return {
        userId: user.id,
        invitation: this.mapToInvitation(updated),
      };
    } catch (error) {
      console.error("[EmployeeInvitationService] Error accepting invitation:", error);
      throw error;
    }
  }

  /**
   * Add employee to company subscription
   */
  private async addEmployeeToCompanySubscription(
    userId: string,
    subscriptionId: string
  ): Promise<void> {
    try {
      const subscription = await prisma.billing_subscriptions.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      // Get current assigned user IDs
      const assignedUserIds = ((subscription.assignedUserIds as any) || []) as string[];

      // Add new user if not already included
      if (!assignedUserIds.includes(userId)) {
        assignedUserIds.push(userId);

        // Update subscription
        await prisma.billing_subscriptions.update({
          where: { id: subscriptionId },
          data: {
            assignedUserIds: assignedUserIds as any,
            quantity: assignedUserIds.length, // Update quantity to match user count
          },
        });
      }
    } catch (error) {
      console.error("[EmployeeInvitationService] Error adding to subscription:", error);
      throw error;
    }
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<EmployeeInvitation | null> {
    try {
      const invitation = await prisma.employee_invitations.findUnique({
        where: { invitationToken: token },
      });

      if (!invitation) {
        return null;
      }

      return this.mapToInvitation(invitation);
    } catch (error) {
      console.error("[EmployeeInvitationService] Error getting invitation:", error);
      return null;
    }
  }

  /**
   * Get pending approvals for admin
   */
  async getPendingApprovals(approverId: string, tenantId?: string): Promise<EmployeeInvitation[]> {
    try {
      const approvals = await prisma.employee_approvals.findMany({
        where: {
          approverId,
          status: "pending",
          ...(tenantId && { tenantId }),
          tokenExpiresAt: { gt: new Date() },
        },
        include: {
          invitation: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return approvals.map((a) => this.mapToInvitation(a.invitation));
    } catch (error) {
      console.error("[EmployeeInvitationService] Error getting pending approvals:", error);
      return [];
    }
  }

  /**
   * Send approval email
   */
  private async sendApprovalEmail(invitation: any): Promise<void> {
    try {
      const invitationLink = `${process.env.NEXTAUTH_URL || "http://localhost:3002"}/signup?token=${invitation.invitationToken}`;

      await notificationService.send({
        type: "success",
        priority: "medium",
        channel: ["email"],
        title: "Your invitation has been approved!",
        message: `You've been approved to join ${invitation.tenantId}. Click the link to complete your signup.`,
        recipient: invitation.email,
        tenantId: invitation.tenantId,
        data: {
          invitationLink,
          invitationToken: invitation.invitationToken,
        },
        actionUrl: invitationLink,
        actionLabel: "Complete Signup",
      });
    } catch (error) {
      console.error("[EmployeeInvitationService] Error sending approval email:", error);
    }
  }

  /**
   * Send rejection email
   */
  private async sendRejectionEmail(invitation: any, reason?: string): Promise<void> {
    try {
      await notificationService.send({
        type: "alert",
        priority: "medium",
        channel: ["email"],
        title: "Invitation Status Update",
        message: reason
          ? `Your invitation has been declined. Reason: ${reason}`
          : "Your invitation has been declined.",
        recipient: invitation.email,
        tenantId: invitation.tenantId,
      });
    } catch (error) {
      console.error("[EmployeeInvitationService] Error sending rejection email:", error);
    }
  }

  /**
   * Send welcome email
   */
  private async sendWelcomeEmail(user: any, invitation: any): Promise<void> {
    try {
      await notificationService.send({
        type: "success",
        priority: "medium",
        channel: ["email"],
        title: "Welcome to BlueDXP!",
        message: `Welcome ${user.name}! Your account has been activated and you're now part of the team.`,
        recipient: user.email,
        userId: user.id,
        tenantId: invitation.tenantId,
      });
    } catch (error) {
      console.error("[EmployeeInvitationService] Error sending welcome email:", error);
    }
  }

  /**
   * Map database model to interface
   */
  private mapToInvitation(dbInvitation: any): EmployeeInvitation {
    return {
      id: dbInvitation.id,
      tenantId: dbInvitation.tenantId,
      invitedBy: dbInvitation.invitedBy,
      email: dbInvitation.email,
      name: dbInvitation.name,
      role: dbInvitation.role,
      department: dbInvitation.department,
      jobTitle: dbInvitation.jobTitle,
      status: dbInvitation.status as any,
      invitationToken: dbInvitation.invitationToken,
      tokenExpiresAt: dbInvitation.tokenExpiresAt.toISOString(),
      companySubscriptionId: dbInvitation.companySubscriptionId,
      subscriptionId: dbInvitation.subscriptionId,
      approvedBy: dbInvitation.approvedBy,
      approvedAt: dbInvitation.approvedAt?.toISOString(),
      rejectedBy: dbInvitation.rejectedBy,
      rejectedAt: dbInvitation.rejectedAt?.toISOString(),
      rejectionReason: dbInvitation.rejectionReason,
      acceptedAt: dbInvitation.acceptedAt?.toISOString(),
      userId: dbInvitation.userId,
      metadata: (dbInvitation.metadata as any) || {},
      createdAt: dbInvitation.createdAt.toISOString(),
      updatedAt: dbInvitation.updatedAt.toISOString(),
    };
  }
}

export const employeeInvitationService = new EmployeeInvitationService();
