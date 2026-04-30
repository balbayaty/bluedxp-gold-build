/**
 * LLM Retrain API
 * Start retraining from collected learning data
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
      const { modelId, baseModel } = body;

      if (!modelId) {
        return NextResponse.json(
          { error: "modelId is required" },
          { status: 400 },
        );
      }

      const trainingJob =
        await llmMLModuleIntegration.startRetrainingFromLearningData(
          modelId,
          baseModel || "llama2",
        );

      return NextResponse.json({
        success: true,
        trainingJob,
        message: "Retraining started from collected learning data",
      });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("[LLM Retrain API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to start retraining",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(handler, {
  feature: "llm",
  action: "execute",
  description: "Start retraining from learning data",
});
