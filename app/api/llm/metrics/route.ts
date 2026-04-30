/**
 * LLM Metrics API
 * Provides visibility into LLM learning progress and performance
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

    if (request.method === "GET") {
      const modelId = request.nextUrl.searchParams.get("modelId");
      const type = request.nextUrl.searchParams.get("type") || "metrics";

      if (modelId) {
        // Get specific model metrics or progress
        if (type === "progress") {
          const progress =
            await llmMLModuleIntegration.getLearningProgress(modelId);
          return NextResponse.json({ success: true, progress });
        } else {
          const metrics = await llmMLModuleIntegration.getModelMetrics(modelId);
          return NextResponse.json({ success: true, metrics });
        }
      } else {
        // Get all LLM models
        const allModels = await llmMLModuleIntegration.getAllLLMModels();
        return NextResponse.json({
          success: true,
          models: allModels,
          count: allModels.length,
        });
      }
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("[LLM Metrics API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get metrics",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  feature: "llm",
  action: "read",
  description: "Get LLM metrics and learning progress",
});
