/**
 * Real-Time Updates Service
 *
 * WebSocket/SSE integration for real-time updates
 * Live tracking, notifications, status updates
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import type { Shipment, JourneyAnalysis } from "@/lib/services/transportation";

// ============================================================================
// TYPES
// ============================================================================

export type UpdateType =
  | "SHIPMENT_STATUS"
  | "SHIPMENT_LOCATION"
  | "JOURNEY_TOUCHPOINT"
  | "JOURNEY_LEG"
  | "EXCEPTION"
  | "DOCUMENT"
  | "CUSTOMS_STATUS"
  | "CARRIER_UPDATE"
  | "ROUTE_OPTIMIZATION"
  | "PRICING_UPDATE"
  | "EMISSIONS_UPDATE"
  | "ALERT"
  | "NOTIFICATION";

export interface RealtimeUpdate {
  id: string;
  type: UpdateType;
  entityId: string;
  entityType:
    | "SHIPMENT"
    | "JOURNEY"
    | "ROUTE"
    | "CARRIER"
    | "CUSTOMS"
    | "OTHER";
  data: Record<string, any>;
  timestamp: Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  userId?: string;
  tenantId?: string;
}

export interface RealtimeSubscription {
  id: string;
  userId: string;
  tenantId?: string;
  subscriptions: {
    entityType: RealtimeUpdate["entityType"];
    entityIds?: string[]; // If empty, subscribe to all
    updateTypes?: UpdateType[]; // If empty, subscribe to all
  }[];
  connectionId?: string; // WebSocket connection ID
  createdAt: Date;
  lastActivity: Date;
}

export interface RealtimeNotification {
  id: string;
  userId: string;
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class RealtimeUpdatesService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private notifications: Map<string, RealtimeNotification[]> = new Map(); // userId -> notifications
  private updateHistory: Map<string, RealtimeUpdate[]> = new Map(); // entityId -> updates

  /**
   * Subscribe to real-time updates
   */
  async subscribe(request: {
    userId: string;
    tenantId?: string;
    subscriptions: RealtimeSubscription["subscriptions"];
    connectionId?: string;
  }): Promise<RealtimeSubscription> {
    const subscription: RealtimeSubscription = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      userId: request.userId,
      tenantId: request.tenantId,
      subscriptions: request.subscriptions,
      connectionId: request.connectionId,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.subscriptions.set(subscription.id, subscription);

    await eventBus.publish("transportation.realtime.subscribed", {
      subscriptionId: subscription.id,
      userId: request.userId,
      timestamp: new Date().toISOString(),
    });

    return subscription;
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);

      await eventBus.publish("transportation.realtime.unsubscribed", {
        subscriptionId,
        userId: subscription.userId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Publish real-time update
   */
  async publishUpdate(update: RealtimeUpdate): Promise<void> {
    // Store in history
    if (!this.updateHistory.has(update.entityId)) {
      this.updateHistory.set(update.entityId, []);
    }
    const history = this.updateHistory.get(update.entityId)!;
    history.push(update);
    // Keep last 100 updates per entity
    if (history.length > 100) {
      history.shift();
    }

    // Find matching subscriptions
    const matchingSubscriptions = Array.from(
      this.subscriptions.values(),
    ).filter((sub) => {
      return sub.subscriptions.some((s) => {
        // Check entity type
        if (s.entityType !== update.entityType) return false;

        // Check entity IDs
        if (
          s.entityIds &&
          s.entityIds.length > 0 &&
          !s.entityIds.includes(update.entityId)
        ) {
          return false;
        }

        // Check update types
        if (
          s.updateTypes &&
          s.updateTypes.length > 0 &&
          !s.updateTypes.includes(update.type)
        ) {
          return false;
        }

        return true;
      });
    });

    // Send to subscribers (in production, via WebSocket/SSE)
    for (const subscription of matchingSubscriptions) {
      await this.sendToSubscriber(subscription, update);
    }

    // Create notification if priority is high
    if (update.priority === "HIGH" || update.priority === "CRITICAL") {
      await this.createNotification({
        userId: update.userId || "system",
        type: update.priority === "CRITICAL" ? "ERROR" : "WARNING",
        title: this.getUpdateTitle(update),
        message: this.getUpdateMessage(update),
        data: update.data,
      });
    }

    // Publish event
    await eventBus.publish("transportation.realtime.update", {
      updateId: update.id,
      type: update.type,
      entityId: update.entityId,
      timestamp: update.timestamp.toISOString(),
    });
  }

  /**
   * Send update to subscriber
   */
  private async sendToSubscriber(
    subscription: RealtimeSubscription,
    update: RealtimeUpdate,
  ): Promise<void> {
    // In production, send via WebSocket or SSE
    // For now, store for retrieval
    subscription.lastActivity = new Date();
  }

  /**
   * Create notification
   */
  async createNotification(request: {
    userId: string;
    type: RealtimeNotification["type"];
    title: string;
    message: string;
    data?: Record<string, any>;
    actionUrl?: string;
  }): Promise<RealtimeNotification> {
    const notification: RealtimeNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      userId: request.userId,
      type: request.type,
      title: request.title,
      message: request.message,
      data: request.data,
      read: false,
      createdAt: new Date(),
      actionUrl: request.actionUrl,
    };

    if (!this.notifications.has(request.userId)) {
      this.notifications.set(request.userId, []);
    }
    this.notifications.get(request.userId)!.push(notification);

    // Keep last 100 notifications per user
    const userNotifications = this.notifications.get(request.userId)!;
    if (userNotifications.length > 100) {
      userNotifications.shift();
    }

    await eventBus.publish("transportation.realtime.notification", {
      notificationId: notification.id,
      userId: request.userId,
      type: request.type,
      timestamp: new Date().toISOString(),
    });

    return notification;
  }

  /**
   * Get updates for entity
   */
  getUpdates(entityId: string, limit?: number): RealtimeUpdate[] {
    const updates = this.updateHistory.get(entityId) || [];
    return limit ? updates.slice(-limit) : updates;
  }

  /**
   * Get notifications for user
   */
  getNotifications(
    userId: string,
    unreadOnly?: boolean,
  ): RealtimeNotification[] {
    const notifications = this.notifications.get(userId) || [];
    return unreadOnly ? notifications.filter((n) => !n.read) : notifications;
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const notifications = this.notifications.get(userId);
    if (notifications) {
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
  }

  /**
   * Get update title
   */
  private getUpdateTitle(update: RealtimeUpdate): string {
    const titles: Record<UpdateType, string> = {
      SHIPMENT_STATUS: "Shipment Status Updated",
      SHIPMENT_LOCATION: "Shipment Location Updated",
      JOURNEY_TOUCHPOINT: "Journey Touchpoint Updated",
      JOURNEY_LEG: "Journey Leg Updated",
      EXCEPTION: "Exception Detected",
      DOCUMENT: "Document Status Changed",
      CUSTOMS_STATUS: "Customs Status Updated",
      CARRIER_UPDATE: "Carrier Update",
      ROUTE_OPTIMIZATION: "Route Optimized",
      PRICING_UPDATE: "Pricing Updated",
      EMISSIONS_UPDATE: "Emissions Updated",
      ALERT: "Alert",
      NOTIFICATION: "Notification",
    };
    return titles[update.type] || "Update";
  }

  /**
   * Get update message
   */
  private getUpdateMessage(update: RealtimeUpdate): string {
    switch (update.type) {
      case "SHIPMENT_STATUS":
        return `Shipment ${update.entityId} status changed to ${update.data.status}`;
      case "EXCEPTION":
        return `Exception detected: ${update.data.description || "Unknown exception"}`;
      case "CUSTOMS_STATUS":
        return `Customs status: ${update.data.status || "Unknown"}`;
      default:
        return `Update for ${update.entityType} ${update.entityId}`;
    }
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): RealtimeSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get subscriptions for user
   */
  getUserSubscriptions(userId: string): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (s) => s.userId === userId,
    );
  }
}

export const realtimeUpdatesService = new RealtimeUpdatesService();
