/**
 * Requisitions API
 * GET /api/procurement/requisitions - List requisitions
 * POST /api/procurement/requisitions - Create requisition
 */

import { NextRequest, NextResponse } from "next/server";
import { requisitionService } from "@/lib/services/procurement/requisitionService";
import type { RequisitionCreateInput } from "@/types/requisition";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const status = searchParams.get("status")?.split(",") as any;
    const type = searchParams.get("type")?.split(",") as any;
    const projectId = searchParams.get("projectId") || undefined;
    const search = searchParams.get("search") || undefined;

    const requisitions = await requisitionService.listRequisitions({
      tenantId,
      status,
      type,
      projectId,
      search,
    });

    return NextResponse.json({
      success: true,
      data: requisitions,
      count: requisitions.length,
    });
  } catch (error: unknown) {
    logger.error("Error fetching requisitions", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "procurement-requisitions", action: "fetch", tenantId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch requisitions",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, userId, ...input } = body;

    const requisition = await requisitionService.createRequisition(
      input as RequisitionCreateInput,
      userId || "system",
    );

    return NextResponse.json({
      success: true,
      data: requisition,
    });
  } catch (error: unknown) {
    logger.error("Error creating requisition", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "procurement-requisitions", action: "create", tenantId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create requisition",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.requisitions",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.requisitions",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
