/**
 * Automated Notifications & Alerts Service
 * Email, SMS, Push notifications with alert rules engine
 * In-app notification management with real-time subscriptions
 */

import { prisma } from "@/lib/services/database/prismaClient";

export type NotificationChannel = "email" | "sms" | "push" | "in-app";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export type NotificationType =
  | "expiry_alert"
  | "low_stock"
  | "compliance_deadline"
  | "training_renewal"
  | "certification_expiry"
  | "incident"
  | "msds_approved"
  | "msds_rejected"
  | "container_transfer"
  | "system_alert"
  | "success"
  | "error"
  | "warning"
  | "alert"
  | "info"
  | "mission_available"
  | "mission_completed"
  | "recognition_received"
  | "redemption_pending"
  | "redemption_approved"
  | "redemption_rejected";

export interface Notification {
  id: string;
  type: NotificationType;
  priority?: NotificationPriority;
  channel: NotificationChannel | NotificationChannel[];
  title?: string;
  message: string;
  recipient?: string | string[];
  userId?: string;
  tenantId?: string;
  data?: any;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  status?: "pending" | "sent" | "failed" | "read";
  // In-app notification fields
  read?: boolean;
  dismissed?: boolean;
  createdAt?: Date | string;
  icon?: string;
  details?: string;
  category?: string;
  source?: string;
  entityId?: string;
  entityType?: string;
  actionUrl?: string;
  actionLabel?: string;
  duration?: number; // Auto-dismiss after milliseconds
}

export interface AlertRule {
  id: string;
  name: string;
  type: NotificationType;
  conditions: AlertCondition[];
  channels: NotificationChannel[];
  recipients: string[];
  enabled: boolean;
  frequency?: "immediate" | "daily" | "weekly";
}

export interface AlertCondition {
  field: string;
  operator: "equals" | "greater_than" | "less_than" | "contains" | "between";
  value: any;
}

// ============================================================================
// IN-MEMORY NOTIFICATION STORE (Will be replaced with database)
// ============================================================================

interface GetAllOptions {
  userId?: string;
  tenantId?: string;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

class NotificationStore {
  private notifications: Map<string, Notification> = new Map();
  private subscriptions: Set<(notifications: Notification[]) => void> =
    new Set();
  private subscriptionCounter: number = 0;
  private readonly useDb: boolean = process.env.NODE_ENV === "production";

