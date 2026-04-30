/**
 * Enhanced HazalyzeCopilot Service
 * Mind-blowing intelligence with proper function calling, multi-step reasoning,
 * explainable AI, and proactive capabilities
 * 4IR & 5IR aligned - Human-centric AI collaboration
 */

import { knowledgeBaseService } from "../knowledge-base";
import { getAgentMemory } from "../agents/agentMemory";
import { agentOrchestrator } from "../agents/agentOrchestrator";
import { eventBus } from "../event-store";
import { createEvent } from "../event-store/utils";
import { toolRegistry } from "./toolExecutor";
import { copilotToolExecutionService } from "./tools/toolExecutionService";
import { copilotToolRegistry } from "./tools/toolRegistry";
import type { CopilotToolId } from "@/types/copilotTools";
import { copilotAnalytics } from "./analytics";
import { copilotMLFeedback } from "./mlFeedbackService";
import { retryWithBackoff } from "./retryLogic";

// Integration imports
import { copilotMLRegistry } from "./integrations/mlRegistryIntegration";
import { copilotRealtimeData } from "./integrations/realtimeDataService";
import { copilotMCP } from "./integrations/mcpIntegration";
import { autonomousAgent } from "./integrations/autonomousAgentService";
import type {
  KnowledgeEntry,
  SearchResult,
  KnowledgeCategory,
} from "@/types/knowledgeBase";
import type {
  AgentMemory,
  ConversationContext,
  MemoryEntry,
} from "../agents/agentMemory";
import type { TaskRequest, TaskResult } from "../agents/agentOrchestrator";
import type { CopilotToolDefinition } from "@/types/copilotTools";
import type {
  CopilotMessage,
  CopilotRequest,
  CopilotResponse,
  CopilotConversation,
  ToolCall,
  ToolResult,
} from "./copilotService";

// ============================================================================
// ENHANCED TYPES
// ============================================================================

export interface EnhancedCopilotResponse extends CopilotResponse {
  reasoning?: {
    steps: ReasoningStep[];
    confidenceBreakdown: ConfidenceBreakdown;
    decisionPath: string[];
  };
  proactiveInsights?: ProactiveInsight[];
  suggestedOptimizations?: Optimization[];
  realTimeData?: Record<string, any>;
}

export interface ReasoningStep {
  step: number;
  action: string;
  reasoning: string;
  result?: any;
  confidence: number;
}

export interface ConfidenceBreakdown {
  overall: number;
  knowledgeBase: number;
  memory: number;
  toolExecution: number;
  contextRelevance: number;
  reasoning: string;
}

export interface ProactiveInsight {
  type: "optimization" | "risk" | "opportunity" | "recommendation";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionable: boolean;
  action?: string;
}

export interface Optimization {
  area: string;
  current: string;
  suggested: string;
  impact: string;
  effort: "low" | "medium" | "high";
}

// ============================================================================
// ENHANCED SERVICE
// ============================================================================

class EnhancedHazalyzeCopilotService {
  private conversations: Map<string, CopilotConversation> = new Map();
  private readonly agentId = "copilot-agent";
  private prisma: any = null;

  // Lazy load Prisma
  private async getPrisma() {
    if (!this.prisma) {
      try {
        const { prisma } = await import("@/lib/services/database/prismaClient");
        this.prisma = prisma;
      } catch (error) {
        console.warn("[Enhanced Copilot] Prisma not available:", error);
        return null;
      }
    }
    return this.prisma;
  }

