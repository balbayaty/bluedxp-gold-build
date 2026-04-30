/**
 * Vision Learning Feedback API
 * Allows users to provide feedback to improve learning
 */

import { NextRequest, NextResponse } from "next/server";
import { selfLearningVisionService } from "@/lib/services/ai/vision/v2/selfLearningVisionService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const {
      patternId,
      photoId,
      damageRecordId,
      userCorrection,
      validated,
      validatedBy,
    } = body;

    if (!patternId || !photoId || !damageRecordId) {
      return NextResponse.json(
        { error: "patternId, photoId, and damageRecordId are required" },
        { status: 400 },
      );
    }

    const feedback = await selfLearningVisionService.processFeedback({
      id: `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      patternId,
      photoId,
      damageRecordId,
      userCorrection,
      validated: validated || false,
      validatedBy: validatedBy || auth.context!.userId,
      validatedAt: validated ? new Date().toISOString() : undefined,
      learningImpact: {
        patternConfidenceChange: validated ? 5 : -5,
        ruleUpdates: [],
        knowledgeBaseUpdates: [],
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      feedback,
      message: "Feedback processed successfully",
    });
  } catch (error) {
    console.error("Feedback processing error:", error);
    return NextResponse.json(
      {
        error: "Feedback processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