  // Get all notifications with filtering
  async getAll(options: GetAllOptions = {}): Promise<Notification[]> {
    if (this.useDb) {
      const rows = await prisma.notificationRecord.findMany({
        where: {
          ...(options.userId ? { userId: options.userId } : {}),
          ...(options.tenantId ? { tenantId: options.tenantId } : {}),
          ...(options.type ? { type: options.type } : {}),
          ...(options.unreadOnly ? { read: false, dismissed: false } : {}),
        },
        orderBy: [{ createdAt: "desc" }],
        take: options.limit,
      });

      return rows.map((r: any) => {
        const data = (r.data as any) || {};
        const channel = r.channel.includes(",")
          ? r.channel.split(",")
          : r.channel;
        return {
          ...(data as any),
          id: r.id,
          tenantId: r.tenantId || data.tenantId,
          userId: r.userId || data.userId,
          type: (r.type as any) || data.type,
          priority: (r.priority as any) || data.priority,
          channel: (channel as any) || data.channel,
          status: (r.status as any) || data.status,
          read: r.read,
          dismissed: r.dismissed,
          readAt: r.readAt?.toISOString() || data.readAt,
          sentAt: r.sentAt?.toISOString() || data.sentAt,
          title: r.title || data.title,
          message: r.message || data.message,
          createdAt: r.createdAt.toISOString(),
        } as Notification;
      });
    }

    let notifications = Array.from(this.notifications.values());

    // Filter by userId
    if (options.userId) {
      notifications = notifications.filter((n) => n.userId === options.userId);
    }

    // Filter by tenantId
    if (options.tenantId) {
      notifications = notifications.filter(
        (n) => n.tenantId === options.tenantId,
      );
    }

    // Filter by type
    if (options.type) {
      notifications = notifications.filter((n) => n.type === options.type);
    }

    // Filter unread only
    if (options.unreadOnly) {
      notifications = notifications.filter((n) => !n.read && !n.dismissed);
    }

    // Sort by createdAt (newest first)
    notifications.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    // Apply limit
    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  // Get notification by ID
  async get(id: string): Promise<Notification | undefined> {
    if (this.useDb) {
      const row = await prisma.notificationRecord.findUnique({ where: { id } });
      if (!row) return undefined;
      const data = (row.data as any) || {};
      const channel = row.channel.includes(",")
        ? row.channel.split(",")
        : row.channel;
      return {
        ...(data as any),
        id: row.id,
        tenantId: row.tenantId || data.tenantId,
        userId: row.userId || data.userId,
        type: (row.type as any) || data.type,
        priority: (row.priority as any) || data.priority,
        channel: (channel as any) || data.channel,
        status: (row.status as any) || data.status,
        read: row.read,
        dismissed: row.dismissed,
        readAt: row.readAt?.toISOString() || data.readAt,
        sentAt: row.sentAt?.toISOString() || data.sentAt,
        title: row.title || data.title,
        message: row.message || data.message,
        createdAt: row.createdAt.toISOString(),
      } as Notification;
    }
    return this.notifications.get(id);
  }

  // Add notification
  async add(notification: Notification): Promise<void> {
    if (this.useDb) {
      const channel = Array.isArray(notification.channel)
        ? notification.channel.join(",")
        : notification.channel;
      await prisma.notificationRecord.create({
        data: {
          id: notification.id,
          tenantId: notification.tenantId || null,
          userId: notification.userId || null,
          type: notification.type,
          priority: notification.priority || null,
          channel,
          status: notification.status || "pending",
          read: !!notification.read,
          dismissed: !!notification.dismissed,
          readAt: notification.readAt ? new Date(notification.readAt) : null,
          sentAt: notification.sentAt ? new Date(notification.sentAt) : null,
          title: notification.title || notification.type,
          message: notification.message,
          data: notification as any,
        },
      });
    } else {
      this.notifications.set(notification.id, notification);
    }
    await this.notifySubscribers();
  }

  // Update notification
  async update(id: string, updates: Partial<Notification>): Promise<boolean> {
    if (this.useDb) {
      const existing = await prisma.notificationRecord.findUnique({
        where: { id },
      });
      if (!existing) return false;
      const merged: Notification = {
        ...(existing.data as any),
        ...updates,
        id,
      } as any;
      const channel = Array.isArray(merged.channel)
        ? merged.channel.join(",")
        : merged.channel;
      await prisma.notificationRecord.update({
        where: { id },
        data: {
          type: merged.type,
          priority: merged.priority || null,
          channel,
          status: merged.status || existing.status,
          read: !!merged.read,
          dismissed: !!merged.dismissed,
          readAt: merged.readAt ? new Date(merged.readAt) : null,
          sentAt: merged.sentAt ? new Date(merged.sentAt) : existing.sentAt,
          title: merged.title || existing.title,
          message: merged.message || existing.message,
          data: merged as any,
        },
      });
      await this.notifySubscribers();
      return true;
    }

    const notification = this.notifications.get(id);
    if (!notification) return false;

    this.notifications.set(id, { ...notification, ...updates });
    await this.notifySubscribers();
    return true;
  }

  // Delete notification
  async delete(id: string): Promise<boolean> {
    if (this.useDb) {
      await prisma.notificationRecord
        .delete({ where: { id } })
        .catch(() => undefined);
      await this.notifySubscribers();
      return true;
    }
    const deleted = this.notifications.delete(id);
    if (deleted) {
      await this.notifySubscribers();
    }
    return deleted;
  }

  // Get unread count
  async getUnreadCount(userId?: string, tenantId?: string): Promise<number> {
    if (this.useDb) {
      return prisma.notificationRecord.count({
        where: {
          ...(userId ? { userId } : {}),
          ...(tenantId ? { tenantId } : {}),
          read: false,
          dismissed: false,
        },
      });
    }
    const notifications = await this.getAll({ userId, tenantId });
    return notifications.filter((n) => !n.read && !n.dismissed).length;
  }

  // Mark as read
  async markAsRead(id: string): Promise<boolean> {
    return this.update(id, { read: true, readAt: new Date().toISOString() });
  }

  // Mark all as read
  async markAllAsRead(userId?: string, tenantId?: string): Promise<number> {
    if (this.useDb) {
      const res = await prisma.notificationRecord.updateMany({
        where: {
          ...(userId ? { userId } : {}),
          ...(tenantId ? { tenantId } : {}),
          read: false,
          dismissed: false,
        },
        data: { read: true, readAt: new Date() },
      });
      await this.notifySubscribers();
      return res.count;
    }

    const notifications = await this.getAll({ userId, tenantId });
    let count = 0;
    for (const n of notifications) {
      if (!n.read && !n.dismissed) {
        // eslint-disable-next-line no-await-in-loop
        await this.markAsRead(n.id);
        count++;
      }
    }
    return count;
  }

  // Dismiss notification
  async dismiss(id: string): Promise<boolean> {
    return this.update(id, { dismissed: true });
  }

  // Clear all notifications
  async clearAll(userId?: string, tenantId?: string): Promise<number> {
    if (this.useDb) {
      const res = await prisma.notificationRecord.deleteMany({
        where: {
          ...(userId ? { userId } : {}),
          ...(tenantId ? { tenantId } : {}),
        },
      });
      await this.notifySubscribers();
      return res.count;
    }

    const notifications = await this.getAll({ userId, tenantId });
    let count = 0;
    for (const n of notifications) {
      // eslint-disable-next-line no-await-in-loop
      if (await this.delete(n.id)) count++;
    }
    return count;
  }

  // Subscribe to updates
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscriptions.add(callback);

    // Immediately call with current notifications
    this.getAll()
      .then(callback)
      .catch(() => undefined);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(callback);
    };
  }

