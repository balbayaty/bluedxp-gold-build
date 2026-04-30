/**
 * IoT Energy Tracking API
 * POST: Track energy consumption from IoT sensors
 */

import { NextRequest, NextResponse } from "next/server";
import { sustainabilityService } from "@/lib/services/wms/sustainabilityService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { warehouseId, sensorId, consumption } = body;

    if (!warehouseId) {
      return NextResponse.json(
        { error: "warehouseId is required" },
        { status: 400 },
      );
    }

    if (!sensorId) {
      return NextResponse.json(
        { error: "sensorId is required" },
        { status: 400 },
      );
    }

    if (consumption === undefined || consumption === null) {
      return NextResponse.json(
        { error: "consumption is required" },
        { status: 400 },
      );
    }

    await sustainabilityService.trackIoTEnergyData(
      warehouseId,
      sensorId,
      consumption,
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking IoT energy data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to track IoT energy data" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.sustainability.iot",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
