/**
 * Copilot Tools List API
 * Lists available tools for the copilot
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { toolRegistry } from "@/lib/services/copilot/toolExecutor";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    // Get all tools (could filter by user permissions)
    const tools = toolRegistry.getAll();

    return NextResponse.json({ tools }, { status: 200 });
  } catch (error) {
    console.error("[Copilot Tools List API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to list tools",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "read",
  requireAuth: true,
});
