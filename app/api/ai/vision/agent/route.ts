/**
 * Vision Agent API Route
 * Intelligent agent-based vision analysis with self-learning
 */

import { NextRequest, NextResponse } from "next/server";
import { visionAgentIntegration } from "@/lib/services/ai/vision/visionAgentIntegration";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { logger } from "@/lib/services/observability/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const {
      type,
      priority = "medium",
      imageFile,
      analysisId,
      feedbackId,
      context,
      module,
    } = body;

    const tenantId = request.headers.get("x-tenant-id") || undefined;
    const userId = request.headers.get("x-user-id") || auth.userId || undefined;

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Task type is required" },
        { status: 400 },
      );
    }

    // Create task
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: type as any,
      priority: priority as any,
      input: {
        imageFile,
        analysisId,
        feedbackId,
        context,
        module,
        tenantId,
        userId,
      },
    };

    // Process with agents
    const result = await visionAgentIntegration.processWithAgents(task);

    logger.info("Vision agent task completed", undefined, {
      module: "ai-vision",
      service: "vision-agent-api",
      taskId: task.id,
      status: result.status,
      confidence: result.confidence,
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      result,
    });
  } catch (error) {
    logger.error(
      "Vision agent API error",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-vision",
        service: "vision-agent-api",
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
