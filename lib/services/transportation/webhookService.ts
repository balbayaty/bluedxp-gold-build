/**
 * Transportation Webhook Service
 *
 * Real-time webhook notifications for transportation events
 * Integrates with existing webhook service
 */

import { deliverWebhook } from "@/lib/services/webhooks/webhookService";
import { eventBus } from "@/lib/services/event-store";
import type { Shipment } from "@/types/tms";

export interface TransportationWebhookEvent {
  type:
    | "shipment.created"
    | "shipment.updated"
    | "shipment.status.changed"
    | "shipment.location.updated"
    | "shipment.exception.occurred"
    | "shipment.delivered"
    | "route.comparison.completed"
    | "pricing.intelligence.updated"
    | "emissions.calculated"
    | "transit.time.predicted"
    | "ai.insights.generated"
    | "load.matched"
    | "iot.alert.triggered"
    | "freight.audited"
    | "payment.processed"
    | "compliance.violation.detected"
    | "carrier.performance.updated"
    | "fleet.optimized"
    | "blockchain.transaction.recorded";
  shipmentId?: string;
  data: any;
  timestamp: Date | string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: TransportationWebhookEvent["type"][];
  secret?: string;
  active: boolean;
  createdAt: Date | string;
  lastTriggered?: Date | string;
}

export class TransportationWebhookService {
  private subscriptions: Map<string, WebhookSubscription> = new Map();

  /**
   * Subscribe to transportation webhook events
   */
  async subscribe(
    url: string,
    events: TransportationWebhookEvent["type"][],
    secret?: string,
  ): Promise<string> {
    const subscriptionId = `transportation-webhook-${Date.now()}`;

    const subscription: WebhookSubscription = {
      id: subscriptionId,
      url,
      events,
      secret,
      active: true,
      createdAt: new Date().toISOString(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Subscribe to event bus events
    for (const eventType of events) {
      await this.subscribeToEventBus(eventType);
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from webhook events
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.set(subscriptionId, subscription);
    }
  }

  /**
   * Trigger webhook for event
   */
  async triggerWebhook(event: TransportationWebhookEvent): Promise<void> {
    // Find all active subscriptions for this event type
    const relevantSubscriptions = Array.from(
      this.subscriptions.values(),
    ).filter((sub) => sub.active && sub.events.includes(event.type));

    // Trigger webhooks
    for (const subscription of relevantSubscriptions) {
      try {
        await this.sendWebhook(subscription, event);
        subscription.lastTriggered = new Date().toISOString();
        this.subscriptions.set(subscription.id, subscription);
      } catch (error) {
        console.error(`Failed to send webhook to ${subscription.url}:`, error);
        // In production, implement retry logic
      }
    }
  }

  /**
   * Send webhook
   */
  private async sendWebhook(
    subscription: WebhookSubscription,
    event: TransportationWebhookEvent,
  ): Promise<void> {
    // Use existing webhook service
    await deliverWebhook(
      subscription.url,
      event.type,
      event.data,
      subscription.secret,
    );
  }

  /**
   * Subscribe to event bus events
   */
  private async subscribeToEventBus(
    eventType: TransportationWebhookEvent["type"],
  ): Promise<void> {
    // Map webhook event types to event bus event types
    const eventBusEventType = this.mapToEventBusType(eventType);

    // Subscribe to event bus
    eventBus.subscribe(eventBusEventType, async (eventData: any) => {
      await this.triggerWebhook({
        type: eventType,
        shipmentId: eventData.shipmentId,
        data: eventData,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Map webhook event type to event bus event type
   */
  private mapToEventBusType(
    eventType: TransportationWebhookEvent["type"],
  ): string {
    const mapping: Record<TransportationWebhookEvent["type"], string> = {
      "shipment.created": "transportation.shipment.created",
      "shipment.updated": "transportation.shipment.updated",
      "shipment.status.changed": "transportation.shipment.status.changed",
      "shipment.location.updated": "transportation.shipment.location.updated",
      "shipment.exception.occurred": "transportation.shipment.exception",
      "shipment.delivered": "transportation.shipment.delivered",
      "route.comparison.completed": "transportation.route.comparison.completed",
      "pricing.intelligence.updated":
        "transportation.pricing.intelligence.updated",
      "emissions.calculated": "transportation.emissions.calculated",
      "transit.time.predicted": "transportation.transit.time.predicted",
      "ai.insights.generated": "transportation.ai.insights.generated",
      "load.matched": "transportation.load.matched",
      "iot.alert.triggered": "transportation.iot.alert",
      "freight.audited": "transportation.freight.audited",
      "payment.processed": "transportation.payment.processed",
      "compliance.violation.detected": "transportation.compliance.violation",
      "carrier.performance.updated":
        "transportation.carrier.performance.updated",
      "fleet.optimized": "transportation.fleet.optimized",
      "blockchain.transaction.recorded":
        "transportation.blockchain.transaction.recorded",
    };
    return mapping[eventType] || eventType;
  }

  /**
   * Get subscription
   */
  getSubscription(subscriptionId: string): WebhookSubscription | null {
    return this.subscriptions.get(subscriptionId) || null;
  }

  /**
   * List all subscriptions
   */
  listSubscriptions(): WebhookSubscription[] {
    return Array.from(this.subscriptions.values());
  }
}

export const transportationWebhookService = new TransportationWebhookService();
