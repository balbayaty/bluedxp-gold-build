/**
 * Warehouse Locations API
 * Comprehensive storage location management endpoints
 * BlueDXP Platform - Integration-First • Event-Driven
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseLocationService } from "@/lib/services/wms/locationService";
import type {
  StorageLocationRequest,
  StorageLocationFilters,
} from "@/types/warehouseLocation";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/locations
 * List all storage locations with optional filters
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: StorageLocationFilters = {
      tenantId: searchParams.get("tenantId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      warehouseId: searchParams.get("warehouseId") || undefined,
      countryCode: searchParams.get("countryCode") || undefined,
      cityCode: searchParams.get("cityCode") || undefined,
      facilityType: (searchParams.get("facilityType") as any) || undefined,
      fireSuppressionType:
        (searchParams.get("fireSuppressionType") as any) || undefined,
      complianceStatus:
        (searchParams.get("complianceStatus") as any) || undefined,
      active:
        searchParams.get("active") === "true"
          ? true
          : searchParams.get("active") === "false"
            ? false
            : undefined,
      searchQuery: searchParams.get("search") || undefined,
    };

    const locations = await warehouseLocationService.listLocations(filters);

    return NextResponse.json({
      success: true,
      data: locations,
      count: locations.length,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch locations",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/wms/locations
 * Create a new storage location
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.type ||
      !body.location ||
      !body.regulatoryAuthority
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: name, type, location, regulatoryAuthority",
        },
        { status: 400 },
      );
    }

    const locationData: StorageLocationRequest = {
      name: body.name,
      type: body.type,
      code: body.code,
      location: body.location,
      regulatoryAuthority: body.regulatoryAuthority,
      fireSuppressionType: body.fireSuppressionType || "None",
      totalPalletCapacity: body.totalPalletCapacity,
      bulkAreaCapacity: body.bulkAreaCapacity,
      currentPalletsUsed: body.currentPalletsUsed,
      storageRestrictions: body.storageRestrictions || {
        hazardClassesAllowed: [],
        hazardClassLimits: {},
        maximumQuantity: 0,
        temperatureControlled: false,
        specialRequirements: [],
      },
      complianceStatus: body.complianceStatus || "Pending Inspection",
      lastInspection:
        body.lastInspection || new Date().toISOString().split("T")[0],
      regulatoryNotes: body.regulatoryNotes,
    };

    const location =
      await warehouseLocationService.createLocation(locationData);

    return NextResponse.json(
      {
        success: true,
        data: location,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create location",
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

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.locations",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
