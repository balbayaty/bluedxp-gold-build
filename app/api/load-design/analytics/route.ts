/**
 * Load Design Analytics API
 *
 * Endpoint for fetching load design analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { loadAnalyticsService } from "@/lib/services/load-design/analytics/loadAnalyticsService";
import type { AnalyticsFilters } from "@/lib/services/load-design/analytics/loadAnalyticsService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters: AnalyticsFilters = {};

    const startDate = searchParams.get("startDate");
    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    const endDate = searchParams.get("endDate");
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const vehicleType = searchParams.get("vehicleType");
    if (vehicleType) {
      filters.vehicleType = vehicleType;
    }

    const transportMode = searchParams.get("transportMode");
    if (transportMode) {
      filters.transportMode = transportMode as any;
    }

    const carrierId = searchParams.get("carrierId");
    if (carrierId) {
      filters.carrierId = carrierId;
    }

    // Fetch actual load plans from database
    const { loadPlanDatabaseAdapter } =
      await import("@/lib/services/load-design/database/loadPlanDatabaseAdapter");
    const loadPlans = await loadPlanDatabaseAdapter.getAllLoadPlans({
      startDate: filters.startDate,
      endDate: filters.endDate,
      transportMode: filters.transportMode,
      vehicleType: filters.vehicleType,
      carrierId: filters.carrierId,
      tenantId: process.env.TENANT_ID,
    });

    const analytics = await loadAnalyticsService.calculateAnalytics(
      loadPlans,
      filters,
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch analytics",
      },
      { status: 500 },
    );
  }
}
