/**
 * Asset Disposal API
 * POST /api/finance/fixed-assets/dispose
 */

import { NextRequest, NextResponse } from "next/server";
import { fixedAssetsService } from "@/lib/services/finance/fixedAssetsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { assetId, disposalData } = body;

    if (!assetId || !disposalData) {
      return NextResponse.json(
        {
          success: false,
          error: "Asset ID and disposal data are required",
        },
        { status: 400 },
      );
    }

    const disposal = await fixedAssetsService.disposeAsset(
      tenantId,
      assetId,
      disposalData,
    );

    return NextResponse.json({
      success: true,
      data: disposal,
    });
  } catch (error: any) {
    console.error("Error disposing asset:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to dispose asset",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.fixed-assets.disposal",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
