/**
 * Fixed Asset Registration API
 * POST /api/finance/fixed-assets/register
 */

import { NextRequest, NextResponse } from "next/server";
import { fixedAssetsService } from "@/lib/services/finance/fixedAssetsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { assetData } = body;

    if (!assetData) {
      return NextResponse.json(
        {
          success: false,
          error: "Asset data is required",
        },
        { status: 400 },
      );
    }

    const asset = await fixedAssetsService.registerAsset(tenantId, assetData);

    return NextResponse.json({
      success: true,
      data: asset,
    });
  } catch (error: any) {
    console.error("Error registering asset:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to register asset",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.fixed-assets",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
