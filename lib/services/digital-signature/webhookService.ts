/**
 * Webhook Service - Send webhook notifications to external systems
 */

import { eventBus } from "@/lib/services/event-store";
import * as crypto from "crypto";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
}

// In-memory storage (will be replaced with database)
const webhookStore = new Map<string, Webhook>();

class WebhookService {
  /**
   * Register Webhook
   */
  async registerWebhook(
    url: string,
    events: string[],
    secret?: string,
  ): Promise<Webhook> {
    const webhook: Webhook = {
      id: `webhook-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`,
      url,
      events,
      secret: secret || crypto.randomBytes(32).toString("hex"),
      isActive: true,
      createdAt: new Date(),
    };

    webhookStore.set(webhook.id, webhook);

    // Subscribe to events
    for (const event of events) {
      eventBus.subscribe(event, async (eventData) => {
        await this.sendWebhook(webhook, event, eventData);
      });
    }

    return webhook;
  }

  /**
   * Send Webhook
   */
  private async sendWebhook(
    webhook: Webhook,
    event: string,
    data: any,
  ): Promise<void> {
    if (!webhook.isActive) {
      return;
    }

    try {
      // Create payload
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      // Create signature
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      // Send webhook
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${webhook.url} - ${response.status}`);
      }
    } catch (error) {
      console.error(`Error sending webhook to ${webhook.url}:`, error);
    }
  }

  /**
   * Get Webhook by ID
   */
  getWebhook(id: string): Webhook | undefined {
    return webhookStore.get(id);
  }

  /**
   * List Webhooks
   */
  listWebhooks(): Webhook[] {
    return Array.from(webhookStore.values());
  }

  /**
   * Delete Webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    webhookStore.delete(id);
  }
}

export const webhookService = new WebhookService();
