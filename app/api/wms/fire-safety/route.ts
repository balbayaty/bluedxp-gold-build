/**
 * Fire Safety API
 * Fire suppression system management and compliance checking
 */

import { NextRequest, NextResponse } from "next/server";
import { fireSafetyService } from "@/lib/services/wms/fireSafetyService";
import { warehouseLocationService } from "@/lib/services/wms/locationService";
import type { FireSuppressionSystemType } from "@/types/warehouseLocation";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/fire-safety
 * Get fire suppression system specifications or check compliance
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    // Get all system specs
    if (action === "specs") {
      const specs = fireSafetyService.getAllSystemSpecs();
      return NextResponse.json({
        success: true,
        data: specs,
      });
    }

    // Get specific system spec
    if (action === "spec") {
      const systemType = searchParams.get(
        "systemType",
      ) as FireSuppressionSystemType;
      if (!systemType) {
        return NextResponse.json(
          { success: false, error: "systemType parameter required" },
          { status: 400 },
        );
      }
      const spec = fireSafetyService.getSystemSpecs(systemType);
      return NextResponse.json({
        success: true,
        data: spec,
      });
    }

    // Get recommended systems
    if (action === "recommend") {
      const hazardClasses = searchParams.get("hazardClasses")?.split(",") || [];
      const areaSize = parseFloat(searchParams.get("areaSize") || "0");

      const recommendations = fireSafetyService.getRecommendedSystem(
        hazardClasses,
        areaSize,
      );
      return NextResponse.json({
        success: true,
        data: recommendations,
      });
    }

    // Check compliance
    if (action === "compliance") {
      const locationId = searchParams.get("locationId");
      if (!locationId) {
        return NextResponse.json(
          { success: false, error: "locationId parameter required" },
          { status: 400 },
        );
      }

      const location = await warehouseLocationService.getLocation(locationId);
      if (!location) {
        return NextResponse.json(
          { success: false, error: "Location not found" },
          { status: 404 },
        );
      }

      const compliance = await fireSafetyService.checkCompliance(
        locationId,
        location.fireSuppressionType,
        location.storageRestrictions.hazardClassesAllowed,
      );

      return NextResponse.json({
        success: true,
        data: compliance,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in fire safety API:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.fire-safety",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
