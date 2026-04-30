/**
 * Waste Tracking API
 * GET: Get waste tracking for a warehouse
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

    const waste = await sustainabilityService.getWasteTracking(
      warehouseId,
      period,
    );

    return NextResponse.json(waste);
  } catch (error: any) {
    console.error("Error fetching waste tracking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch waste tracking" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.sustainability.waste",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
