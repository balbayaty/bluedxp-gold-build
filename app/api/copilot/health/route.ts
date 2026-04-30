/**
 * Copilot Health Check API
 * Returns the health status of all copilot services
 */

import { NextResponse } from "next/server";
import { toolRegistry } from "@/lib/services/copilot/toolExecutor";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { getAgentMemory } from "@/lib/services/agents/agentMemory";

export async function GET() {
  const health: Record<
    string,
    { status: "healthy" | "unhealthy"; details?: string }
  > = {};

  // Check tool registry
  try {
    const tools = toolRegistry.getAll();
    health.toolRegistry = {
      status: "healthy",
      details: `${tools.length} tools registered`,
    };
  } catch (error) {
    health.toolRegistry = {
      status: "unhealthy",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check knowledge base
  try {
    await knowledgeBaseService.semanticSearch("test", { limit: 1 });
    health.knowledgeBase = {
      status: "healthy",
      details: "Knowledge base accessible",
    };
  } catch (error) {
    health.knowledgeBase = {
      status: "unhealthy",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check agent memory
  try {
    const agentMemory = getAgentMemory("copilot-agent");
    health.agentMemory = {
      status: "healthy",
      details: "Agent memory accessible",
    };
  } catch (error) {
    health.agentMemory = {
      status: "unhealthy",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  const allHealthy = Object.values(health).every((h) => h.status === "healthy");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      services: health,
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 },
  );
}
