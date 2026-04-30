/**
 * SKU Packaging Level Detail API Endpoints
 * Update and delete individual packaging levels
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// PUT /api/wms/skus/[id]/packaging/levels/[levelId] - Update packaging level
// ============================================================================

async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string; levelId: string } },
) {
  try {
    const { id, levelId } = params;
    const body = await request.json();

    const level = await skuService.updatePackagingLevel(id, levelId, body);

    return NextResponse.json(level, { status: 200 });
  } catch (error) {
    console.error("Error updating packaging level:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update packaging level",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// DELETE /api/wms/skus/[id]/packaging/levels/[levelId] - Delete packaging level
// ============================================================================

async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string; levelId: string } },
) {
  try {
    const { id, levelId } = params;

    await skuService.deletePackagingLevel(id, levelId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting packaging level:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete packaging level",
      },
      { status: 500 },
    );
  }
}

export const PUT = withAPIGateway(putHandler, {
  moduleId: "wms",
  featureId: "wms.skus.packaging.levels",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "wms",
  featureId: "wms.skus.packaging.levels",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
