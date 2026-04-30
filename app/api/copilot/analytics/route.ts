/**
 * Copilot Analytics API
 * Returns usage analytics for the copilot
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { copilotAnalytics } from "@/lib/services/copilot/analytics";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    const analytics = copilotAnalytics.getAnalytics(
      context.tenantId,
      context.userId,
    );

    if (!analytics) {
      return NextResponse.json(
        {
          analytics: {
            tenantId: context.tenantId,
            userId: context.userId,
            totalMessages: 0,
            totalConversations: 0,
            averageMessagesPerConversation: 0,
            averageResponseTime: 0,
            ragUsageCount: 0,
            memoryUsageCount: 0,
            toolUsageCount: 0,
            streamingUsageCount: 0,
            averageConfidence: 0,
            knowledgeRetrievalRate: 0,
            memoryHitRate: 0,
            dailyUsage: {},
            errorCount: 0,
            errorRate: 0,
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error("[Copilot Analytics API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get analytics",
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
