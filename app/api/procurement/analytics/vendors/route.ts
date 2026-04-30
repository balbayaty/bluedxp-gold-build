/**
 * Vendor Analytics API
 * GET /api/procurement/analytics/vendors
 */

import { NextRequest, NextResponse } from "next/server";
import { vendorAnalyticsService } from "@/lib/services/procurement/analytics/vendorAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const vendorId = searchParams.get("vendorId");
    const startDate =
      searchParams.get("startDate") ||
      new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();

    if (!vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor ID is required",
        },
        { status: 400 },
      );
    }

    const analytics = await vendorAnalyticsService.analyzeVendor(
      vendorId,
      tenantId,
      startDate,
      endDate,
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error("Error analyzing vendor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze vendor",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.analytics.vendors",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
