/**
 * SKU Detail API Endpoints
 * GET, PUT, DELETE operations for individual SKUs
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET /api/wms/skus/[id] - Get SKU by ID
// ============================================================================

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const sku = await skuService.getSKU(id);

    if (!sku) {
      return NextResponse.json({ error: "SKU not found" }, { status: 404 });
    }

    return NextResponse.json(sku, { status: 200 });
  } catch (error) {
    console.error("Error getting SKU:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get SKU" },
      { status: 500 },
    );
  }
}

// ============================================================================
// PUT /api/wms/skus/[id] - Update SKU
// ============================================================================

async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    const sku = await skuService.updateSKU(id, body);

    return NextResponse.json(sku, { status: 200 });
  } catch (error) {
    console.error("Error updating SKU:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update SKU",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// DELETE /api/wms/skus/[id] - Delete SKU
// ============================================================================

async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    await skuService.deleteSKU(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting SKU:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete SKU",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.skus",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "wms",
  featureId: "wms.skus",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "wms",
  featureId: "wms.skus",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
