/**
 * Copilot Tool Execution API
 * Executes tools on behalf of the copilot
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { toolExecutor } from "@/lib/services/copilot/toolExecutor";
import type { CopilotToolExecutionRequest } from "@/types/copilotTools";

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
    const toolRequest: CopilotToolExecutionRequest = {
      toolId: body.toolId,
      input: body.input,
      confirm: body.confirm,
    };

    if (!toolRequest.toolId) {
      return NextResponse.json(
        { error: "Tool ID is required" },
        { status: 400 },
      );
    }

    // Execute tool
    const result = await toolExecutor.execute(toolRequest, {
      tenantId: context.tenantId,
      userId: context.userId,
      moduleId: context.moduleId,
      featureId: context.featureId,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("[Copilot Tools API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute tool",
        details: error instanceof Error ? error.message : "Unknown error",
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
