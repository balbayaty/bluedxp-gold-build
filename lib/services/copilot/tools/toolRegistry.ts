import type {
  CopilotToolDefinition,
  CopilotToolId,
} from "@/types/copilotTools";

export class CopilotToolRegistry {
  private tools = new Map<CopilotToolId, CopilotToolDefinition>();

  register(tool: CopilotToolDefinition) {
    this.tools.set(tool.id, tool);
  }

  get(toolId: CopilotToolId): CopilotToolDefinition {
    const t = this.tools.get(toolId);
    if (!t) throw new Error(`Copilot tool not found: ${toolId}`);
    return t;
  }

  list(): CopilotToolDefinition[] {
    return Array.from(this.tools.values()).sort((a, b) =>
      a.id.localeCompare(b.id),
    );
  }
}

export const copilotToolRegistry = new CopilotToolRegistry();
