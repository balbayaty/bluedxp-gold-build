/**
 * AI Analytics - Demand Forecast API
 */

import { NextRequest, NextResponse } from "next/server";
import { aiAnalyticsService } from "@/lib/services/wms/aiAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skuId = searchParams.get("skuId");
    const period = searchParams.get("period") || "MONTHLY";

    if (!skuId) {
      return NextResponse.json({ error: "skuId is required" }, { status: 400 });
    }

    const forecast = await aiAnalyticsService.forecastDemand(
      skuId,
      period as "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY",
    );
    return NextResponse.json(forecast);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get forecast",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.ai-analytics.forecast",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
