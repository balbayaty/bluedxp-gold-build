/**
 * Liquidity Analysis API
 * GET /api/finance/treasury/liquidity
 */

import { NextRequest, NextResponse } from "next/server";
import { treasuryService } from "@/lib/services/finance/treasuryService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const date = searchParams.get("date") || new Date().toISOString();

    const analysis = await treasuryService.getLiquidityAnalysis(tenantId, date);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error("Error getting liquidity analysis:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get liquidity analysis",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.treasury.liquidity",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
