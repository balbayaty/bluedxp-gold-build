/**
 * Agent Task Execution API
 * Execute tasks using AI agents
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { agentOrchestrator } from "@/lib/services/agents";
import type { TaskRequest } from "@/lib/services/agents/agentOrchestrator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      agentId,
      description,
      input,
      requiredCapabilities,
      priority = "medium",
    } = body;

    if (!description && !input?.userMessage) {
      return NextResponse.json(
        {
          success: false,
          error: "Description or input.userMessage is required",
        },
        { status: 400 },
      );
    }

    const taskRequest: TaskRequest = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: body.type || "general",
      description: description || input?.userMessage || "",
      input: input || { userMessage: description },
      context: {
        tenantId: auth.context.tenantId,
        userId: auth.context.userId,
        ...body.context,
      },
      requiredCapabilities,
      preferredAgent: agentId,
      priority: priority as "low" | "medium" | "high" | "urgent",
      timeout: body.timeout || 300000, // 5 minutes default
      tenantId: auth.context.tenantId,
      userId: auth.context.userId,
      correlationId: body.correlationId,
    };

    const result = await agentOrchestrator.routeTask(taskRequest);

    return NextResponse.json({
      success: result.status !== "failure",
      result,
    });
  } catch (error: any) {
    console.error("[Agent Execute API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute agent task",
      },
      { status: 500 },
    );
  }
}
