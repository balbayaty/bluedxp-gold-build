import { NextRequest, NextResponse } from "next/server";
import { skuAIAnalyticsIntegration } from "@/lib/services/wms/skuAIAnalyticsIntegration";
import type { DemandForecast } from "@/lib/services/wms/skuAIAnalyticsIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { skuId: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "monthly") as
      | "daily"
      | "weekly"
      | "monthly"
      | "quarterly";
    const months = parseInt(searchParams.get("months") || "6", 10);

    const forecast = await skuAIAnalyticsIntegration.getDemandForecast(
      params.skuId,
      period,
      months,
    );

    if (!forecast) {
      return NextResponse.json(
        { success: false, error: "Forecast not available" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: forecast });
  } catch (error) {
    console.error("Error in forecast API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
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
