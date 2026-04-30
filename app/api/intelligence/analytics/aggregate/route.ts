/**
 * Analytics Aggregation API
 * Aggregates analytics from all modules
 */

import { NextResponse } from "next/server";
import { unifiedIntelligenceService } from "@/lib/services/intelligence-analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, moduleIds, timeRange } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 },
      );
    }

    const analytics = await unifiedIntelligenceService.aggregateAnalytics({
      tenantId,
      moduleIds,
      timeRange,
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error aggregating analytics:", error);
    return NextResponse.json(
      { error: "Failed to aggregate analytics" },
      { status: 500 },
    );
  }
}
