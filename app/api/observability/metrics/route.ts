/**
 * Metrics API
 * GET /api/observability/metrics - Prometheus metrics endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { metricsService } from "@/lib/services/observability/metrics";

export async function GET(request: NextRequest) {
  try {
    const prometheusFormat = metricsService.exportPrometheusFormat();

    return new NextResponse(prometheusFormat, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4",
      },
    });
  } catch (error: any) {
    console.error("Error exporting metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to export metrics",
      },
      { status: 500 },
    );
  }
}
