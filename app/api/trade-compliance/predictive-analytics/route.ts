/**
 * Predictive Analytics API Route
 * Provides forecasting, risk prediction, and optimization recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { predictiveAnalyticsService } from "@/lib/services/trade-compliance/predictiveAnalyticsService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = (searchParams.get("timeframe") || "30D") as
      | "7D"
      | "30D"
      | "90D"
      | "1Y";
    const optimizationType = (searchParams.get("optimizationType") ||
      "cost") as "cost" | "time" | "risk" | "efficiency";

    // Fetch records for analysis
    const recordsRes = await fetch(
      `${request.nextUrl.origin}/api/trade-compliance/records`,
    );
    const recordsData = await recordsRes.json();
    const records = recordsData.success ? recordsData.records || [] : [];

    // Generate historical data
    const historicalData = records.map((r: any, idx: number) => ({
      date: new Date(Date.now() - (records.length - idx) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      recordCount: 1,
      avgComplianceScore: r.complianceScore || 75,
      totalCosts: r.totalValue || 0,
    }));

    // Generate forecasts
    const forecasts = await predictiveAnalyticsService.forecastMetrics(
      historicalData,
      timeframe,
    );

    // Generate risk predictions
    const riskPredictions =
      await predictiveAnalyticsService.predictRisks(records);

    // Generate optimizations
    const optimizations = await predictiveAnalyticsService.optimize(
      records,
      optimizationType,
    );

    return NextResponse.json({
      success: true,
      data: {
        forecasts,
        riskPredictions,
        optimizations,
      },
    });
  } catch (error) {
    console.error("Error generating predictive analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate analytics",
      },
      { status: 500 },
    );
  }
}
