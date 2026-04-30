/**
 * Event Capture Service
 *
 * Captures events from ALL modules via Event Bus
 * Foundation for unified intelligence and analytics
 */

import { eventBus, eventStore } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence";
import type { DomainEvent } from "@/types/cqrs";
import type { IntelligenceEvent } from "@/types/intelligence-analytics";

export class EventCaptureService {
  private static instance: EventCaptureService;
  private subscriptions: Map<string, string> = new Map(); // subscriptionId -> moduleId
  private capturedEvents: Map<string, IntelligenceEvent> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EventCaptureService {
    if (!EventCaptureService.instance) {
      EventCaptureService.instance = new EventCaptureService();
    }
    return EventCaptureService.instance;
  }

  /**
   * Initialize event capture from all modules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("⚠️ Event Capture Service already initialized");
      return;
    }

    console.log("🔍 Initializing Event Capture Service...");

    // Get all registered modules
    const { moduleRegistry } = await import("@/lib/modules/registry");
    const modules = moduleRegistry.getAllModules();

    // Subscribe to each module's events
    for (const mod of modules) {
      await this.subscribeToModule(mod.id);
    }

    // Subscribe to wildcard for any new modules
    const wildcardSubId = eventBus.subscribe(
      "*.*",
      async (event: DomainEvent) => {
        await this.captureEvent(event);
      },
    );
    this.subscriptions.set("*.*", wildcardSubId);

    this.isInitialized = true;
    console.log(
      `✅ Event Capture Service initialized - Subscribed to ${modules.length} modules`,
    );
  }

  /**
   * Subscribe to all events from a specific module
   */
  private async subscribeToModule(moduleId: string): Promise<void> {
    // Subscribe to all events from module (module.*)
    const subId1 = eventBus.subscribe(
      `${moduleId}.*`,
      async (event: DomainEvent) => {
        await this.captureEvent(event);
      },
    );
    this.subscriptions.set(`${moduleId}.*`, subId1);

    // Subscribe to specific high-value event types
    const eventTypes = [
      "created",
      "updated",
      "deleted",
      "status.changed",
      "exception",
      "deviation",
      "anomaly",
      "incident",
      "ncr",
      "capa",
      "delay",
      "error",
      "warning",
      "completed",
      "failed",
    ];

    for (const eventType of eventTypes) {
      const subId = eventBus.subscribe(
        `${moduleId}.${eventType}`,
        async (event: DomainEvent) => {
          await this.captureEvent(event);
          // Auto-trigger analysis for critical events
          if (this.shouldAutoAnalyze(event)) {
            await this.triggerAnalysis(event);
          }
        },
      );
      this.subscriptions.set(`${moduleId}.${eventType}`, subId);
    }
  }

  /**
   * Capture an event
   */
  async captureEvent(event: DomainEvent): Promise<IntelligenceEvent> {
    const intelligenceEvent: IntelligenceEvent = {
      id: `intel-${event.id || Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: this.mapEventTypeToIntelligenceType(event.type),
      source: {
        module: this.extractModuleFromEventType(event.type),
        entityType: event.aggregateType,
        entityId: event.aggregateId,
        eventType: event.type,
      },
      data: event.payload,
      timestamp: new Date(event.timestamp),
      tenantId: event.metadata?.tenantId || "unknown",
      correlationId: event.metadata?.correlationId,
      metadata: {
        version: event.version,
        originalEventId: event.id,
        ...event.metadata,
      },
    };

    // Store in captured events
    this.capturedEvents.set(intelligenceEvent.id, intelligenceEvent);

    // Store in event store (if not already there)
    try {
      await eventStore.append([event]);
    } catch (error) {
      // Event might already be in store, that's okay
      console.debug("Event already in store or error:", error);
    }

    // Create evidence
    try {
      await evidenceService.recordEvidence({
        type: "event",
        source: event.aggregateType,
        entityId: event.aggregateId,
        data: event.payload,
        metadata: {
          eventType: event.type,
          module: intelligenceEvent.source.module,
          timestamp: event.timestamp,
          tenantId: intelligenceEvent.tenantId,
        },
      });
    } catch (error) {
      console.error("Error recording evidence:", error);
    }

    return intelligenceEvent;
  }

  /**
   * Get captured events
   */
  getCapturedEvents(filters?: {
    module?: string;
    type?: IntelligenceEvent["type"];
    tenantId?: string;
    timeRange?: { start: Date; end: Date };
  }): IntelligenceEvent[] {
    let events = Array.from(this.capturedEvents.values());

    if (filters) {
      if (filters.module) {
        events = events.filter((e) => e.source.module === filters.module);
      }
      if (filters.type) {
        events = events.filter((e) => e.type === filters.type);
      }
      if (filters.tenantId) {
        events = events.filter((e) => e.tenantId === filters.tenantId);
      }
      if (filters.timeRange) {
        events = events.filter((e) => {
          const timestamp = new Date(e.timestamp);
          return (
            timestamp >= filters.timeRange!.start &&
            timestamp <= filters.timeRange!.end
          );
        });
      }
    }

    return events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * Check if event should trigger automatic analysis
   */
  private shouldAutoAnalyze(event: DomainEvent): boolean {
    const criticalEventTypes = [
      "exception",
      "deviation",
      "anomaly",
      "incident",
      "error",
      "failed",
      "delay",
    ];

    return criticalEventTypes.some((type) =>
      event.type.toLowerCase().includes(type),
    );
  }

  /**
   * Trigger analysis for an event
   */
  private async triggerAnalysis(event: DomainEvent): Promise<void> {
    // Import here to avoid circular dependencies
    const { unifiedIntelligenceService } =
      await import("./unifiedIntelligenceService");

    try {
      await unifiedIntelligenceService.analyzeEvent({
        event,
        autoTrigger: true,
      });
    } catch (error) {
      console.error("Error triggering analysis:", error);
    }
  }

  /**
   * Map event type to intelligence event type
   */
  private mapEventTypeToIntelligenceType(
    eventType: string,
  ): IntelligenceEvent["type"] {
    const lower = eventType.toLowerCase();

    if (lower.includes("anomaly") || lower.includes("exception")) {
      return "ANOMALY";
    }
    if (
      lower.includes("deviation") ||
      lower.includes("incident") ||
      lower.includes("ncr")
    ) {
      return "ROOT_CAUSE";
    }
    if (lower.includes("pattern")) {
      return "PATTERN";
    }
    if (lower.includes("prediction") || lower.includes("forecast")) {
      return "PREDICTION";
    }
    if (lower.includes("insight") || lower.includes("recommendation")) {
      return "INSIGHT";
    }

    return "INSIGHT"; // Default
  }

  /**
   * Extract module name from event type
   */
  private extractModuleFromEventType(eventType: string): string {
    // Event types are typically: "module.entity.action"
    const parts = eventType.split(".");
    return parts[0] || "unknown";
  }

  /**
   * Cleanup subscriptions
   */
  async cleanup(): Promise<void> {
    for (const [key, subId] of this.subscriptions.entries()) {
      try {
        eventBus.unsubscribe(subId);
      } catch (error) {
        console.error(`Error unsubscribing from ${key}:`, error);
      }
    }
    this.subscriptions.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const eventCaptureService = EventCaptureService.getInstance();
