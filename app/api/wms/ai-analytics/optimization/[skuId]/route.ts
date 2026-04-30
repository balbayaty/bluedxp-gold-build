import { NextRequest, NextResponse } from "next/server";
import { skuAIAnalyticsIntegration } from "@/lib/services/wms/skuAIAnalyticsIntegration";
import type { InventoryOptimization } from "@/lib/services/wms/skuAIAnalyticsIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { skuId: string } },
) {
  try {
    const optimization =
      await skuAIAnalyticsIntegration.getInventoryOptimization(params.skuId);

    if (!optimization) {
      return NextResponse.json(
        { success: false, error: "Optimization not available" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: optimization });
  } catch (error) {
    console.error("Error in optimization API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { skuId: string } },
) {
  try {
    const body = await request.json();
    const success = await skuAIAnalyticsIntegration.applyOptimization(
      params.skuId,
      body,
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to apply optimization" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Optimization applied",
    });
  } catch (error) {
    console.error("Error applying optimization:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.ai-analytics.optimization",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.ai-analytics.optimization",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
