/**
 * Benchmarking API
 *
 * POST /api/transportation/benchmarking
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { benchmarkingService } from "@/lib/services/transportation";

async function handler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const body = await req.json();
    const { action, ...params } = body;
    const tenantId = context?.tenantId;

    switch (action) {
      case "benchmark": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required (multi-tenant day 1)",
            },
            { status: 400 },
          );
        }
        const benchmark = await benchmarkingService.benchmark({
          shipment: params.shipment,
          routePlan: params.routePlan,
          transitTime: params.transitTime,
          mode: params.mode,
          type: params.type,
          route: params.route,
          tenantId: String(tenantId),
        });

        return NextResponse.json({
          success: true,
          data: benchmark,
        });
      }

      case "getBenchmarks": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required (multi-tenant day 1)",
            },
            { status: 400 },
          );
        }
        const benchmarks = params.category
          ? benchmarkingService.getIndustryBenchmarks(params.category)
          : benchmarkingService.getAllIndustryBenchmarks();

        return NextResponse.json({
          success: true,
          data: benchmarks,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Benchmarking API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "benchmarking",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withTransportationAPI(handler, {
  featureId: "benchmarking",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
