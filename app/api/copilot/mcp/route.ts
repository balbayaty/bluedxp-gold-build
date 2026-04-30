/**
 * MCP (Model Context Protocol) API
 * Endpoints for MCP tool management and execution
 * 4IR & 5IR Aligned • External Tool Access • Autonomous Capabilities
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { copilotMCP, type MCPToolType } from "@/lib/services/copilot/integrations/mcpIntegration";

interface ExecuteToolRequest {
  toolId: string;
  input: Record<string, any>;
  skipApproval?: boolean;
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as MCPToolType | null;
    const action = searchParams.get("action") || "list";

    switch (action) {
      case "list": {
        const tools = type 
          ? copilotMCP.getToolsByType(type)
          : copilotMCP.getTools();
        
        return NextResponse.json({
          success: true,
          tools: tools.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            type: t.type,
            capabilities: t.capabilities,
            requiresApproval: t.requiresApproval,
            riskLevel: t.riskLevel,
            inputSchema: t.inputSchema,
          })),
          count: tools.length,
        });
      }

      case "servers": {
        const servers = copilotMCP.getServers();
        return NextResponse.json({
          success: true,
          servers,
        });
      }

      case "history": {
        const history = copilotMCP.getExecutionHistory(context.tenantId);
        return NextResponse.json({
          success: true,
          executions: history,
          count: history.length,
        });
      }

      case "types": {
        return NextResponse.json({
          success: true,
          types: [
            { type: "browser", description: "Browser automation tools" },
            { type: "database", description: "Database query tools" },
            { type: "api", description: "External API tools" },
            { type: "file_system", description: "File system access" },
            { type: "screen", description: "Screen control tools" },
            { type: "notifications", description: "Notification tools" },
            { type: "terminal", description: "Terminal/shell tools" },
            { type: "clipboard", description: "Clipboard access" },
          ],
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[MCP API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error?.message },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { error: "User authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({})) as Partial<ExecuteToolRequest>;

    if (!body.toolId) {
      return NextResponse.json(
        { error: "toolId is required" },
        { status: 400 }
      );
    }

    // Execute the tool
    const execution = await copilotMCP.executeTool(
      body.toolId,
      body.input || {},
      {
        tenantId: context.tenantId,
        userId: context.userId,
        skipApproval: body.skipApproval,
      }
    );

    return NextResponse.json({
      success: execution.status === "completed",
      execution: {
        id: execution.id,
        toolId: execution.toolId,
        status: execution.status,
        output: execution.output,
        error: execution.error,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
      },
    });
  } catch (error: any) {
    console.error("[MCP API] Error executing tool:", error);
    return NextResponse.json(
      { error: "Failed to execute tool", details: error?.message },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
