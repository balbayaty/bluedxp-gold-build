/**
 * RFI Detail API Routes
 * GET, PUT, DELETE operations for individual RFIs
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { rfiService } from "@/lib/services/proposals/RFIService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - Get RFI by ID
// ============================================================================

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const rfiId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";

    if (!rfiId) {
      return NextResponse.json(
        { success: false, error: "RFI ID is required" },
        { status: 400 },
      );
    }

    const rfi = await rfiService.getRFI(rfiId, tenantId);

    if (!rfi) {
      return NextResponse.json(
        { success: false, error: "RFI not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: rfi,
    });
  } catch (error) {
    console.error("Error fetching RFI:", error);
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
// PUT - Update RFI
// ============================================================================

async function PUTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const rfiId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const body = await request.json();

    if (!rfiId) {
      return NextResponse.json(
        { success: false, error: "RFI ID is required" },
        { status: 400 },
      );
    }

    const rfi = await rfiService.updateRFI(rfiId, body, tenantId);

    return NextResponse.json({
      success: true,
      data: rfi,
    });
  } catch (error) {
    console.error("Error updating RFI:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const PUT = withAPIGateway(PUTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfi",
  action: "write",
  requireAuth: true,
});

// ============================================================================
// DELETE - Delete RFI
// ============================================================================

async function DELETEHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const rfiId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";

    if (!rfiId) {
      return NextResponse.json(
        { success: false, error: "RFI ID is required" },
        { status: 400 },
      );
    }

    const deleted = await rfiService.deleteRFI(rfiId, tenantId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "RFI not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "RFI deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting RFI:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const DELETE = withAPIGateway(DELETEHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfi",
  action: "delete",
  requireAuth: true,
});
