/**
 * ASN Notification Service
 * Integrates ASN events with notification service
 * Sends notifications for status changes, SLA breaches, etc.
 */

import { notificationService } from "@/lib/services/notifications/notificationService";
import { eventBus } from "@/lib/services/event-store";
import type { ASNData } from "@/types/asn";

class ASNNotificationService {
  private isInitialized = false;

  /**
   * Initialize event subscriptions
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Subscribe to ASN status changes
      eventBus.subscribe("asn.status_changed", async (event: any) => {
        await this.handleStatusChange(event);
      });

      // Subscribe to ASN created
      eventBus.subscribe("asn.created", async (event: any) => {
        await this.handleASNCreated(event);
      });

      // Subscribe to SLA breaches (if available)
      eventBus.subscribe("asn.sla_breach", async (event: any) => {
        await this.handleSLABreach(event);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error("[asn-notifications] Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Handle ASN status change
   */
  private async handleStatusChange(event: any): Promise<void> {
    try {
      const { status, previousStatus, context } = event.payload;
      const asnId = event.aggregateId;
      const userId = event.metadata?.userId;

      // Determine notification type based on status
      let notificationType: any = "info";
      let priority: any = "medium";
      let title = "ASN Status Updated";
      let message = `ASN ${asnId} status changed from ${previousStatus} to ${status}`;

      // Critical status changes
      if (status === "BLOCKED" || status === "CANCELLED") {
        notificationType = "alert";
        priority = "high";
        title = "ASN Action Required";
        message = `ASN ${asnId} has been ${status.toLowerCase()}. Action may be required.`;
      } else if (status === "GR_POSTED" || status === "COMPLETED") {
        notificationType = "success";
        priority = "low";
        title = "ASN Completed";
        message = `ASN ${asnId} has been completed successfully.`;
      } else if (status === "IN_TRANSIT") {
        notificationType = "info";
        priority = "medium";
        title = "ASN In Transit";
        message = `ASN ${asnId} is now in transit.`;
      }

      // Send notification
      await notificationService.send({
        type: notificationType,
        priority,
        channel: ["in-app", "email"],
        title,
        message,
        userId,
        entityId: asnId,
        entityType: "ASN",
        actionUrl: `/process-lifecycle/lifecycle/ASN/${asnId}`,
        actionLabel: "View ASN",
        data: {
          asnId,
          status,
          previousStatus,
          context,
        },
      });
    } catch (error) {
      console.error("[asn-notifications] Error handling status change:", error);
    }
  }

  /**
   * Handle ASN created
   */
  private async handleASNCreated(event: any): Promise<void> {
    try {
      const asn: ASNData = event.payload;
      const userId = event.metadata?.userId;

      await notificationService.send({
        type: "info",
        priority: "low",
        channel: ["in-app"],
        title: "New ASN Created",
        message: `New ASN ${asn.documentNumber} has been created.`,
        userId,
        entityId: asn.id,
        entityType: "ASN",
        actionUrl: `/process-lifecycle/lifecycle/ASN/${asn.id}`,
        actionLabel: "View ASN",
        data: { asn },
      });
    } catch (error) {
      console.error("[asn-notifications] Error handling ASN created:", error);
    }
  }

  /**
   * Handle SLA breach
   */
  private async handleSLABreach(event: any): Promise<void> {
    try {
      const { asnId, slaName, breachReason } = event.payload;
      const userId = event.metadata?.userId;

      await notificationService.send({
        type: "alert",
        priority: "high",
        channel: ["in-app", "email", "sms"],
        title: "SLA Breach Alert",
        message: `ASN ${asnId} has breached SLA: ${slaName}. ${breachReason || ""}`,
        userId,
        entityId: asnId,
        entityType: "ASN",
        actionUrl: `/process-lifecycle/lifecycle/ASN/${asnId}`,
        actionLabel: "View Details",
        data: {
          asnId,
          slaName,
          breachReason,
        },
      });
    } catch (error) {
      console.error("[asn-notifications] Error handling SLA breach:", error);
    }
  }

  /**
   * Send custom notification for ASN
   */
  async sendCustomNotification(
    asnId: string,
    notification: {
      type?: any;
      priority?: any;
      title: string;
      message: string;
      channels?: any[];
      userId?: string;
    },
  ): Promise<void> {
    try {
      await notificationService.send({
        type: notification.type || "info",
        priority: notification.priority || "medium",
        channel: notification.channels || ["in-app"],
        title: notification.title,
        message: notification.message,
        userId: notification.userId,
        entityId: asnId,
        entityType: "ASN",
        actionUrl: `/process-lifecycle/lifecycle/ASN/${asnId}`,
        actionLabel: "View ASN",
      });
    } catch (error) {
      console.error(
        "[asn-notifications] Error sending custom notification:",
        error,
      );
      throw error;
    }
  }
}

export const asnNotificationService = new ASNNotificationService();

// Initialize on module load
if (typeof window === "undefined") {
  asnNotificationService.initialize().catch((err) => {
    console.error(
      "[asn-notifications] Failed to initialize on module load:",
      err,
    );
  });
}
