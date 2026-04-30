/**
 * Utility Bill Analytics API Route
 *
 * GET /api/facility/utility-bills/analytics - Get analytics and insights
 * POST /api/facility/utility-bills/analytics/compare - Compare bills
 */

import { NextRequest, NextResponse } from "next/server";
import { getUtilityBillAnalyticsService } from "@/lib/services/facility/utility-bills/utilityBillAnalyticsService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import type { BillComparisonRequest } from "@/types/utility-bills";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters: any = {};
    if (searchParams.get("utilityTypes")) {
      filters.utilityTypes = searchParams.get("utilityTypes")!.split(",");
    }
    if (searchParams.get("facilityIds")) {
      filters.facilityIds = searchParams.get("facilityIds")!.split(",");
    }
    if (searchParams.get("warehouseIds")) {
      filters.warehouseIds = searchParams.get("warehouseIds")!.split(",");
    }
    if (searchParams.get("tenantId")) {
      filters.tenantId = searchParams.get("tenantId")!;
    }

    // Parse period
    let period: { start: Date; end: Date } | undefined;
    if (searchParams.get("startDate") && searchParams.get("endDate")) {
      period = {
        start: new Date(searchParams.get("startDate")!),
        end: new Date(searchParams.get("endDate")!),
      };
    }

    const analyticsService = getUtilityBillAnalyticsService();
    const analytics = await analyticsService.generateAnalytics(filters, period);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error generating analytics", err, {
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
        error: err.message || "Failed to generate analytics",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const comparisonRequest: BillComparisonRequest = await request.json();

    if (!comparisonRequest.comparisonType || !comparisonRequest.metrics) {
      return NextResponse.json(
        { success: false, error: "Comparison type and metrics are required" },
        { status: 400 },
      );
    }

    const analyticsService = getUtilityBillAnalyticsService();
    const comparison = await analyticsService.compareBills(comparisonRequest);

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error comparing bills", err, {
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
        error: err.message || "Failed to compare bills",
      },
      { status: 500 },
    );
  }
}
