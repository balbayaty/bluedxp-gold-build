/**
 * Inventory API Endpoints
 * Real-time inventory management
 */

import { NextRequest, NextResponse } from "next/server";
import { inventoryService } from "@/lib/services/wms/inventoryService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skuId = searchParams.get("skuId");
    const warehouseId = searchParams.get("warehouseId");
    const locationId = searchParams.get("locationId");

    if (skuId && warehouseId) {
      const stock = await inventoryService.getStock(skuId, warehouseId);
      return NextResponse.json(stock);
    }

    if (locationId) {
      const stocks = await inventoryService.getStockByLocation(locationId);
      return NextResponse.json(stocks);
    }

    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get inventory",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { skuId, warehouseId, quantity, reason } = body;

    if (!skuId || !warehouseId || quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const stock = await inventoryService.updateStock(
      skuId,
      warehouseId,
      quantity,
      reason,
    );
    return NextResponse.json(stock);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update inventory",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.inventory",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.inventory",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
