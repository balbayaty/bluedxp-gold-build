/**
 * Human Feedback API Route
 * Submit and process human feedback for vision analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { humanInTheLoopService } from "@/lib/services/ai/vision/humanInTheLoopService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { logger } from "@/lib/services/observability/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const {
      requestId,
      analysisId,
      type = "approval",
      approved,
      corrections,
      comments,
      confidence,
      actionsTaken,
      followUpRequired,
      followUpNotes,
    } = body;

    const userId = request.headers.get("x-user-id") || auth.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 401 },
      );
    }

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: "Analysis ID is required" },
        { status: 400 },
      );
    }

    // Submit feedback
    const result = await humanInTheLoopService.submitFeedback({
      requestId: requestId || `request-${analysisId}`,
      analysisId,
      userId,
      type: type as any,
      approved: approved ?? true,
      corrections: corrections?.map((c: any) => ({
        field: c.field,
        originalValue: c.originalValue,
        correctedValue: c.correctedValue,
        reason: c.reason,
      })),
      comments,
      confidence,
      actionsTaken,
      followUpRequired,
      followUpNotes,
      metadata: {
        tenantId: request.headers.get("x-tenant-id") || undefined,
      },
    });

    logger.info("Human feedback submitted", undefined, {
      module: "ai-vision",
      service: "human-feedback-api",
      feedbackId: result.feedback.id,
      analysisId,
      approved: result.feedback.approved,
    });

    return NextResponse.json({
      success: true,
      feedback: result.feedback,
      learningImpact: result.learningImpact,
    });
  } catch (error) {
    logger.error(
      "Human feedback API error",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-vision",
        service: "human-feedback-api",
      },
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get("x-tenant-id") || undefined;
    const userId = request.headers.get("x-user-id") || auth.userId || undefined;

    // Get pending requests
    const pending = await humanInTheLoopService.getPendingRequests({
      tenantId,
      userId,
      type: searchParams.get("type") as any,
      priority: searchParams.get("priority") as any,
    });

    return NextResponse.json({
      success: true,
      pendingRequests: pending,
      count: pending.length,
    });
  } catch (error) {
    logger.error(
      "Human feedback GET error",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-vision",
        service: "human-feedback-api",
      },
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
