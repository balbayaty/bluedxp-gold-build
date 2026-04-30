/**
 * Pulse Weekly Snapshots Cron Job
 * Runs weekly on Sunday at 2 AM
 */

import { NextRequest, NextResponse } from "next/server";
import {
  calculateScoreSnapshotsJob,
  evaluateWeeklyBossBattlesJob,
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

    // Run both weekly jobs
    await Promise.all([
      evaluateWeeklyBossBattlesJob(),
      calculateScoreSnapshotsJob("weekly"),
    ]);

    return NextResponse.json({
      success: true,
      message: "Weekly snapshots and boss battles evaluated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pulse weekly snapshots cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate weekly snapshots",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
