/**
 * Cash Forecast API
 * POST /api/finance/treasury/forecast
 */

import { NextRequest, NextResponse } from "next/server";
import { treasuryService } from "@/lib/services/finance/treasuryService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { forecastData } = body;

    if (!forecastData) {
      return NextResponse.json(
        {
          success: false,
          error: "Forecast data is required",
        },
        { status: 400 },
      );
    }

    const forecast = await treasuryService.createCashForecast(
      tenantId,
      forecastData,
    );

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (error: any) {
    console.error("Error creating cash forecast:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create cash forecast",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.treasury.forecast",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
