/**
 * Pulse Daily Snapshots Cron Job
 * Runs daily at 1 AM to calculate score snapshots
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateScoreSnapshotsJob } from "@/lib/services/pulse/pulseJobs";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await calculateScoreSnapshotsJob("daily");

    return NextResponse.json({
      success: true,
      message: "Daily snapshots calculated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pulse daily snapshots cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate daily snapshots",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
