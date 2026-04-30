/**
 * Warehouse Sustainability API
 * GET: Get sustainability metrics for a warehouse
 * POST: Track sustainability data (carbon, energy, waste)
 */

import { NextRequest, NextResponse } from "next/server";
import { sustainabilityService } from "@/lib/services/wms/sustainabilityService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouseId");
    const period = (searchParams.get("period") || "MONTHLY") as
      | "DAILY"
      | "WEEKLY"
      | "MONTHLY"
      | "YEARLY";

    if (!warehouseId) {
      return NextResponse.json(
        { error: "warehouseId is required" },
        { status: 400 },
      );
    }

    const metrics = await sustainabilityService.getSustainabilityMetrics(
      warehouseId,
      period,
    );

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("Error fetching sustainability metrics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sustainability metrics" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { type, warehouseId, ...data } = body;

    if (!warehouseId) {
      return NextResponse.json(
        { error: "warehouseId is required" },
        { status: 400 },
      );
    }

    switch (type) {
      case "carbon":
        await sustainabilityService.trackCarbonFootprint(
          warehouseId,
          data.source,
          data.emissions,
          data.period,
        );
        break;
      case "energy":
        await sustainabilityService.trackEnergyConsumption(
          warehouseId,
          data.source,
          data.consumption,
          data.period,
        );
        break;
      case "waste":
        await sustainabilityService.trackWaste(
          warehouseId,
          data.wasteType,
          data.quantity,
          data.period,
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type. Must be carbon, energy, or waste" },
          { status: 400 },
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking sustainability data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to track sustainability data" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.sustainability",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.sustainability",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
