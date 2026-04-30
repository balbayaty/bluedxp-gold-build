/**
 * Truth Engine WebSocket Handler
 * Real-time updates via WebSocket
 */

import { TruthEvent, TruthTimeline } from "@/types/truth-engine";
import { eventBus } from "@/lib/services/event-store";
import { DomainEvent } from "@/types/cqrs";

export interface WebSocketMessage {
  type:
    | "event"
    | "timeline_update"
    | "kpi_update"
    | "board_brief_update"
    | "error";
  data: any;
  timestamp: string;
}

export class TruthEngineWebSocketHandler {
  private connections: Map<string, Set<WebSocket>> = new Map();

  /**
   * Add WebSocket connection
   */
  addConnection(entityKey: string, ws: WebSocket): void {
    if (!this.connections.has(entityKey)) {
      this.connections.set(entityKey, new Set());
    }
    this.connections.get(entityKey)!.add(ws);

    // Subscribe to events for this entity
    this.subscribeToEntity(entityKey);

    // Handle disconnect
    ws.addEventListener("close", () => {
      this.removeConnection(entityKey, ws);
    });
  }

  /**
   * Remove WebSocket connection
   */
  removeConnection(entityKey: string, ws: WebSocket): void {
    const connections = this.connections.get(entityKey);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.connections.delete(entityKey);
      }
    }
  }

  /**
   * Subscribe to entity events
   */
  private subscribeToEntity(entityKey: string): void {
    const [entityType, entityId] = entityKey.split(":");

    eventBus.subscribe(`truth.*`, async (event: DomainEvent) => {
      const payload = event.payload as any;
      const eventEntityRef = (payload.entityRefs as any)?.[`${entityType}Id`];

      if (eventEntityRef === entityId) {
        this.broadcastToEntity(entityKey, {
          type: "event",
          data: payload,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  /**
   * Broadcast message to all connections for an entity
   */
  broadcastToEntity(entityKey: string, message: WebSocketMessage): void {
    const connections = this.connections.get(entityKey);
    if (!connections) return;

    const messageStr = JSON.stringify(message);

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error("Error sending WebSocket message:", error);
          this.removeConnection(entityKey, ws);
        }
      }
    });
  }

  /**
   * Broadcast timeline update
   */
  broadcastTimelineUpdate(entityKey: string, timeline: TruthTimeline): void {
    this.broadcastToEntity(entityKey, {
      type: "timeline_update",
      data: timeline,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast KPI update
   */
  broadcastKPIUpdate(kpiId: string, kpi: any): void {
    // Broadcast to all connections (or filter by relevant entities)
    this.connections.forEach((connections, entityKey) => {
      const message: WebSocketMessage = {
        type: "kpi_update",
        data: { kpiId, kpi },
        timestamp: new Date().toISOString(),
      };

      const messageStr = JSON.stringify(message);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(messageStr);
          } catch (error) {
            console.error("Error sending KPI update:", error);
          }
        }
      });
    });
  }

  /**
   * Broadcast board brief update
   */
  broadcastBoardBriefUpdate(tenantId: string, brief: any): void {
    // Broadcast to all connections for this tenant
    this.connections.forEach((connections, entityKey) => {
      if (entityKey.startsWith(`tenant:${tenantId}`)) {
        const message: WebSocketMessage = {
          type: "board_brief_update",
          data: brief,
          timestamp: new Date().toISOString(),
        };

        const messageStr = JSON.stringify(message);
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(messageStr);
            } catch (error) {
              console.error("Error sending board brief update:", error);
            }
          }
        });
      }
    });
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    let total = 0;
    this.connections.forEach((connections) => {
      total += connections.size;
    });
    return total;
  }
}

export const truthEngineWebSocketHandler = new TruthEngineWebSocketHandler();
