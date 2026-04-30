/**
 * AI Analytics - Inventory Optimization API
 */

import { NextRequest, NextResponse } from "next/server";
import { aiAnalyticsService } from "@/lib/services/wms/aiAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skuId = searchParams.get("skuId");

    if (!skuId) {
      return NextResponse.json({ error: "skuId is required" }, { status: 400 });
    }

    const optimization = await aiAnalyticsService.optimizeInventory(skuId);
    return NextResponse.json(optimization);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to optimize inventory",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.ai-analytics.optimize",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
