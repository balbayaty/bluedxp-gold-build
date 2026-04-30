/**
 * ASN Real-Time Service
 * Provides real-time updates for ASN changes via WebSocket/SSE
 * Integrates with event bus for live updates
 */

import { eventBus } from "@/lib/services/event-store";
import type { ASNData } from "@/types/asn";

export interface ASNRealtimeUpdate {
  type: "asn.created" | "asn.updated" | "asn.status_changed" | "asn.deleted";
  asnId: string;
  data?: ASNData;
  changes?: Record<string, any>;
  timestamp: string;
}

type RealtimeCallback = (update: ASNRealtimeUpdate) => void;

class ASNRealtimeService {
  private subscriptions: Map<string, Set<RealtimeCallback>> = new Map();
  private eventBusSubscription: (() => void) | null = null;
  private isInitialized = false;

  /**
   * Initialize event bus subscription
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Subscribe to all ASN events
      const subscription = eventBus.subscribe("asn.*", async (event: any) => {
        try {
          const update = this.mapEventToUpdate(event);
          if (update) {
            this.broadcast(update);
          }
        } catch (error) {
          console.error("[asn-realtime] Error processing event:", error);
        }
      });

      // Store subscription for cleanup
      this.eventBusSubscription = () => {
        try {
          if (
            subscription &&
            subscription.unsubscribe &&
            typeof subscription.unsubscribe === "function"
          ) {
            subscription.unsubscribe();
          }
        } catch (error) {
          console.error("[asn-realtime] Error unsubscribing:", error);
        }
      };

      this.isInitialized = true;
    } catch (error) {
      console.error(
        "[asn-realtime] Failed to initialize event bus subscription:",
        error,
      );
      throw error;
    }
  }

  /**
   * Subscribe to ASN updates
   */
  subscribe(asnId: string, callback: RealtimeCallback): () => void {
    if (!this.subscriptions.has(asnId)) {
      this.subscriptions.set(asnId, new Set());
    }
    this.subscriptions.get(asnId)!.add(callback);

    // Initialize if not already done
    if (!this.isInitialized) {
      this.initialize().catch((err) => {
        console.error("[asn-realtime] Failed to initialize:", err);
      });
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(asnId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(asnId);
        }
      }
    };
  }

  /**
   * Subscribe to all ASN updates
   */
  subscribeAll(callback: RealtimeCallback): () => void {
    return this.subscribe("*", callback);
  }

  /**
   * Broadcast update to subscribers
   */
  private broadcast(update: ASNRealtimeUpdate): void {
    // Broadcast to specific ASN subscribers
    const specificSubscribers = this.subscriptions.get(update.asnId);
    if (specificSubscribers) {
      specificSubscribers.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error("[asn-realtime] Error in callback:", error);
        }
      });
    }

    // Broadcast to all subscribers
    const allSubscribers = this.subscriptions.get("*");
    if (allSubscribers) {
      allSubscribers.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error("[asn-realtime] Error in callback:", error);
        }
      });
    }
  }

  /**
   * Map event bus event to realtime update
   */
  private mapEventToUpdate(event: any): ASNRealtimeUpdate | null {
    const eventType = event.type;

    if (eventType === "asn.created") {
      return {
        type: "asn.created",
        asnId: event.aggregateId,
        data: event.payload,
        timestamp: event.metadata?.timestamp || new Date().toISOString(),
      };
    }

    if (eventType === "asn.updated") {
      return {
        type: "asn.updated",
        asnId: event.aggregateId,
        data: event.payload.current,
        changes: event.payload.updates,
        timestamp: event.metadata?.timestamp || new Date().toISOString(),
      };
    }

    if (eventType === "asn.status_changed") {
      return {
        type: "asn.status_changed",
        asnId: event.aggregateId,
        changes: {
          status: event.payload.status,
          previousStatus: event.payload.previousStatus,
        },
        timestamp: event.metadata?.timestamp || new Date().toISOString(),
      };
    }

    if (eventType === "asn.deleted") {
      return {
        type: "asn.deleted",
        asnId: event.aggregateId,
        timestamp: event.metadata?.timestamp || new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.eventBusSubscription) {
      this.eventBusSubscription();
      this.eventBusSubscription = null;
    }
    this.subscriptions.clear();
    this.isInitialized = false;
  }
}

export const asnRealtimeService = new ASNRealtimeService();
