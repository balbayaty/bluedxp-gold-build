/**
 * MCP Analytics Endpoint
 *
 * Provides comprehensive analytics for MCP tools
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { enhancedMCPServer } from "@/lib/mcp";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    const url = new URL(request.url);
    const toolName = url.searchParams.get("tool");
    const category = url.searchParams.get("category");
    const timeRange = url.searchParams.get("timeRange");

    if (toolName) {
      // Single tool analytics
      const analytics = enhancedMCPServer.getToolAnalytics(toolName);
      const tool = enhancedMCPServer.getTool(toolName);

      return NextResponse.json({
        success: true,
        tool: {
          name: toolName,
          metadata: tool?.metadata,
          analytics,
        },
      });
    }

    // All tools analytics
    const allAnalytics = enhancedMCPServer.getAllToolsAnalytics();
    const stats = enhancedMCPServer.getServerStats();

    // Filter by category if provided
    let filteredAnalytics = allAnalytics;
    if (category) {
      const tools = enhancedMCPServer.listTools({ category: category as any });
      filteredAnalytics = Object.fromEntries(
        Object.entries(allAnalytics).filter(([name]) =>
          tools.some((t) => t.name === name),
        ),
      );
    }

    // Calculate aggregate metrics
    const totalExecutions = Object.values(filteredAnalytics).reduce(
      (sum, a) => sum + a.executionCount,
      0,
    );
    const avgExecutionTime =
      Object.values(filteredAnalytics).reduce(
        (sum, a) => sum + a.averageExecutionTime,
        0,
      ) / Object.keys(filteredAnalytics).length || 0;

    const topTools = Object.entries(filteredAnalytics)
      .sort((a, b) => b[1].executionCount - a[1].executionCount)
      .slice(0, 10)
      .map(([name, analytics]) => ({ name, ...analytics }));

    const slowestTools = Object.entries(filteredAnalytics)
      .sort((a, b) => b[1].averageExecutionTime - a[1].averageExecutionTime)
      .slice(0, 10)
      .map(([name, analytics]) => ({ name, ...analytics }));

    return NextResponse.json({
      success: true,
      summary: {
        totalTools: Object.keys(filteredAnalytics).length,
        totalExecutions,
        averageExecutionTime: avgExecutionTime,
        toolsByCategory: stats.toolsByCategory,
        toolsByStatus: stats.toolsByStatus,
      },
      topTools,
      slowestTools,
      analytics: filteredAnalytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  feature: "mcp",
  action: "read",
  description: "MCP analytics",
});
