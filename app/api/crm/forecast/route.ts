/**
 * CRM Sales Forecast API
 * GET /api/crm/forecast - Get sales forecast
 */

import { NextRequest, NextResponse } from "next/server";
import { salesForecastService } from "@/lib/services/crm/salesForecastService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const startDate =
      searchParams.get("startDate") ||
      new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();
    const forecastType = (searchParams.get("forecastType") ||
      "PIPELINE") as any;

    const forecast = await salesForecastService.generateForecast({
      tenantId,
      period: { startDate, endDate },
      forecastType,
    });

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
