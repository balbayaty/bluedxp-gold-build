import { NextRequest, NextResponse } from "next/server";
import { warehouseAreaService } from "@/lib/services/wms/areaService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import prisma from "@/lib/prisma";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string; zoneId: string } },
) {
  try {
    const warehouseId = params.id;
    const zoneId = params.zoneId;

    const area = await warehouseAreaService.getArea(zoneId);

    if (!area) {
      return NextResponse.json(
        { success: false, error: "Zone/Area not found" },
        { status: 404 },
      );
    }

    // Fetch Real Inventory
    const quants = await prisma.inventoryQuant.findMany({
      where: {
        bin: { areaId: zoneId },
      },
      include: {
        material: true,
        bin: true,
      },
    });

    // Map to frontend InventoryItem type
    const inventory = quants.map((q) => ({
      id: q.id,
      sku: q.sku,
      name: q.material?.name || "Unknown Item",
      category: q.material?.category || "Uncategorized",
      quantity: q.quantity,
      unit: q.uom,
      location: q.bin?.code || "No Bin",
      value: q.quantity * (Number(q.material?.standardPrice) || 0),
      supplier: "-", // Not directly on Quant
      lastMoved: q.lastMoved || q.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      zone: area,
      inventory,
      equipment: [], // Equipment is next
    });
  } catch (error) {
    console.error("Error fetching zone:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch zone" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.zones",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
