/**
 * Predictive Price Forecast API
 * POST /api/procurement/predictive/price-forecast
 */

import { NextRequest, NextResponse } from "next/server";
import { predictiveAnalyticsService } from "@/lib/services/procurement/predictiveAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { itemName, category, currency, historicalPeriods } = body;

    if (!itemName || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "Item name and category are required",
        },
        { status: 400 },
      );
    }

    const forecast = await predictiveAnalyticsService.forecastPriceTrends(
      itemName,
      category,
      currency || "SAR",
      historicalPeriods,
    );

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (error: any) {
    console.error("Error forecasting price:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to forecast price",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.predictive.price-forecast",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
