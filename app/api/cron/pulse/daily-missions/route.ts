/**
 * Pulse Daily Missions Cron Job
 * Runs daily at midnight to generate missions for all users
 * Configure in vercel.json or external cron service
 */

import { NextRequest, NextResponse } from "next/server";
import { generateDailyMissionsJob } from "@/lib/services/pulse/pulseJobs";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if using Vercel Cron)
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await generateDailyMissionsJob();

    return NextResponse.json({
      success: true,
      message: "Daily missions generated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pulse daily missions cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate daily missions",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
