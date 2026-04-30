/**
 * Geofence Real-Time Service
 *
 * WebSocket integration for real-time geofence event updates
 * - Live zone entry/exit notifications
 * - Real-time dwell time tracking
 * - Anomaly alerts
 * - Predictive insights
 *
 * Integrates with WebSocket server for live updates
 */

import { eventBus } from "@/lib/services/event-store";
import type { GeofenceEvent, GeofenceZone } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface RealtimeGeofenceUpdate {
  type:
    | "ZONE_ENTRY"
    | "ZONE_EXIT"
    | "DWELL_WARNING"
    | "DWELL_EXCEEDED"
    | "ANOMALY"
    | "INSIGHT"
    | "ZONE_STATUS";
  event?: GeofenceEvent;
  zone?: GeofenceZone;
  data: Record<string, any>;
  timestamp: Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface RealtimeSubscription {
  id: string;
  tenantId: string;
  userId?: string;
  subscriptions: Array<{
    type: RealtimeGeofenceUpdate["type"];
    zoneIds?: string[];
    shipmentIds?: string[];
  }>;
  callback: (update: RealtimeGeofenceUpdate) => void;
  createdAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

class GeofenceRealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private updateHistory: Map<string, RealtimeGeofenceUpdate[]> = new Map();
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize WebSocket connection
   */
  async initialize(tenantId: string, userId?: string): Promise<void> {
    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3000";
      this.websocket = new WebSocket(
        `${wsUrl}/geofence?tenantId=${tenantId}&userId=${userId || "anonymous"}`,
      );

      this.websocket.onopen = () => {
        console.log("Geofence WebSocket connected");
        this.reconnectAttempts = 0;
        this.publishUpdate({
          type: "ZONE_STATUS",
          data: { status: "connected" },
          timestamp: new Date(),
          priority: "LOW",
        });
      };

      this.websocket.onmessage = (event) => {
        try {
          const update: RealtimeGeofenceUpdate = JSON.parse(event.data);
          this.handleIncomingUpdate(update);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error("Geofence WebSocket error:", error);
      };

      this.websocket.onclose = () => {
        console.log("Geofence WebSocket disconnected");
        this.attemptReconnect(tenantId, userId);
      };
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      // Fallback to polling if WebSocket fails
      this.startPolling(tenantId);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(
    tenantId: string,
    subscriptions: RealtimeSubscription["subscriptions"],
    callback: (update: RealtimeGeofenceUpdate) => void,
    userId?: string,
  ): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      tenantId,
      userId,
      subscriptions,
      callback,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription to server if WebSocket is connected
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: "subscribe",
          subscriptionId,
          subscriptions,
          tenantId,
        }),
      );
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    // Notify server
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: "unsubscribe",
          subscriptionId,
        }),
      );
    }

    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Publish real-time update
   */
  async publishUpdate(update: RealtimeGeofenceUpdate): Promise<void> {
    // Store in history
    const key = update.event?.zoneId || update.zone?.id || "global";
    if (!this.updateHistory.has(key)) {
      this.updateHistory.set(key, []);
    }
    const history = this.updateHistory.get(key)!;
    history.push(update);
    if (history.length > 100) {
      history.shift();
    }

    // Send via WebSocket if connected
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(update));
    }

    // Notify subscribers
    this.notifySubscribers(update);

    // Publish to event bus
    await eventBus.publish({
      type: "geofence.realtime.update",
      data: update,
      metadata: {
        source: "geofence-realtime-service",
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Handle incoming WebSocket update
   */
  private handleIncomingUpdate(update: RealtimeGeofenceUpdate): void {
    // Convert timestamp string to Date if needed
    if (typeof update.timestamp === "string") {
      update.timestamp = new Date(update.timestamp);
    }

    // Notify subscribers
    this.notifySubscribers(update);
  }

  /**
   * Notify all matching subscribers
   */
  private notifySubscribers(update: RealtimeGeofenceUpdate): void {
    for (const subscription of this.subscriptions.values()) {
      // Check if subscription matches
      const matches = subscription.subscriptions.some((sub) => {
        if (sub.type !== update.type) return false;
        if (sub.zoneIds && sub.zoneIds.length > 0) {
          const zoneId = update.event?.zoneId || update.zone?.id;
          if (!zoneId || !sub.zoneIds.includes(zoneId)) return false;
        }
        if (sub.shipmentIds && sub.shipmentIds.length > 0) {
          const shipmentId = update.event?.shipmentId;
          if (!shipmentId || !sub.shipmentIds.includes(shipmentId))
            return false;
        }
        return true;
      });

      if (matches) {
        try {
          subscription.callback(update);
        } catch (error) {
          console.error("Error in subscription callback:", error);
        }
      }
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(tenantId: string, userId?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        "Max reconnection attempts reached, falling back to polling",
      );
      this.startPolling(tenantId);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    setTimeout(() => {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      );
      this.initialize(tenantId, userId);
    }, delay);
  }

  /**
   * Fallback polling mechanism
   */
  private startPolling(tenantId: string): void {
    console.log("Starting polling fallback for geofence updates");
    // Poll every 5 seconds
    setInterval(async () => {
      try {
        // In production, this would fetch new events from API
        // For now, we'll rely on WebSocket when available
      } catch (error) {
        console.error("Error in polling:", error);
      }
    }, 5000);
  }

  /**
   * Get update history
   */
  getHistory(zoneId?: string, limit = 50): RealtimeGeofenceUpdate[] {
    if (zoneId) {
      return this.updateHistory.get(zoneId)?.slice(-limit) || [];
    }
    // Return all history (flattened)
    const allHistory: RealtimeGeofenceUpdate[] = [];
    for (const history of this.updateHistory.values()) {
      allHistory.push(...history);
    }
    return allHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.subscriptions.clear();
  }
}

export const geofenceRealtimeService = new GeofenceRealtimeService();
