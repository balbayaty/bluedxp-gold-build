/**
 * QHSE Safety Metrics API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseSafetyMetricsService } from "@/lib/services/qhse";
import type { SafetyMetricFilters } from "@/types/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "calculate-trir") {
      const filters: SafetyMetricFilters = {
        tenantId: searchParams.get("tenantId") || undefined,
        customerId: searchParams.get("customerId") || undefined,
        warehouseId: searchParams.get("warehouseId") || undefined,
        facilityId: searchParams.get("facilityId") || undefined,
        periodStart: searchParams.get("periodStart") || undefined,
        periodEnd: searchParams.get("periodEnd") || undefined,
      };

      const trir = await qhseSafetyMetricsService.calculateTRIR(filters);
      return NextResponse.json({
        success: true,
        data: { trir },
      });
    }

    if (action === "calculate-ltifr") {
      const filters: SafetyMetricFilters = {
        tenantId: searchParams.get("tenantId") || undefined,
        customerId: searchParams.get("customerId") || undefined,
        warehouseId: searchParams.get("warehouseId") || undefined,
        facilityId: searchParams.get("facilityId") || undefined,
        periodStart: searchParams.get("periodStart") || undefined,
        periodEnd: searchParams.get("periodEnd") || undefined,
      };

      const ltifr = await qhseSafetyMetricsService.calculateLTIFR(filters);
      return NextResponse.json({
        success: true,
        data: { ltifr },
      });
    }

    if (action === "trends") {
      const filters: SafetyMetricFilters = {
        tenantId: searchParams.get("tenantId") || undefined,
        customerId: searchParams.get("customerId") || undefined,
        warehouseId: searchParams.get("warehouseId") || undefined,
        facilityId: searchParams.get("facilityId") || undefined,
        periodStart: searchParams.get("periodStart") || undefined,
        periodEnd: searchParams.get("periodEnd") || undefined,
      };

      const trends = await qhseSafetyMetricsService.getSafetyTrends(filters);
      return NextResponse.json({
        success: true,
        data: trends,
      });
    }

    if (action === "benchmark") {
      const metric = (searchParams.get("metric") as "TRIR" | "LTIFR") || "TRIR";
      const comparison =
        await qhseSafetyMetricsService.compareToIndustryBenchmark(metric);
      return NextResponse.json({
        success: true,
        data: comparison,
      });
    }

    // Default: Get all safety metrics
    const filters: SafetyMetricFilters = {
      tenantId: searchParams.get("tenantId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      warehouseId: searchParams.get("warehouseId") || undefined,
      facilityId: searchParams.get("facilityId") || undefined,
      periodStart: searchParams.get("periodStart") || undefined,
      periodEnd: searchParams.get("periodEnd") || undefined,
    };

    const metrics = await qhseSafetyMetricsService.getSafetyMetrics(filters);

    return NextResponse.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error("Error fetching safety metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch safety metrics",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    if (
      !body.tenantId ||
      !body.period ||
      !body.periodStart ||
      !body.periodEnd
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: tenantId, period, periodStart, periodEnd",
        },
        { status: 400 },
      );
    }

    const metric = await qhseSafetyMetricsService.recordSafetyMetric({
      tenantId: body.tenantId,
      customerId: body.customerId,
      warehouseId: body.warehouseId,
      facilityId: body.facilityId,
      period: body.period,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      trir: body.trir,
      ltifr: body.ltifr,
      nearMisses: body.nearMisses,
      firstAidCases: body.firstAidCases,
      medicalTreatmentCases: body.medicalTreatmentCases,
      lostTimeCases: body.lostTimeCases,
      fatalities: body.fatalities,
      safetyObservations: body.safetyObservations,
      safetyObservationsClosed: body.safetyObservationsClosed,
      averageEmployeeCount: body.averageEmployeeCount,
      totalHoursWorked: body.totalHoursWorked,
      targets: body.targets,
      oshaCompliant:
        body.oshaCompliant !== undefined ? body.oshaCompliant : true,
      oshaLogGenerated: body.oshaLogGenerated || false,
      oshaLogSubmitted: body.oshaLogSubmitted || false,
      createdBy: body.createdBy,
      updatedBy: body.updatedBy || body.createdBy,
    });

    return NextResponse.json(
      {
        success: true,
        data: metric,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error recording safety metric:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to record safety metric",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.safety-metrics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.safety-metrics",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
