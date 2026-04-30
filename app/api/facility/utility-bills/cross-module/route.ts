/**
 * Cross-Module Insights API Route
 *
 * GET /api/facility/utility-bills/cross-module - Get cross-module insights
 */

import { NextRequest, NextResponse } from "next/server";
import { getHierarchicalAnalyticsService } from "@/lib/services/facility/utility-bills/hierarchicalAnalyticsService";
import { getUtilityBillService } from "@/lib/services/facility/utility-bills/utilityBillService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const facilityId = searchParams.get("facilityId") || undefined;
    const warehouseId = searchParams.get("warehouseId") || undefined;

    const analyticsService = getHierarchicalAnalyticsService();
    const billService = getUtilityBillService();

    // Get bills
    const { bills } = await billService.getBills({
      filters: {
        facilityIds: facilityId ? [facilityId] : undefined,
        warehouseIds: warehouseId ? [warehouseId] : undefined,
      },
    });

    const insights = await analyticsService.getCrossModuleInsights(
      bills,
      facilityId,
      warehouseId,
    );

    return NextResponse.json({
      success: true,
      data: insights,
      summary: {
        totalModules: insights.length,
        totalInsights: insights.reduce((sum, m) => sum + m.insights.length, 0),
        byModule: insights.reduce(
          (acc, m) => {
            acc[m.module] = m.insights.length;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error getting cross-module insights", err, {
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
        error: err.message || "Failed to get cross-module insights",
      },
      { status: 500 },
    );
  }
}
