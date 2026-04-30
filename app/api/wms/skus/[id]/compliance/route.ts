/**
 * SKU Compliance API Endpoint
 * Check compliance for a specific SKU
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET /api/wms/skus/[id]/compliance - Check SKU compliance
// ============================================================================

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region") || undefined;

    const compliance = await skuService.checkCompliance(id, region);

    return NextResponse.json(compliance, { status: 200 });
  } catch (error) {
    console.error("Error checking SKU compliance:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to check compliance",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.skus.compliance",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
