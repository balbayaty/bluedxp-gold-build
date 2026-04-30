/**
 * Copilot Integrations Index
 * Exports all integration services for the copilot
 * 4IR & 5IR Aligned • Full Platform Integration
 */

// ML Registry Integration
export { copilotMLRegistry } from "./mlRegistryIntegration";
export type {
  CopilotPrediction,
  CopilotRecommendation,
} from "./mlRegistryIntegration";

// Real-Time Data Service
export { copilotRealtimeData } from "./realtimeDataService";
export type {
  RealtimeDataType,
  RealtimeDataPoint,
  RealtimeSubscription,
  PlatformSnapshot,
} from "./realtimeDataService";

// MCP Integration
export { copilotMCP } from "./mcpIntegration";
export type {
  MCPToolType,
  MCPTool,
  MCPToolExecution,
  MCPServerConnection,
} from "./mcpIntegration";

// Autonomous Agent Service
export { autonomousAgent } from "./autonomousAgentService";
export type {
  AgentMode,
  WorkflowStatus,
  AgentWorkflow,
  AgentStep,
  StepResult,
  WorkflowLearning,
  AgentCapability,
} from "./autonomousAgentService";

/**
 * Initialize all integrations
 */
export async function initializeCopilotIntegrations(): Promise<void> {
  const { copilotRealtimeData } = await import("./realtimeDataService");
  const { copilotMLRegistry } = await import("./mlRegistryIntegration");

  console.log("[CopilotIntegrations] 🚀 Initializing integrations...");

  try {
    // Initialize real-time data service
    await copilotRealtimeData.initialize();

    // Register copilot ML models
    await copilotMLRegistry.registerCopilotModels();

    console.log("[CopilotIntegrations] ✅ All integrations initialized");
  } catch (error) {
    console.error("[CopilotIntegrations] ❌ Failed to initialize:", error);
  }
}
