/**
 * Pulse Missions API
 * GET /api/pulse/missions - Get missions
 * POST /api/pulse/missions/:id/claim - Claim mission
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { pulseMissionService } from "@/lib/services/pulse";

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { userId, tenantId } = auth.context;
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "today";

    let date = new Date();
    if (period === "week") {
      date = new Date();
      date.setDate(date.getDate() - date.getDay()); // Start of week
    }

    const missions = await pulseMissionService.generateDailyMissions(
      userId,
      tenantId,
      date,
    );

    return NextResponse.json({ success: true, data: missions });
  } catch (error) {
    console.error("Get missions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get missions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { userId, tenantId } = auth.context;
    const body = await request.json();
    const { missionId } = body;

    if (!missionId) {
      return NextResponse.json(
        { success: false, error: "missionId is required" },
        { status: 400 },
      );
    }

    const progress = await pulseMissionService.claimMission(
      missionId,
      userId,
      tenantId,
    );

    return NextResponse.json({ success: true, data: progress });
  } catch (error: any) {
    console.error("Claim mission error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to claim mission" },
      { status: 500 },
    );
  }
}
