/**
 * QR AI Agents API
 * Autonomous AI agents for QR management
 */

import { NextRequest, NextResponse } from "next/server";
import { qrAIAgentService } from "@/lib/services/qr/qrAIAgentService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "create-agent") {
      const agent = await qrAIAgentService.createAgent(data);
      return NextResponse.json({ success: true, agent });
    }

    if (action === "assign-task") {
      const task = await qrAIAgentService.assignTask(data);
      return NextResponse.json({ success: true, task });
    }

    if (action === "generate-insights") {
      const insights = await qrAIAgentService.generateAutonomousInsights(
        data.agentId,
        data.scope,
      );
      return NextResponse.json({ success: true, insights });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR agents API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (agentId) {
      // Get agent insights
      const insights =
        await qrAIAgentService.generateAutonomousInsights(agentId);
      return NextResponse.json({ success: true, insights });
    }

    return NextResponse.json(
      { success: false, error: "agentId required" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR agents API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get insights" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.agents",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.agents",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
