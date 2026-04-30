/**
 * Facility Space Management API Route
 * Handles space CRUD operations and utilization analytics
 *
 * SECURITY: Protected with API Gateway
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { SpaceService } from "@/lib/services/facility/space/spaceService";
import { getSpaceUtilizationService } from "@/lib/services/facility/space/spaceUtilizationService";
import { getFacilityIntegrationService } from "@/lib/services/facility/integration/facilityIntegrationService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

const spaceService = new SpaceService();
const integrationService = getFacilityIntegrationService();

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "facility-1";
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const floor = searchParams.get("floor");
    const building = searchParams.get("building");
    const includeUtilization =
      searchParams.get("includeUtilization") === "true";
    const includeOptimization =
      searchParams.get("includeOptimization") === "true";

    // Get spaces
    const spaces = await spaceService.getSpaces(facilityId, {
      type: type as any,
      status: status as any,
      floor,
      building,
    });

    // Get utilization data if requested
    let utilizationData = null;
    if (includeUtilization) {
      try {
        const utilizationService = getSpaceUtilizationService();
        const utilization =
          await utilizationService.getUtilizationAnalytics(facilityId);
        utilizationData = utilization;
      } catch (utilError) {
        logger.warn(
          "Failed to get utilization analytics",
          utilError instanceof Error ? utilError : new Error(String(utilError)),
          {
            module: "facility",
            service: "space",
            facilityId,
          },
        );
      }
    }

    // Get optimization recommendations if requested
    let optimization = null;
    if (includeOptimization) {
      try {
        const utilizationService = getSpaceUtilizationService();
        const recommendations =
          await utilizationService.getOptimizationRecommendations(facilityId);
        optimization = recommendations;
      } catch (optError) {
        logger.warn(
          "Failed to get optimization recommendations",
          optError instanceof Error ? optError : new Error(String(optError)),
          {
            module: "facility",
            service: "space",
            facilityId,
          },
        );
      }
    }

    // Calculate statistics
    const totalArea = spaces.reduce(
      (sum, s) => sum + (s.specifications.area || 0),
      0,
    );
    const totalCapacity = spaces.reduce(
      (sum, s) => sum + (s.specifications.capacity || 0),
      0,
    );
    const allocatedSpaces = spaces.filter(
      (s) => s.allocation && s.allocation.allocatedTo,
    ).length;
    const availableSpaces = spaces.filter(
      (s) => s.status === "available",
    ).length;
    const averageUtilization =
      spaces.length > 0
        ? spaces.reduce(
            (sum, s) => sum + (s.utilization?.utilizationRate || 0),
            0,
          ) / spaces.length
        : 0;

    const stats = {
      total: spaces.length,
      totalArea,
      totalCapacity,
      allocated: allocatedSpaces,
      available: availableSpaces,
      averageUtilization: Math.round(averageUtilization * 100) / 100,
    };

    return NextResponse.json({
      success: true,
      data: spaces,
      stats,
      utilization: utilizationData,
      optimization,
      total: spaces.length,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching spaces", err, {
      module: "facility",
      service: "space",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "space",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch spaces" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const space = await spaceService.createSpace(body);

    // Store in Knowledge Base if enabled
    try {
      await integrationService.storeFacilityDocumentation(
        body.facilityId || "facility-1",
        {
          title: `Space: ${space.name || space.id}`,
          content: `Space created: ${space.type} - ${space.specifications.area} ${space.specifications.areaUnit || "sqm"}`,
          type: "specification",
          category: "space",
          relatedSpaceId: space.id,
          tags: ["space", space.type],
        },
      );
    } catch (kbError) {
      logger.warn(
        "Failed to store space in knowledge base",
        kbError instanceof Error ? kbError : new Error(String(kbError)),
        {
          module: "facility",
          service: "space",
          spaceId: space.id,
        },
      );
    }

    return NextResponse.json({
      success: true,
      data: space,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error creating space", err, {
      module: "facility",
      service: "space",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "space",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create space" },
      { status: 500 },
    );
  }
}

async function putHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Space ID is required" },
        { status: 400 },
      );
    }

    const space = await spaceService.updateSpace(id, updates);

    return NextResponse.json({
      success: true,
      data: space,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error updating space", err, {
      module: "facility",
      service: "space",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "space",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update space" },
      { status: 500 },
    );
  }
}

// Export with API Gateway protection
export const GET = withAPIGateway(getHandler, {
  moduleId: "facility",
  featureId: "facility.spaces",
  action: "read",
  requireAuth: true,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "facility",
  featureId: "facility.spaces",
  action: "write",
  requireAuth: true,
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000,
  },
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "facility",
  featureId: "facility.spaces",
  action: "write",
  requireAuth: true,
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000,
  },
});
