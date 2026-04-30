/**
 * Carbon Footprint API
 * GET: Get carbon footprint for a warehouse
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

    const footprint = await sustainabilityService.getCarbonFootprint(
      warehouseId,
      period,
    );

    return NextResponse.json(footprint);
  } catch (error: any) {
    console.error("Error fetching carbon footprint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch carbon footprint" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.sustainability.carbon",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
