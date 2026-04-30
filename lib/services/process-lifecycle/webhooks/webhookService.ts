/**
 * Advanced Webhook Service for Process Lifecycle Module
 * Event-driven webhooks with retry, signatures, and management
 * More advanced than competitors
 */

import crypto from "crypto";
import type { ProcessEvent } from "@/types/process-lifecycle";

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  tenantId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    lastDeliveryAt?: Date;
    lastSuccessAt?: Date;
    lastFailureAt?: Date;
  };
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: ProcessEvent;
  status: "pending" | "delivered" | "failed" | "retrying";
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  createdAt: Date;
}

export interface WebhookRetryConfig {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export class AdvancedWebhookService {
  private webhooks: Map<string, Webhook> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private retryQueue: WebhookDelivery[] = [];
  private retryConfig: WebhookRetryConfig = {
    maxAttempts: 5,
    initialDelay: 1000, // 1 second
    maxDelay: 300000, // 5 minutes
    backoffMultiplier: 2,
  };
  private processingInterval: NodeJS.Timeout | null = null;
  private metrics = {
    totalWebhooks: 0,
    activeWebhooks: 0,
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
  };

  /**
   * Create webhook
   */
  async createWebhook(data: {
    url: string;
    events: string[];
    tenantId: string;
    secret?: string;
    metadata?: Record<string, any>;
  }): Promise<Webhook> {
    const webhook: Webhook = {
      id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      url: data.url,
      events: data.events,
      secret: data.secret || this.generateSecret(),
      active: true,
      tenantId: data.tenantId,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
      },
    };

    this.webhooks.set(webhook.id, webhook);
    this.metrics.totalWebhooks++;
    this.metrics.activeWebhooks++;

    console.log(`✅ Webhook created: ${webhook.id}`);
    return webhook;
  }

