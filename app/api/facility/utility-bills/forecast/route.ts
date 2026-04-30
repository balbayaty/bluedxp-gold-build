/**
 * Predictive Forecasting API Route
 *
 * GET /api/facility/utility-bills/forecast - Get cost and consumption forecast
 * POST /api/facility/utility-bills/forecast/budget - Generate budget plan
 * GET /api/facility/utility-bills/forecast/variance - Analyze budget variance
 */

import { NextRequest, NextResponse } from "next/server";
import { getPredictiveForecastingService } from "@/lib/services/facility/utility-bills/predictiveForecastingService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const facilityId = searchParams.get("facilityId") || undefined;
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const horizon =
      (searchParams.get("horizon") as "1m" | "3m" | "6m" | "12m") || "3m";
    const utilityType = (searchParams.get("utilityType") as any) || undefined;

    const forecastingService = getPredictiveForecastingService();
    const forecast = await forecastingService.forecast(
      facilityId,
      warehouseId,
      horizon,
      utilityType,
    );

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error generating forecast", err, {
      module: "facility",
      service: "utility-bills",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "utility-bills",
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to generate forecast",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { facilityId, warehouseId, period, scenarios } = body;

    if (!period || !period.start || !period.end) {
      return NextResponse.json(
        { success: false, error: "Period (start and end dates) is required" },
        { status: 400 },
      );
    }

    const forecastingService = getPredictiveForecastingService();
    const budget = await forecastingService.generateBudget(
      facilityId,
      warehouseId,
      {
        start: new Date(period.start),
        end: new Date(period.end),
      },
      scenarios !== false,
    );

    return NextResponse.json({
      success: true,
      data: budget,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error generating budget", err, {
      module: "facility",
      service: "utility-bills",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "utility-bills",
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to generate budget",
      },
      { status: 500 },
    );
  }
}
