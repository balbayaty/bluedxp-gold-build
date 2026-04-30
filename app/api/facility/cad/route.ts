/**
 * CAD Drawings API Route
 * Handles CAD drawing management
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
    const type = searchParams.get("type") as any;
    const status = searchParams.get("status");
    const linkedAssetId = searchParams.get("linkedAssetId");
    const linkedSpaceId = searchParams.get("linkedSpaceId");

    const drawings = await cadService.getDrawings(facilityId, {
      type,
      status: status || undefined,
      linkedAssetId: linkedAssetId || undefined,
      linkedSpaceId: linkedSpaceId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: drawings,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching CAD drawings", err, {
      module: "facility",
      service: "cad",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "cad",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch CAD drawings" },
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
    const type = formData.get("type") as any;
    const version = formData.get("version") as string;
    const revision = formData.get("revision") as string;
    const description = formData.get("description") as string;
    const linkedAssets = formData.get("linkedAssets") as string;
    const linkedSpaces = formData.get("linkedSpaces") as string;

    if (!file || !name || !type) {
      return NextResponse.json(
        { success: false, error: "File, name, and type are required" },
        { status: 400 },
      );
    }

    const drawing = await cadService.uploadDrawing(facilityId, file, {
      name,
      type,
      version: version || undefined,
      revision: revision || undefined,
      description: description || undefined,
      linkedAssets: linkedAssets ? JSON.parse(linkedAssets) : undefined,
      linkedSpaces: linkedSpaces ? JSON.parse(linkedSpaces) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: drawing,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error uploading CAD drawing", err, {
      module: "facility",
      service: "cad",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "cad",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to upload CAD drawing" },
      { status: 500 },
    );
  }
}

// Export with API Gateway protection
export const GET = withAPIGateway(getHandler, {
  moduleId: "facility",
  featureId: "facility.cad",
  action: "read",
  requireAuth: true,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "facility",
  featureId: "facility.cad",
  action: "write",
  requireAuth: true,
  rateLimit: {
    maxRequests: 20,
    windowMs: 60000,
  },
});
