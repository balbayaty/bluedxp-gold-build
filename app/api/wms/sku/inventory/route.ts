/**
 * SKU Inventory API
 * Real-time inventory data for SKU module
 * Connects inventoryService to SKU pages
 */

import { NextRequest, NextResponse } from "next/server";
import { inventoryService } from "@/lib/services/wms/inventoryService";
import { skuService } from "@/lib/services/wms/skuService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { prisma } from "@/lib/services/database/prismaClient";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skuId = searchParams.get("skuId");
    const warehouseId = searchParams.get("warehouseId");
    const includeMovements = searchParams.get("includeMovements") === "true";
    const includeAccuracy = searchParams.get("includeAccuracy") === "true";

    if (!skuId) {
      return NextResponse.json(
        { success: false, error: "skuId is required" },
        { status: 400 },
      );
    }

    // Get SKU details
    const sku = await skuService.getSKU(skuId);
    if (!sku) {
      return NextResponse.json(
        { success: false, error: "SKU not found" },
        { status: 404 },
      );
    }

    // Get inventory data
    const inventoryData: any[] = [];

    if (warehouseId) {
      // Get stock for specific warehouse
      const stock = await inventoryService.getStock(skuId, warehouseId);
      if (stock) {
        inventoryData.push({
          ...stock,
          warehouseId,
          movements: includeMovements
            ? await inventoryService.getMovements(skuId, {})
            : undefined,
          accuracy: includeAccuracy
            ? await inventoryService.getInventoryAccuracy(skuId)
            : undefined,
        });
      }
    } else {
      // Get stock for all warehouses from database
      const warehouses = await prisma.warehouse.findMany({
        where: {
          tenantId: context.tenantId,
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      for (const warehouse of warehouses) {
        const stock = await inventoryService.getStock(skuId, warehouse.id);
        if (stock) {
          inventoryData.push({
            ...stock,
            warehouseId: warehouse.id,
            warehouseCode: warehouse.code,
            warehouseName: warehouse.name,
            movements: includeMovements
              ? await inventoryService.getMovements(skuId, {})
              : undefined,
            accuracy: includeAccuracy
              ? await inventoryService.getInventoryAccuracy(skuId)
              : undefined,
          });
        }
      }
    }

    // Calculate totals
    const totals = inventoryData.reduce(
      (acc, inv) => ({
        totalQuantity: acc.totalQuantity + inv.quantity,
        totalReserved: acc.totalReserved + inv.reservedQuantity,
        totalAvailable: acc.totalAvailable + inv.availableQuantity,
      }),
      { totalQuantity: 0, totalReserved: 0, totalAvailable: 0 },
    );

    return NextResponse.json({
      success: true,
      data: {
        sku: {
          id: sku.id,
          skuCode: sku.skuCode,
          materialNumber: sku.materialNumber,
          description: sku.description,
        },
        inventory: inventoryData,
        totals,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching SKU inventory:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch inventory",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.sku.inventory",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
