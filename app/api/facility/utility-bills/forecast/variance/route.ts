/**
 * Budget Variance Analysis API Route
 *
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

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "startDate and endDate are required" },
        { status: 400 },
      );
    }

    const forecastingService = getPredictiveForecastingService();
    const variance = await forecastingService.analyzeVariance(
      facilityId,
      warehouseId,
      {
        start: new Date(startDate),
        end: new Date(endDate),
      },
    );

    return NextResponse.json({
      success: true,
      data: variance,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error analyzing variance", err, {
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
        error: err.message || "Failed to analyze variance",
      },
      { status: 500 },
    );
  }
}
