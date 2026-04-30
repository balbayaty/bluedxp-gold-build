/**
 * ASN Real-Time Updates API (Server-Sent Events)
 * Provides real-time ASN updates via SSE
 */

import { NextRequest } from "next/server";
import { asnRealtimeService } from "@/lib/services/asn/asnRealtimeService";
import type { ASNRealtimeUpdate } from "@/lib/services/asn/asnRealtimeService";

/**
 * GET /api/asn/realtime
 * Server-Sent Events stream for real-time ASN updates
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const asnId = searchParams.get("asnId"); // Optional: filter by specific ASN

  // Initialize realtime service
  await asnRealtimeService.initialize();

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`,
        ),
      );

      // Subscribe to updates
      const unsubscribe = asnId
        ? asnRealtimeService.subscribe(asnId, (update: ASNRealtimeUpdate) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(update)}\n\n`),
            );
          })
        : asnRealtimeService.subscribeAll((update: ASNRealtimeUpdate) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(update)}\n\n`),
            );
          });

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`,
            ),
          );
        } catch (error) {
          clearInterval(heartbeatInterval);
          unsubscribe();
          controller.close();
        }
      }, 30000); // Every 30 seconds

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
