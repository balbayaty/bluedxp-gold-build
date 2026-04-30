import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * Vehicle Event API
 * Handles vehicle entry/exit events and statistics
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get("cameraId");

    // Mock statistics for demo
    const stats = {
      avgDwellSec: 1250 + Math.floor(Math.random() * 200),
      parkedCount: 3 + Math.floor(Math.random() * 2),
      slaSeconds: 1800,
      slaCompliance: 92 + Math.floor(Math.random() * 5),
    };

    return NextResponse.json({
      success: true,
      stats,
      cameraId: cameraId || null,
    });
  } catch (error) {
    console.error("Error fetching vehicle events:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vehicle events" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { cameraId, plate, eventType } = body;

    // In a real implementation, this would save to database
    // For now, just return success
    return NextResponse.json({
      success: true,
      ok: true,
      message: `Vehicle ${eventType} event recorded for plate ${plate} at camera ${cameraId}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error recording vehicle event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record vehicle event" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.vehicle-events",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.vehicle-events",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
