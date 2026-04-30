/**
 * Spend Analytics API
 * GET /api/procurement/analytics/spend
 */

import { NextRequest, NextResponse } from "next/server";
import { spendAnalyticsService } from "@/lib/services/procurement/analytics/spendAnalyticsService";
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
    const currency = searchParams.get("currency") || "SAR";

    const analysis = await spendAnalyticsService.analyzeSpend(
      tenantId,
      startDate,
      endDate,
      currency,
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error("Error analyzing spend:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze spend",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.analytics.spend",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
