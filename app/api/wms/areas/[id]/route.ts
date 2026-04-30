/**
 * Warehouse Area API - Individual Area Operations
 * GET, PUT, DELETE operations for specific areas
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseAreaService } from "@/lib/services/wms/areaService";
import type { WarehouseAreaRequest } from "@/types/warehouseArea";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/areas/[id]
 * Get a specific warehouse area
 */
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const area = await warehouseAreaService.getArea(params.id);

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          error: "Area not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: area,
    });
  } catch (error) {
    console.error("Error fetching area:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch area",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/wms/areas/[id]
 * Update a warehouse area
 */
async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    const updateData: Partial<WarehouseAreaRequest> = {
      ...(body.areaCode && { areaCode: body.areaCode }),
      ...(body.areaName && { areaName: body.areaName }),
      ...(body.zone && { zone: body.zone }),
      ...(body.capacity !== undefined && { capacity: body.capacity }),
      ...(body.currentStock !== undefined && {
        currentStock: body.currentStock,
      }),
      ...(body.allowedHazards && { allowedHazards: body.allowedHazards }),
      ...(body.restrictions !== undefined && {
        restrictions: body.restrictions,
      }),
      ...(body.active !== undefined && { active: body.active }),
    };

    const area = await warehouseAreaService.updateArea(params.id, updateData);

    return NextResponse.json({
      success: true,
      data: area,
    });
  } catch (error) {
    console.error("Error updating area:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update area",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/wms/areas/[id]
 * Delete a warehouse area
 */
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    await warehouseAreaService.deleteArea(params.id);

    return NextResponse.json({
      success: true,
      message: "Area deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting area:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete area",
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

export const PUT = withAPIGateway(putHandler, {
  moduleId: "wms",
  featureId: "wms.areas",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "wms",
  featureId: "wms.areas",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
