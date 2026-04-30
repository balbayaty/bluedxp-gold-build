/**
 * Demand Forecasting API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { demandForecastingService } from "@/lib/services/marketplace/demandForecastingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { category, period, lookAhead } = body;

    if (!category || !period) {
      return NextResponse.json(
        { error: "Category and period are required" },
        { status: 400 },
      );
    }

    const forecast = await demandForecastingService.forecastDemand({
      category,
      period,
      lookAhead: lookAhead || 12,
    });

    return NextResponse.json(forecast);
  } catch (error: any) {
    console.error("Demand forecasting error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to forecast demand" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.demand-forecasting",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
