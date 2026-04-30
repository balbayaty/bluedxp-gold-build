/**
 * Enterprise QR Analytics API
 * World-Class Analytics Endpoint
 * Supports multiple dashboard levels: executive, operational, detailed
 */

import { NextRequest, NextResponse } from "next/server";
import { enterpriseQRAnalyticsService } from "@/lib/services/qr/enterpriseQRAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") || "executive"; // executive | operational | detailed
    const timeRange = searchParams.get("timeRange") || "30d";
    const tenantId = searchParams.get("tenantId");
    const modules = searchParams.get("modules")?.split(",");

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get enterprise analytics
    const analytics = await enterpriseQRAnalyticsService.getEnterpriseAnalytics(
      {
        tenantId: tenantId || undefined,
        startDate,
        endDate: now,
        modules: modules || undefined,
        includePredictions: true,
        includeIoT: true,
        includeBlockchain: true,
      },
    );

    // Return data based on level
    let responseData: any = {
      success: true,
      level,
      timeRange,
      timestamp: new Date().toISOString(),
    };

    switch (level) {
      case "executive":
        responseData.metrics = analytics.executive;
        responseData.predictions = analytics.predictions;
        break;
      case "operational":
        responseData.metrics = analytics.operational;
        responseData.realTime = analytics.realTime;
        break;
      case "detailed":
        responseData.metrics = analytics.detailed;
        responseData.anomalies = analytics.detailed.anomalies;
        break;
      case "all":
        responseData.analytics = analytics;
        break;
      default:
        responseData.metrics = analytics.executive;
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error getting enterprise analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get enterprise analytics",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.analytics.enterprise",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
