/**
 * QR Real-Time WebSocket Handler
 * Real-time QR scan events and updates
 */

import { NextRequest } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

// This will be initialized by the main server
let io: SocketIOServer | null = null;

export function initializeQRWebSocket(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
    },
    path: "/api/qr/realtime",
  });

  io.on("connection", (socket) => {
    logger.info("QR WebSocket client connected", { socketId: socket.id });

    // Subscribe to QR scan events
    socket.on(
      "subscribe-qr-scans",
      (data: { qrId?: string; tenantId?: string }) => {
        if (data.qrId) {
          socket.join(`qr:${data.qrId}`);
        }
        if (data.tenantId) {
          socket.join(`tenant:${data.tenantId}`);
        }
        socket.emit("subscribed", { qrId: data.qrId, tenantId: data.tenantId });
      },
    );

    // Unsubscribe
    socket.on(
      "unsubscribe-qr-scans",
      (data: { qrId?: string; tenantId?: string }) => {
        if (data.qrId) {
          socket.leave(`qr:${data.qrId}`);
        }
        if (data.tenantId) {
          socket.leave(`tenant:${data.tenantId}`);
        }
      },
    );

    socket.on("disconnect", () => {
      logger.info("QR WebSocket client disconnected", { socketId: socket.id });
    });
  });

  return io;
}

/**
 * Broadcast QR scan event
 */
export function broadcastQRScan(scan: {
  qrId: string;
  location: string;
  device: string;
  timestamp: Date;
  userId?: string;
  tenantId?: string;
}) {
  if (!io) {
    // WebSocket not initialized - this is OK, just log
    logger.warn("WebSocket server not initialized, skipping broadcast");
    return;
  }

  try {
    // Broadcast to specific QR room
    io.to(`qr:${scan.qrId}`).emit("qr-scan", {
      type: "scan",
      scan: {
        id: `scan-${Date.now()}`,
        qrId: scan.qrId,
        timestamp: scan.timestamp,
        location: scan.location,
        device: scan.device,
        module: "qr",
        responseTime: 0,
      },
    });

    // Broadcast to tenant room
    if (scan.tenantId) {
      io.to(`tenant:${scan.tenantId}`).emit("qr-scan", {
        type: "scan",
        scan,
      });
    }
  } catch (error: unknown) {
    logger.error("Error broadcasting QR scan event", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "qr-realtime", action: "broadcast-scan" },
    );
    // Don't throw - broadcasting is non-critical
  }
}

/**
 * Broadcast network update
 */
export function broadcastNetworkUpdate(networkId: string, update: any) {
  if (!io) {
    logger.warn(
      "WebSocket server not initialized, skipping network update broadcast",
    );
    return;
  }
  try {
    io.emit("qr-network-update", { networkId, update });
  } catch (error: unknown) {
    logger.error("Error broadcasting network update", {
      error: error instanceof Error ? error.message : String(error),
      networkId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "qr-realtime", action: "broadcast-network-update", networkId },
    );
  }
}

/**
 * Broadcast agent insight
 */
export function broadcastAgentInsight(agentId: string, insight: any) {
  if (!io) {
    logger.warn(
      "WebSocket server not initialized, skipping agent insight broadcast",
    );
    return;
  }
  try {
    io.emit("qr-agent-insight", { agentId, insight });
  } catch (error: unknown) {
    logger.error("Error broadcasting agent insight", {
      error: error instanceof Error ? error.message : String(error),
      agentId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "qr-realtime", action: "broadcast-agent-insight", agentId },
    );
  }
}

/**
 * Broadcast achievement unlock
 */
export function broadcastAchievementUnlock(userId: string, achievement: any) {
  if (!io) {
    logger.warn(
      "WebSocket server not initialized, skipping achievement broadcast",
    );
    return;
  }
  try {
    io.to(`user:${userId}`).emit("qr-achievement-unlocked", {
      userId,
      achievement,
    });
  } catch (error: unknown) {
    logger.error("Error broadcasting achievement unlock", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "qr-realtime", action: "broadcast-achievement", userId },
    );
  }
}

/**
 * Broadcast leaderboard update
 */
export function broadcastLeaderboardUpdate(leaderboardId: string) {
  if (!io) {
    logger.warn(
      "WebSocket server not initialized, skipping leaderboard update broadcast",
    );
    return;
  }
  try {
    io.emit("qr-leaderboard-update", { leaderboardId });
  } catch (error: unknown) {
    logger.error("Error broadcasting leaderboard update", {
      error: error instanceof Error ? error.message : String(error),
      leaderboardId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "qr-realtime",
        action: "broadcast-leaderboard",
        leaderboardId,
      },
    );
  }
}

// HTTP handler for Next.js (WebSocket upgrade happens at server level)
// Note: This endpoint is intentionally not authenticated as it's just an info endpoint
// The actual WebSocket connection requires authentication at the socket level
export async function GET(request: NextRequest) {
  return new Response("WebSocket endpoint - use ws:// protocol", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
