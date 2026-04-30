/**
 * BIM Models API Route
 * Handles BIM model management
 *
 * SECURITY: Protected with API Gateway
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { getCADDocumentService } from "@/lib/services/facility/cad/cadDocumentService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

const cadService = getCADDocumentService();

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "facility-1";

    const models = await cadService.getBIMModels(facilityId);

    return NextResponse.json({
      success: true,
      data: models,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching BIM models", err, {
      module: "facility",
      service: "bim",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "bim",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch BIM models" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const formData = await request.formData();
    const facilityId = (formData.get("facilityId") as string) || "facility-1";
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const version = (formData.get("version") as string) || "1.0";
    const author = formData.get("author") as string;
    const software = formData.get("software") as string;
    const projectName = formData.get("projectName") as string;

    if (!file || !name) {
      return NextResponse.json(
        { success: false, error: "File and name are required" },
        { status: 400 },
      );
    }

    const model = await cadService.uploadBIMModel(facilityId, file, {
      name,
      version,
      author,
      software,
      projectName,
    });

    return NextResponse.json({
      success: true,
      data: model,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error uploading BIM model", err, {
      module: "facility",
      service: "bim",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "bim",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to upload BIM model" },
      { status: 500 },
    );
  }
}

// Export with API Gateway protection
export const GET = withAPIGateway(getHandler, {
  moduleId: "facility",
  featureId: "facility.bim",
  action: "read",
  requireAuth: true,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "facility",
  featureId: "facility.bim",
  action: "write",
  requireAuth: true,
  rateLimit: {
    maxRequests: 20,
    windowMs: 60000,
  },
});
