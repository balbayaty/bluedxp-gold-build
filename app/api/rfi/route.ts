/**
 * RFI API Routes
 * CRUD operations for Request for Information
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { rfiService } from "@/lib/services/proposals/RFIService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - List RFIs
// ============================================================================

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const { searchParams } = new URL(request.url);

    const filters = {
      status: searchParams.get("status") as any,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      companyName: searchParams.get("companyName") || undefined,
    };

    const result = await rfiService.listRFIs(tenantId, filters);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error listing RFIs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(GETHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfi",
  action: "read",
  requireAuth: true,
});

// ============================================================================
// POST - Create RFI
// ============================================================================

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const userId = context.userId || "system";
    const body = await request.json();

    const rfi = await rfiService.createRFI({
      ...body,
      tenantId,
      createdBy: userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: rfi,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating RFI:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfi",
  action: "write",
  requireAuth: true,
});
