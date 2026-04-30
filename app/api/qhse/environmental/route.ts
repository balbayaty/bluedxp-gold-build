/**
 * QHSE Environmental Metrics API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseEnvironmentalService } from "@/lib/services/qhse";
import type { EnvironmentalMetricFilters } from "@/types/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: EnvironmentalMetricFilters = {
      tenantId: searchParams.get("tenantId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      warehouseId: searchParams.get("warehouseId") || undefined,
      facilityId: searchParams.get("facilityId") || undefined,
      metricType: (searchParams.get("metricType") as any) || undefined,
      periodStart: searchParams.get("periodStart") || undefined,
      periodEnd: searchParams.get("periodEnd") || undefined,
    };

    const metrics = await qhseEnvironmentalService.getMetrics(filters);

    return NextResponse.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error("Error fetching environmental metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch environmental metrics",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    if (!body.tenantId || !body.metricType || !body.value || !body.unit) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: tenantId, metricType, value, unit",
        },
        { status: 400 },
      );
    }

    const metric = await qhseEnvironmentalService.recordMetric({
      tenantId: body.tenantId,
      customerId: body.customerId,
      warehouseId: body.warehouseId,
      facilityId: body.facilityId,
      metricType: body.metricType,
      period: body.period || "MONTHLY",
      periodStart: body.periodStart || new Date().toISOString(),
      periodEnd: body.periodEnd || new Date().toISOString(),
      value: body.value,
      unit: body.unit,
      baseline: body.baseline,
      target: body.target,
      previousValue: body.previousValue,
      breakdown: body.breakdown,
      regulatoryRequirement: body.regulatoryRequirement,
      complianceStatus: body.complianceStatus,
      notes: body.notes,
      verifiedBy: body.verifiedBy,
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
    console.error("Error recording environmental metric:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to record environmental metric",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.environmental",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.environmental",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
