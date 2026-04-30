/**
 * Copilot Feedback API
 * Endpoint for submitting user feedback on copilot interactions
 * This data is used for ML training and continuous improvement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { copilotMLFeedback, type FeedbackType, type FeedbackReason } from "@/lib/services/copilot/mlFeedbackService";

interface FeedbackRequest {
  conversationId: string;
  messageId: string;
  type: FeedbackType;
  rating?: number;
  reason?: FeedbackReason;
  comment?: string;
  userQuery: string;
  assistantResponse: string;
  toolsUsed?: string[];
  knowledgeUsed?: string[];
  confidence: number;
  responseTime: number;
  moduleId?: string;
  pathname?: string;
}

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { error: "User authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({})) as Partial<FeedbackRequest>;

    // Validate required fields
    if (!body.conversationId || !body.messageId || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: conversationId, messageId, type" },
        { status: 400 }
      );
    }

    if (!["positive", "negative", "neutral"].includes(body.type)) {
      return NextResponse.json(
        { error: "Invalid feedback type. Must be: positive, negative, or neutral" },
        { status: 400 }
      );
    }

    // Submit feedback
    const feedback = await copilotMLFeedback.submitFeedback({
      tenantId: context.tenantId,
      userId: context.userId,
      conversationId: body.conversationId,
      messageId: body.messageId,
      type: body.type,
      rating: body.rating,
      reason: body.reason,
      comment: body.comment,
      userQuery: body.userQuery || "",
      assistantResponse: body.assistantResponse || "",
      toolsUsed: body.toolsUsed,
      knowledgeUsed: body.knowledgeUsed,
      confidence: body.confidence || 0.5,
      responseTime: body.responseTime || 0,
      moduleId: body.moduleId,
      pathname: body.pathname,
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: "Thank you for your feedback! This helps us improve.",
    });
  } catch (error: any) {
    console.error("[Copilot Feedback API] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback", details: error?.message },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving feedback stats
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const stats = copilotMLFeedback.getStats(context.tenantId);
    const patterns = copilotMLFeedback.getPatterns(context.tenantId);

    return NextResponse.json({
      success: true,
      stats,
      patterns: patterns.slice(0, 10), // Top 10 patterns
      learningStatus: {
        isLearning: stats.totalFeedback >= 10,
        samplesCollected: stats.totalFeedback,
        samplesNeeded: Math.max(0, 10 - stats.totalFeedback),
        patternsIdentified: patterns.length,
      },
    });
  } catch (error: any) {
    console.error("[Copilot Feedback API] Error:", error);
    return NextResponse.json(
      { error: "Failed to get feedback stats", details: error?.message },
      { status: 500 }
    );
  }
}

export const POST = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
