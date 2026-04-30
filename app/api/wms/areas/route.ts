/**
 * Warehouse Areas API
 * Comprehensive area/zone management endpoints
 * BlueDXP Platform - Integration-First • Event-Driven
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseAreaService } from "@/lib/services/wms/areaService";
import type {
  WarehouseAreaRequest,
  WarehouseAreaFilters,
  WarehouseAreaImportData,
} from "@/types/warehouseArea";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/areas
 * List all warehouse areas with optional filters
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: WarehouseAreaFilters = {
      warehouseId: searchParams.get("warehouseId") || undefined,
      zone: searchParams.get("zone") || undefined,
      active:
        searchParams.get("active") === "true"
          ? true
          : searchParams.get("active") === "false"
            ? false
            : undefined,
      tenantId: searchParams.get("tenantId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      searchQuery: searchParams.get("search") || undefined,
    };

    const areas = await warehouseAreaService.listAreas(filters);

    return NextResponse.json({
      success: true,
      data: areas,
      count: areas.length,
    });
  } catch (error) {
    console.error("Error fetching areas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch areas",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/wms/areas
 * Create a new warehouse area or import multiple areas
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // Check if this is a bulk import
    if (body.import && Array.isArray(body.data)) {
      const importData: WarehouseAreaImportData[] = body.data;
      const warehouseId = body.warehouseId;

      if (!warehouseId) {
        return NextResponse.json(
          {
            success: false,
            error: "warehouseId is required for import",
          },
          { status: 400 },
        );
      }

      const importedAreas = await warehouseAreaService.importAreas(
        warehouseId,
        importData,
      );

      return NextResponse.json(
        {
          success: true,
          data: importedAreas,
          count: importedAreas.length,
          message: `Successfully imported ${importedAreas.length} areas`,
        },
        { status: 201 },
      );
    }

    // Single area creation
    if (!body.areaCode || !body.areaName || !body.zone || !body.warehouseId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: areaCode, areaName, zone, warehouseId",
        },
        { status: 400 },
      );
    }

    const areaData: WarehouseAreaRequest = {
      areaCode: body.areaCode,
      areaName: body.areaName,
      zone: body.zone,
      warehouseId: body.warehouseId,
      capacity: body.capacity || 0,
      currentStock: body.currentStock || 0,
      allowedHazards: body.allowedHazards || [],
      restrictions: body.restrictions || "",
      active: body.active !== undefined ? body.active : true,
    };

    const area = await warehouseAreaService.createArea(areaData);

    return NextResponse.json(
      {
        success: true,
        data: area,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating area:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create area",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.areas",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.areas",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
