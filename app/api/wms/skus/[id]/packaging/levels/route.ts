/**
 * SKU Packaging Levels API Endpoints
 * Manage individual packaging levels
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { PackagingLevel } from "@/types/sku";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// POST /api/wms/skus/[id]/packaging/levels - Add packaging level
// ============================================================================

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    const level = await skuService.addPackagingLevel(id, body);

    return NextResponse.json(level, { status: 201 });
  } catch (error) {
    console.error("Error adding packaging level:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to add packaging level",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.skus.packaging.levels",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
