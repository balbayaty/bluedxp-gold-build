/**
 * API Route: Update inventory from RFID/barcode scan
 * POST /api/wms/inventory/scan
 */

import { NextRequest, NextResponse } from "next/server";
import { wmsInventoryIntegration } from "@/lib/services/wms/inventoryIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { skuId, quantity, location, batchNumber, serialNumber, scanType } =
      body;

    if (!skuId || quantity === undefined || !location || !scanType) {
      return NextResponse.json(
        {
          error: "Missing required fields: skuId, quantity, location, scanType",
        },
        { status: 400 },
      );
    }

    const updatedInventory =
      await wmsInventoryIntegration.updateInventoryFromScan(skuId, {
        quantity,
        location,
        batchNumber,
        serialNumber,
        scanType,
      });

    return NextResponse.json(updatedInventory);
  } catch (error: any) {
    console.error("Error updating inventory from scan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update inventory" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.inventory.scan",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
