/**
 * Pulse Benchmark Percentiles API
 * GET /api/pulse/benchmark/percentiles - Get benchmark percentiles
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { pulseBenchmarkService } from "@/lib/services/pulse";

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { tenantId } = auth.context;
    const searchParams = request.nextUrl.searchParams;
    const metricKey = searchParams.get("metricKey");
    const benchmarkGroup =
      searchParams.get("group") || "industry=logistics,region=GCC,size=ENT";

    if (!metricKey) {
      return NextResponse.json(
        { success: false, error: "metricKey is required" },
        { status: 400 },
      );
    }

    const percentile = await pulseBenchmarkService.getPercentiles(
      tenantId,
      metricKey,
      benchmarkGroup,
    );

    return NextResponse.json({ success: true, data: percentile });
  } catch (error: any) {
    console.error("Get percentiles error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get percentiles" },
      { status: 500 },
    );
  }
}
