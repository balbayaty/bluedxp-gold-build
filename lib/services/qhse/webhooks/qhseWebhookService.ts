/**
 * QHSE Webhook Service
 * Webhook integration for QHSE events
 * Integrated with platform webhook service
 */

import * as webhookService from "@/lib/services/webhooks/webhookService";
import { eventBus } from "@/lib/services/event-store";
import type { Webhook, WebhookEvent } from "@/types/userManagement";

// ============================================================================
// QHSE WEBHOOK TYPES
// ============================================================================

export type QHSEWebhookEvent =
  | "qhse.incident.created"
  | "qhse.incident.updated"
  | "qhse.incident.critical"
  | "qhse.inspection.scheduled"
  | "qhse.inspection.completed"
  | "qhse.inspection.overdue"
  | "qhse.training.assigned"
  | "qhse.training.completed"
  | "qhse.training.expiring"
  | "qhse.training.expired"
  | "qhse.audit.scheduled"
  | "qhse.audit.completed"
  | "qhse.metric.threshold"
  | "qhse.compliance.deadline";

export interface QHSEWebhookConfig {
  id: string;
  name: string;
  url: string;
  events: QHSEWebhookEvent[];
  secret?: string;
  enabled: boolean;
  tenantId: string;
  headers?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// QHSE WEBHOOK SERVICE
// ============================================================================

class QHSEWebhookService {
  private configs: Map<string, QHSEWebhookConfig> = new Map();

  /**
   * Register webhook
   */
  async registerWebhook(
    config: Omit<QHSEWebhookConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<QHSEWebhookConfig> {
    const webhookConfig: QHSEWebhookConfig = {
      ...config,
      id: `webhook-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.configs.set(webhookConfig.id, webhookConfig);

    // Register with platform webhook service (store locally for now)
    // In production, this would be stored in database and managed by platform webhook service
    // Note: Platform webhook service uses function-based API, not class methods

    await eventBus.publish({
      type: "qhse.webhook.registered",
      payload: { webhookId: webhookConfig.id, url: webhookConfig.url },
      timestamp: new Date().toISOString(),
    });

    return webhookConfig;
  }

  /**
   * Trigger webhook for event
   */
  async triggerWebhook(event: QHSEWebhookEvent, data: any): Promise<void> {
    const matchingWebhooks = Array.from(this.configs.values()).filter(
      (w) => w.enabled && w.events.includes(event),
    );

    for (const webhook of matchingWebhooks) {
      try {
        const platformWebhook: Webhook = {
          id: webhook.id,
          userId: "", // Will be set by caller
          tenantId: webhook.tenantId,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events as WebhookEvent[],
          secret: webhook.secret || "",
          verifySSL: true,
          status: webhook.enabled ? "ACTIVE" : "INACTIVE",
          retryPolicy: {
            maxRetries: webhook.retryConfig?.maxRetries || 3,
            retryDelay: webhook.retryConfig?.retryDelay || 1000,
            backoffMultiplier: 2,
          },
          totalDeliveries: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await webhookService.triggerWebhook(
          platformWebhook,
          event as WebhookEvent,
          data,
        );
      } catch (error) {
        console.error(`Error triggering webhook ${webhook.id}:`, error);
        // Continue with other webhooks
      }
    }
  }

  /**
   * Get webhook config
   */
  getWebhook(webhookId: string): QHSEWebhookConfig | null {
    return this.configs.get(webhookId) || null;
  }

  /**
   * Get all webhooks for tenant
   */
  getWebhooksForTenant(tenantId: string): QHSEWebhookConfig[] {
    return Array.from(this.configs.values()).filter(
      (w) => w.tenantId === tenantId,
    );
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<QHSEWebhookConfig>,
  ): Promise<QHSEWebhookConfig> {
    const webhook = this.configs.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const updated = {
      ...webhook,
      ...updates,
      id: webhookId,
      updatedAt: new Date().toISOString(),
    };

    this.configs.set(webhookId, updated);

    // Update platform webhook (in production, would update database)
    // Platform webhook service manages webhooks separately

    return updated;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    if (!this.configs.has(webhookId)) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    this.configs.delete(webhookId);

    // Delete from platform webhook service (in production, would delete from database)
    // Platform webhook service manages webhooks separately

    await eventBus.publish({
      type: "qhse.webhook.deleted",
      payload: { webhookId },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Test webhook
   */
  async testWebhook(
    webhookId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const webhook = this.configs.get(webhookId);
    if (!webhook) {
      return { success: false, error: "Webhook not found" };
    }

    try {
      const platformWebhook: Webhook = {
        id: webhook.id,
        userId: "", // Will be set by caller
        tenantId: webhook.tenantId,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events as WebhookEvent[],
        secret: webhook.secret || "",
        verifySSL: true,
        status: webhook.enabled ? "ACTIVE" : "INACTIVE",
        retryPolicy: {
          maxRetries: webhook.retryConfig?.maxRetries || 3,
          retryDelay: webhook.retryConfig?.retryDelay || 1000,
          backoffMultiplier: 2,
        },
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await webhookService.triggerWebhook(
        platformWebhook,
        "qhse.incident.created" as WebhookEvent,
        {
          test: true,
          timestamp: new Date().toISOString(),
        },
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const qhseWebhookService = new QHSEWebhookService();
