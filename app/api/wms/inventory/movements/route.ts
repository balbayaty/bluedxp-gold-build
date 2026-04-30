/**
 * Inventory Movements API
 */

import { NextRequest, NextResponse } from "next/server";
import { inventoryService } from "@/lib/services/wms/inventoryService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skuId = searchParams.get("skuId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    if (!skuId) {
      return NextResponse.json({ error: "skuId is required" }, { status: 400 });
    }

    const filters: { startDate?: Date; endDate?: Date; type?: string } = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (type) filters.type = type;

    const movements = await inventoryService.getMovements(skuId, filters);
    return NextResponse.json(movements);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get movements",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const movement = await inventoryService.recordMovement(body);
    return NextResponse.json(movement);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to record movement",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.inventory.movements",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.inventory.movements",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
