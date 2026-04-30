/**
 * Depreciation Calculation API
 * POST /api/finance/fixed-assets/depreciation
 */

import { NextRequest, NextResponse } from "next/server";
import { fixedAssetsService } from "@/lib/services/finance/fixedAssetsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { assetId, period } = body;

    if (!assetId || !period) {
      return NextResponse.json(
        {
          success: false,
          error: "Asset ID and period are required",
        },
        { status: 400 },
      );
    }

    const schedule = await fixedAssetsService.calculateDepreciation(
      tenantId,
      assetId,
      period,
    );

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error("Error calculating depreciation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to calculate depreciation",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.fixed-assets.depreciation",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
