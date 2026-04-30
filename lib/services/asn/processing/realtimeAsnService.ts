/**
 * Real-Time ASN Service
 * Handles real-time ASN processing and updates
 */

import { eventBus } from "@/lib/services/event-store";
import type { ASN, ASNStatus } from "@/types/asn";

export class RealtimeAsnService {
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for real-time updates
   */
  private setupEventListeners() {
    // Listen for ASN events
    eventBus.subscribe("asn.created", (event) => {
      this.notifySubscribers("asn.created", event);
    });

    eventBus.subscribe("asn.updated", (event) => {
      this.notifySubscribers("asn.updated", event);
    });

    eventBus.subscribe("asn.status.changed", (event) => {
      this.notifySubscribers("asn.status.changed", event);
    });

    eventBus.subscribe("asn.exception.detected", (event) => {
      this.notifySubscribers("asn.exception.detected", event);
    });

    eventBus.subscribe("asn.prediction.arrival", (event) => {
      this.notifySubscribers("asn.prediction.arrival", event);
    });
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    this.subscribers.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  /**
   * Notify subscribers of an event
   */
  private notifySubscribers(eventType: string, data: any) {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Publish real-time status update
   */
  async publishStatusUpdate(
    asnId: string,
    status: ASNStatus,
    tenantId: string,
  ): Promise<void> {
    await eventBus.publish("asn.status.changed", {
      asnId,
      status,
      tenantId,
      timestamp: new Date(),
    });
  }

  /**
   * Get real-time ASN queue
   */
  async getRealtimeQueue(tenantId: string): Promise<{
    pending: ASN[];
    inProgress: ASN[];
    exceptions: ASN[];
  }> {
    // This would typically fetch from database
    // For now, return empty structure
    return {
      pending: [],
      inProgress: [],
      exceptions: [],
    };
  }
}

// Export singleton
let realtimeAsnServiceInstance: RealtimeAsnService | null = null;

export function getRealtimeAsnService(): RealtimeAsnService {
  if (!realtimeAsnServiceInstance) {
    realtimeAsnServiceInstance = new RealtimeAsnService();
  }
  return realtimeAsnServiceInstance;
}
