/**
 * Copilot Conversations API
 * Manage copilot conversations (list, get, delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { copilotService } from "@/lib/services/copilot/copilotService";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (request.method === "GET") {
      // List conversations
      const conversations = copilotService.listConversations(
        context.tenantId,
        context.userId,
      );
      return NextResponse.json({ conversations }, { status: 200 });
    }

    if (request.method === "DELETE") {
      // Delete conversation
      const { searchParams } = new URL(request.url);
      const conversationId = searchParams.get("id");

      if (!conversationId) {
        return NextResponse.json(
          { error: "Conversation ID required" },
          { status: 400 },
        );
      }

      const deleted = copilotService.deleteConversation(
        conversationId,
        context.tenantId,
      );
      if (deleted) {
        return NextResponse.json({ success: true }, { status: 200 });
      } else {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("[Copilot Conversations API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
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

export const DELETE = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "delete",
  requireAuth: true,
});
