/**
 * MSDS Real-Time Service
 * WebSocket/SSE bridge for MSDS processing queue updates
 * Bridges event bus events to WebSocket for real-time client updates
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

export interface MSDSRealtimeUpdate {
  type:
    | "job.started"
    | "job.progress"
    | "job.item.completed"
    | "job.item.failed"
    | "job.completed"
    | "job.failed";
  jobId: string;
  data: any;
  timestamp: string;
}

type RealtimeCallback = (update: MSDSRealtimeUpdate) => void;

class MSDSRealtimeService {
  private subscriptions: Map<string, Set<RealtimeCallback>> = new Map();
  private eventBusSubscription: (() => void) | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize event bus subscription
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return this.initPromise || Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Subscribe to all MSDS job events
        const subscription = eventBus.subscribe(
          "msds.job.*",
          async (event: DomainEvent) => {
            try {
              const update = this.mapEventToUpdate(event);
              if (update) {
                this.broadcast(update);
              }
            } catch (error) {
              console.error("[msds-realtime] Error processing event:", error);
            }
          },
        );

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
            console.error("[msds-realtime] Error unsubscribing:", error);
          }
        };

        this.isInitialized = true;
      } catch (error) {
        console.error(
          "[msds-realtime] Failed to initialize event bus subscription:",
          error,
        );
        // Continue without real-time updates rather than breaking
        this.isInitialized = false;
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Map event bus event to realtime update
   */
  private mapEventToUpdate(event: DomainEvent): MSDSRealtimeUpdate | null {
    const eventType = event.type;
    const payload = event.payload as any;

    if (!eventType.startsWith("msds.job.")) return null;

    const updateType = eventType.replace(
      "msds.job.",
      "",
    ) as MSDSRealtimeUpdate["type"];

    return {
      type: updateType,
      jobId: payload?.jobId || event.entityId || "",
      data: payload,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Subscribe to updates for a specific job
   */
  subscribe(jobId: string, callback: RealtimeCallback): () => void {
    if (!jobId || typeof callback !== "function") {
      console.warn("[msds-realtime] Invalid subscription parameters");
      return () => {}; // Return no-op unsubscribe
    }

    if (!this.subscriptions.has(jobId)) {
      this.subscriptions.set(jobId, new Set());
    }
    this.subscriptions.get(jobId)!.add(callback);

    // Initialize if not already done (non-blocking)
    if (!this.isInitialized) {
      this.initialize().catch((err) => {
        console.warn(
          "[msds-realtime] Initialization failed, continuing without real-time updates:",
          err,
        );
      });
    }

    // Return unsubscribe function
    return () => {
      try {
        const callbacks = this.subscriptions.get(jobId);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.subscriptions.delete(jobId);
          }
        }
      } catch (error) {
        console.error("[msds-realtime] Error unsubscribing:", error);
      }
    };
  }

  /**
   * Subscribe to all MSDS job updates
   */
  subscribeAll(callback: RealtimeCallback): () => void {
    return this.subscribe("*", callback);
  }

  /**
   * Broadcast update to subscribers
   */
  private broadcast(update: MSDSRealtimeUpdate): void {
    // Broadcast to specific job subscribers
    const jobSubscribers = this.subscriptions.get(update.jobId);
    if (jobSubscribers) {
      jobSubscribers.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error("[msds-realtime] Error in callback:", error);
        }
      });
    }

    // Broadcast to "all" subscribers
    const allSubscribers = this.subscriptions.get("*");
    if (allSubscribers) {
      allSubscribers.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error("[msds-realtime] Error in callback:", error);
        }
      });
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    try {
      if (this.eventBusSubscription) {
        this.eventBusSubscription();
        this.eventBusSubscription = null;
      }
      this.subscriptions.clear();
      this.isInitialized = false;
    } catch (error) {
      console.error("[msds-realtime] Error during cleanup:", error);
    }
  }
}

export const msdsRealtimeService = new MSDSRealtimeService();
