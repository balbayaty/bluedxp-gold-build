/**
 * Tariff Analysis API Route
 *
 * POST /api/facility/utility-bills/tariff/analyze - Analyze tariff optimization
 */

import { NextRequest, NextResponse } from "next/server";
import { getHierarchicalAnalyticsService } from "@/lib/services/facility/utility-bills/hierarchicalAnalyticsService";
import { getUtilityBillService } from "@/lib/services/facility/utility-bills/utilityBillService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import type { TariffAnalysis } from "@/lib/services/facility/utility-bills/hierarchicalAnalyticsService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billIds, facilityId, warehouseId, tariffStructure } = body;

    if (!tariffStructure) {
      return NextResponse.json(
        { success: false, error: "Tariff structure is required" },
        { status: 400 },
      );
    }

    const analyticsService = getHierarchicalAnalyticsService();
    const billService = getUtilityBillService();

    // Get bills
    let bills;
    if (billIds && Array.isArray(billIds)) {
      bills = await Promise.all(billIds.map((id) => billService.getBill(id)));
      bills = bills.filter((b) => b !== null) as any[];
    } else {
      const result = await billService.getBills({
        filters: {
          facilityIds: facilityId ? [facilityId] : undefined,
          warehouseIds: warehouseId ? [warehouseId] : undefined,
        },
      });
      bills = result.bills;
    }

    if (bills.length === 0) {
      return NextResponse.json(
        { success: false, error: "No bills found for analysis" },
        { status: 404 },
      );
    }

    const analysis = await analyticsService.analyzeTariffOptimization(
      bills,
      tariffStructure as TariffAnalysis["tariffStructure"],
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error analyzing tariff", err, {
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
        error: err.message || "Failed to analyze tariff",
      },
      { status: 500 },
    );
  }
}
