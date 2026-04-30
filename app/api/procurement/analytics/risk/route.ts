/**
 * Risk Analytics API
 * GET /api/procurement/analytics/risk
 */

import { NextRequest, NextResponse } from "next/server";
import { riskAnalyticsService } from "@/lib/services/procurement/analytics/riskAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const startDate =
      searchParams.get("startDate") ||
      new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();

    const riskAnalysis = await riskAnalyticsService.analyzeRisks(
      tenantId,
      startDate,
      endDate,
    );

    return NextResponse.json({
      success: true,
      data: riskAnalysis,
    });
  } catch (error: any) {
    console.error("Error analyzing risks:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze risks",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.analytics.risk",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
