/**
 * Copilot Tools API
 * Lists available Copilot tools (capabilities) for the platform.
 *
 * Note: This is NOT execution; execution is handled by /api/copilot/tools/execute
 * with additional permission checks.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { copilotToolExecutionService } from "@/lib/services/copilot/tools/toolExecutionService";

async function handler(_req: NextRequest, ctx: APIRequestContext) {
  if (!ctx.tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );
  // Listing tools is safe; tool execution is separately protected.
  return NextResponse.json({ tools: copilotToolExecutionService.listTools() });
}

export const GET = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.intelligent_orchestration",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
