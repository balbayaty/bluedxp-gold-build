/**
 * Pulse Leaderboard API
 * GET /api/pulse/leaderboard - Get leaderboard
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { pulseScoreboardService } from "@/lib/services/pulse";
import type { ScopeType } from "@/types/pulse";

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
    const scope = (searchParams.get("scope") || "team") as ScopeType;
    const scopeId = searchParams.get("scopeId") || tenantId;
    const period = searchParams.get("period") || "week";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Calculate period
    const end = new Date();
    const start = new Date();
    if (period === "week") {
      start.setDate(start.getDate() - 7);
    } else if (period === "month") {
      start.setMonth(start.getMonth() - 1);
    } else {
      start.setDate(start.getDate() - 1); // today
    }

    const leaderboard = await pulseScoreboardService.getLeaderboard(
      scope,
      scopeId,
      tenantId,
      { start, end },
      limit,
    );

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get leaderboard" },
      { status: 500 },
    );
  }
}
