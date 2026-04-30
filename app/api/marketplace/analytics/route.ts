/**
 * Marketplace Analytics API
 * Comprehensive analytics and insights
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceAnalyticsService } from "@/lib/services/marketplace/marketplaceAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "overview"; // overview, predictive
    const periodStart =
      searchParams.get("periodStart") ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const periodEnd = searchParams.get("periodEnd") || new Date().toISOString();
    const category = searchParams.get("category");

    if (type === "predictive") {
      const insights = await marketplaceAnalyticsService.getPredictiveInsights(
        category || undefined,
      );
      return NextResponse.json({
        success: true,
        data: { insights },
        count: insights.length,
      });
    }

    const analytics = await marketplaceAnalyticsService.getAnalytics({
      start: periodStart,
      end: periodEnd,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error("Failed to get analytics:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get analytics" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.analytics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
