/**
 * WebSocket Server for Real-Time Features
 * Handles WebSocket connections for live updates
 */

import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(server: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
    },
    path: "/api/realtime",
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Handle join room (for tenant/user isolation)
    socket.on("join", (data: { tenantId?: string; userId?: string }) => {
      if (data.tenantId) {
        socket.join(`tenant:${data.tenantId}`);
      }
      if (data.userId) {
        socket.join(`user:${data.userId}`);
      }
    });

    // Handle inventory updates
    socket.on("inventory_update", (data: any) => {
      // Broadcast to relevant rooms
      if (data.tenantId) {
        io?.to(`tenant:${data.tenantId}`).emit("inventory_update", data);
      }
    });

    // Handle container movements
    socket.on("container_moved", (data: any) => {
      if (data.tenantId) {
        io?.to(`tenant:${data.tenantId}`).emit("container_moved", data);
      }
    });

    // Handle MSDS approvals
    socket.on("msds_approved", (data: any) => {
      if (data.tenantId) {
        io?.to(`tenant:${data.tenantId}`).emit("msds_approved", data);
      }
    });

    // Handle notifications
    socket.on("notification", (data: any) => {
      if (data.userId) {
        io?.to(`user:${data.userId}`).emit("notification", data);
      } else if (data.tenantId) {
        io?.to(`tenant:${data.tenantId}`).emit("notification", data);
      }
    });

    // Handle compliance alerts
    socket.on("compliance_alert", (data: any) => {
      if (data.tenantId) {
        io?.to(`tenant:${data.tenantId}`).emit("compliance_alert", data);
      }
    });

    // Handle system status (heartbeat)
    socket.on("system_status", (data: any) => {
      if (data.type === "ping") {
        socket.emit("system_status", {
          type: "pong",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Broadcast event to all clients
 */
export function broadcast(event: string, data: any): void {
  io?.emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast to tenant
 */
export function broadcastToTenant(
  tenantId: string,
  event: string,
  data: any,
): void {
  io?.to(`tenant:${tenantId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast to user
 */
export function broadcastToUser(
  userId: string,
  event: string,
  data: any,
): void {
  io?.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}
