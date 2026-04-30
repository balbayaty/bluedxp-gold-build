/**
 * Warehouse Location API - Individual Location Operations
 * GET, PUT, DELETE operations for specific locations
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseLocationService } from "@/lib/services/wms/locationService";
import type { StorageLocationRequest } from "@/types/warehouseLocation";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/locations/[id]
 * Get a specific storage location
 */
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const location = await warehouseLocationService.getLocation(params.id);

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: "Location not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch location",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/wms/locations/[id]
 * Update a storage location
 */
async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    const updateData: Partial<StorageLocationRequest> = {
      ...(body.name && { name: body.name }),
      ...(body.type && { type: body.type }),
      ...(body.location && { location: body.location }),
      ...(body.regulatoryAuthority && {
        regulatoryAuthority: body.regulatoryAuthority,
      }),
      ...(body.fireSuppressionType && {
        fireSuppressionType: body.fireSuppressionType,
      }),
      ...(body.totalPalletCapacity !== undefined && {
        totalPalletCapacity: body.totalPalletCapacity,
      }),
      ...(body.bulkAreaCapacity !== undefined && {
        bulkAreaCapacity: body.bulkAreaCapacity,
      }),
      ...(body.currentPalletsUsed !== undefined && {
        currentPalletsUsed: body.currentPalletsUsed,
      }),
      ...(body.storageRestrictions && {
        storageRestrictions: body.storageRestrictions,
      }),
      ...(body.complianceStatus && { complianceStatus: body.complianceStatus }),
      ...(body.lastInspection && { lastInspection: body.lastInspection }),
      ...(body.regulatoryNotes !== undefined && {
        regulatoryNotes: body.regulatoryNotes,
      }),
    };

    const location = await warehouseLocationService.updateLocation(
      params.id,
      updateData,
    );

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update location",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/wms/locations/[id]
 * Delete a storage location
 */
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    await warehouseLocationService.deleteLocation(params.id);

    return NextResponse.json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete location",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.locations",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "wms",
  featureId: "wms.locations",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "wms",
  featureId: "wms.locations",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
