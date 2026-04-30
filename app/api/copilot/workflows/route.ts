import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { listCopilotWorkflows } from "@/lib/services/copilot/workflows/workflowRegistry";

async function handler(_request: NextRequest, _context: APIRequestContext) {
  // Simple list endpoint for UI discovery (tools remain governed server-side).
  const workflows = listCopilotWorkflows().map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    moduleId: w.moduleId,
    steps: w.steps,
  }));
  return NextResponse.json({ workflows });
}

export const GET = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.intelligent_orchestration",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
