/**
 * Corridor Intelligence API
 *
 * Analyze corridors, track touchpoints, get optimization recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { CorridorIntelligenceService } from "@/lib/services/corridors/corridor-service";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

const corridorService = new CorridorIntelligenceService();

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const corridorId = searchParams.get("corridorId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (action === "analyze" && corridorId && from && to) {
      const analysis = await corridorService.analyzeCorridor(
        corridorId,
        { from: new Date(from), to: new Date(to) },
        tenantId,
      );
      return NextResponse.json(analysis);
    }

    if (action === "recommendations" && corridorId) {
      // Need analysis first, so get it from query or request body
      const analysisRes = await request.json().catch(() => null);
      if (!analysisRes) {
        return NextResponse.json(
          { error: "Analysis required for recommendations" },
          { status: 400 },
        );
      }
      const recommendations =
        await corridorService.getOptimizationRecommendations(
          corridorId,
          analysisRes,
        );
      return NextResponse.json({ recommendations });
    }

    if (corridorId) {
      const corridor = corridorService.getCorridor(corridorId);
      if (!corridor) {
        return NextResponse.json(
          { error: "Corridor not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(corridor);
    }

    // List available corridors
    return NextResponse.json({
      corridors: [
        { id: "saudi-kuwait", name: "Saudi Arabia - Kuwait Corridor" },
        { id: "saudi-syria", name: "Saudi Arabia - Syria Corridor" },
      ],
    });
  } catch (error) {
    console.error("Error getting corridor data:", error);
    return NextResponse.json(
      {
        error: "Failed to get corridor data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const { action, shipmentId, touchpointId, event, timestamp } = body;

    if (
      action === "track" &&
      shipmentId &&
      touchpointId &&
      event &&
      timestamp
    ) {
      await corridorService.trackTouchpoint(
        shipmentId,
        touchpointId,
        event,
        new Date(timestamp),
        tenantId,
      );
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (action === "analyze" && body.corridorId && body.from && body.to) {
      const analysis = await corridorService.analyzeCorridor(
        body.corridorId,
        { from: new Date(body.from), to: new Date(body.to) },
        tenantId,
      );
      return NextResponse.json(analysis);
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error processing corridor action:", error);
    return NextResponse.json(
      {
        error: "Failed to process corridor action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "corridors",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withTransportationAPI(postHandler, {
  featureId: "corridors",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
