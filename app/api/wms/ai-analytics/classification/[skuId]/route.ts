import { NextRequest, NextResponse } from "next/server";
import { skuAIAnalyticsIntegration } from "@/lib/services/wms/skuAIAnalyticsIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { skuId: string } },
) {
  try {
    const classification =
      await skuAIAnalyticsIntegration.getABCXYZClassification(params.skuId);

    if (!classification) {
      return NextResponse.json(
        { success: false, error: "Classification not available" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: classification });
  } catch (error) {
    console.error("Error in classification API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.ai-analytics.classification",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
