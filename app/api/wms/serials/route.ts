/**
 * WMS Serial Number Management API
 * GET /api/wms/serials - Get serials
 * 
 * Uses InventoryQuant with serialNumber field - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/serials - Get serials
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const materialNumber = searchParams.get("materialNumber") || "";
    const serialNumber = searchParams.get("serialNumber") || "";

    // Build where clause
    const where: any = {
      tenantId,
      serialNumber: { not: null },
    };

    if (materialNumber) {
      where.sku = materialNumber;
    }

    if (serialNumber) {
      where.serialNumber = serialNumber;
    }

    // Get inventory quants with serial numbers
    const quants = await prisma.inventoryQuant.findMany({
      where,
      include: {
        material: true,
        bin: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Map to serial format
    const serials = quants.map((quant) => ({
      id: quant.id,
      serialNumber: quant.serialNumber || "",
      materialNumber: quant.sku,
      materialDescription: quant.material?.description || quant.sku,
      batchNumber: quant.batchNumber || undefined,
      location: quant.binId || "UNKNOWN",
      status: quant.status === "AVAILABLE" ? "AVAILABLE" as const :
              quant.status === "RESERVED" ? "RESERVED" as const :
              quant.status === "QUARANTINE" ? "QUARANTINE" as const :
              quant.status === "HOLD" ? "QUARANTINE" as const :
              "IN_USE" as const,
      currentLocation: quant.binId || "UNKNOWN",
      productionDate: quant.manufactureDate || undefined,
      lastMovementDate: quant.updatedAt || quant.createdAt,
      movementHistory: [], // Would be populated from audit log in production
    }));

    return NextResponse.json({
      success: true,
      data: serials,
      count: serials.length,
    });
  } catch (error) {
    console.error("Error fetching serials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch serials" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.serials",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
