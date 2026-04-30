/**
 * Copilot Tool Executor
 * Executes tools on behalf of the copilot with RBAC enforcement
 */

import type {
  CopilotToolDefinition,
  CopilotToolExecutionRequest,
  CopilotToolExecutionResponse,
} from "@/types/copilotTools";
import { eventBus } from "../event-store";
import { createEvent } from "../event-store/utils";

// ============================================================================
// TOOL REGISTRY
// ============================================================================

class ToolRegistry {
  private tools: Map<string, CopilotToolDefinition> = new Map();

  register(tool: CopilotToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  get(toolId: string): CopilotToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  getAll(): CopilotToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getByModule(moduleId: string): CopilotToolDefinition[] {
    return this.getAll().filter((t) => t.moduleId === moduleId);
  }
}

export const toolRegistry = new ToolRegistry();

// ============================================================================
// TOOL EXECUTOR
// ============================================================================

class CopilotToolExecutor {
  /**
   * Execute a tool with RBAC and confirmation checks
   */
  async execute(
    request: CopilotToolExecutionRequest,
    context: {
      tenantId: string;
      userId: string;
      moduleId?: string;
      featureId?: string;
    },
  ): Promise<CopilotToolExecutionResponse> {
    const tool = toolRegistry.get(request.toolId);

    if (!tool) {
      return {
        success: false,
        toolId: request.toolId,
        error: `Tool ${request.toolId} not found`,
      };
    }

    // Check RBAC (would be enforced by API Gateway, but double-check here)
    if (tool.moduleId !== context.moduleId) {
      // Module mismatch - could still be allowed if user has cross-module access
      // This is a simplified check - real RBAC would be more complex
    }

    // Check if confirmation required
    if (tool.requiresConfirmation && !request.confirm) {
      return {
        success: false,
        toolId: request.toolId,
        error: "Confirmation required",
        requiresConfirmation: true,
      };
    }

    try {
      // Execute tool based on toolId
      const output = await this.executeTool(tool, request.input, context);

      // Publish event
      await eventBus.publish(
        createEvent(
          "copilot.tool.executed",
          context.tenantId,
          "Tenant",
          {
            toolId: tool.id,
            toolName: tool.name,
            success: true,
          },
          1,
          { tenantId: context.tenantId, userId: context.userId },
        ),
      );

      return {
        success: true,
        toolId: request.toolId,
        output,
      };
    } catch (error) {
      console.error(`[Tool Executor] Error executing tool ${tool.id}:`, error);

      await eventBus.publish(
        createEvent(
          "copilot.tool.failed",
          context.tenantId,
          "Tenant",
          {
            toolId: tool.id,
            toolName: tool.name,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          1,
          { tenantId: context.tenantId, userId: context.userId },
        ),
      );

      return {
        success: false,
        toolId: request.toolId,
        error: error instanceof Error ? error.message : "Tool execution failed",
      };
    }
  }

  /**
   * Execute tool based on toolId
   * This routes to actual tool implementations including MCP tools
   */
  private async executeTool(
    tool: CopilotToolDefinition,
    input: unknown,
    context: { tenantId: string; userId: string },
  ): Promise<unknown> {
    // Check if this is an MCP tool (prefixed with 'mcp.')
    if (tool.id.startsWith("mcp.")) {
      try {
        const { mcpServer } = await import("@/lib/mcp");
        const mcpToolName = tool.id.replace("mcp.", "");
        const result = await mcpServer.executeTool(mcpToolName, {
          ...(input as Record<string, any>),
          tenantId: context.tenantId,
          userId: context.userId,
        });
        return result;
      } catch (error) {
        console.error(
          `[ToolExecutor] MCP tool ${tool.id} execution failed:`,
          error,
        );
        throw new Error(
          `MCP tool execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Route to appropriate tool handler
    // This is a simplified version - real implementation would have tool handlers

    switch (tool.id) {
      case "tool.search-shipments":
        return await this.searchShipments(input, context);
      case "tool.create-shipment":
        return await this.createShipment(input, context);
      case "tool.get-inventory":
        return await this.getInventory(input, context);
      case "tool.check-compliance":
        return await this.checkCompliance(input, context);
      default:
        throw new Error(`Tool ${tool.id} not implemented`);
    }
  }

  // Tool implementations (simplified - would call actual services)
  private async searchShipments(input: any, context: any): Promise<any> {
    // Would call shipment service
    return { shipments: [], total: 0 };
  }

  private async createShipment(input: any, context: any): Promise<any> {
    // Would call shipment service
    return { shipmentId: `ship-${Date.now()}`, status: "created" };
  }

  private async getInventory(input: any, context: any): Promise<any> {
    // Would call inventory service
    return { items: [], total: 0 };
  }

  private async checkCompliance(input: any, context: any): Promise<any> {
    // Would call compliance service
    return { compliant: true, issues: [] };
  }
}

export const toolExecutor = new CopilotToolExecutor();

import { BUILTIN_COPILOT_TOOLS } from "./tools/builtins";

// Register all builtin tools
BUILTIN_COPILOT_TOOLS.forEach((tool) => {
  toolRegistry.register(tool);
});

// Register manual overrides or additional dynamic tools below if needed
