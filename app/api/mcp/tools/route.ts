/**
 * Enhanced MCP Tools API Route
 * Exposes MCP tools for execution via API
 * Supports: single execution, batch execution, streaming, analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { mcpServer, enhancedMCPServer } from "@/lib/mcp";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "execute";

    // List tools
    if (request.method === "GET") {
      // Analytics endpoint
      if (action === "analytics") {
        const toolName = url.searchParams.get("tool");

        if (toolName) {
          const analytics = enhancedMCPServer.getToolAnalytics(toolName);
          return NextResponse.json({ success: true, analytics });
        } else {
          const analytics = enhancedMCPServer.getAllToolsAnalytics();
          const stats = enhancedMCPServer.getServerStats();
          return NextResponse.json({ success: true, analytics, stats });
        }
      }

      // List tools with filtering
      const category = url.searchParams.get("category");
      const tags = url.searchParams.get("tags")?.split(",").filter(Boolean);
      const status = url.searchParams.get("status");
      const search = url.searchParams.get("search");

      const tools = enhancedMCPServer.listTools({
        category: category as any,
        tags,
        status: status as any,
        search,
      });

      return NextResponse.json({
        success: true,
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          metadata: {
            version: tool.metadata.version,
            category: tool.metadata.category,
            tags: tool.metadata.tags,
            status: tool.metadata.status,
            cacheable: tool.metadata.cacheable,
            streaming: tool.metadata.streaming,
            batchable: tool.metadata.batchable,
          },
        })),
        count: tools.length,
      });
    }

    // Execute tool
    if (request.method === "POST") {
      const body = await request.json();
      const { action: bodyAction, toolName, params, batch, stream } = body;
      const finalAction = bodyAction || action;

      // Batch execution
      if (finalAction === "batch" || batch) {
        const batchRequest = batch || { tools: [{ name: toolName, params }] };
        const result = await enhancedMCPServer.executeBatch(batchRequest, {
          tenantId: context.tenantId,
          userId: context.userId,
        });
        return NextResponse.json({ success: true, result });
      }

      // Streaming
      if (finalAction === "stream" || stream) {
        // Return SSE stream
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of enhancedMCPServer.streamTool(
                toolName,
                params,
                {
                  tenantId: context.tenantId,
                  userId: context.userId,
                },
              )) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
                );
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (error: any) {
              controller.enqueue(encoder.encode(`error: ${error.message}\n\n`));
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      // Single execution
      const result = await enhancedMCPServer.executeTool(toolName, params, {
        tenantId: context.tenantId,
        userId: context.userId,
      });

      return NextResponse.json({
        success: result.success,
        toolName,
        result: result.data,
        error: result.error,
        metadata: result.metadata,
        cached: result.cached,
        executionTime: result.executionTime,
      });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("[MCP Tools API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  feature: "mcp",
  action: "read",
  description: "List MCP tools",
});

export const POST = withAPIGateway(handler, {
  feature: "mcp",
  action: "execute",
  description: "Execute MCP tool",
});
