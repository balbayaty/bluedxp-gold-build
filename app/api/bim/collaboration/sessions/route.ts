/**
 * BIM Collaboration Sessions API
 * GET - Get collaboration sessions
 * POST - Create collaboration session
 */

import { NextRequest, NextResponse } from "next/server";
import { getBIMCollaborationService } from "@/lib/services/facility/bim/bimCollaborationService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modelId = searchParams.get("modelId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") as any;

    const collaborationService = getBIMCollaborationService();
    let sessions;

    if (modelId) {
      sessions = await collaborationService.getModelSessions(modelId);
    } else {
      // Get all sessions by getting sessions for each model (workaround)
      // In production, add getAllSessions() method to service
      const allSessions: any[] = [];
      // For now, return empty array if no modelId - service needs getAllSessions method
      sessions = allSessions;
    }

    // Filter by userId/status if provided
    if (userId || status) {
      sessions = sessions.filter((s: any) => {
        const matchesUserId =
          !userId || s.participants?.some((p: any) => p.userId === userId);
        const matchesStatus = !status || s.status === status;
        return matchesUserId && matchesStatus;
      });
    }

    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to get BIM collaboration sessions", err, {
      module: "bim",
      service: "collaboration",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "collaboration",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to get sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, hostId, hostName, session } = body;

    if (!modelId || !hostId || !hostName || !session) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: modelId, hostId, hostName, session",
        },
        { status: 400 },
      );
    }

    const collaborationService = getBIMCollaborationService();
    const newSession = await collaborationService.createSession(
      modelId,
      hostId,
      hostName,
      session,
    );

    return NextResponse.json(
      {
        success: true,
        data: newSession,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to create BIM collaboration session", err, {
      module: "bim",
      service: "collaboration",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "collaboration",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create session" },
      { status: 500 },
    );
  }
}
