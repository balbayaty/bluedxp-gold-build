/**
 * API Route: Trigger cycle count for a SKU
 * POST /api/wms/inventory/cycle-count
 */

import { NextRequest, NextResponse } from "next/server";
import { wmsInventoryIntegration } from "@/lib/services/wms/inventoryIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { skuId, warehouseId } = body;

    if (!skuId) {
      return NextResponse.json(
        { error: "Missing required field: skuId" },
        { status: 400 },
      );
    }

    await wmsInventoryIntegration.triggerCycleCount(skuId, warehouseId);

    return NextResponse.json({
      success: true,
      message: "Cycle count triggered",
    });
  } catch (error: any) {
    console.error("Error triggering cycle count:", error);
    return NextResponse.json(
      { error: error.message || "Failed to trigger cycle count" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.inventory.cycle-count",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
