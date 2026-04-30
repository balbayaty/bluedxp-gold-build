/**
 * Hierarchical Analytics API Route
 *
 * POST /api/facility/utility-bills/hierarchical/breakdown - Get hierarchical breakdown
 * POST /api/facility/utility-bills/hierarchical/savings - Get savings insights
 * POST /api/facility/utility-bills/hierarchical/multi-dimensional - Get multi-dimensional breakdown
 */

import { NextRequest, NextResponse } from "next/server";
import { getHierarchicalAnalyticsService } from "@/lib/services/facility/utility-bills/hierarchicalAnalyticsService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import type { HierarchicalStructure } from "@/lib/services/facility/utility-bills/hierarchicalAnalyticsService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, structure, period, dimensions } = body;

    const analyticsService = getHierarchicalAnalyticsService();

    switch (action) {
      case "breakdown": {
        if (!structure || !Array.isArray(structure)) {
          return NextResponse.json(
            { success: false, error: "Structure array is required" },
            { status: 400 },
          );
        }

        const breakdown = await analyticsService.getHierarchicalBreakdown(
          structure as HierarchicalStructure[],
          period
            ? { start: new Date(period.start), end: new Date(period.end) }
            : undefined,
        );

        return NextResponse.json({
          success: true,
          data: breakdown,
        });
      }

      case "savings": {
        if (!structure || !Array.isArray(structure)) {
          return NextResponse.json(
            { success: false, error: "Structure array is required" },
            { status: 400 },
          );
        }

        const insights = await analyticsService.getSavingsInsights(
          structure as HierarchicalStructure[],
          period
            ? { start: new Date(period.start), end: new Date(period.end) }
            : undefined,
        );

        return NextResponse.json({
          success: true,
          data: insights,
          summary: {
            totalInsights: insights.length,
            totalPotentialSavings: insights.reduce(
              (sum, i) => sum + i.potentialSavings.amount,
              0,
            ),
            annualSavings: insights.reduce(
              (sum, i) => sum + (i.potentialSavings.annualSavings || 0),
              0,
            ),
            byType: insights.reduce(
              (acc, i) => {
                acc[i.type] = (acc[i.type] || 0) + i.potentialSavings.amount;
                return acc;
              },
              {} as Record<string, number>,
            ),
          },
        });
      }

      case "multi-dimensional": {
        if (!dimensions || !Array.isArray(dimensions)) {
          return NextResponse.json(
            { success: false, error: "Dimensions array is required" },
            { status: 400 },
          );
        }

        // Get all bills
        const { getUtilityBillService } =
          await import("@/lib/services/facility/utility-bills/utilityBillService");
        const billService = getUtilityBillService();
        const { bills } = await billService.getBills({
          filters: period
            ? {
                dateRange: {
                  start: new Date(period.start),
                  end: new Date(period.end),
                },
              }
            : undefined,
        });

        const breakdown = await analyticsService.getMultiDimensionalBreakdown(
          bills,
          dimensions as Array<
            | "warehouse"
            | "sub-warehouse"
            | "area"
            | "zone"
            | "utility-type"
            | "period"
          >,
        );

        return NextResponse.json({
          success: true,
          data: breakdown,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid action. Use: breakdown, savings, or multi-dimensional",
          },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error in hierarchical analytics", err, {
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
        error: err.message || "Failed to process hierarchical analytics",
      },
      { status: 500 },
    );
  }
}
