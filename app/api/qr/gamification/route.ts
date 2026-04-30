/**
 * QR Gamification API
 * Achievements, leaderboards, challenges
 */

import { NextRequest, NextResponse } from "next/server";
import { qrGamificationService } from "@/lib/services/qr/qrGamificationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "check-achievements") {
      const achievements = await qrGamificationService.checkAchievements(
        data.userId,
        data.action,
      );
      return NextResponse.json({ success: true, achievements });
    }

    if (action === "create-challenge") {
      const challenge = await qrGamificationService.createChallenge(data);
      return NextResponse.json({ success: true, challenge });
    }

    if (action === "join-challenge") {
      await qrGamificationService.joinChallenge(data.challengeId, data.userId);
      return NextResponse.json({ success: true, message: "Joined challenge" });
    }

    if (action === "complete-challenge") {
      await qrGamificationService.completeChallenge(
        data.challengeId,
        data.userId,
        data.score,
      );
      return NextResponse.json({
        success: true,
        message: "Challenge completed",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR gamification API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const leaderboardId = searchParams.get("leaderboardId");
    const userId = searchParams.get("userId");

    if (leaderboardId) {
      const leaderboard =
        await qrGamificationService.updateLeaderboard(leaderboardId);
      return NextResponse.json({ success: true, leaderboard });
    }

    if (userId) {
      // Get user progress
      return NextResponse.json({
        success: true,
        progress: null, // In production, query database
      });
    }

    return NextResponse.json(
      { success: false, error: "leaderboardId or userId required" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR gamification API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get data" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.gamification",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.gamification",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
