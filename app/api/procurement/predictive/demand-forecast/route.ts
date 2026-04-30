/**
 * Predictive Demand Forecast API
 * POST /api/procurement/predictive/demand-forecast
 */

import { NextRequest, NextResponse } from "next/server";
import { predictiveAnalyticsService } from "@/lib/services/procurement/predictiveAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { materialName, category, projectId, historicalPeriods } = body;
    const tenantId = context.tenantId;

    if (!materialName || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "Material name and category are required",
        },
        { status: 400 },
      );
    }
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const forecast = await predictiveAnalyticsService.forecastMaterialDemand(
      tenantId,
      materialName,
      category,
      projectId,
      historicalPeriods,
    );

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (error: any) {
    console.error("Error forecasting demand:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to forecast demand",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.predictive.demand-forecast",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
