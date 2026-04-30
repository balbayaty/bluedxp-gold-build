/**
 * Predictive Insights API
 * Returns AI-powered predictive insights and forecasts
 */

import { NextRequest, NextResponse } from "next/server";
import { predictiveAnalyticsService } from "@/lib/services/ai/vision/predictiveAnalyticsService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { logger } from "@/lib/services/observability/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") || "30d") as
      | "7d"
      | "30d"
      | "90d";
    const tenantId = request.headers.get("x-tenant-id") || undefined;

    const insights = await predictiveAnalyticsService.generateInsights(
      tenantId,
      timeframe,
    );

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length,
      timeframe,
    });
  } catch (error) {
    logger.error(
      "Predictive insights API error",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-vision",
        service: "predictive-insights-api",
      },
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
