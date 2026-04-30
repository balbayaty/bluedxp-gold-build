/**
 * API Route: Get inventory accuracy for a SKU
 * GET /api/wms/inventory/accuracy/[skuId]
 */

import { NextRequest, NextResponse } from "next/server";
import { wmsInventoryIntegration } from "@/lib/services/wms/inventoryIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { skuId: string } },
) {
  try {
    const accuracy = await wmsInventoryIntegration.getInventoryAccuracyData(
      params.skuId,
    );

    if (!accuracy) {
      return NextResponse.json(
        { error: "Accuracy data not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(accuracy);
  } catch (error: any) {
    console.error("Error fetching inventory accuracy:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch accuracy" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.inventory.accuracy",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
