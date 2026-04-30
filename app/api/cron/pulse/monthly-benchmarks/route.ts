/**
 * Pulse Monthly Benchmarks Cron Job
 * Runs monthly on 1st at 3-4 AM
 */

import { NextRequest, NextResponse } from "next/server";
import {
  aggregateBenchmarkMetricsJob,
  submitTenantBenchmarkMetricsJob,
} from "@/lib/services/pulse/pulseJobs";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run both monthly jobs
    await Promise.all([
      aggregateBenchmarkMetricsJob(),
      submitTenantBenchmarkMetricsJob(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Monthly benchmarks aggregated and submitted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pulse monthly benchmarks cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process monthly benchmarks",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
