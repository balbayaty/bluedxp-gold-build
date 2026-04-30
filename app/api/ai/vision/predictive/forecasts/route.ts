/**
 * Predictive Forecasts API
 * Returns trend forecasts for specific metrics
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
    const metric = searchParams.get("metric") || "compliance";
    const periods = parseInt(searchParams.get("periods") || "7");
    const tenantId = request.headers.get("x-tenant-id") || undefined;

    const metrics = ["compliance", "issues", "critical_issues"];
    const forecasts = [];

    for (const m of metrics) {
      try {
        const forecast = await predictiveAnalyticsService.forecastTrends(
          m,
          tenantId,
          periods,
        );
        forecasts.push(forecast);
      } catch (error) {
        // Skip metrics with insufficient data
        console.warn(`Forecast failed for ${m}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      forecasts,
      count: forecasts.length,
    });
  } catch (error) {
    logger.error(
      "Predictive forecasts API error",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-vision",
        service: "predictive-forecasts-api",
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
