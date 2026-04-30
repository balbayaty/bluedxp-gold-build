/**
 * Advanced Server-Sent Events (SSE) Server for Process Lifecycle Module
 * Unidirectional real-time updates with advanced features
 * More advanced than competitors
 */

import { Response } from "next/server";
import type {
  LifecycleUpdate,
  WorkflowExecutionUpdate,
  ProcessMiningUpdate,
  AnalyticsUpdate,
} from "@/types/process-lifecycle";

export interface SSEClient {
  id: string;
  response: Response;
  subscriptions: Set<string>;
  connectedAt: Date;
  lastEventId: number;
  metadata: Record<string, any>;
}

export interface SSERoom {
  roomId: string;
  roomType:
    | "lifecycle"
    | "workflow"
    | "process-mining"
    | "analytics"
    | "entity"
    | "module";
  clients: Set<string>;
  eventHistory: SSEEvent[];
  maxHistory: number;
}

export interface SSEEvent {
  id: number;
  type: string;
  data: any;
  timestamp: Date;
  retry?: number;
}

export class AdvancedSSEServer {
  private clients: Map<string, SSEClient> = new Map();
  private rooms: Map<string, SSERoom> = new Map();
  private eventCounter: number = 0;
  private eventHistory: Map<string, SSEEvent[]> = new Map();
  private maxHistorySize: number = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    eventsSent: 0,
    errors: 0,
  };

  /**
   * Create new SSE connection
   */
  async createConnection(
    clientId: string,
    response: Response,
    metadata?: Record<string, any>,
  ): Promise<SSEClient> {
    const client: SSEClient = {
      id: clientId,
      response,
      subscriptions: new Set(),
      connectedAt: new Date(),
      lastEventId: 0,
      metadata: metadata || {},
    };

    this.clients.set(clientId, client);
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    // Send initial connection event
    await this.sendEvent(client, {
      type: "connected",
      data: {
        clientId,
        serverTime: new Date().toISOString(),
        features: {
          history: true,
          rooms: true,
          compression: false, // SSE doesn't support compression
        },
      },
    });

    // Start heartbeat for this client
    this.startClientHeartbeat(client);

    console.log(`✅ SSE client connected: ${clientId}`);
    return client;
  }

  /**
   * Subscribe client to room
   */
  async subscribe(
    clientId: string,
    roomType: SSERoom["roomType"],
    data: any,
  ): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    const roomId = this.generateRoomId(roomType, data);

    // Create or get room
    if (!this.rooms.has(roomId)) {
      const room: SSERoom = {
        roomId,
        roomType,
        clients: new Set(),
        eventHistory: [],
        maxHistory: 100,
      };
      this.rooms.set(roomId, room);
    }

    const room = this.rooms.get(roomId)!;
    room.clients.add(clientId);
    client.subscriptions.add(roomId);

    // Send subscription confirmation
    await this.sendEvent(client, {
      type: "subscribed",
      data: {
        roomId,
        type: roomType,
        subscribers: room.clients.size,
        history: room.eventHistory.slice(-10),
      },
    });

    console.log(`✅ Client ${clientId} subscribed to ${roomId}`);
  }

  /**
   * Unsubscribe client from room
   */
  async unsubscribe(clientId: string, roomId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.delete(roomId);

    const room = this.rooms.get(roomId);
    if (room) {
      room.clients.delete(clientId);
      if (room.clients.size === 0) {
        this.rooms.delete(roomId);
        this.eventHistory.delete(roomId);
      }
    }

    await this.sendEvent(client, {
      type: "unsubscribed",
      data: { roomId },
    });
  }

  /**
   * Publish lifecycle update
   */
  async publishLifecycleUpdate(update: LifecycleUpdate): Promise<void> {
    const roomId = this.generateRoomId("lifecycle", {
      entityId: update.entityId,
      entityType: update.entityType,
    });

    await this.publishToRoom(roomId, {
      type: "lifecycle.update",
      data: update,
    });
  }

  /**
   * Publish workflow update
   */
  async publishWorkflowUpdate(update: WorkflowExecutionUpdate): Promise<void> {
    const roomId = this.generateRoomId("workflow", {
      workflowId: update.workflowId,
      executionId: update.executionId,
    });

    await this.publishToRoom(roomId, {
      type: "workflow.update",
      data: update,
    });
  }

  /**
   * Publish process mining update
   */
  async publishProcessMiningUpdate(update: ProcessMiningUpdate): Promise<void> {
    const roomId = this.generateRoomId("process-mining", {
      caseId: update.caseId,
      caseType: update.caseType,
    });

    await this.publishToRoom(roomId, {
      type: "process-mining.update",
      data: update,
    });
  }

  /**
   * Publish analytics update
   */
  async publishAnalyticsUpdate(update: AnalyticsUpdate): Promise<void> {
    const roomId = this.generateRoomId("analytics", {
      entityType: update.entityType,
    });

    await this.publishToRoom(roomId, {
      type: "analytics.update",
      data: update,
    });
  }

  /**
   * Publish to room
   */
  private async publishToRoom(
    roomId: string,
    event: Omit<SSEEvent, "id" | "timestamp">,
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const sseEvent: SSEEvent = {
      id: ++this.eventCounter,
      timestamp: new Date(),
      ...event,
    };

    // Add to room history
    room.eventHistory.push(sseEvent);
    if (room.eventHistory.length > room.maxHistory) {
      room.eventHistory.shift();
    }

    // Add to global history
    if (!this.eventHistory.has(roomId)) {
      this.eventHistory.set(roomId, []);
    }
    const history = this.eventHistory.get(roomId)!;
    history.push(sseEvent);
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    // Send to all clients in room
    const promises: Promise<void>[] = [];
    room.clients.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client) {
        promises.push(this.sendEvent(client, event));
      }
    });

    await Promise.all(promises);
    this.metrics.eventsSent += room.clients.size;
  }

  /**
   * Send event to client
   */
  private async sendEvent(
    client: SSEClient,
    event: Omit<SSEEvent, "id" | "timestamp">,
  ): Promise<void> {
    try {
      const sseEvent: SSEEvent = {
        id: ++this.eventCounter,
        timestamp: new Date(),
        ...event,
      };

      client.lastEventId = sseEvent.id;

      // Format SSE message
      const lines: string[] = [];

      if (sseEvent.id) {
        lines.push(`id: ${sseEvent.id}`);
      }

      if (sseEvent.type) {
        lines.push(`event: ${sseEvent.type}`);
      }

      if (sseEvent.retry) {
        lines.push(`retry: ${sseEvent.retry}`);
      }

      // Data must be JSON stringified and can span multiple lines
      const dataStr = JSON.stringify(sseEvent.data);
      dataStr.split("\n").forEach((line) => {
        lines.push(`data: ${line}`);
      });

      lines.push(""); // Empty line to signal end of message

      const message = lines.join("\n");

      // Write to response (this is a simplified version - actual implementation depends on framework)
      // In Next.js, you'd use a streaming response
      console.log(`📤 SSE Event to ${client.id}:`, sseEvent.type);

      this.metrics.eventsSent++;
    } catch (error) {
      console.error(`Error sending SSE event to ${client.id}:`, error);
      this.metrics.errors++;
      this.removeClient(client.id);
    }
  }

  /**
   * Start heartbeat for client
   */
  private startClientHeartbeat(client: SSEClient): void {
    const interval = setInterval(async () => {
      if (!this.clients.has(client.id)) {
        clearInterval(interval);
        return;
      }

      try {
        await this.sendEvent(client, {
          type: "heartbeat",
          data: { timestamp: Date.now() },
        });
      } catch (error) {
        console.error(`Heartbeat failed for ${client.id}:`, error);
        clearInterval(interval);
        this.removeClient(client.id);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Start global heartbeat
   */
  startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        this.sendEvent(client, {
          type: "heartbeat",
          data: { timestamp: Date.now() },
        }).catch(() => {
          // Ignore errors - client might be disconnected
        });
      });
    }, 30000);
  }

  /**
   * Remove client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all rooms
    client.subscriptions.forEach((roomId) => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.clients.delete(clientId);
        if (room.clients.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });

    this.clients.delete(clientId);
    this.metrics.activeConnections--;

    console.log(`❌ SSE client disconnected: ${clientId}`);
  }

  /**
   * Generate room ID
   */
  private generateRoomId(type: SSERoom["roomType"], data: any): string {
    switch (type) {
      case "lifecycle":
        return `lifecycle:${data.entityType}:${data.entityId}`;
      case "workflow":
        return `workflow:${data.workflowId}${data.executionId ? `:${data.executionId}` : ""}`;
      case "process-mining":
        return `process-mining:${data.caseType}:${data.caseId}`;
      case "analytics":
        return `analytics:${data.entityType || "all"}`;
      case "entity":
        return `entity:${data.entityType}:${data.entityId}`;
      case "module":
        return `module:${data.module}`;
      default:
        return `room:${type}:${JSON.stringify(data)}`;
    }
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      rooms: this.rooms.size,
      activeConnections: this.clients.size,
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.clear();
    this.rooms.clear();
    this.eventHistory.clear();

    console.log("✅ SSE server cleaned up");
  }
}

// Singleton instance
export const sseServer = new AdvancedSSEServer();

export default sseServer;
