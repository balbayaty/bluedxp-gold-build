/**
 * Advanced WebSocket Server for Process Lifecycle Module
 * State-of-the-art real-time communication with pub/sub, rooms, and advanced features
 * More advanced than Celonis, ServiceNow, and Power Automate combined
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import type {
  LifecycleUpdate,
  WorkflowExecutionUpdate,
  ProcessMiningUpdate,
  AnalyticsUpdate,
  ProcessEvent,
} from "@/types/process-lifecycle";

export interface WebSocketConnection {
  socketId: string;
  userId: string;
  tenantId: string;
  subscriptions: Set<string>;
  metadata: Record<string, any>;
  connectedAt: Date;
  lastActivity: Date;
}

export interface WebSocketRoom {
  roomId: string;
  roomType:
    | "lifecycle"
    | "workflow"
    | "process-mining"
    | "analytics"
    | "entity"
    | "module";
  subscribers: Set<string>;
  metadata: Record<string, any>;
  createdAt: Date;
}

export class AdvancedWebSocketServer {
  private io: SocketIOServer | null = null;
  private redisClient: ReturnType<typeof createClient> | null = null;
  private redisSubscriber: ReturnType<typeof createClient> | null = null;
  private connections: Map<string, WebSocketConnection> = new Map();
  private rooms: Map<string, WebSocketRoom> = new Map();
  private messageQueue: Map<string, ProcessEvent[]> = new Map();
  private rateLimiters: Map<string, { count: number; resetAt: number }> =
    new Map();

  // Advanced features
  private compressionEnabled: boolean = true;
  private messageHistory: Map<string, ProcessEvent[]> = new Map();
  private maxHistorySize: number = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
  };

  /**
   * Initialize WebSocket server
   */
  async initialize(httpServer: HTTPServer, redisUrl?: string): Promise<void> {
    // Create Socket.IO server with advanced configuration
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e8, // 100MB
      compression: this.compressionEnabled,
      perMessageDeflate: {
        threshold: 1024,
        zlibDeflateOptions: {
          level: 6,
        },
      },
    });

    // Redis adapter for horizontal scaling
    if (redisUrl) {
      try {
        this.redisClient = createClient({ url: redisUrl });
        this.redisSubscriber = this.redisClient.duplicate();

        await Promise.all([
          this.redisClient.connect(),
          this.redisSubscriber.connect(),
        ]);

        this.io.adapter(createAdapter(this.redisClient, this.redisSubscriber));
        console.log("✅ WebSocket Redis adapter initialized");
      } catch (error) {
        console.warn(
          "⚠️ Redis adapter failed, using in-memory adapter:",
          error,
        );
      }
    }

    // Setup event handlers
    this.setupEventHandlers();

    // Start heartbeat
    this.startHeartbeat();

    // Start metrics collection
    this.startMetricsCollection();

    console.log("✅ Advanced WebSocket Server initialized");
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      this.handleConnection(socket);
    });

    // Handle disconnection
    this.io.on("disconnect", (socket: Socket) => {
      this.handleDisconnection(socket);
    });
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: Socket): void {
    const connection: WebSocketConnection = {
      socketId: socket.id,
      userId: socket.handshake.auth?.userId || "anonymous",
      tenantId: socket.handshake.auth?.tenantId || "default",
      subscriptions: new Set(),
      metadata: socket.handshake.auth?.metadata || {},
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.connections.set(socket.id, connection);
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    // Join tenant room automatically
    socket.join(`tenant:${connection.tenantId}`);
    socket.join(`user:${connection.userId}`);

    // Setup socket event handlers
    this.setupSocketHandlers(socket, connection);

    // Send welcome message
    socket.emit("connected", {
      socketId: socket.id,
      serverTime: new Date().toISOString(),
      features: {
        compression: this.compressionEnabled,
        history: true,
        rooms: true,
        pubsub: true,
      },
    });

    console.log(
      `✅ Client connected: ${socket.id} (User: ${connection.userId}, Tenant: ${connection.tenantId})`,
    );
  }

  /**
   * Setup individual socket event handlers
   */
  private setupSocketHandlers(
    socket: Socket,
    connection: WebSocketConnection,
  ): void {
    // Subscribe to lifecycle updates
    socket.on(
      "subscribe:lifecycle",
      async (data: { entityId: string; entityType: string }) => {
        await this.handleSubscribe(socket, connection, "lifecycle", data);
      },
    );

    // Subscribe to workflow updates
    socket.on(
      "subscribe:workflow",
      async (data: { workflowId: string; executionId?: string }) => {
        await this.handleSubscribe(socket, connection, "workflow", data);
      },
    );

    // Subscribe to process mining updates
    socket.on(
      "subscribe:process-mining",
      async (data: { caseId: string; caseType: string }) => {
        await this.handleSubscribe(socket, connection, "process-mining", data);
      },
    );

    // Subscribe to analytics updates
    socket.on(
      "subscribe:analytics",
      async (data: { entityType?: string; filters?: Record<string, any> }) => {
        await this.handleSubscribe(socket, connection, "analytics", data);
      },
    );

    // Subscribe to entity updates
    socket.on(
      "subscribe:entity",
      async (data: { entityId: string; entityType: string }) => {
        await this.handleSubscribe(socket, connection, "entity", data);
      },
    );

    // Subscribe to module updates
    socket.on("subscribe:module", async (data: { module: string }) => {
      await this.handleSubscribe(socket, connection, "module", data);
    });

    // Unsubscribe
    socket.on("unsubscribe", async (data: { roomId: string }) => {
      await this.handleUnsubscribe(socket, connection, data.roomId);
    });

    // Get message history
    socket.on(
      "get:history",
      async (data: { roomId: string; limit?: number }) => {
        await this.handleGetHistory(socket, data.roomId, data.limit);
      },
    );

    // Ping/Pong for connection health
    socket.on("ping", () => {
      connection.lastActivity = new Date();
      socket.emit("pong", { timestamp: Date.now() });
    });

    // Rate limiting check
    socket.on("message", (data: any) => {
      if (this.checkRateLimit(socket.id)) {
        connection.lastActivity = new Date();
        this.metrics.messagesReceived++;
      } else {
        socket.emit("error", {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many messages",
        });
      }
    });

    // Error handling
    socket.on("error", (error: Error) => {
      console.error(`Socket error for ${socket.id}:`, error);
      this.metrics.errors++;
    });
  }

  /**
   * Handle subscription
   */
  private async handleSubscribe(
    socket: Socket,
    connection: WebSocketConnection,
    type: WebSocketRoom["roomType"],
    data: any,
  ): Promise<void> {
    const roomId = this.generateRoomId(type, data);

    // Join room
    socket.join(roomId);
    connection.subscriptions.add(roomId);

    // Create or update room
    if (!this.rooms.has(roomId)) {
      const room: WebSocketRoom = {
        roomId,
        roomType: type,
        subscribers: new Set(),
        metadata: data,
        createdAt: new Date(),
      };
      this.rooms.set(roomId, room);
    }

    const room = this.rooms.get(roomId)!;
    room.subscribers.add(socket.id);

    // Send subscription confirmation
    socket.emit("subscribed", {
      roomId,
      type,
      subscribers: room.subscribers.size,
      history: this.messageHistory.get(roomId)?.slice(-10) || [],
    });

    console.log(`✅ Client ${socket.id} subscribed to ${roomId}`);
  }

  /**
   * Handle unsubscription
   */
  private async handleUnsubscribe(
    socket: Socket,
    connection: WebSocketConnection,
    roomId: string,
  ): Promise<void> {
    socket.leave(roomId);
    connection.subscriptions.delete(roomId);

    const room = this.rooms.get(roomId);
    if (room) {
      room.subscribers.delete(socket.id);
      if (room.subscribers.size === 0) {
        this.rooms.delete(roomId);
        this.messageHistory.delete(roomId);
      }
    }

    socket.emit("unsubscribed", { roomId });
  }

  /**
   * Handle get history
   */
  private async handleGetHistory(
    socket: Socket,
    roomId: string,
    limit: number = 50,
  ): Promise<void> {
    const history = this.messageHistory.get(roomId) || [];
    const limitedHistory = history.slice(-limit);

    socket.emit("history", {
      roomId,
      messages: limitedHistory,
      total: history.length,
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socket: Socket): void {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    // Remove from all rooms
    connection.subscriptions.forEach((roomId) => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.subscribers.delete(socket.id);
        if (room.subscribers.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });

    this.connections.delete(socket.id);
    this.metrics.activeConnections--;

    console.log(`❌ Client disconnected: ${socket.id}`);
  }

  /**
   * Publish lifecycle update
   */
  publishLifecycleUpdate(update: LifecycleUpdate): void {
    const roomId = this.generateRoomId("lifecycle", {
      entityId: update.entityId,
      entityType: update.entityType,
    });

    this.publishToRoom(roomId, {
      type: "lifecycle.update",
      timestamp: new Date().toISOString(),
      data: update,
    });
  }

  /**
   * Publish workflow update
   */
  publishWorkflowUpdate(update: WorkflowExecutionUpdate): void {
    const roomId = this.generateRoomId("workflow", {
      workflowId: update.workflowId,
      executionId: update.executionId,
    });

    this.publishToRoom(roomId, {
      type: "workflow.update",
      timestamp: new Date().toISOString(),
      data: update,
    });
  }

  /**
   * Publish process mining update
   */
  publishProcessMiningUpdate(update: ProcessMiningUpdate): void {
    const roomId = this.generateRoomId("process-mining", {
      caseId: update.caseId,
      caseType: update.caseType,
    });

    this.publishToRoom(roomId, {
      type: "process-mining.update",
      timestamp: new Date().toISOString(),
      data: update,
    });
  }

  /**
   * Publish analytics update
   */
  publishAnalyticsUpdate(update: AnalyticsUpdate): void {
    const roomId = this.generateRoomId("analytics", {
      entityType: update.entityType,
    });

    this.publishToRoom(roomId, {
      type: "analytics.update",
      timestamp: new Date().toISOString(),
      data: update,
    });
  }

  /**
   * Publish to room
   */
  private publishToRoom(roomId: string, event: ProcessEvent): void {
    if (!this.io) return;

    // Add to history
    if (!this.messageHistory.has(roomId)) {
      this.messageHistory.set(roomId, []);
    }
    const history = this.messageHistory.get(roomId)!;
    history.push(event);
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    // Emit to room
    this.io.to(roomId).emit("update", event);
    this.metrics.messagesSent++;

    // Also emit to tenant room if applicable
    const room = this.rooms.get(roomId);
    if (room?.metadata?.tenantId) {
      this.io.to(`tenant:${room.metadata.tenantId}`).emit("update", event);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(
    event: ProcessEvent,
    filter?: (connection: WebSocketConnection) => boolean,
  ): void {
    if (!this.io) return;

    if (filter) {
      this.connections.forEach((connection, socketId) => {
        if (filter(connection)) {
          this.io!.to(socketId).emit("broadcast", event);
        }
      });
    } else {
      this.io.emit("broadcast", event);
    }

    this.metrics.messagesSent++;
  }

  /**
   * Generate room ID
   */
  private generateRoomId(type: WebSocketRoom["roomType"], data: any): string {
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
   * Check rate limit
   */
  private checkRateLimit(socketId: string): boolean {
    const limit = 100; // messages per minute
    const window = 60000; // 1 minute

    const limiter = this.rateLimiters.get(socketId);
    const now = Date.now();

    if (!limiter || now > limiter.resetAt) {
      this.rateLimiters.set(socketId, {
        count: 1,
        resetAt: now + window,
      });
      return true;
    }

    if (limiter.count >= limit) {
      return false;
    }

    limiter.count++;
    return true;
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.io) return;

      // Check for stale connections
      const now = Date.now();
      this.connections.forEach((connection, socketId) => {
        const lastActivity = connection.lastActivity.getTime();
        const timeout = 120000; // 2 minutes

        if (now - lastActivity > timeout) {
          const socket = this.io!.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
            console.log(`⚠️ Disconnected stale connection: ${socketId}`);
          }
        }
      });

      // Send heartbeat to all connections
      this.io.emit("heartbeat", { timestamp: Date.now() });
    }, 30000); // Every 30 seconds
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      console.log("📊 WebSocket Metrics:", {
        ...this.metrics,
        rooms: this.rooms.size,
        connections: this.connections.size,
      });
    }, 60000); // Every minute
  }

  /**
   * Get server instance
   */
  getServer(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      rooms: this.rooms.size,
      activeConnections: this.connections.size,
    };
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.redisClient) {
      await this.redisClient.quit();
    }

    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }

    if (this.io) {
      this.io.close();
    }

    console.log("✅ WebSocket server cleaned up");
  }
}

// Singleton instance
export const websocketServer = new AdvancedWebSocketServer();

export default websocketServer;
