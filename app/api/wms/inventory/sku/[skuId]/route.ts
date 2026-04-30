/**
 * API Route: Get real-time inventory for a SKU
 * GET /api/wms/inventory/sku/[skuId]
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
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId") || undefined;

    const inventory = await wmsInventoryIntegration.getSKUInventoryRealTime(
      params.skuId,
      warehouseId,
    );

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(inventory);
  } catch (error: any) {
    console.error("Error fetching SKU inventory:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.inventory.sku",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
