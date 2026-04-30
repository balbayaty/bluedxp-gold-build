/**
 * BIM Collaboration Session Detail API
 * GET - Get session by ID
 * PATCH - Update session
 * POST - Join/Leave session, Add annotation, Create issue
 */

import { NextRequest, NextResponse } from "next/server";
import { getBIMCollaborationService } from "@/lib/services/facility/bim/bimCollaborationService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 },
      );
    }

    const collaborationService = getBIMCollaborationService();
    const session = await collaborationService.getSession(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to get BIM collaboration session", err, {
      module: "bim",
      service: "collaboration",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "collaboration",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to get session" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, ...data } = body;

    const collaborationService = getBIMCollaborationService();

    if (action === "join") {
      const { userId, userName } = data;
      await collaborationService.joinSession(id, userId, userName);
      return NextResponse.json({ success: true });
    }

    if (action === "leave") {
      const { userId } = data;
      await collaborationService.leaveSession(id, userId);
      return NextResponse.json({ success: true });
    }

    if (action === "update-view") {
      const { userId, viewState } = data;
      await collaborationService.updateParticipantView(id, userId, viewState);
      return NextResponse.json({ success: true });
    }

    if (action === "end") {
      await collaborationService.endSession(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to update BIM collaboration session", err, {
      module: "bim",
      service: "collaboration",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "collaboration",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update session" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, ...data } = body;

    const collaborationService = getBIMCollaborationService();

    if (action === "add-annotation") {
      const { userId, userName, annotation } = data;
      const newAnnotation = await collaborationService.addAnnotation(
        id,
        userId,
        userName,
        annotation,
      );
      return NextResponse.json(
        { success: true, data: newAnnotation },
        { status: 201 },
      );
    }

    if (action === "create-issue") {
      const { userId, issue } = data;
      if (!issue?.modelId) {
        return NextResponse.json(
          { success: false, error: "issue.modelId is required" },
          { status: 400 },
        );
      }
      const newIssue = await collaborationService.createIssue(
        id,
        issue.modelId,
        userId,
        issue,
      );
      return NextResponse.json(
        { success: true, data: newIssue },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to perform action on BIM collaboration session", err, {
      module: "bim",
      service: "collaboration",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "collaboration",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to perform action" },
      { status: 500 },
    );
  }
}
