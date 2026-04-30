/**
 * MCP Health Check Endpoint
 *
 * Provides health status for MCP server and tools
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { enhancedMCPServer } from "@/lib/mcp";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    const stats = enhancedMCPServer.getServerStats();
    const tools = enhancedMCPServer.listTools();

    // Check tool health
    const toolHealth: Record<string, boolean> = {};
    for (const tool of tools) {
      if (tool.metadata.healthCheck) {
        try {
          toolHealth[tool.name] = await tool.metadata.healthCheck();
        } catch {
          toolHealth[tool.name] = false;
        }
      } else {
        toolHealth[tool.name] = true; // Assume healthy if no health check
      }
    }

    const healthyTools = Object.values(toolHealth).filter((h) => h).length;
    const totalTools = Object.keys(toolHealth).length;
    const healthScore =
      totalTools > 0 ? (healthyTools / totalTools) * 100 : 100;

    return NextResponse.json({
      status:
        healthScore >= 80
          ? "healthy"
          : healthScore >= 50
            ? "degraded"
            : "unhealthy",
      healthScore,
      stats: {
        ...stats,
        healthyTools,
        totalTools,
      },
      toolHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  feature: "mcp",
  action: "read",
  description: "MCP health check",
});
