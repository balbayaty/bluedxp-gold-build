/**
 * Copilot Integration Test Suite
 * Tests all integration points across the platform
 */

import { copilotService } from "./copilotService";
import { toolExecutor, toolRegistry } from "./toolExecutor";
import { copilotAnalytics } from "./analytics";
import { knowledgeBaseService } from "../knowledge-base";
import { getAgentMemory } from "../agents/agentMemory";
import { eventBus } from "../event-store";

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

export async function testCopilotIntegration() {
  const results: Array<{
    test: string;
    status: "pass" | "fail";
    error?: string;
  }> = [];

  // Test 1: Service initialization
  try {
    if (!copilotService) throw new Error("Copilot service not initialized");
    results.push({ test: "Service Initialization", status: "pass" });
  } catch (error) {
    results.push({
      test: "Service Initialization",
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Knowledge Base Integration
  try {
    const testSearch = await knowledgeBaseService.semanticSearch("test", {
      limit: 1,
    });
    if (!Array.isArray(testSearch)) throw new Error("Invalid search result");
    results.push({ test: "Knowledge Base Integration", status: "pass" });
  } catch (error) {
    results.push({
      test: "Knowledge Base Integration",
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: Agent Memory Integration
  try {
    const agentMemory = getAgentMemory("copilot-agent");
    if (!agentMemory) throw new Error("Agent memory not available");
    results.push({ test: "Agent Memory Integration", status: "pass" });
  } catch (error) {
    results.push({
      test: "Agent Memory Integration",
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 4: Tool Registry
  try {
    const tools = toolRegistry.getAll();
    if (!Array.isArray(tools)) throw new Error("Invalid tools array");
    if (tools.length === 0) throw new Error("No tools registered");
    results.push({ test: "Tool Registry", status: "pass" });
  } catch (error) {
    results.push({
      test: "Tool Registry",
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 5: Analytics
  try {
    const analytics = copilotAnalytics.getAnalytics("test-tenant", "test-user");
    // Analytics might be null for new users, that's OK
    results.push({ test: "Analytics Service", status: "pass" });
  } catch (error) {
    results.push({
      test: "Analytics Service",
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 6: Event Bus
  try {
    // Just check if eventBus is available
    if (!eventBus) throw new Error("Event bus not available");
    results.push({ test: "Event Bus Integration", status: "pass" });
  } catch (error) {
    results.push({
      test: "Event Bus Integration",
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 7: Message Processing (with mock data)
  try {
    const response = await copilotService.processMessage(
      "test-tenant",
      "test-user",
      {
        message: "Test message",
        options: {
          useRAG: false,
          useMemory: false,
          useTools: false,
        },
      },
    );
    if (!response || !response.message) throw new Error("Invalid response");
    results.push({ test: "Message Processing", status: "pass" });
  } catch (error) {
    results.push({
      test: "Message Processing",
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return results;
}

// ============================================================================
// EXPORT
// ============================================================================

export default testCopilotIntegration;