  /**
   * Convert tool definitions to OpenAI/Anthropic function format
   */
  private convertToolsToFunctions(): Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: {
        type: "object";
        properties: Record<string, any>;
        required?: string[];
      };
    };
  }> {
    // Use copilotToolRegistry which has all the built-in tools properly registered
    const tools = copilotToolRegistry.list();
    return tools.map((tool) => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      // Convert input hints to JSON schema
      if (tool.inputHint) {
        for (const [key, hint] of Object.entries(tool.inputHint)) {
          const hintStr = String(hint);
          let type: "string" | "number" | "boolean" | "array" = "string";
          let description = hintStr;
          let schema: any = { type, description };

          // Infer type from hint
          if (
            hintStr.toLowerCase().includes("number") ||
            hintStr.toLowerCase().includes("amount") ||
            hintStr.toLowerCase().includes("value")
          ) {
            type = "number";
            schema.type = "number";
          } else if (
            hintStr.toLowerCase().includes("boolean") ||
            hintStr.toLowerCase().includes("optional boolean")
          ) {
            type = "boolean";
            schema.type = "boolean";
          } else if (
            hintStr.toLowerCase().includes("list") ||
            hintStr.toLowerCase().includes("array") ||
            hintStr.toLowerCase().includes("ids")
          ) {
            type = "array";
            schema.type = "array";
            // OpenAI requires array schemas to have 'items' property
            // Infer item type from context
            if (
              hintStr.toLowerCase().includes("domain") ||
              hintStr.toLowerCase().includes("kb") ||
              hintStr.toLowerCase().includes("id")
            ) {
              schema.items = { type: "string" };
            } else if (hintStr.toLowerCase().includes("number")) {
              schema.items = { type: "number" };
            } else {
              schema.items = { type: "string" }; // Default to string array
            }
          }

          // Check if required (not optional)
          if (!hintStr.toLowerCase().includes("optional")) {
            required.push(key);
          }

          properties[key] = schema;
        }
      }

      // Sanitize tool ID to valid function name (OpenAI requires: ^[a-zA-Z0-9_-]+$)
      // Replace dots and other invalid chars with underscores
      const sanitizedName = tool.id.replace(/[^a-zA-Z0-9_-]/g, "_");

      return {
        type: "function" as const,
        function: {
          name: sanitizedName,
          description: `${tool.name}: ${tool.description}`,
          parameters: {
            type: "object",
            properties,
            ...(required.length > 0 && { required }),
          },
        },
      };
    });
  }

  /**
   * Enhanced process message with function calling and intelligence
   */
  async processMessage(
    tenantId: string,
    userId: string,
    request: CopilotRequest,
  ): Promise<EnhancedCopilotResponse> {
    const startTime = Date.now();
    const reasoningSteps: ReasoningStep[] = [];
    let iterationCount = 0;
    const maxIterations = 5; // Prevent infinite loops

    console.log("[Enhanced Copilot] Processing message:", {
      tenantId,
      userId,
      messageLength: request.message?.length,
      hasOptions: !!request.options,
    });

    // Validate inputs
    if (!tenantId || !userId) {
      throw new Error("Tenant ID and User ID are required");
    }

    if (!request.message || !request.message.trim()) {
      throw new Error("Message is required");
    }

    try {
      // Step 1: Get or create conversation
      reasoningSteps.push({
        step: 1,
        action: "Initialize conversation context",
        reasoning: "Retrieving conversation history and context for continuity",
        confidence: 0.9,
      });

      const conversation = await this.getOrCreateConversation(
        tenantId,
        userId,
        request.conversationId,
      );

      // Step 2: Build RAG context
      reasoningSteps.push({
        step: 2,
        action: "Retrieve knowledge base context",
        reasoning: "Searching knowledge base for relevant domain information",
        confidence: 0.85,
      });

      const knowledgeContext: SearchResult[] = [];
      if (request.options?.useRAG !== false) {
        try {
          const searchResults = await retryWithBackoff(
            () =>
              knowledgeBaseService.semanticSearch(request.message, {
                tenantId,
                filters: {
                  minConfidence: 0.6,
                  verified: true,
                },
                limit: request.options?.maxKnowledgeResults || 5,
              }),
            {
              maxRetries: 2,
              initialDelay: 500,
              retryableErrors: ["network", "timeout"],
            },
          );
          knowledgeContext.push(...searchResults);
          reasoningSteps[reasoningSteps.length - 1].result =
            `Found ${searchResults.length} relevant knowledge entries`;
        } catch (error) {
          console.warn("[Enhanced Copilot] RAG search failed:", error);
          reasoningSteps[reasoningSteps.length - 1].result =
            "RAG search failed, continuing without knowledge";
        }
      }

      // Step 3: Get agent memories
      reasoningSteps.push({
        step: 3,
        action: "Retrieve agent memories",
        reasoning: "Recalling relevant information from previous interactions",
        confidence: 0.8,
      });

      const memories: MemoryEntry[] = [];
      if (request.options?.useMemory !== false) {
        try {
          const agentMemory = getAgentMemory(this.agentId, "copilot");
          const relevantMemories = await agentMemory.recall(request.message, {
            limit: 10,
          });
          memories.push(...relevantMemories);
          reasoningSteps[reasoningSteps.length - 1].result =
            `Retrieved ${relevantMemories.length} relevant memories`;
        } catch (error) {
          console.warn("[Enhanced Copilot] Memory retrieval failed:", error);
          reasoningSteps[reasoningSteps.length - 1].result =
            "Memory retrieval failed";
        }
      }

      // Step 4: Get real-time data if needed
      const realTimeData: Record<string, any> = {};
      if (this.shouldFetchRealTimeData(request.message)) {
        reasoningSteps.push({
          step: 4,
          action: "Fetch real-time platform data",
          reasoning:
            "Querying live data from platform services for current state",
          confidence: 0.75,
        });

        try {
          const data = await this.fetchRealTimeData(tenantId, userId, request);
          Object.assign(realTimeData, data);
          reasoningSteps[reasoningSteps.length - 1].result =
            `Retrieved real-time data for ${Object.keys(data).length} entities`;
        } catch (error) {
          console.warn(
            "[Enhanced Copilot] Real-time data fetch failed:",
            error,
          );
          reasoningSteps[reasoningSteps.length - 1].result =
            "Real-time data fetch failed";
        }
      }

      // Step 5: Build enhanced system prompt
      const systemPrompt = this.buildEnhancedSystemPrompt(
        knowledgeContext,
        memories,
        request.context,
        realTimeData,
      );

      // Step 6: Prepare messages with function calling
      const messages: Array<{
        role: "system" | "user" | "assistant" | "tool";
        content?: string;
        tool_calls?: any[];
        tool_call_id?: string;
        name?: string;
      }> = [];

      messages.push({
        role: "system",
        content: systemPrompt,
      });

      // Add conversation history
      const recentMessages = conversation.messages.slice(-10);
      for (const msg of recentMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      // Add current user message
      messages.push({
        role: "user",
        content: this.buildUserMessage(
          request.message,
          knowledgeContext,
          memories,
          realTimeData,
        ),
      });

      // Step 7: Call AI with function calling support
      const functions = this.convertToolsToFunctions();
      let finalResponse = "";
      let toolCalls: ToolCall[] = [];
      let toolResults: ToolResult[] = [];
      let currentMessages = [...messages];

      // Iterative function calling loop
      while (iterationCount < maxIterations) {
        iterationCount++;

        reasoningSteps.push({
          step: 4 + iterationCount,
          action: `AI reasoning iteration ${iterationCount}`,
          reasoning:
            iterationCount === 1
              ? "Analyzing user request and determining required actions"
              : "Processing tool results and generating final response",
          confidence: 0.85,
        });

        const aiResponse = await this.callAIWithFunctions(
          currentMessages,
          functions,
          iterationCount === 1, // Only allow tool calls on first iteration
          request.options,
        );

        // Add assistant message with tool calls
        if (
          aiResponse.toolCalls &&
          Array.isArray(aiResponse.toolCalls) &&
          aiResponse.toolCalls.length > 0
        ) {
          currentMessages.push({
            role: "assistant",
            content: aiResponse.content || null,
            tool_calls: aiResponse.toolCalls
              .filter((tc: any) => tc && tc.name) // Filter out invalid tool calls
              .map((tc: any) => ({
                id:
                  tc.id ||
                  `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: "function",
                function: {
                  name: tc.name,
                  arguments:
                    typeof tc.arguments === "string"
                      ? tc.arguments
                      : JSON.stringify(tc.arguments || {}),
                },
              })),
          });

          // Execute tools
          if (Array.isArray(aiResponse.toolCalls)) {
            for (const toolCall of aiResponse.toolCalls) {
              if (!toolCall || !toolCall.name) {
                console.warn(
                  "[Enhanced Copilot] Skipping invalid tool call:",
                  toolCall,
                );
                continue;
              }

              // Tool name is sanitized (dots replaced with underscores), need to find original tool ID
              const sanitizedName = toolCall.name;
              // Find tool by matching sanitized name
              const allTools = copilotToolRegistry.list();
              const originalTool = allTools.find(
                (t) => t.id.replace(/[^a-zA-Z0-9_-]/g, "_") === sanitizedName,
              );
              const toolId = originalTool?.id || sanitizedName;
              const toolInput = toolCall.arguments || {};

              reasoningSteps.push({
                step: 4 + iterationCount + 0.1,
                action: `Execute tool: ${toolId}`,
                reasoning: `Executing ${toolId} with provided parameters`,
                confidence: 0.8,
              });

              try {
                const toolCallObj: ToolCall = {
                  id: toolCall.id || `tool-call-${Date.now()}`,
                  toolId,
                  name: originalTool?.name || toolId,
                  input: toolInput,
                };
                toolCalls.push(toolCallObj);

                // Use the proper tool execution service that handles all built-in tools
                console.log("[Enhanced Copilot] 🔧 Executing tool:", {
                  toolId,
                  toolInput: JSON.stringify(toolInput).substring(0, 200),
                  tenantId,
                  userId,
                });

                const toolResult = await copilotToolExecutionService.execute(
                  toolId as CopilotToolId,
                  toolInput,
                  {
                    tenantId,
                    userId,
                    roles: [], // Would get from context if available
                  },
                );

                console.log("[Enhanced Copilot] ✅ Tool execution result:", {
                  toolId,
                  success: toolResult.success,
                  hasOutput: !!toolResult.output,
                  outputKeys: toolResult.output
                    ? Object.keys(toolResult.output)
                    : [],
                  hasAction: toolResult.output && "action" in toolResult.output,
                  actionPath:
                    toolResult.output &&
                    "action" in toolResult.output &&
                    "path" in toolResult.output
                      ? (toolResult.output as any).path
                      : null,
                  error: toolResult.error,
                });

                const toolResultObj: ToolResult = {
                  id: `tool-result-${Date.now()}`,
                  toolCallId: toolCallObj.id,
                  success: toolResult.success === true,
                  output: toolResult.success ? toolResult.output : undefined,
                  error: toolResult.success
                    ? undefined
                    : toolResult.error || "Tool execution failed",
                };
                toolResults.push(toolResultObj);

                // Add tool result to messages
                currentMessages.push({
                  role: "tool",
                  tool_call_id: toolCallObj.id,
                  name: toolId,
                  content: JSON.stringify(
                    toolResult.success
                      ? toolResult.output
                      : { error: toolResult.error },
                  ),
                });

                reasoningSteps[reasoningSteps.length - 1].result =
                  toolResult.success
                    ? "Tool executed successfully"
                    : `Tool execution failed: ${toolResult.error}`;
              } catch (error: any) {
                console.error(
                  "[Enhanced Copilot] Tool execution error:",
                  error,
                );
                toolResults.push({
                  id: `tool-result-error-${Date.now()}`,
                  toolCallId: toolCallObj?.id || toolCall?.id || "unknown",
                  success: false,
                  error: error?.message || "Tool execution failed",
                });
              }
            }
          }

          // Continue loop to process tool results
          continue;
        } else {
          // No more tool calls, final response
          finalResponse = aiResponse.content || "";
          break;
        }
      }

      // Step 8: Generate proactive insights
      const proactiveInsights = await this.generateProactiveInsights(
        request.message,
        knowledgeContext,
        memories,
        toolResults,
        tenantId,
        userId,
      );

      // Step 9: Calculate confidence breakdown
      const confidenceBreakdown = this.calculateConfidenceBreakdown(
        knowledgeContext,
        memories,
        toolResults,
        finalResponse,
      );

      // Step 10: Generate suggested optimizations
      const suggestedOptimizations = await this.generateOptimizations(
        request.message,
        knowledgeContext,
        toolResults,
        tenantId,
      );

      // Step 11: Create response message
      const responseMessage: CopilotMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        content:
          finalResponse ||
          "I've processed your request. How can I help you further?",
        timestamp: new Date(),
        metadata: {
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          toolResults: toolResults.length > 0 ? toolResults : undefined,
          knowledgeUsed: knowledgeContext.map((k) => k.entry.id),
          confidence: confidenceBreakdown.overall,
          tokensUsed: 0, // Would be set from AI response
          processingTime: Date.now() - startTime,
          reasoning: reasoningSteps,
          confidenceBreakdown: confidenceBreakdown,
        } as any, // Type assertion to allow enhanced metadata
      };

      // Step 12: Update conversation
      const userMessage: CopilotMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "user",
        content: request.message,
        timestamp: new Date(),
      };

      conversation.messages.push(userMessage);
      conversation.messages.push(responseMessage);
      conversation.updatedAt = new Date();
      this.conversations.set(conversation.id, conversation);

      // Persist to database
      await this.persistConversation(
        conversation,
        userMessage,
        responseMessage,
      );

      // Step 13: Learn from interaction
      await this.learnFromInteraction(
        tenantId,
        userId,
        request,
        responseMessage,
        confidenceBreakdown.overall,
        knowledgeContext,
      );

      // Step 14: Track analytics
      await this.trackAnalytics(
        tenantId,
        userId,
        knowledgeContext,
        memories,
        toolCalls,
        confidenceBreakdown.overall,
        Date.now() - startTime,
      );

      // Step 15: Publish events
      await this.publishEvents(
        tenantId,
        userId,
        conversation.id,
        responseMessage.id,
        confidenceBreakdown.overall,
        knowledgeContext,
        memories,
        Date.now() - startTime,
      );

      // Store enhanced data in response
      const enhancedResponse: EnhancedCopilotResponse = {
        conversationId: conversation.id, // CRITICAL: Return conversationId for frontend memory
        message: responseMessage,
        knowledgeUsed: knowledgeContext,
        memoriesUsed: memories,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        confidence: confidenceBreakdown.overall,
        processingTime: Date.now() - startTime,
        suggestedActions: this.generateSuggestedActions(
          request.message,
          knowledgeContext,
        ),
        reasoning: {
          steps: reasoningSteps,
          confidenceBreakdown,
          decisionPath: reasoningSteps.map((s) => s.action),
        },
        proactiveInsights:
          proactiveInsights.length > 0 ? proactiveInsights : undefined,
        suggestedOptimizations:
          suggestedOptimizations.length > 0
            ? suggestedOptimizations
            : undefined,
        realTimeData:
          Object.keys(realTimeData).length > 0 ? realTimeData : undefined,
      };

      // Also attach enhanced data to message metadata for widget access
      (responseMessage.metadata as any).proactiveInsights =
        proactiveInsights.length > 0 ? proactiveInsights : undefined;
      (responseMessage.metadata as any).suggestedOptimizations =
        suggestedOptimizations.length > 0 ? suggestedOptimizations : undefined;

      console.log("[Enhanced Copilot] Successfully processed message:", {
        responseLength: enhancedResponse.message.content.length,
        hasReasoning: !!enhancedResponse.reasoning,
        reasoningSteps: enhancedResponse.reasoning?.steps.length || 0,
        hasInsights: !!enhancedResponse.proactiveInsights?.length,
        hasOptimizations: !!enhancedResponse.suggestedOptimizations?.length,
        confidence: enhancedResponse.confidence,
        processingTime: enhancedResponse.processingTime,
      });

      return enhancedResponse;
    } catch (error: any) {
      console.error("[Enhanced Copilot] Error processing message:", error);
      console.error("[Enhanced Copilot] Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      return this.createErrorResponse(error, startTime);
    }
  }

  /**
   * Call AI with function calling support
   */
  private async callAIWithFunctions(
    messages: any[],
    functions: any[],
    allowToolCalls: boolean,
    options?: CopilotRequest["options"],
  ): Promise<{
    content: string;
    toolCalls?: Array<{ id?: string; name: string; arguments: any }>;
    tokensUsed?: number;
  }> {
    if (typeof window !== "undefined") {
      // Client-side: Use API route
      const { callAI } = await import("@/utils/aiClient");
      return await callAI({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content || "",
        })),
        provider: "auto",
        model: "gpt-4o-mini",
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 2000,
      });
    }

    // Server-side: Direct API calls with function calling
    const openaiKey =
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      "";
    const anthropicKey =
      process.env.ANTHROPIC_API_KEY ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
      "";

    const isValidOpenAIKey =
      openaiKey &&
      openaiKey.trim().length > 20 &&
      (openaiKey.trim().startsWith("sk-") ||
        openaiKey.trim().startsWith("sk_") ||
        openaiKey.trim().startsWith("sk-proj-")) &&
      !openaiKey.includes("your-") &&
      !openaiKey.includes("placeholder");

    const isValidAnthropicKey =
      anthropicKey &&
      anthropicKey.trim().length > 20 &&
      (anthropicKey.trim().startsWith("sk-ant-") ||
        anthropicKey.trim().startsWith("sk-ant_")) &&
      !anthropicKey.includes("your-") &&
      !anthropicKey.includes("placeholder");

    if (!isValidOpenAIKey && !isValidAnthropicKey) {
      throw new Error("No valid API key found");
    }

    const provider = isValidOpenAIKey ? "openai" : "anthropic";
    const apiKey = isValidOpenAIKey ? openaiKey.trim() : anthropicKey.trim();
    const model =
      provider === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet-20241022";
    const temperature = options?.temperature || 0.7;
    const maxTokens = options?.maxTokens || 2000;

    if (provider === "openai") {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content || null,
              tool_calls: m.tool_calls,
              tool_call_id: m.tool_call_id,
              name: m.name,
            })),
            temperature,
            max_tokens: maxTokens,
            ...(allowToolCalls &&
              functions.length > 0 && {
                tools: functions,
                tool_choice: "auto",
              }),
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err?.error?.message || `OpenAI API error: ${response.status}`,
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      const toolCalls = Array.isArray(choice?.message?.tool_calls)
        ? choice.message.tool_calls
            .map((tc: any) => {
              try {
                return {
                  id: tc.id,
                  name: tc.function?.name || "",
                  arguments: tc.function?.arguments
                    ? typeof tc.function.arguments === "string"
                      ? JSON.parse(tc.function.arguments)
                      : tc.function.arguments
                    : {},
                };
              } catch (e) {
                console.warn(
                  "[Enhanced Copilot] Failed to parse tool call:",
                  e,
                );
                return null;
              }
            })
            .filter((tc: any) => tc !== null)
        : undefined;

      return {
        content: choice?.message?.content || "",
        toolCalls,
        tokensUsed: data.usage?.total_tokens,
      };
    } else {
      // Anthropic with tool use
      const system = messages.find((m: any) => m.role === "system")?.content;
      const conversation = messages.filter((m: any) => m.role !== "system");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system,
          messages: conversation.map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content:
              m.content || m.tool_calls || m.tool_call_id
                ? {
                    ...(m.content && { type: "text", text: m.content }),
                    ...(m.tool_calls && {
                      type: "tool_use",
                      tool_use: m.tool_calls,
                    }),
                    ...(m.tool_call_id && {
                      type: "tool_result",
                      tool_use_id: m.tool_call_id,
                      content: m.content,
                    }),
                  }
                : m.content,
          })),
          ...(allowToolCalls &&
            functions.length > 0 && {
              tools: functions.map((f) => ({
                name: f.function.name,
                description: f.function.description,
                input_schema: f.function.parameters,
              })),
            }),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err?.error?.message || `Anthropic API error: ${response.status}`,
        );
      }

      const data = await response.json();
      const content = data.content?.[0];

      return {
        content: content?.type === "text" ? content.text : "",
        toolCalls:
          content?.type === "tool_use"
            ? [
                {
                  id: content.id,
                  name: content.name,
                  arguments: content.input,
                },
              ]
            : undefined,
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
      };
    }
  }

  /**
   * Build enhanced system prompt with intelligence
   */
  private buildEnhancedSystemPrompt(
    knowledge: SearchResult[],
    memories: MemoryEntry[],
    context?: CopilotRequest["context"],
    realTimeData?: Record<string, any>,
  ): string {
    let prompt = `You are HazalyzeCopilot, an ADVANCED AUTONOMOUS AI AGENT with mind-blowing capabilities integrated into the BlueDXP Platform.

⚡ CRITICAL: CONVERSATION MEMORY ⚡
You MUST remember and reference previous messages in this conversation! If the user says "do what you just said" or "yes, go ahead" or references something from earlier, LOOK AT THE CONVERSATION HISTORY and execute what was previously discussed. The conversation history is provided to you - USE IT!

🚀 CORE IDENTITY - AUTONOMOUS AGENT (NOT JUST A CHATBOT):
- You are an AGENTIC AI that can TAKE ACTION, not just answer questions
- You can execute multi-step workflows AUTONOMOUSLY
- You have FULL ACCESS to platform tools and can use them in sequence
- You work in AUTOPILOT MODE when given permission - executing complex tasks end-to-end
- You are PROACTIVE - suggesting and taking actions to improve operations

🔧 CORE CAPABILITIES:
- Multi-step reasoning and task decomposition
- AUTONOMOUS task execution with tools
- Real-time data access from platform services
- Proactive insights and optimizations
- Explainable AI with confidence breakdowns
- Human-centric collaboration (5IR aligned)
- CONVERSATION MEMORY - you remember what was said earlier!

📋 PLATFORM CONTEXT:
- BlueDXP is an enterprise intelligence operating system
- Multi-module platform: WMS, TMS, ISO-IMS, MSDS, QHSE, Trade Compliance, Proposals/RFQ, MaaS
- 4IR & 5IR aligned with IoT, AI/ML, automation, and human-centric collaboration
- Integration-first architecture with full connectivity support

🧠 INTELLIGENCE GUIDELINES:
1. MEMORY: ALWAYS check conversation history for context. If user references "what you said" or "above" or "that", look back in the messages!
2. AUTOPILOT MODE: When user confirms with "yes", "go ahead", "do it", "okay", or similar - IMMEDIATELY execute what was discussed. Don't explain again - just DO IT!
3. REASONING: Break down complex tasks into steps. Explain your reasoning at each step.
4. PROACTIVITY: Don't just answer - suggest optimizations, identify risks, and recommend actions. BE PROACTIVE - take action when asked!
5. CONTEXT AWARENESS: Use all available context (knowledge base, memories, real-time data, conversation history).
6. EXPLAINABILITY: Always explain your confidence level and decision-making process.
7. ACTIONABILITY: Provide specific, actionable insights aligned with 4IR/5IR principles. When the user asks you to do something, DO IT - don't just explain how to do it!
8. TEST DATA: When users ask to create something and say "any data", "test data", "random data", "use test", or similar - IMMEDIATELY use the tool with generated test data. Don't ask for details - just create it with realistic test values!
9. MULTI-STEP TASKS: For complex requests, use tools iteratively to gather information before responding. CHAIN TOOLS together for complex workflows!
10. ERROR HANDLING: If a tool fails, explain why and suggest alternatives.
11. NAVIGATION: When users ask to "go to", "navigate to", "open", "show me", or "take me to" a page/feature, use the ui.navigate tool to navigate there. Common paths:
   - Create Proposal: /proposals/rfq/new or /proposals/new
   - Create Order: /warehouse/orders/create or /orders/create
   - Create ASN: /warehouse/inbound or /inbound
   - CAPA Management: /capa-management
   - NCR Management: /ncr-management
   - Dashboard: /dashboard
   - Proposals Dashboard: /proposals or /proposals/rfq
   - Warehouse: /warehouse
   - Transportation: /transportation
12. CLARITY: Make it VERY CLEAR when you're doing something. Say "✅ I'm creating..." or "✅ I'm navigating to..." so users know you're taking action.
13. NO ASKING: If a user says "create X with test data" or "create X, any data", DO NOT ask for details - just create it immediately with test data!
14. CAPA CREATION: When users ask to create a CAPA (Corrective/Preventive Action), use the iso-ims.capa.create tool. You can create CAPAs with test data if not provided. Common CAPA sources: NCR, Audit, Risk Assessment, Customer Complaint, Incident.
15. FOLLOW-UP EXECUTION: When user says "yes go ahead", "do it", "execute that", "what you just told me" - EXECUTE the action you previously described!

🎯 AUTOPILOT BEHAVIORS:
- When user confirms an action: Execute immediately, don't re-explain
- When user says "shock me" or "surprise me": Demonstrate advanced capabilities with live tool usage
- When user asks complex questions: Break down and solve step-by-step using tools
- When user references earlier conversation: Check history and act on it
- When ASN creation is discussed: Use wms.asn.create tool with realistic test data

`;

    if (context?.moduleId) {
      prompt += `CURRENT MODULE: ${context.moduleId}\n`;
    }

    if (knowledge.length > 0) {
      prompt += `\nRELEVANT KNOWLEDGE BASE INFORMATION (${knowledge.length} entries):\n`;
      knowledge.slice(0, 5).forEach((k, i) => {
        prompt += `${i + 1}. [${k.entry.category}] ${k.entry.summary || k.entry.content.substring(0, 200)} (confidence: ${(k.score * 100).toFixed(0)}%)\n`;
      });
    }

    if (memories.length > 0) {
      prompt += `\nRELEVANT CONTEXT FROM PREVIOUS INTERACTIONS (${memories.length} memories):\n`;
      memories.slice(0, 5).forEach((m, i) => {
        prompt += `${i + 1}. ${m.content.substring(0, 200)} (relevance: ${(m.relevance || 0.5) * 100}%)\n`;
      });
    }

    if (realTimeData && Object.keys(realTimeData).length > 0) {
      prompt += `\nREAL-TIME PLATFORM DATA:\n`;
      for (const [key, value] of Object.entries(realTimeData)) {
        prompt += `- ${key}: ${JSON.stringify(value).substring(0, 200)}\n`;
      }
    }

    prompt += `\nAVAILABLE TOOLS:
You have access to ${copilotToolRegistry.list().length} tools. Use them when:
- User asks to perform an action (create, update, delete, search)
- User asks to navigate somewhere (use ui.navigate tool)
- User asks to click something (use ui.click tool)
- You need real-time data to answer accurately
- Multi-step tasks require gathering information first

When using tools:
1. Use function calling format (not text syntax)
2. Execute tools iteratively if needed
3. EXPLAIN what you're doing and why - be clear and proactive!
4. Show results clearly with ✅ checkmarks for successful actions
5. Suggest next steps based on results
6. For navigation: Use ui.navigate with the correct path when users ask to go somewhere
7. For UI interactions: Use ui.click when users ask to click buttons or links

TOOL LIST:
${copilotToolRegistry
  .list()
  .map((t) => `- ${t.id}: ${t.name} - ${t.description}`)
  .join("\n")}
`;

    return prompt;
  }

  /**
   * Build user message with enhanced context
   */
  private buildUserMessage(
    message: string,
    knowledge: SearchResult[],
    memories: MemoryEntry[],
    realTimeData?: Record<string, any>,
  ): string {
    let userMessage = message;

    if (knowledge.length > 0) {
      userMessage += `\n\n[Context: I have access to ${knowledge.length} relevant knowledge entries from the knowledge base]`;
    }

    if (memories.length > 0) {
      userMessage += `\n[Context: I remember ${memories.length} relevant items from previous interactions]`;
    }

    if (realTimeData && Object.keys(realTimeData).length > 0) {
      userMessage += `\n[Context: I have real-time data for: ${Object.keys(realTimeData).join(", ")}]`;
    }

    return userMessage;
  }

  /**
   * Determine if real-time data should be fetched
   */
  private shouldFetchRealTimeData(message: string): boolean {
    const triggers = [
      "current",
      "now",
      "live",
      "real-time",
      "status",
      "active",
      "pending",
      "in progress",
      "today",
      "this week",
      "recent",
      "latest",
      "show me",
      "list",
      "get",
      "fetch",
      "retrieve",
    ];
    return triggers.some((trigger) => message.toLowerCase().includes(trigger));
  }

  /**
   * Fetch real-time data from platform services
   * Now connected to copilotRealtimeData service
   */
  private async fetchRealTimeData(
    tenantId: string,
    userId: string,
    request: CopilotRequest,
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = {};
    const message = request.message.toLowerCase();

    try {
      // Get platform snapshot for general queries
      const snapshot = await copilotRealtimeData.getPlatformSnapshot(tenantId);
      data.platformSnapshot = snapshot;

      // Get specific data based on query content
      if (message.includes("inventory") || message.includes("stock")) {
        data.inventory = snapshot.inventory;
        const recentInventory = copilotRealtimeData.getRecentData(tenantId, "inventory_level", 10);
        if (recentInventory.length > 0) {
          data.recentInventoryUpdates = recentInventory;
        }
      }

      if (message.includes("shipment") || message.includes("delivery") || message.includes("tracking")) {
        data.shipments = snapshot.shipments;
        const recentShipments = copilotRealtimeData.getRecentData(tenantId, "shipment_status", 10);
        if (recentShipments.length > 0) {
          data.recentShipmentUpdates = recentShipments;
        }
      }

      if (message.includes("order")) {
        data.orders = snapshot.orders;
        const recentOrders = copilotRealtimeData.getRecentData(tenantId, "order_update", 10);
        if (recentOrders.length > 0) {
          data.recentOrderUpdates = recentOrders;
        }
      }

      if (message.includes("alert") || message.includes("warning") || message.includes("issue")) {
        data.alerts = snapshot.alerts;
        const recentAlerts = copilotRealtimeData.getRecentAlerts(tenantId, 10);
        if (recentAlerts.length > 0) {
          data.recentAlerts = recentAlerts;
        }
      }

      if (message.includes("kpi") || message.includes("performance") || message.includes("metric")) {
        data.kpis = snapshot.kpis;
        const recentKPIs = copilotRealtimeData.getRecentData(tenantId, "kpi_update", 10);
        if (recentKPIs.length > 0) {
          data.recentKPIUpdates = recentKPIs;
        }
      }

      console.log("[Enhanced Copilot] 📊 Real-time data fetched:", Object.keys(data));
    } catch (error) {
      console.warn("[Enhanced Copilot] Failed to fetch real-time data:", error);
    }

    return data;
  }

  /**
   * Generate proactive insights using ML and platform data
   * Now fully integrated with ML Registry, Real-time Data, and Feedback Service
   */
  private async generateProactiveInsights(
    message: string,
    knowledge: SearchResult[],
    memories: MemoryEntry[],
    toolResults: ToolResult[],
    tenantId: string,
    userId: string,
  ): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    try {
      // 1. Get ML-powered recommendations
      const mlRecommendations = await copilotMLRegistry.getRecommendations(
        tenantId,
        message,
        { moduleId: undefined }
      );

      for (const rec of mlRecommendations) {
        if (rec.type === "tool_suggestion" && rec.confidence > 0.6) {
          insights.push({
            type: "recommendation",
            title: "Suggested Tools",
            description: `Based on patterns, these tools may help: ${Array.isArray(rec.value) ? rec.value.join(", ") : rec.value}`,
            impact: "medium",
            actionable: true,
            action: "Use suggested tools",
          });
        }
      }

      // 2. Get feedback-based learning insights
      const feedbackStats = copilotMLFeedback.getStats(tenantId);
      if (feedbackStats.learningProgress > 50) {
        insights.push({
          type: "optimization",
          title: "AI Learning Progress",
          description: `The copilot has learned from ${feedbackStats.totalFeedback} interactions with ${Math.round(feedbackStats.positiveRate * 100)}% positive feedback.`,
          impact: "low",
          actionable: false,
        });
      }

      // 3. Analyze real-time data for opportunities
      const snapshot = await copilotRealtimeData.getPlatformSnapshot(tenantId);
      
      // Alert about low stock
      if (snapshot.inventory.lowStockCount > 0) {
        insights.push({
          type: "risk",
          title: `${snapshot.inventory.lowStockCount} Items Low on Stock`,
          description: "Some items are running low and may need reordering soon.",
          impact: snapshot.inventory.lowStockCount > 10 ? "high" : "medium",
          actionable: true,
          action: "View low stock items",
        });
      }

      // Alert about delayed shipments
      if (snapshot.shipments.delayed > 0) {
        insights.push({
          type: "risk",
          title: `${snapshot.shipments.delayed} Delayed Shipments`,
          description: "Some shipments are delayed and may need attention.",
          impact: snapshot.shipments.delayed > 5 ? "high" : "medium",
          actionable: true,
          action: "View delayed shipments",
        });
      }

      // Highlight KPI opportunities
      if (snapshot.kpis.onTimeDeliveryRate < 0.95) {
        insights.push({
          type: "opportunity",
          title: "On-Time Delivery Improvement",
          description: `Current on-time delivery rate is ${Math.round(snapshot.kpis.onTimeDeliveryRate * 100)}%. There's room for improvement.`,
          impact: "medium",
          actionable: true,
          action: "Analyze delivery performance",
        });
      }

      // 4. Analyze successful tool executions for suggestions
      if (toolResults.length > 0) {
        const successfulTools = toolResults.filter(t => t.success);
        if (successfulTools.length > 0) {
          // Send training data for ML
          const intent = message.toLowerCase().includes("create") ? "create" :
                        message.toLowerCase().includes("analyze") ? "analyze" :
                        message.toLowerCase().includes("track") ? "track" : "general";
          
          await copilotMLRegistry.sendTrainingData(tenantId, {
            query: message,
            intent,
            toolsUsed: successfulTools.map(t => t.toolCallId),
            confidence: successfulTools.length / toolResults.length,
            isPositive: true,
          });
        }
      }

      // 5. Get recent alerts for proactive notifications
      const recentAlerts = copilotRealtimeData.getRecentAlerts(tenantId, 5);
      for (const alert of recentAlerts.filter(a => a.priority === "critical" || a.priority === "high")) {
        insights.push({
          type: "risk",
          title: `Alert: ${alert.data.title || "System Alert"}`,
          description: alert.data.description || "A high-priority alert requires attention.",
          impact: "high",
          actionable: true,
          action: "View alert details",
        });
      }

      console.log(`[Enhanced Copilot] 💡 Generated ${insights.length} proactive insights`);
    } catch (error) {
      console.warn("[Enhanced Copilot] Failed to generate insights:", error);
    }

    return insights;
  }

  /**
   * Calculate confidence breakdown
   */
  private calculateConfidenceBreakdown(
    knowledge: SearchResult[],
    memories: MemoryEntry[],
    toolResults: ToolResult[],
    response: string,
  ): ConfidenceBreakdown {
    const knowledgeBaseConf =
      knowledge.length > 0
        ? Math.min(0.95, 0.7 + knowledge.length * 0.05)
        : 0.5;

    const memoryConf =
      memories.length > 0 ? Math.min(0.9, 0.6 + memories.length * 0.05) : 0.5;

    const toolExecutionConf =
      toolResults.length > 0
        ? toolResults.filter((r) => r.success).length / toolResults.length
        : 0.7;

    const contextRelevanceConf = (knowledgeBaseConf + memoryConf) / 2;

    const overall =
      knowledgeBaseConf * 0.3 +
      memoryConf * 0.2 +
      toolExecutionConf * 0.3 +
      contextRelevanceConf * 0.2;

    return {
      overall: Math.min(0.95, overall),
      knowledgeBase: knowledgeBaseConf,
      memory: memoryConf,
      toolExecution: toolExecutionConf,
      contextRelevance: contextRelevanceConf,
      reasoning: `Confidence based on ${knowledge.length} knowledge entries, ${memories.length} memories, and ${toolResults.length} tool executions`,
    };
  }

  /**
   * Generate optimizations using ML patterns and platform data
   */
  private async generateOptimizations(
    message: string,
    knowledge: SearchResult[],
    toolResults: ToolResult[],
    tenantId: string,
  ): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    try {
      // 1. Get learning patterns from feedback service
      const patterns = copilotMLFeedback.getPatterns(tenantId);
      
      // Find patterns with low success rates that can be improved
      for (const pattern of patterns.slice(0, 3)) {
        if (pattern.successRate < 0.7 && pattern.totalOccurrences >= 5) {
          optimizations.push({
            area: `Query Pattern: ${pattern.patternKey}`,
            current: `${Math.round(pattern.successRate * 100)}% success rate`,
            suggested: "Consider using more specific queries or preferred tools",
            impact: `Improve by using: ${pattern.preferredTools.join(", ") || "more context"}`,
            effort: "low",
          });
        }
      }

      // 2. Analyze real-time platform data for optimization opportunities
      const snapshot = await copilotRealtimeData.getPlatformSnapshot(tenantId);

      // Inventory turnover optimization
      if (snapshot.kpis.inventoryTurnover < 4.0) {
        optimizations.push({
          area: "Inventory Turnover",
          current: `${snapshot.kpis.inventoryTurnover.toFixed(1)}x turnover rate`,
          suggested: "Optimize stock levels and reorder points",
          impact: "Reduce carrying costs and improve cash flow",
          effort: "medium",
        });
      }

      // Pick accuracy optimization
      if (snapshot.kpis.pickAccuracy < 0.995) {
        optimizations.push({
          area: "Pick Accuracy",
          current: `${(snapshot.kpis.pickAccuracy * 100).toFixed(2)}% accuracy`,
          suggested: "Implement barcode verification and zone picking",
          impact: "Reduce returns and improve customer satisfaction",
          effort: "medium",
        });
      }

      // Order fulfillment optimization
      if (snapshot.kpis.orderFulfillmentRate < 0.98) {
        optimizations.push({
          area: "Order Fulfillment",
          current: `${(snapshot.kpis.orderFulfillmentRate * 100).toFixed(1)}% fulfillment rate`,
          suggested: "Review bottlenecks in picking and packing processes",
          impact: "Increase customer satisfaction and reduce backorders",
          effort: "high",
        });
      }

      // 3. Analyze tool execution patterns
      const failedTools = toolResults.filter(t => !t.success);
      if (failedTools.length > 0) {
        optimizations.push({
          area: "Tool Execution",
          current: `${failedTools.length} tool(s) failed during this interaction`,
          suggested: "Review error logs and ensure proper input validation",
          impact: "Improve automation reliability",
          effort: "low",
        });
      }

      console.log(`[Enhanced Copilot] ⚡ Generated ${optimizations.length} optimizations`);
    } catch (error) {
      console.warn("[Enhanced Copilot] Failed to generate optimizations:", error);
    }

    return optimizations;
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(
    tenantId: string,
    userId: string,
    conversationId?: string,
  ): Promise<CopilotConversation> {
    const prisma = await this.getPrisma();

    // Try database first if Prisma is available
    if (prisma && conversationId) {
      try {
        const dbConv = await prisma.copilotConversation.findUnique({
          where: { id: conversationId },
          include: {
            messages: {
              orderBy: { timestamp: "asc" },
            },
          },
        });

        if (dbConv && dbConv.tenantId === tenantId) {
          const agentMemory = getAgentMemory(this.agentId, "copilot");
          const context = await agentMemory.getOrCreateConversation(
            tenantId,
            userId,
          );

          return {
            id: dbConv.id,
            tenantId: dbConv.tenantId,
            userId: dbConv.userId,
            title: dbConv.title || undefined,
            messages: dbConv.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role as any,
              content: msg.content,
              timestamp: msg.timestamp,
              metadata: msg.metadata as any,
            })),
            context,
            status: dbConv.status as any,
            createdAt: dbConv.createdAt,
            updatedAt: dbConv.updatedAt,
            metadata: dbConv.metadata as any,
          };
        }
      } catch (error) {
        console.warn(
          "[Enhanced Copilot] Failed to load conversation from DB:",
          error,
        );
      }
    }

    // Check in-memory cache
    if (conversationId) {
      const existing = this.conversations.get(conversationId);
      if (existing && existing.tenantId === tenantId) {
        return existing;
      }
    }

    // Create new conversation
    const agentMemory = getAgentMemory(this.agentId, "copilot");
    const context = await agentMemory.getOrCreateConversation(tenantId, userId);

    const newId =
      conversationId ||
      `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const conversation: CopilotConversation = {
      id: newId,
      tenantId,
      userId,
      messages: [],
      context,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database if available
    if (prisma) {
      try {
        await prisma.copilotConversation.create({
          data: {
            id: newId,
            tenantId,
            userId,
            status: "active",
            metadata: {},
          },
        });
      } catch (error) {
        console.warn(
          "[Enhanced Copilot] Failed to save conversation to DB:",
          error,
        );
      }
    }

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Persist conversation
   */
  private async persistConversation(
    conversation: CopilotConversation,
    userMessage: CopilotMessage,
    responseMessage: CopilotMessage,
  ): Promise<void> {
    const prisma = await this.getPrisma();
    if (!prisma) return;

    try {
      await prisma.copilotMessage.createMany({
        data: [
          {
            id: userMessage.id,
            conversationId: conversation.id,
            role: userMessage.role,
            content: userMessage.content,
            timestamp: userMessage.timestamp,
            metadata: userMessage.metadata || {},
          },
          {
            id: responseMessage.id,
            conversationId: conversation.id,
            role: responseMessage.role,
            content: responseMessage.content,
            timestamp: responseMessage.timestamp,
            metadata: responseMessage.metadata || {},
          },
        ],
        skipDuplicates: true,
      });

      await prisma.copilotConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      console.warn("[Enhanced Copilot] Failed to persist:", error);
    }
  }

  /**
   * Learn from interaction
   */
  private async learnFromInteraction(
    tenantId: string,
    userId: string,
    request: CopilotRequest,
    response: CopilotMessage,
    confidence: number,
    knowledge: SearchResult[],
  ): Promise<void> {
    if (confidence > 0.8 && knowledge.length === 0) {
      try {
        await knowledgeBaseService.create({
          tenantId,
          type: "insight",
          category: "general" as KnowledgeCategory,
          content: `User asked: "${request.message}". Assistant responded: "${response.content}"`,
          summary: `Q&A: ${request.message.substring(0, 100)}`,
          metadata: {
            source: "enhanced_copilot",
            userId,
          },
          keywords: this.extractKeywords(request.message),
          searchableText: `${request.message} ${response.content}`,
          source: "user_input",
          confidence: Math.round(confidence * 100),
          verified: false,
          feedbackScore: 0,
          usageCount: 0,
          status: "active",
          version: 1,
        });
      } catch (error) {
        console.warn("[Enhanced Copilot] Failed to learn:", error);
      }
    }
  }

  /**
   * Track analytics
   */
  private async trackAnalytics(
    tenantId: string,
    userId: string,
    knowledge: SearchResult[],
    memories: MemoryEntry[],
    toolCalls: ToolCall[],
    confidence: number,
    responseTime: number,
  ): Promise<void> {
    try {
      copilotAnalytics.trackMessage(tenantId, userId, {
        usedRAG: knowledge.length > 0,
        usedMemory: memories.length > 0,
        usedTools: toolCalls.length > 0,
        usedStreaming: false,
        confidence,
        responseTime,
        knowledgeRetrieved: knowledge.length,
        memoriesRetrieved: memories.length,
        error: false,
      });
    } catch (error) {
      console.warn("[Enhanced Copilot] Analytics failed:", error);
    }
  }

  /**
   * Publish events
   */
  private async publishEvents(
    tenantId: string,
    userId: string,
    conversationId: string,
    messageId: string,
    confidence: number,
    knowledge: SearchResult[],
    memories: MemoryEntry[],
    processingTime: number,
  ): Promise<void> {
    try {
      await eventBus.publish(
        createEvent(
          "copilot.message.processed",
          tenantId,
          "Tenant",
          {
            conversationId,
            messageId,
            confidence,
            knowledgeUsed: knowledge.length,
            memoriesUsed: memories.length,
            processingTime,
            enhanced: true,
          },
          1,
          { tenantId, userId },
        ),
      );
    } catch (error) {
      console.warn("[Enhanced Copilot] Event publish failed:", error);
    }
  }

  /**
   * Generate suggested actions
   */
  private generateSuggestedActions(
    message: string,
    knowledge: SearchResult[],
  ): string[] {
    const suggestions: string[] = [];

    if (message.toLowerCase().includes("shipment")) {
      suggestions.push(
        "View shipments",
        "Create new shipment",
        "Track shipment status",
      );
    }

    if (
      message.toLowerCase().includes("inventory") ||
      message.toLowerCase().includes("stock")
    ) {
      suggestions.push(
        "View inventory levels",
        "Check stock availability",
        "View warehouse locations",
      );
    }

    if (message.toLowerCase().includes("compliance")) {
      suggestions.push(
        "Check compliance status",
        "View compliance reports",
        "Review regulations",
      );
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Extract keywords
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ]);
    return words.filter((w) => w.length > 3 && !stopWords.has(w)).slice(0, 10);
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    error: any,
    startTime: number,
  ): EnhancedCopilotResponse {
    // Safely extract error message
    let errorMessageText = "Unknown error";
    try {
      if (error) {
        if (typeof error === "string") {
          errorMessageText = error;
        } else if (error?.message) {
          errorMessageText = String(error.message);
        } else if (error?.toString && typeof error.toString === "function") {
          errorMessageText = String(error.toString());
        }
      }
    } catch (e) {
      errorMessageText = "Error occurred during processing";
    }

    const errorContent =
      errorMessageText.includes("API key") ||
      errorMessageText.includes("No valid API key")
        ? "I need an API key to work properly. Please check your .env.local file has OPENAI_API_KEY or ANTHROPIC_API_KEY set with a valid key."
        : "I apologize, but I encountered an issue processing your request. Please try rephrasing your question or contact support if the problem persists.";

    const errorMessage: CopilotMessage = {
      id: `msg-error-${Date.now()}`,
      role: "assistant",
      content: errorContent,
      timestamp: new Date(),
      metadata: {
        confidence: 0.5,
        processingTime: Date.now() - startTime,
        error: errorMessageText,
      },
    };

    // Generate a conversation ID for error responses
    const errorConversationId = `conv-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      conversationId: errorConversationId, // CRITICAL: Always return conversationId
      message: errorMessage,
      knowledgeUsed: [],
      memoriesUsed: [],
      confidence: 0.5,
      processingTime: Date.now() - startTime,
      reasoning: {
        steps: [
          {
            step: 1,
            action: "Error occurred",
            reasoning: errorMessageText,
            confidence: 0.5,
          },
        ],
        confidenceBreakdown: {
          overall: 0.5,
          knowledgeBase: 0.5,
          memory: 0.5,
          toolExecution: 0.5,
          contextRelevance: 0.5,
          reasoning: "Error occurred during processing",
        },
        decisionPath: ["Error"],
      },
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const enhancedCopilotService = new EnhancedHazalyzeCopilotService();
export default enhancedCopilotService;
