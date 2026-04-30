/**
 * WMS Batch Management API
 * GET /api/wms/batches - Get batches
 * 
 * Uses InventoryQuant with batchNumber field - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/batches - Get batches
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const materialNumber = searchParams.get("materialNumber") || "";

    // Build where clause
    const where: any = {
      tenantId,
      batchNumber: { not: null },
    };

    if (materialNumber) {
      where.sku = materialNumber;
    }

    // Get inventory quants grouped by batch
    const quants = await prisma.inventoryQuant.findMany({
      where,
      include: {
        material: true,
        bin: true,
      },
      orderBy: { expiryDate: "asc" }, // FEFO order
      take: 200,
    });

    // Group by batchNumber and aggregate
    const batchMap = new Map<string, any>();
    
    quants.forEach((quant) => {
      if (!quant.batchNumber) return;
      
      const batchKey = `${quant.sku}-${quant.batchNumber}`;
      if (!batchMap.has(batchKey)) {
        batchMap.set(batchKey, {
          id: `BATCH-${quant.batchNumber}`,
          batchNumber: quant.batchNumber,
          materialNumber: quant.sku,
          materialDescription: quant.material?.description || quant.sku,
          quantity: 0,
          unit: quant.material?.baseUnit || "EA",
          locations: [] as string[],
          productionDate: quant.manufactureDate || undefined,
          expiryDate: quant.expiryDate || undefined,
          status: quant.status === "AVAILABLE" ? "AVAILABLE" as const :
                  quant.status === "RESERVED" ? "RESERVED" as const :
                  quant.status === "QUARANTINE" ? "QUARANTINE" as const :
                  quant.expiryDate && new Date(quant.expiryDate) < new Date() ? "EXPIRED" as const :
                  "AVAILABLE" as const,
        });
      }
      
      const batch = batchMap.get(batchKey)!;
      batch.quantity += quant.quantity;
      if (quant.binId && !batch.locations.includes(quant.binId)) {
        batch.locations.push(quant.binId);
      }
    });

    const batches = Array.from(batchMap.values());

    return NextResponse.json({
      success: true,
      data: batches,
      count: batches.length,
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.batches",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
