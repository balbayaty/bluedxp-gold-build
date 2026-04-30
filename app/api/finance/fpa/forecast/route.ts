/**
 * Financial Forecast API
 * POST /api/finance/fpa/forecast
 */

import { NextRequest, NextResponse } from "next/server";
import { fpaService } from "@/lib/services/finance/fpaService";
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

    const forecast = await fpaService.generateForecast(tenantId, forecastData);

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (error: any) {
    console.error("Error generating forecast:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate forecast",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.fpa.forecast",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
