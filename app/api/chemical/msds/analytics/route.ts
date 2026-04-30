/**
 * MSDS Analytics API
 * Returns comprehensive analytics and insights for MSDS data
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsAnalyticsService } from "@/lib/services/chemical/msdsAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = context.tenantId;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const dateRange =
      dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;

    const analytics = await msdsAnalyticsService.getAnalytics(
      tenantId,
      dateRange,
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error("❌ Error getting MSDS analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get analytics",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.analytics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
