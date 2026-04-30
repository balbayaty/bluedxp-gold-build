/**
 * Digital Twin API Route
 * Handles digital twin management
 *
 * SECURITY: Protected with API Gateway
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { getDigitalTwinService } from "@/lib/services/facility/digitalTwin/digitalTwinService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

const digitalTwinService = getDigitalTwinService();

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "facility-1";
    const twinId = searchParams.get("twinId");

    if (twinId) {
      // Get specific twin
      const twin = await digitalTwinService.getDigitalTwin(twinId);

      if (!twin || twin.facilityId !== facilityId) {
        return NextResponse.json(
          { success: false, error: "Digital twin not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: twin,
      });
    } else {
      // Get facility digital twin (returns first one or null)
      const twin = await digitalTwinService.getFacilityDigitalTwin(facilityId);

      return NextResponse.json({
        success: true,
        data: twin ? [twin] : [],
      });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching digital twins", err, {
      module: "facility",
      service: "digital-twin",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "digital-twin",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch digital twins" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { facilityId, name, dataSources } = body;

    if (!facilityId || !name || !dataSources) {
      return NextResponse.json(
        {
          success: false,
          error: "facilityId, name, and dataSources are required",
        },
        { status: 400 },
      );
    }

    const twin = await digitalTwinService.createDigitalTwin(facilityId, {
      name,
      dataSources,
    });

    return NextResponse.json({
      success: true,
      data: twin,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error creating digital twin", err, {
      module: "facility",
      service: "digital-twin",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "digital-twin",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create digital twin" },
      { status: 500 },
    );
  }
}

async function putHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const twinId = searchParams.get("twinId");
    const action = searchParams.get("action");

    if (!twinId) {
      return NextResponse.json(
        { success: false, error: "twinId is required" },
        { status: 400 },
      );
    }

    if (action === "sync") {
      await digitalTwinService.syncDigitalTwin(twinId);
      return NextResponse.json({
        success: true,
        message: "Digital twin synced successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error updating digital twin", err, {
      module: "facility",
      service: "digital-twin",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "digital-twin",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update digital twin" },
      { status: 500 },
    );
  }
}

// Export with API Gateway protection
export const GET = withAPIGateway(getHandler, {
  moduleId: "facility",
  featureId: "facility.digital-twin",
  action: "read",
  requireAuth: true,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "facility",
  featureId: "facility.digital-twin",
  action: "write",
  requireAuth: true,
  rateLimit: {
    maxRequests: 30,
    windowMs: 60000,
  },
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "facility",
  featureId: "facility.digital-twin",
  action: "write",
  requireAuth: true,
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000,
  },
});
