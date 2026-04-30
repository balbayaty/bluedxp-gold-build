/**
 * Transportation Control Tower - Live Stream (NDJSON)
 *
 * Why NDJSON:
 * - Works with fetch() streaming (can include tenant headers)
 * - Easy to parse in the browser
 *
 * Each line is one JSON object with `{ type, timestamp, payload, aggregateId }`.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

async function handler(_req: NextRequest, context: { tenantId?: string }) {
  const tenantId = context.tenantId;
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Heartbeat (keeps proxies from buffering too aggressively)
      const heartbeat = setInterval(() => {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
            }) + "\n",
          ),
        );
      }, 15000);

      const sub = eventBus.subscribe(
        "transportation.*",
        async (evt: DomainEvent) => {
          if (evt?.metadata?.tenantId !== tenantId) return;
          const line = JSON.stringify({
            type: evt.type,
            timestamp: evt.timestamp,
            aggregateId: evt.aggregateId,
            payload: evt.payload,
          });
          controller.enqueue(encoder.encode(line + "\n"));
        },
      );

      // Cleanup when consumer disconnects
      (controller as any)._cleanup = () => {
        clearInterval(heartbeat);
        sub.unsubscribe();
      };
    },
    cancel(reason) {
      try {
        (this as any)._cleanup?.();
      } catch {
        // ignore
      }
      void reason;
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Connection: "keep-alive",
    },
  });
}

export const GET = withTransportationAPI(handler, {
  featureId: "control-tower",
  action: "read_only",
  requireAuth: true,
  rateLimit: false, // streaming endpoint
});
