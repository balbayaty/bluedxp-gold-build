/**
 * Warehouse Brand Messaging Integration Service
 * Integrates warehouse operations with brand messaging for professional communications
 */

import { brandMessagingService } from "@/lib/services/brand-messaging/brandMessagingService";
import type { BrandMessage, MessagingType } from "@/types/brand-messaging";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface WarehouseBrandMessage {
  id: string;
  warehouseId: string;
  type: "notification" | "alert" | "report" | "update" | "custom";
  recipient: string;
  message: BrandMessage;
  sentAt?: string;
  status: "pending" | "sent" | "failed";
}

export interface WarehouseBrandMessagingStats {
  totalMessages: number;
  byType: Record<string, number>;
  averageQuality: number;
  last24Hours: number;
}

// ============================================================================
// SERVICE
// ============================================================================

class WarehouseBrandMessagingIntegration {
  private messages: Map<string, WarehouseBrandMessage> = new Map();

  /**
   * Generate branded warehouse notification
   */
  async generateNotification(
    warehouseId: string,
    context: {
      title: string;
      body: string;
      recipient?: string;
      type?: MessagingType;
    },
  ): Promise<BrandMessage> {
    try {
      const message = await brandMessagingService.generateMessage({
        type: context.type || "notification",
        context: {
          domain: "warehouse",
          action: context.title,
          details: context.body,
          warehouseId,
        },
        language: "en", // Can be made configurable
      });

      // Publish event
      await eventBus.publish({
        id: `warehouse-brand-msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "warehouse.brand.message.generated",
        aggregateId: warehouseId,
        payload: {
          messageId: message.id,
          type: context.type || "notification",
        },
        timestamp: new Date().toISOString(),
      });

      return message;
    } catch (error) {
      console.error("Error generating brand message:", error);
      throw error;
    }
  }

  /**
   * Generate branded warehouse alert
   */
  async generateAlert(
    warehouseId: string,
    context: {
      alertType: string;
      severity: "critical" | "high" | "medium" | "low";
      message: string;
      recipient?: string;
    },
  ): Promise<BrandMessage> {
    try {
      const message = await brandMessagingService.generateMessage({
        type: "alert",
        context: {
          domain: "warehouse",
          action: `${context.alertType} Alert`,
          details: `Severity: ${context.severity}\n${context.message}`,
          warehouseId,
          severity: context.severity,
        },
        language: "en",
      });

      return message;
    } catch (error) {
      console.error("Error generating brand alert:", error);
      throw error;
    }
  }

  /**
   * Generate branded warehouse report
   */
  async generateReport(
    warehouseId: string,
    context: {
      reportType: string;
      summary: string;
      data?: Record<string, any>;
      recipient?: string;
    },
  ): Promise<BrandMessage> {
    try {
      const message = await brandMessagingService.generateMessage({
        type: "report",
        context: {
          domain: "warehouse",
          action: `${context.reportType} Report`,
          details: context.summary,
          warehouseId,
          data: context.data,
        },
        language: "en",
      });

      return message;
    } catch (error) {
      console.error("Error generating brand report:", error);
      throw error;
    }
  }

  /**
   * Store warehouse brand message
   */
  async storeMessage(
    warehouseId: string,
    message: BrandMessage,
    type: WarehouseBrandMessage["type"],
    recipient?: string,
  ): Promise<WarehouseBrandMessage> {
    const warehouseMessage: WarehouseBrandMessage = {
      id: `wbm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      type,
      recipient: recipient || "",
      message,
      status: "pending",
      sentAt: new Date().toISOString(),
    };

    this.messages.set(warehouseMessage.id, warehouseMessage);

    // Publish event
    await eventBus.publish({
      id: `warehouse-brand-msg-stored-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.brand.message.stored",
      aggregateId: warehouseId,
      payload: {
        messageId: warehouseMessage.id,
        type,
      },
      timestamp: new Date().toISOString(),
    });

    return warehouseMessage;
  }

  /**
   * Get messaging statistics
   */
  async getStats(warehouseId: string): Promise<WarehouseBrandMessagingStats> {
    const warehouseMessages = Array.from(this.messages.values()).filter(
      (m) => m.warehouseId === warehouseId,
    );

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stats: WarehouseBrandMessagingStats = {
      totalMessages: warehouseMessages.length,
      byType: {},
      averageQuality: 0,
      last24Hours: warehouseMessages.filter(
        (m) => m.sentAt && new Date(m.sentAt) > last24Hours,
      ).length,
    };

    let totalQuality = 0;
    warehouseMessages.forEach((m) => {
      stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
      if (m.message.quality) {
        totalQuality += m.message.quality.score || 0;
      }
    });

    if (warehouseMessages.length > 0) {
      stats.averageQuality = totalQuality / warehouseMessages.length;
    }

    return stats;
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(
    warehouseId: string,
    limit: number = 50,
  ): Promise<WarehouseBrandMessage[]> {
    return Array.from(this.messages.values())
      .filter((m) => m.warehouseId === warehouseId)
      .sort((a, b) => {
        const aTime = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const bTime = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }
}

export const warehouseBrandMessagingIntegration =
  new WarehouseBrandMessagingIntegration();
