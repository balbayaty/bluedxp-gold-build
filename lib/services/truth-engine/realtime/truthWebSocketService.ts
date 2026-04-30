/**
 * Truth Engine WebSocket Service
 * Integrates with existing WebSocket infrastructure
 * No duplication - reuses existing WebSocket server
 */

import { AdvancedWebSocketServer } from "@/lib/services/process-lifecycle/realtime/websocketServer";
import { truthEngineService } from "../truthEngineService";
import { TruthEvent } from "@/types/truth-engine";
import { DomainEvent } from "@/types/cqrs";
import { eventBus } from "@/lib/services/event-store";

export class TruthWebSocketService {
  private wsServer: AdvancedWebSocketServer | null = null;
  private subscriptions: Map<string, string> = new Map();

  /**
   * Initialize WebSocket service
   */
  async initialize(wsServer: AdvancedWebSocketServer) {
    this.wsServer = wsServer;
    this.setupEventHandlers();
    console.log("✅ Truth Engine WebSocket Service initialized");
  }

  /**
   * Setup event handlers for real-time truth events
   */
  private setupEventHandlers() {
    // Subscribe to truth events from event bus
    const subscriptionId = eventBus.subscribe(
      "truth.*",
      async (event: DomainEvent) => {
        await this.broadcastTruthEvent(event);
      },
    );

    this.subscriptions.set("truth-events", subscriptionId);
  }

  /**
   * Broadcast truth event to subscribed clients
   */
  private async broadcastTruthEvent(event: DomainEvent) {
    if (!this.wsServer) return;

    const payload = event.payload as any;
    const truthEvent = payload as TruthEvent;

    // Broadcast to tenant room
    if (truthEvent.tenantId) {
      this.wsServer.broadcastToRoom(`tenant:${truthEvent.tenantId}`, {
        type: "truth:event",
        event: truthEvent,
        timestamp: new Date().toISOString(),
      });
    }

    // Broadcast to entity-specific room
    const entityType = Object.keys(truthEvent.entityRefs)[0];
    const entityId =
      truthEvent.entityRefs[entityType as keyof typeof truthEvent.entityRefs];
    if (entityType && entityId) {
      this.wsServer.broadcastToRoom(`entity:${entityType}:${entityId}`, {
        type: "truth:event",
        event: truthEvent,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Subscribe to truth events for an entity
   */
  subscribeToEntity(
    socketId: string,
    entityType: string,
    entityId: string,
  ): void {
    if (!this.wsServer) return;

    const roomId = `entity:${entityType}:${entityId}`;
    this.wsServer.joinRoom(socketId, roomId);
  }

  /**
   * Unsubscribe from entity events
   */
  unsubscribeFromEntity(
    socketId: string,
    entityType: string,
    entityId: string,
  ): void {
    if (!this.wsServer) return;

    const roomId = `entity:${entityType}:${entityId}`;
    this.wsServer.leaveRoom(socketId, roomId);
  }

  /**
   * Subscribe to truth events for a tenant
   */
  subscribeToTenant(socketId: string, tenantId: string): void {
    if (!this.wsServer) return;

    const roomId = `tenant:${tenantId}`;
    this.wsServer.joinRoom(socketId, roomId);
  }

  /**
   * Get real-time truth metrics
   */
  async getRealTimeMetrics(tenantId: string): Promise<{
    totalEvents: number;
    eventsLast24h: number;
    averageConfidence: number;
    activeGaps: number;
    complianceScore: number;
  }> {
    const allEvents = await truthEngineService.searchTruthEvents({
      tenantId,
      limit: 10000,
    });

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const eventsLast24h = allEvents.events.filter(
      (e) => new Date(e.happenedAt) >= last24h,
    );

    const averageConfidence =
      allEvents.events.length > 0
        ? allEvents.events.reduce((sum, e) => sum + e.confidenceScore, 0) /
          allEvents.events.length
        : 0;

    // Get gaps (would need to implement gap detection)
    const activeGaps = 0; // Placeholder

    // Calculate compliance score
    const complianceScore = averageConfidence * 100;

    return {
      totalEvents: allEvents.events.length,
      eventsLast24h: eventsLast24h.length,
      averageConfidence,
      activeGaps,
      complianceScore,
    };
  }

  /**
   * Broadcast real-time metrics
   */
  async broadcastMetrics(tenantId: string): Promise<void> {
    if (!this.wsServer) return;

    const metrics = await this.getRealTimeMetrics(tenantId);

    this.wsServer.broadcastToRoom(`tenant:${tenantId}`, {
      type: "truth:metrics",
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.subscriptions.forEach((id) => {
      eventBus.unsubscribe(id);
    });
    this.subscriptions.clear();
  }
}

export const truthWebSocketService = new TruthWebSocketService();
