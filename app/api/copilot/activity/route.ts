import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { prisma } from "@/lib/services/database/prismaClient";

function safeLimit(v: string | null): number {
  const n = Number(v || 50);
  if (!Number.isFinite(n)) return 50;
  return Math.min(200, Math.max(1, Math.floor(n)));
}

async function handler(req: NextRequest, ctx: APIRequestContext) {
  if (!ctx.tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const sp = req.nextUrl.searchParams;
  const limit = safeLimit(sp.get("limit"));

  const rows = await prisma.event.findMany({
    where: {
      tenantId: ctx.tenantId,
      OR: [
        { eventType: { startsWith: "copilot." } },
        { eventType: { startsWith: "transportation.customs." } },
        { eventType: { startsWith: "proposals-rfq." } },
        { eventType: { startsWith: "msds." } },
      ],
    },
    orderBy: [{ timestamp: "desc" }],
    take: limit,
  });

  // Return a compact, UI-safe view (avoid dumping big payloads)
  const events = rows.map((r) => ({
    id: r.id,
    type: r.eventType,
    aggregateType: r.aggregateType,
    aggregateId: r.aggregateId,
    timestamp: r.timestamp.toISOString(),
    tenantId: r.tenantId,
    // keep only top-level keys for quick display
    payloadKeys:
      r.payload && typeof r.payload === "object"
        ? Object.keys(r.payload as any).slice(0, 20)
        : [],
    metadata: (r.metadata as any)
      ? {
          source: (r.metadata as any).source,
          correlationId: (r.metadata as any).correlationId,
        }
      : undefined,
  }));

  return NextResponse.json({ events });
}

export const GET = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.intelligent_orchestration",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
