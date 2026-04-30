/**
 * Learning & Feedback API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { learningFeedbackService } from "@/lib/services/marketplace/learningFeedbackService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const feedback = await learningFeedbackService.submitFeedback(body);
    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit feedback" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requirementId = searchParams.get("requirementId");

    if (!requirementId) {
      return NextResponse.json(
        { error: "Requirement ID is required" },
        { status: 400 },
      );
    }

    const insights = await learningFeedbackService.getInsights(requirementId);
    return NextResponse.json(insights);
  } catch (error: any) {
    console.error("Insights retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get insights" },
      { status: 500 },
    );
  }
}
