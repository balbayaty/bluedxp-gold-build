/**
 * Warehouse Optimization - Slotting API
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseOptimizationService } from "@/lib/services/wms/warehouseOptimizationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouseId");
    const skuIds = searchParams.get("skuIds")?.split(",");

    if (!warehouseId) {
      return NextResponse.json(
        { error: "warehouseId is required" },
        { status: 400 },
      );
    }

    const recommendations = await warehouseOptimizationService.optimizeSlotting(
      warehouseId,
      skuIds,
    );
    return NextResponse.json(recommendations);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to optimize slotting",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.warehouse-optimization.slotting",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
