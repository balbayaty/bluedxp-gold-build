/**
 * HazalyzeCopilot Service
 * Main export for copilot functionality
 * 
 * Includes:
 * - Core copilot service (basic & enhanced)
 * - ML Feedback service for continuous learning
 * - Analytics tracking
 * - Streaming support
 * - Full platform integrations (ML Registry, MCP, WebSocket, Autonomous Agents)
 */

// Core Services
export { copilotService, default } from "./copilotService";
export { enhancedCopilotService } from "./enhancedCopilotService";

// History Service
export { copilotHistoryService } from "./historyService";

// ML & Analytics
export { copilotMLFeedback } from "./mlFeedbackService";
export { copilotAnalytics } from "./analytics";

// Streaming
export { streamCopilotResponse } from "./streamingService";

// Integrations
export {
  copilotMLRegistry,
  copilotRealtimeData,
  copilotMCP,
  autonomousAgent,
  initializeCopilotIntegrations,
} from "./integrations";

// Types - Core
export type {
  CopilotMessage,
  CopilotConversation,
  CopilotRequest,
  CopilotResponse,
  ToolCall,
  ToolResult,
} from "./copilotService";

export type {
  EnhancedCopilotResponse,
  ReasoningStep,
  ConfidenceBreakdown,
  ProactiveInsight,
  Optimization,
} from "./enhancedCopilotService";

export type {
  CopilotFeedback,
  FeedbackType,
  FeedbackReason,
  LearningPattern,
  MLTrainingData,
  FeedbackStats,
} from "./mlFeedbackService";

export type {
  StreamingChunk,
} from "./streamingService";

// Types - Integrations
export type {
  CopilotPrediction,
  CopilotRecommendation,
} from "./integrations/mlRegistryIntegration";

export type {
  RealtimeDataType,
  RealtimeDataPoint,
  RealtimeSubscription,
  PlatformSnapshot,
} from "./integrations/realtimeDataService";

export type {
  MCPToolType,
  MCPTool,
  MCPToolExecution,
  MCPServerConnection,
} from "./integrations/mcpIntegration";

export type {
  AgentMode,
  WorkflowStatus,
  AgentWorkflow,
  AgentStep,
  StepResult,
  WorkflowLearning,
  AgentCapability,
} from "./integrations/autonomousAgentService";
