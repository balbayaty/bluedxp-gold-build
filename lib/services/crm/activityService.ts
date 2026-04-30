/**
 * Activity Service
 * Activity tracking integrated with Brand Messaging
 */

import { eventBus } from "@/lib/services/event-bus";
import type { Activity } from "@/types/crm";

// ============================================================================
// SERVICE
// ============================================================================

class ActivityService {
  private activities: Map<string, Activity> = new Map();

  /**
   * Initialize event handlers to capture activities from Brand Messaging
   */
  initializeEventHandlers(): void {
    // Subscribe to email events
    eventBus.subscribe("brand-messaging.email.sent", async (event: any) => {
      await this.createActivityFromEmail(event.payload);
    });

    // Subscribe to WhatsApp events
    eventBus.subscribe("brand-messaging.whatsapp.sent", async (event: any) => {
      await this.createActivityFromWhatsApp(event.payload);
    });

    // Subscribe to SMS events
    eventBus.subscribe("brand-messaging.sms.sent", async (event: any) => {
      await this.createActivityFromSMS(event.payload);
    });
  }

  /**
   * Create activity from email
   */
  private async createActivityFromEmail(emailData: any): Promise<void> {
    try {
      const activity: Activity = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: emailData.tenantId || "",
        type: "EMAIL",
        subject: emailData.subject || "Email",
        description: emailData.body,
        relatedTo: {
          type: emailData.relatedToType || "ACCOUNT",
          id: emailData.relatedToId || "",
        },
        assignedTo: emailData.sentBy,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        metadata: {
          emailId: emailData.emailId || emailData.id,
        },
        createdAt: new Date().toISOString(),
        createdBy: emailData.sentBy || "system",
        updatedAt: new Date().toISOString(),
      };

      this.activities.set(activity.id, activity);

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "crm.activity.created",
        aggregateId: activity.id,
        aggregateType: "activity",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: activity,
      });
    } catch (error) {
      console.error("Error creating activity from email:", error);
    }
  }

  /**
   * Create activity from WhatsApp
   */
  private async createActivityFromWhatsApp(whatsappData: any): Promise<void> {
    try {
      const activity: Activity = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: whatsappData.tenantId || "",
        type: "WHATSAPP",
        subject: "WhatsApp Message",
        description: whatsappData.message,
        relatedTo: {
          type: whatsappData.relatedToType || "ACCOUNT",
          id: whatsappData.relatedToId || "",
        },
        assignedTo: whatsappData.sentBy,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        metadata: {
          messageId: whatsappData.messageId || whatsappData.id,
        },
        createdAt: new Date().toISOString(),
        createdBy: whatsappData.sentBy || "system",
        updatedAt: new Date().toISOString(),
      };

      this.activities.set(activity.id, activity);
    } catch (error) {
      console.error("Error creating activity from WhatsApp:", error);
    }
  }

  /**
   * Create activity from SMS
   */
  private async createActivityFromSMS(smsData: any): Promise<void> {
    try {
      const activity: Activity = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: smsData.tenantId || "",
        type: "SMS",
        subject: "SMS Message",
        description: smsData.message,
        relatedTo: {
          type: smsData.relatedToType || "ACCOUNT",
          id: smsData.relatedToId || "",
        },
        assignedTo: smsData.sentBy,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        metadata: {
          messageId: smsData.messageId || smsData.id,
        },
        createdAt: new Date().toISOString(),
        createdBy: smsData.sentBy || "system",
        updatedAt: new Date().toISOString(),
      };

      this.activities.set(activity.id, activity);
    } catch (error) {
      console.error("Error creating activity from SMS:", error);
    }
  }

  /**
   * Create activity manually
   */
  async createActivity(input: {
    tenantId: string;
    type: Activity["type"];
    subject: string;
    description?: string;
    relatedTo: Activity["relatedTo"];
    assignedTo?: string;
    dueDate?: Date | string;
    createdBy: string;
  }): Promise<Activity> {
    const activity: Activity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      type: input.type,
      subject: input.subject,
      description: input.description,
      relatedTo: input.relatedTo,
      assignedTo: input.assignedTo,
      dueDate: input.dueDate,
      status: "PLANNED",
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
      updatedAt: new Date().toISOString(),
    };

    this.activities.set(activity.id, activity);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.activity.created",
      aggregateId: activity.id,
      aggregateType: "activity",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: activity,
    });

    return activity;
  }

  /**
   * Get activities
   */
  async getActivities(filters: {
    tenantId: string;
    relatedToType?: Activity["relatedTo"]["type"];
    relatedToId?: string;
    type?: Activity["type"];
    status?: Activity["status"];
  }): Promise<Activity[]> {
    let activities = Array.from(this.activities.values()).filter(
      (a) => a.tenantId === filters.tenantId,
    );

    if (filters.relatedToType) {
      activities = activities.filter(
        (a) => a.relatedTo.type === filters.relatedToType,
      );
    }

    if (filters.relatedToId) {
      activities = activities.filter(
        (a) => a.relatedTo.id === filters.relatedToId,
      );
    }

    if (filters.type) {
      activities = activities.filter((a) => a.type === filters.type);
    }

    if (filters.status) {
      activities = activities.filter((a) => a.status === filters.status);
    }

    return activities.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}

export const activityService = new ActivityService();

// Initialize event handlers on service creation
if (typeof window === "undefined") {
  activityService.initializeEventHandlers();
}
