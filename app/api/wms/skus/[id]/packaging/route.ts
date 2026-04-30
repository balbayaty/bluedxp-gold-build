/**
 * SKU Packaging API Endpoints
 * Manage packaging hierarchy for SKUs
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { PackagingHierarchy, PackagingLevel } from "@/types/sku";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET /api/wms/skus/[id]/packaging - Get packaging hierarchy
// ============================================================================

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const hierarchy = await skuService.getPackagingHierarchy(id);

    if (!hierarchy) {
      return NextResponse.json(
        { error: "Packaging hierarchy not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(hierarchy, { status: 200 });
  } catch (error) {
    console.error("Error getting packaging hierarchy:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get packaging hierarchy",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/wms/skus/[id]/packaging - Create packaging hierarchy
// ============================================================================

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    const hierarchy = await skuService.createPackagingHierarchy(id, body);

    return NextResponse.json(hierarchy, { status: 201 });
  } catch (error) {
    console.error("Error creating packaging hierarchy:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create packaging hierarchy",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// PUT /api/wms/skus/[id]/packaging - Update packaging hierarchy
// ============================================================================

async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    const hierarchy = await skuService.updatePackagingHierarchy(id, body);

    return NextResponse.json(hierarchy, { status: 200 });
  } catch (error) {
    console.error("Error updating packaging hierarchy:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update packaging hierarchy",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.skus.packaging",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.skus.packaging",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "wms",
  featureId: "wms.skus.packaging",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
