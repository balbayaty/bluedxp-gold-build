/**
 * Warehouse WhatsApp Integration Service
 * Integrates warehouse operations with WhatsApp for notifications and alerts
 */

import { WhatsAppService } from "@/lib/services/whatsapp/whatsappService";
import type {
  WhatsAppMessage,
  WhatsAppMessageResult,
} from "@/lib/services/whatsapp/whatsappService";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface WarehouseWhatsAppNotification {
  id: string;
  warehouseId: string;
  type: "alert" | "order_status" | "inventory" | "task" | "incident" | "custom";
  recipient: string; // Phone number
  message: string;
  templateId?: string;
  templateParams?: Record<string, string>;
  priority: "high" | "normal" | "low";
  status: "pending" | "sent" | "failed";
  sentAt?: string;
  error?: string;
}

export interface WarehouseWhatsAppStats {
  totalSent: number;
  totalFailed: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  last24Hours: number;
}

// ============================================================================
// SERVICE
// ============================================================================

class WarehouseWhatsAppIntegration {
  private whatsappService: WhatsAppService;
  private notifications: Map<string, WarehouseWhatsAppNotification> = new Map();

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Send warehouse alert via WhatsApp
   */
  async sendAlert(
    warehouseId: string,
    alert: {
      type: string;
      message: string;
      recipient: string;
      priority?: "high" | "normal" | "low";
    },
  ): Promise<WarehouseWhatsAppNotification> {
    const notification: WarehouseWhatsAppNotification = {
      id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      type: "alert",
      recipient: alert.recipient,
      message: alert.message,
      priority: alert.priority || "normal",
      status: "pending",
    };

    try {
      const whatsappMessage: WhatsAppMessage = {
        to: alert.recipient,
        message: `🚨 Warehouse Alert\n\n${alert.message}\n\nWarehouse: ${warehouseId}`,
        priority: alert.priority || "normal",
      };

      const result = await this.whatsappService.sendMessage(whatsappMessage);

      if (result.success) {
        notification.status = "sent";
        notification.sentAt = new Date().toISOString();
      } else {
        notification.status = "failed";
        notification.error = result.error;
      }

      this.notifications.set(notification.id, notification);

      // Publish event
      await eventBus.publish({
        id: `warehouse-whatsapp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "warehouse.whatsapp.sent",
        aggregateId: warehouseId,
        payload: {
          notificationId: notification.id,
          type: notification.type,
          status: notification.status,
        },
        timestamp: new Date().toISOString(),
      });

      return notification;
    } catch (error) {
      notification.status = "failed";
      notification.error =
        error instanceof Error ? error.message : "Unknown error";
      this.notifications.set(notification.id, notification);
      throw error;
    }
  }

  /**
   * Send order status update via WhatsApp
   */
  async sendOrderStatus(
    warehouseId: string,
    order: {
      orderId: string;
      status: string;
      recipient: string;
      details?: string;
    },
  ): Promise<WarehouseWhatsAppNotification> {
    const notification: WarehouseWhatsAppNotification = {
      id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      type: "order_status",
      recipient: order.recipient,
      message: `Order ${order.orderId} status: ${order.status}${order.details ? `\n${order.details}` : ""}`,
      priority: "normal",
      status: "pending",
    };

    try {
      const whatsappMessage: WhatsAppMessage = {
        to: order.recipient,
        message: `📦 Order Update\n\nOrder: ${order.orderId}\nStatus: ${order.status}${order.details ? `\n\n${order.details}` : ""}`,
        priority: "normal",
      };

      const result = await this.whatsappService.sendMessage(whatsappMessage);

      if (result.success) {
        notification.status = "sent";
        notification.sentAt = new Date().toISOString();
      } else {
        notification.status = "failed";
        notification.error = result.error;
      }

      this.notifications.set(notification.id, notification);
      return notification;
    } catch (error) {
      notification.status = "failed";
      notification.error =
        error instanceof Error ? error.message : "Unknown error";
      this.notifications.set(notification.id, notification);
      throw error;
    }
  }

  /**
   * Send inventory alert via WhatsApp
   */
  async sendInventoryAlert(
    warehouseId: string,
    alert: {
      sku: string;
      location: string;
      message: string;
      recipient: string;
      priority?: "high" | "normal" | "low";
    },
  ): Promise<WarehouseWhatsAppNotification> {
    const notification: WarehouseWhatsAppNotification = {
      id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      type: "inventory",
      recipient: alert.recipient,
      message: `Inventory Alert: ${alert.message}\nSKU: ${alert.sku}\nLocation: ${alert.location}`,
      priority: alert.priority || "normal",
      status: "pending",
    };

    try {
      const whatsappMessage: WhatsAppMessage = {
        to: alert.recipient,
        message: `📊 Inventory Alert\n\n${alert.message}\n\nSKU: ${alert.sku}\nLocation: ${alert.location}`,
        priority: alert.priority || "normal",
      };

      const result = await this.whatsappService.sendMessage(whatsappMessage);

      if (result.success) {
        notification.status = "sent";
        notification.sentAt = new Date().toISOString();
      } else {
        notification.status = "failed";
        notification.error = result.error;
      }

      this.notifications.set(notification.id, notification);
      return notification;
    } catch (error) {
      notification.status = "failed";
      notification.error =
        error instanceof Error ? error.message : "Unknown error";
      this.notifications.set(notification.id, notification);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(warehouseId: string): Promise<WarehouseWhatsAppStats> {
    const warehouseNotifications = Array.from(
      this.notifications.values(),
    ).filter((n) => n.warehouseId === warehouseId);

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stats: WarehouseWhatsAppStats = {
      totalSent: warehouseNotifications.filter((n) => n.status === "sent")
        .length,
      totalFailed: warehouseNotifications.filter((n) => n.status === "failed")
        .length,
      byType: {},
      byPriority: {},
      last24Hours: warehouseNotifications.filter(
        (n) => n.sentAt && new Date(n.sentAt) > last24Hours,
      ).length,
    };

    warehouseNotifications.forEach((n) => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
      stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get recent notifications
   */
  async getRecentNotifications(
    warehouseId: string,
    limit: number = 50,
  ): Promise<WarehouseWhatsAppNotification[]> {
    return Array.from(this.notifications.values())
      .filter((n) => n.warehouseId === warehouseId)
      .sort((a, b) => {
        const aTime = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const bTime = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }
}

export const warehouseWhatsAppIntegration = new WarehouseWhatsAppIntegration();
