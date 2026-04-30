/**
 * SKU Analytics API Endpoint
 * Get analytics for a specific SKU
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET /api/wms/skus/[id]/analytics - Get SKU analytics
// ============================================================================

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const analytics = await skuService.getSKUAnalytics(id);

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error("Error getting SKU analytics:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get analytics",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.skus.analytics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
