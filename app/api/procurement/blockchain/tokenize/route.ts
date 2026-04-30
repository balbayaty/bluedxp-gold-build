/**
 * Blockchain Tokenization API
 * POST /api/procurement/blockchain/tokenize
 */

import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/services/procurement/blockchainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, asset } = body;

    if (!tenantId || !asset) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and asset are required",
        },
        { status: 400 },
      );
    }

    const tokenizedAsset = await blockchainService.tokenizeAsset(
      tenantId,
      asset,
    );

    return NextResponse.json({
      success: true,
      data: tokenizedAsset,
    });
  } catch (error: any) {
    console.error("Error tokenizing asset:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to tokenize asset",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.blockchain.tokenize",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
