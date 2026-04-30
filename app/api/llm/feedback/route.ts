/**
 * LLM Feedback API
 * Submit feedback for LLM learning
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { llmMLModuleIntegration } from "@/lib/services/llm-provider/integration/mlModuleIntegration";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (request.method === "POST") {
      const body = await request.json();
      const {
        modelId,
        type,
        interactionId,
        comment,
        expectedOutput,
        actualOutput,
      } = body;

      if (!modelId) {
        return NextResponse.json(
          { error: "modelId is required" },
          { status: 400 },
        );
      }

      if (!type || !["positive", "negative", "neutral"].includes(type)) {
        return NextResponse.json(
          { error: "type must be positive, negative, or neutral" },
          { status: 400 },
        );
      }

      await llmMLModuleIntegration.submitLLMFeedback(modelId, {
        type,
        interactionId,
        comment,
        expectedOutput,
        actualOutput,
      });

      return NextResponse.json({
        success: true,
        message: "Feedback submitted successfully",
      });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("[LLM Feedback API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit feedback",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(handler, {
  feature: "llm",
  action: "create",
  description: "Submit LLM feedback for learning",
});