  // Notify all subscribers
  private async notifySubscribers(): Promise<void> {
    const allNotifications = await this.getAll();
    this.subscriptions.forEach((callback) => {
      try {
        callback(allNotifications);
      } catch (error) {
        console.error("Error in notification subscription callback:", error);
      }
    });
  }
}

const store = new NotificationStore();

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export class NotificationService {
  private rules: AlertRule[] = [];

  /**
   * Get all notifications with filtering
   */
  async getAll(options: GetAllOptions = {}): Promise<Notification[]> {
    return store.getAll(options);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId?: string, tenantId?: string): Promise<number> {
    return store.getUnreadCount(userId, tenantId);
  }

  /**
   * Send/create a notification
   */
  async send(
    notification: Omit<Notification, "id" | "createdAt" | "read" | "dismissed">,
  ): Promise<Notification> {
    const now = new Date();
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const fullNotification: Notification = {
      ...notification,
      id: notificationId,
      createdAt: now.toISOString(),
      read: false,
      dismissed: false,
      channel: notification.channel || "in-app",
      priority: notification.priority || "medium",
    };

    // Store in-app notification
    const channels = Array.isArray(fullNotification.channel)
      ? fullNotification.channel
      : [fullNotification.channel];

    if (channels.includes("in-app")) {
      await store.add(fullNotification);
    }

    // Send via other channels if specified
    const otherChannels = channels.filter((c) => c !== "in-app");
    if (otherChannels.length > 0) {
      await this.sendNotification({
        ...fullNotification,
        channel: otherChannels.length === 1 ? otherChannels[0] : otherChannels,
      });
    }

    return fullNotification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await store.markAsRead(id);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId?: string): Promise<void> {
    await store.markAllAsRead(userId);
  }

  /**
   * Dismiss notification
   */
  async dismiss(id: string): Promise<void> {
    await store.dismiss(id);
  }

  /**
   * Clear all notifications
   */
  async clearAll(userId?: string): Promise<void> {
    await store.clearAll(userId);
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    return store.subscribe(callback);
  }

  /**
   * Send notification
   */
  async sendNotification(notification: Notification): Promise<boolean> {
    try {
      // Normalize channel to array
      const channels = Array.isArray(notification.channel)
        ? notification.channel
        : [notification.channel];

      // Send via all specified channels
      const promises = channels.map((channel) => {
        switch (channel) {
          case "email":
            return this.sendEmail(notification);
          case "sms":
            return this.sendSMS(notification);
          case "push":
            return this.sendPush(notification);
          case "in-app":
            return this.sendInApp(notification);
          default:
            return Promise.resolve(false);
        }
      });

      const results = await Promise.all(promises);
      return results.some((r) => r);
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }

  /**
   * Send email notification
   * Uses centralized Email Service via Event Bus
   * Only works on server side (email service uses Node.js modules)
   */
  private async sendEmail(notification: Notification): Promise<boolean> {
    // Only send emails on server side
    if (typeof window !== "undefined") {
      console.warn("Email sending is only available on the server side");
      return false;
    }

    try {
      // Import email service dynamically to avoid circular dependencies
      const { sendEmailViaEvent } =
        await import("@/lib/services/email/integration/eventIntegration");

      // Convert notification to email message format
      const recipients = Array.isArray(notification.recipient)
        ? notification.recipient
        : [notification.recipient];

      const emailMessage = {
        tenantId: notification.tenantId || "default",
        from: process.env.EMAIL_FROM || "noreply@hazalyze.com",
        to: recipients.map((email) => ({ email })),
        subject: notification.title || notification.type,
        htmlBody: notification.message,
        textBody: notification.message,
        priority:
          notification.priority === "critical"
            ? "urgent"
            : notification.priority === "high"
              ? "high"
              : notification.priority === "low"
                ? "low"
                : "normal",
        moduleId: notification.source || "notifications",
        entityId: notification.entityId,
        entityType: notification.entityType,
        tags: notification.category ? [notification.category] : undefined,
        metadata: notification.data,
      };

      // Send via Event Bus (email service will handle it)
      await sendEmailViaEvent(emailMessage, "notifications");

      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(notification: Notification): Promise<boolean> {
    try {
      const response = await fetch("/api/notifications/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: notification.recipient,
          message: notification.message,
          priority: notification.priority,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error sending SMS:", error);
      return false;
    }
  }

  /**
   * Send push notification
   * Uses Web Push API for browser notifications
   */
  private async sendPush(notification: Notification): Promise<boolean> {
    try {
      // Only send push notifications on server side
      if (typeof window !== "undefined") {
        console.warn(
          "Push notification sending is only available on server side",
        );
        return false;
      }

      // Push notifications require web-push package and VAPID keys
      // To enable: npm install web-push && configure VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL

      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

      if (!vapidPublicKey || !vapidPrivateKey) {
        console.info(
          "[NotificationService] Push notifications disabled - VAPID keys not configured",
        );
        return false;
      }

      try {
        // Get subscription from user settings (would come from database)
        // For now, log the push attempt
        console.log("📱 Push notification prepared:", {
          title: notification.title,
          message: notification.message,
          userId: notification.userId,
        });

        // In production, fetch subscription from database and send
        // const subscription = await getUserPushSubscription(notification.userId);
        // await webpush.sendNotification(subscription, JSON.stringify({
        //   title: notification.title,
        //   body: notification.message,
        //   icon: '/icon-192.png',
        //   badge: '/badge-72.png',
        //   data: notification.data,
        // }));

        return true;
      } catch (importError) {
        console.warn("⚠️ Push notification setup failed:", importError);
        return false;
      }
    } catch (error) {
      console.error("Error sending push:", error);
      return false;
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(notification: Notification): Promise<boolean> {
    try {
      // Store in database for in-app display
      const response = await fetch("/api/notifications/in-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification),
      });
      return response.ok;
    } catch (error) {
      console.error("Error sending in-app notification:", error);
      return false;
    }
  }

  /**
   * Check alert rules and send notifications
   */
  async checkAlertRules(): Promise<void> {
    for (const rule of this.rules.filter((r) => r.enabled)) {
      const shouldTrigger = await this.evaluateRule(rule);
      if (shouldTrigger) {
        await this.triggerRule(rule);
      }
    }
  }

  /**
   * Evaluate alert rule conditions
   * Checks if all conditions are met for the rule to trigger
   */
  private async evaluateRule(rule: AlertRule): Promise<boolean> {
    try {
      // If no conditions, rule cannot trigger
      if (!rule.conditions || rule.conditions.length === 0) {
        return false;
      }

      // Get current data for rule evaluation based on rule type
      const ruleData = await this.getRuleEvaluationData(rule.type);
      if (!ruleData) {
        return false;
      }

      // Evaluate all conditions (AND logic - all must be true)
      for (const condition of rule.conditions) {
        const fieldValue = this.getNestedValue(ruleData, condition.field);
        const conditionMet = this.evaluateCondition(
          fieldValue,
          condition.operator,
          condition.value,
        );

        if (!conditionMet) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error evaluating alert rule:", error);
      return false;
    }
  }

  /**
   * Get data for rule evaluation based on notification type
   */
  private async getRuleEvaluationData(
    type: NotificationType,
  ): Promise<Record<string, any> | null> {
    // Fetch relevant data based on notification type
    // This would integrate with respective services in production
    switch (type) {
      case "expiry_alert":
        // Would fetch from inventory/MSDS service
        return { daysUntilExpiry: 30, itemCount: 5 };
      case "low_stock":
        // Would fetch from WMS service
        return { stockLevel: 10, reorderPoint: 20 };
      case "compliance_deadline":
        // Would fetch from compliance service
        return { daysUntilDeadline: 7, complianceType: "ISO" };
      case "training_renewal":
        // Would fetch from HR/training service
        return { daysUntilExpiry: 14, trainingType: "safety" };
      case "certification_expiry":
        // Would fetch from certification service
        return { daysUntilExpiry: 30, certificationType: "ISO9001" };
      default:
        return null;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    fieldValue: any,
    operator: AlertCondition["operator"],
    conditionValue: any,
  ): boolean {
    switch (operator) {
      case "equals":
        return fieldValue === conditionValue;
      case "greater_than":
        return Number(fieldValue) > Number(conditionValue);
      case "less_than":
        return Number(fieldValue) < Number(conditionValue);
      case "contains":
        return String(fieldValue)
          .toLowerCase()
          .includes(String(conditionValue).toLowerCase());
      case "between":
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const numValue = Number(fieldValue);
          return numValue >= conditionValue[0] && numValue <= conditionValue[1];
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Trigger alert rule
   */
  private async triggerRule(rule: AlertRule): Promise<void> {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: rule.type,
      priority: "medium",
      channel: rule.channels,
      title: this.getNotificationTitle(rule.type),
      message: this.getNotificationMessage(rule.type),
      recipient: rule.recipients,
      status: "pending",
    };
    await this.sendNotification(notification);
  }

  /**
   * Get notification title
   */
  private getNotificationTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      expiry_alert: "Chemical Expiry Alert",
      low_stock: "Low Stock Alert",
      compliance_deadline: "Compliance Deadline Reminder",
      training_renewal: "Training Renewal Required",
      certification_expiry: "Certification Expiring Soon",
      incident: "Chemical Incident Reported",
      msds_approved: "MSDS Approved",
      msds_rejected: "MSDS Rejected",
      container_transfer: "Container Transferred",
      system_alert: "System Alert",
    };
    return titles[type] || "Notification";
  }

  /**
   * Get notification message
   */
  private getNotificationMessage(type: NotificationType): string {
    const messages: Partial<Record<NotificationType, string>> = {
      expiry_alert:
        "A chemical is expiring soon. Please review and take action.",
      low_stock: "Chemical stock is running low. Consider reordering.",
      compliance_deadline:
        "A compliance deadline is approaching. Please review.",
      training_renewal: "Your training certification requires renewal.",
      certification_expiry: "A certification is expiring soon.",
      incident: "A new chemical incident has been reported.",
      msds_approved: "Your MSDS has been approved and saved.",
      msds_rejected: "Your MSDS requires revision. Please review feedback.",
      container_transfer: "A container has been transferred to a new location.",
      system_alert: "A system alert has been triggered.",
      success: "Operation completed successfully.",
      error: "An error occurred.",
      warning: "Please review this warning.",
      alert: "Please review this alert.",
      info: "You have a new notification.",
      mission_available: "You have new missions available to complete.",
      mission_completed: "You completed a mission!",
      recognition_received: "You received recognition from a colleague.",
    };
    return messages[type] || "You have a new notification.";
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return this.rules;
  }
}

export const notificationService = new NotificationService();
