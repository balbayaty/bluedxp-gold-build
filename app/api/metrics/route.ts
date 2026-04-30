/**
 * Prometheus Metrics Endpoint
 * Exposes metrics in Prometheus format
 */

import { NextResponse } from "next/server";
import { metricsService } from "@/lib/services/observability/metrics";

export async function GET() {
  try {
    const metrics = await metricsService.exportPrometheusFormat();
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4",
      },
    });
  } catch (error) {
    console.error("Error exporting metrics:", error);
    return NextResponse.json(
      { error: "Failed to export metrics" },
      { status: 500 },
    );
  }
}
