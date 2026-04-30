/**
 * Optimization Recommendations API
 * GET /api/procurement/predictive/optimization
 */

import { NextRequest, NextResponse } from "next/server";
import { predictiveAnalyticsService } from "@/lib/services/procurement/predictiveAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const focusArea = searchParams.get("focusArea") as
      | "SOURCING"
      | "INVENTORY"
      | "COST"
      | "PROCESS"
      | undefined;

    const recommendations =
      await predictiveAnalyticsService.generateOptimizationRecommendations(
        tenantId,
        focusArea,
      );

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error("Error generating optimization recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "Failed to generate optimization recommendations",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.predictive.optimization",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
