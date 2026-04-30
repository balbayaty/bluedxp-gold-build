/**
 * Truth Engine Events Stream API
 * Server-Sent Events (SSE) for real-time timeline updates
 */

import { NextRequest } from "next/server";
import { truthEngineService } from "@/lib/services/truth-engine";
import { eventBus } from "@/lib/services/event-store";
import { DomainEvent } from "@/types/cqrs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const tenantId = searchParams.get("tenantId");

  if (!entityType || !entityId || !tenantId) {
    return new Response(
      JSON.stringify({
        error: "entityType, entityId, and tenantId are required",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`),
      );

      // Subscribe to truth events for this entity
      const subscription = eventBus.subscribe(
        `truth.*`,
        async (event: DomainEvent) => {
          const payload = event.payload as any;
          const eventEntityRef = (payload.entityRefs as any)?.[
            `${entityType}Id`
          ];

          if (eventEntityRef === entityId) {
            // Send event update
            const message = {
              type: "event",
              event: payload,
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(message)}\n\n`),
            );
          }
        },
      );

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`,
          ),
        );
      }, 30000); // Every 30 seconds

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        subscription.unsubscribe();
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for nginx
    },
  });
}
