/**
 * Real-Time Accident/Incident Streaming API
 * Server-Sent Events (SSE) for live incident updates
 */

import { NextRequest } from "next/server";
import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tenantId = searchParams.get("tenantId");
  const incidentId = searchParams.get("incidentId"); // Optional: filter by specific incident

  if (!tenantId) {
    return new Response(JSON.stringify({ error: "tenantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`,
        ),
      );

      // Subscribe to incident events
      const subscription = eventBus.subscribe(
        "transportation.incident.*",
        async (event: DomainEvent) => {
          const payload = event.payload as any;
          const eventTenantId = event.metadata.tenantId;

          // Filter by tenant
          if (eventTenantId !== tenantId) return;

          // Filter by incident ID if specified
          if (incidentId && payload.incidentId !== incidentId) return;

          // Send event update
          const message = {
            type: "incident_update",
            event: {
              type: event.type,
              incidentId: payload.incidentId,
              data: payload.incident || payload,
              timestamp: new Date().toISOString(),
            },
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(message)}\n\n`),
          );
        },
      );

      // Subscribe to IoT events that might trigger incidents
      const iotSubscription = eventBus.subscribe(
        "transportation.iot.*",
        async (event: DomainEvent) => {
          const payload = event.payload as any;
          if (payload.shock && payload.shock > 5) {
            const message = {
              type: "potential_incident",
              event: {
                type: "high_shock_detected",
                shipmentId: payload.shipmentId,
                vehicleId: payload.vehicleId,
                shock: payload.shock,
                location: payload.location,
                timestamp: new Date().toISOString(),
              },
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
        iotSubscription.unsubscribe();
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
