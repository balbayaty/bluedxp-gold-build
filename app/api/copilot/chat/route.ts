/**
 * Copilot Chat API
 * Handles copilot conversations with RAG, memory, and AI integration
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { enhancedCopilotService } from "@/lib/services/copilot/enhancedCopilotService";
import { copilotService } from "@/lib/services/copilot/copilotService";
import type { CopilotRequest } from "@/lib/services/copilot/copilotService";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { error: "User authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const copilotRequest: CopilotRequest = {
      conversationId: body.conversationId,
      message: body.message || "",
      context: body.context,
      options: body.options || {
        useRAG: true,
        useMemory: true,
        useTools: true,
      },
    };

    if (!copilotRequest.message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Process message with enhanced intelligence (function calling, multi-step reasoning, etc.)
    try {
      // Try enhanced service first for mind-blowing capabilities
      try {
        const response = await enhancedCopilotService.processMessage(
          context.tenantId,
          context.userId,
          copilotRequest,
        );
        return NextResponse.json(response, { status: 200 });
      } catch (enhancedError: any) {
        // If enhanced service fails, fall back to regular service
        console.warn(
          "[Copilot API] Enhanced service failed, falling back to regular service:",
          enhancedError?.message,
        );
        console.warn(
          "[Copilot API] Enhanced error stack:",
          enhancedError?.stack,
        );

        // Fallback to regular copilot service
        const response = await copilotService.processMessage(
          context.tenantId,
          context.userId,
          copilotRequest,
        );
        return NextResponse.json(response, { status: 200 });
      }
    } catch (serviceError: any) {
      // Log the actual service error
      console.error("[Copilot API] Service error:", serviceError);
      console.error(
        "[Copilot API] Service error message:",
        serviceError?.message,
      );
      console.error("[Copilot API] Service error stack:", serviceError?.stack);

      // Return the actual error message to the client
      return NextResponse.json(
        {
          error: "Failed to process message",
          details:
            serviceError instanceof Error
              ? serviceError.message
              : "Unknown service error",
          message:
            serviceError instanceof Error
              ? serviceError.message
              : "Unknown error",
          stack:
            process.env.NODE_ENV === "development"
              ? serviceError?.stack
              : undefined,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("[Copilot API] FATAL ERROR:", error);
    console.error("[Copilot API] Error type:", error?.constructor?.name);
    console.error("[Copilot API] Error message:", error?.message);
    if (error.response) {
      console.error("[Copilot API] Response data:", error.response.data);
      console.error("[Copilot API] Response status:", error.response.status);
    }
    return NextResponse.json(
      {
        error: "Failed to process message",
        details: error instanceof Error ? error.message : "Unknown error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
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