  /**
   * Get webhook
   */
  async getWebhook(webhookId: string): Promise<Webhook | null> {
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * List webhooks
   */
  async listWebhooks(tenantId?: string, active?: boolean): Promise<Webhook[]> {
    let webhooks = Array.from(this.webhooks.values());

    if (tenantId) {
      webhooks = webhooks.filter((w) => w.tenantId === tenantId);
    }

    if (active !== undefined) {
      webhooks = webhooks.filter((w) => w.active === active);
    }

    return webhooks;
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<Webhook>,
  ): Promise<Webhook | null> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;

    const updated = {
      ...webhook,
      ...updates,
      updatedAt: new Date(),
    };

    this.webhooks.set(webhookId, updated);
    return updated;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    this.webhooks.delete(webhookId);
    if (webhook.active) {
      this.metrics.activeWebhooks--;
    }
    this.metrics.totalWebhooks--;

    return true;
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(event: ProcessEvent): Promise<void> {
    // Find webhooks subscribed to this event type
    const subscribedWebhooks = Array.from(this.webhooks.values()).filter(
      (webhook) => {
        // Multi-tenant day 1: never deliver cross-tenant
        if (!webhook.active) return false;
        if (!webhook.events.includes(event.type)) return false;
        if (event.tenantId && webhook.tenantId !== event.tenantId) return false;
        return true;
      },
    );

    // Create deliveries for each webhook
    const promises = subscribedWebhooks.map((webhook) => {
      return this.createDelivery(webhook, event);
    });

    await Promise.all(promises);

    // Start processing if not already running
    if (!this.processingInterval) {
      this.startProcessing();
    }
  }

  /**
   * Create delivery
   */
  private async createDelivery(
    webhook: Webhook,
    event: ProcessEvent,
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      webhookId: webhook.id,
      event,
      status: "pending",
      attempts: 0,
      maxAttempts: this.retryConfig.maxAttempts,
      createdAt: new Date(),
    };

    this.deliveries.set(delivery.id, delivery);
    this.retryQueue.push(delivery);
    this.metrics.totalDeliveries++;

    // Update webhook stats
    webhook.stats.totalDeliveries++;

    return delivery;
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, 5000); // Process every 5 seconds
  }

  /**
   * Process delivery queue
   */
  private async processQueue(): Promise<void> {
    const now = new Date();
    const readyDeliveries = this.retryQueue.filter((delivery) => {
      if (delivery.status === "pending") return true;
      if (
        delivery.status === "retrying" &&
        delivery.nextRetryAt &&
        delivery.nextRetryAt <= now
      ) {
        return true;
      }
      return false;
    });

    for (const delivery of readyDeliveries) {
      await this.deliver(delivery);
    }

    // Remove completed/failed deliveries from queue
    this.retryQueue = this.retryQueue.filter((d) => {
      return d.status === "pending" || d.status === "retrying";
    });
  }

  /**
   * Deliver webhook
   */
  private async deliver(delivery: WebhookDelivery): Promise<void> {
    const webhook = this.webhooks.get(delivery.webhookId);
    if (!webhook) {
      delivery.status = "failed";
      delivery.error = "Webhook not found";
      return;
    }

    delivery.attempts++;
    delivery.status = delivery.attempts > 1 ? "retrying" : "pending";

    try {
      // Create signature
      const signature = this.createSignature(webhook.secret, delivery.event);

      // Prepare payload
      const payload = JSON.stringify({
        id: delivery.id,
        event: delivery.event,
        timestamp: new Date().toISOString(),
      });

      // Send webhook
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Id": webhook.id,
          "X-Webhook-Event": delivery.event.type,
        },
        body: payload,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (response.ok) {
        // Success
        delivery.status = "delivered";
        delivery.deliveredAt = new Date();
        delivery.responseCode = response.status;
        delivery.responseBody = await response.text().catch(() => "");

        // Update webhook stats
        webhook.stats.successfulDeliveries++;
        webhook.stats.lastDeliveryAt = new Date();
        webhook.stats.lastSuccessAt = new Date();

        // Remove from queue
        const index = this.retryQueue.indexOf(delivery);
        if (index > -1) {
          this.retryQueue.splice(index, 1);
        }

        this.metrics.successfulDeliveries++;
      } else {
        // Failed - schedule retry
        await this.scheduleRetry(delivery, response.status);
      }
    } catch (error) {
      // Error - schedule retry
      delivery.error = error instanceof Error ? error.message : "Unknown error";
      await this.scheduleRetry(delivery);
    }
  }

  /**
   * Schedule retry
   */
  private async scheduleRetry(
    delivery: WebhookDelivery,
    responseCode?: number,
  ): Promise<void> {
    if (delivery.attempts >= delivery.maxAttempts) {
      // Max attempts reached - mark as failed
      delivery.status = "failed";
      delivery.failedAt = new Date();
      delivery.responseCode = responseCode;

      const webhook = this.webhooks.get(delivery.webhookId);
      if (webhook) {
        webhook.stats.failedDeliveries++;
        webhook.stats.lastFailureAt = new Date();
      }

      this.metrics.failedDeliveries++;

      // Remove from queue
      const index = this.retryQueue.indexOf(delivery);
      if (index > -1) {
        this.retryQueue.splice(index, 1);
      }
    } else {
      // Calculate next retry time (exponential backoff)
      const delay = Math.min(
        this.retryConfig.initialDelay *
          Math.pow(this.retryConfig.backoffMultiplier, delivery.attempts - 1),
        this.retryConfig.maxDelay,
      );

      delivery.status = "retrying";
      delivery.nextRetryAt = new Date(Date.now() + delay);
    }
  }

  /**
   * Create HMAC signature
   */
  private createSignature(secret: string, event: ProcessEvent): string {
    const payload = JSON.stringify(event);
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    return `sha256=${hmac.digest("hex")}`;
  }

  /**
   * Verify signature
   */
  verifySignature(signature: string, secret: string, payload: string): boolean {
    const expectedSignature = this.createSignature(
      secret,
      JSON.parse(payload) as ProcessEvent,
    );
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Generate secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Get delivery
   */
  async getDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
    return this.deliveries.get(deliveryId) || null;
  }

  /**
   * List deliveries
   */
  async listDeliveries(
    webhookId?: string,
    status?: string,
  ): Promise<WebhookDelivery[]> {
    let deliveries = Array.from(this.deliveries.values());

    if (webhookId) {
      deliveries = deliveries.filter((d) => d.webhookId === webhookId);
    }

    if (status) {
      deliveries = deliveries.filter((d) => d.status === status);
    }

    return deliveries.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      pendingDeliveries: this.retryQueue.filter((d) => d.status === "pending")
        .length,
      retryingDeliveries: this.retryQueue.filter((d) => d.status === "retrying")
        .length,
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Singleton instance
export const webhookService = new AdvancedWebhookService();

export default webhookService;
