/**
 * Data Mining API
 * Runs data mining analysis
 */

import { NextResponse } from "next/server";
import { unifiedIntelligenceService } from "@/lib/services/intelligence-analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenantId,
      moduleIds,
      timeRange,
      algorithms = ["pattern", "anomaly", "clustering"],
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 },
      );
    }

    const results = await unifiedIntelligenceService.runDataMining({
      tenantId,
      moduleIds,
      timeRange,
      algorithms,
    });

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error("Error running data mining:", error);
    return NextResponse.json(
      { error: "Failed to run data mining" },
      { status: 500 },
    );
  }
}
