/**
 * 🚀 USER ANALYTICS API
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { analyticsService } from "@/lib/services/user/analyticsService";

async function GET(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const { searchParams } = new URL(req.url);

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const startDate =
      searchParams.get("startDate") ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();

    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    const [activityStats, behaviorAnalysis] = await Promise.all([
      analyticsService.getUserActivityStats(userId, timeRange),
      analyticsService.analyzeUserBehavior(userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        activity: activityStats,
        behavior: behaviorAnalysis,
      },
    });
  } catch (error) {
    console.error("[Analytics API] Error getting user analytics:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 },
    );
  }
}

export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireAuth: true }),
  { requireAuth: true },
);

export { GETHandler as GET };
