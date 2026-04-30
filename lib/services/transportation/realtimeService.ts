/**
 * Transportation Real-Time Service
 *
 * WebSocket and SSE support for real-time transportation updates
 * Integrates with existing WebSocket service
 */

import { eventBus } from "@/lib/services/event-store";
import { assertRealInProduction } from "./strictMode";
import type { Shipment, TrackingEvent } from "@/types/tms";

export interface RealtimeUpdate {
  type:
    | "SHIPMENT_STATUS"
    | "LOCATION_UPDATE"
    | "SENSOR_DATA"
    | "ALERT"
    | "EXCEPTION"
    | "COMPLIANCE_VIOLATION"
    | "ROUTE_UPDATE"
    | "PRICING_UPDATE";
  shipmentId: string;
  data: any;
  timestamp: Date | string;
}

export interface RealtimeSubscription {
  id: string;
  shipmentIds: string[];
  eventTypes: RealtimeUpdate["type"][];
  connectionId: string;
  createdAt: Date | string;
}

export class TransportationRealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private connections: Map<string, any> = new Map(); // WebSocket/SSE connections

  /**
   * Subscribe to real-time updates
   */
  async subscribe(
    connectionId: string,
    shipmentIds: string[],
    eventTypes: RealtimeUpdate["type"][],
  ): Promise<string> {
    const subscriptionId = `realtime-${connectionId}-${Date.now()}`;

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      shipmentIds,
      eventTypes,
      connectionId,
      createdAt: new Date().toISOString(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Subscribe to event bus events
    await this.subscribeToEventBus(subscription);

    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Broadcast update to subscribers
   */
  async broadcastUpdate(update: RealtimeUpdate): Promise<void> {
    // Find all subscriptions that match this update
    const relevantSubscriptions = Array.from(
      this.subscriptions.values(),
    ).filter(
      (sub) =>
        (sub.shipmentIds.includes(update.shipmentId) ||
          sub.shipmentIds.length === 0) &&
        sub.eventTypes.includes(update.type),
    );

    // Send to each connection
    for (const subscription of relevantSubscriptions) {
      const connection = this.connections.get(subscription.connectionId);
      if (connection) {
        try {
          await this.sendToConnection(connection, update);
        } catch (error) {
          console.error(
            `Failed to send update to connection ${subscription.connectionId}:`,
            error,
          );
          // Remove connection if it's dead
          this.connections.delete(subscription.connectionId);
        }
      }
    }
  }

  /**
   * Register connection
   */
  registerConnection(connectionId: string, connection: any): void {
    this.connections.set(connectionId, connection);
  }

  /**
   * Unregister connection
   */
  unregisterConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    // Remove all subscriptions for this connection
    const subscriptions = Array.from(this.subscriptions.values()).filter(
      (sub) => sub.connectionId === connectionId,
    );
    subscriptions.forEach((sub) => this.subscriptions.delete(sub.id));
  }

  /**
   * Send to connection
   */
  private async sendToConnection(
    connection: any,
    update: RealtimeUpdate,
  ): Promise<void> {
    // In production, use WebSocket or SSE
    // For now, simulate
    assertRealInProduction(
      "tms.realtime.transport",
      "Realtime transport is currently a stub. Configure WebSocket/SSE infrastructure for production.",
    );
    if (connection.send) {
      connection.send(JSON.stringify(update));
    }
  }

  /**
   * Subscribe to event bus
   */
  private async subscribeToEventBus(
    subscription: RealtimeSubscription,
  ): Promise<void> {
    // Subscribe to relevant event bus events
    const eventTypes = [
      "transportation.shipment.status.changed",
      "transportation.shipment.location.updated",
      "transportation.iot.data.received",
      "transportation.iot.alert",
      "transportation.shipment.exception",
      "transportation.compliance.violation",
      "transportation.route.comparison.completed",
      "transportation.pricing.intelligence.updated",
    ];

    for (const eventType of eventTypes) {
      eventBus.subscribe(eventType, async (eventData: any) => {
        // Map event bus event to realtime update
        const update = this.mapToRealtimeUpdate(eventType, eventData);
        if (update) {
          await this.broadcastUpdate(update);
        }
      });
    }
  }

  /**
   * Map event bus event to realtime update
   */
  private mapToRealtimeUpdate(
    eventType: string,
    eventData: any,
  ): RealtimeUpdate | null {
    const mapping: Record<string, (data: any) => RealtimeUpdate | null> = {
      "transportation.shipment.status.changed": (data) => ({
        type: "SHIPMENT_STATUS",
        shipmentId: data.shipmentId,
        data: { status: data.status },
        timestamp: new Date().toISOString(),
      }),
      "transportation.shipment.location.updated": (data) => ({
        type: "LOCATION_UPDATE",
        shipmentId: data.shipmentId,
        data: { location: data.location },
        timestamp: new Date().toISOString(),
      }),
      "transportation.iot.data.received": (data) => ({
        type: "SENSOR_DATA",
        shipmentId: data.shipmentId,
        data: { sensorData: data.sensorData },
        timestamp: new Date().toISOString(),
      }),
      "transportation.iot.alert": (data) => ({
        type: "ALERT",
        shipmentId: data.shipmentId,
        data: { alert: data },
        timestamp: new Date().toISOString(),
      }),
      "transportation.shipment.exception": (data) => ({
        type: "EXCEPTION",
        shipmentId: data.shipmentId,
        data: { exception: data },
        timestamp: new Date().toISOString(),
      }),
      "transportation.compliance.violation": (data) => ({
        type: "COMPLIANCE_VIOLATION",
        shipmentId: data.shipmentId,
        data: { violations: data.violations },
        timestamp: new Date().toISOString(),
      }),
      "transportation.route.comparison.completed": (data) => ({
        type: "ROUTE_UPDATE",
        shipmentId: data.shipmentId,
        data: { routes: data.routes },
        timestamp: new Date().toISOString(),
      }),
      "transportation.pricing.intelligence.updated": (data) => ({
        type: "PRICING_UPDATE",
        shipmentId: data.shipmentId,
        data: { pricing: data.pricing },
        timestamp: new Date().toISOString(),
      }),
    };

    const mapper = mapping[eventType];
    return mapper ? mapper(eventData) : null;
  }
}

export const transportationRealtimeService =
  new TransportationRealtimeService();
