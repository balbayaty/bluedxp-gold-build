import { NextRequest, NextResponse } from "next/server";
import { skuAIAnalyticsIntegration } from "@/lib/services/wms/skuAIAnalyticsIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const skuIdsParam = searchParams.get("skuIds");
    const skuIds = skuIdsParam ? skuIdsParam.split(",") : undefined;

    const recommendations =
      await skuAIAnalyticsIntegration.getReorderRecommendations(skuIds);

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Error in reorder recommendations API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.ai-analytics.reorder",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
