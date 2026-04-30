/**
 * Pulse Overview API
 * GET /api/pulse/overview - Get user's pulse overview
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import {
  pulseLedgerService,
  pulseMissionService,
  pulseScoringService,
} from "@/lib/services/pulse";
import type { PulseOverview } from "@/types/pulse";

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

    // Get balance
    const balance = await pulseLedgerService.getBalance(userId, tenantId);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's missions
    const missions = await pulseMissionService.generateDailyMissions(
      userId,
      tenantId,
      today,
    );

    // Get today's progress
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayEvents = await pulseLedgerService.getEventHistory(
      userId,
      tenantId,
      {
        start: todayStart,
        end: todayEnd,
      },
    );

    const completedMissions = missions.filter((m) => {
      // Check if mission is completed (stub - should check progress)
      return false;
    });

    const pointsEarned = todayEvents.reduce(
      (sum, e) => sum + e.pointsAwardedPP,
      0,
    );
    const creditsEarned = todayEvents.reduce(
      (sum, e) => sum + e.creditsAwardedIC,
      0,
    );

    // Get pillar scores for today
    const pillarScores = await pulseScoringService.calculatePillarScores(
      userId,
      tenantId,
      {
        start: todayStart,
        end: todayEnd,
      },
    );

    const overview: PulseOverview = {
      balance,
      todayProgress: {
        missions: missions.length,
        completed: completedMissions.length,
        pointsEarned,
        creditsEarned,
      },
      activeMissions: missions,
      recentEvents: todayEvents.slice(0, 10),
      pillarScores,
    };

    return NextResponse.json({ success: true, data: overview });
  } catch (error) {
    console.error("Pulse overview error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get pulse overview",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    );
  }
}
