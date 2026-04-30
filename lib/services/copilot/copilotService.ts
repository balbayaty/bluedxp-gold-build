/**
 * HazalyzeCopilot Service
 * Advanced AI copilot with RAG, memory, and full platform integration
 * 4IR & 5IR aligned - Human-centric AI collaboration
 */

import { knowledgeBaseService } from "../knowledge-base";
import { getAgentMemory } from "../agents/agentMemory";
import { agentOrchestrator } from "../agents/agentOrchestrator";
import { eventBus } from "../event-store";
import { createEvent } from "../event-store/utils";
import { toolExecutor, toolRegistry } from "./toolExecutor";
import { copilotAnalytics } from "./analytics";
import { retryWithBackoff } from "./retryLogic";
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

// ============================================================================
// TYPES
// ============================================================================

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: Date | string;
  metadata?: {
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
    knowledgeUsed?: string[]; // Knowledge entry IDs
    confidence?: number;
    tokensUsed?: number;
    processingTime?: number;
    // Enhanced features
    proactiveInsights?: Array<{
      type: "optimization" | "risk" | "opportunity" | "recommendation";
      title: string;
      description: string;
      impact: "high" | "medium" | "low";
      actionable: boolean;
      action?: string;
    }>;
    suggestedOptimizations?: Array<{
      area: string;
      current: string;
      suggested: string;
      impact: string;
      effort: "low" | "medium" | "high";
    }>;
    reasoning?: Array<{
      step: number;
      action: string;
      reasoning: string;
      result?: any;
      confidence: number;
    }>;
    confidenceBreakdown?: {
      overall: number;
      knowledgeBase: number;
      memory: number;
      toolExecution: number;
      contextRelevance: number;
      reasoning: string;
    };
    attachmentAnalysis?: any;
    canRetry?: boolean;
  };
  // ML Feedback tracking
  feedback?: "positive" | "negative" | null;
}

export interface ToolCall {
  id: string;
  toolId: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResult {
  id: string;
  toolCallId: string;
  success: boolean;
  output?: any;
  error?: string;
}

export interface CopilotConversation {
  id: string;
  tenantId: string;
  userId: string;
  title?: string;
  messages: CopilotMessage[];
  context: ConversationContext;
  status: "active" | "archived" | "paused";
  createdAt: Date | string;
  updatedAt: Date | string;
  metadata?: {
    moduleId?: string;
    featureId?: string;
    relatedEntities?: string[]; // Entity IDs (shipments, orders, etc.)
  };
}

export interface CopilotRequest {
  conversationId?: string;
  message: string;
  context?: {
    moduleId?: string;
    featureId?: string;
    entityId?: string;
    entityType?: string;
  };
  options?: {
    useRAG?: boolean;
    useMemory?: boolean;
    useTools?: boolean;
    maxKnowledgeResults?: number;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface CopilotResponse {
  conversationId: string; // CRITICAL: Always return conversationId for memory continuity
  message: CopilotMessage;
  knowledgeUsed: SearchResult[];
  memoriesUsed: MemoryEntry[];
  toolCalls?: ToolCall[];
  confidence: number;
  processingTime: number;
  suggestedActions?: string[];
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

class HazalyzeCopilotService {
  private conversations: Map<string, CopilotConversation> = new Map();
  private readonly agentId = "copilot-agent";
  private prisma: any = null;

  // Lazy load Prisma to avoid import issues
  private async getPrisma() {
    if (!this.prisma) {
      try {
        const { prisma } = await import("@/lib/services/database/prismaClient");
        this.prisma = prisma;
      } catch (error) {
        console.warn(
          "[Copilot] Prisma not available, using in-memory storage:",
          error,
        );
        return null;
      }
    }
    return this.prisma;
  }

  /**
   * Process a user message with full RAG, memory, and AI integration
   */
  async processMessage(
    tenantId: string,
    userId: string,
    request: CopilotRequest,
  ): Promise<CopilotResponse> {
    const startTime = Date.now();

    // Validate inputs
    if (!tenantId || !userId) {
      throw new Error("Tenant ID and User ID are required");
    }

    if (!request.message || !request.message.trim()) {
      throw new Error("Message is required");
    }

    try {
      // 1. Get or create conversation
      const conversation = await this.getOrCreateConversation(
        tenantId,
        userId,
        request.conversationId,
      );

      // 2. Build context from RAG (Knowledge Base) with retry
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
        } catch (error) {
          console.warn(
            "[Copilot] RAG search failed after retries, continuing without knowledge:",
            error,
          );
        }
      }

      // 3. Get relevant agent memories
      const memories: MemoryEntry[] = [];
      if (request.options?.useMemory !== false) {
        try {
          const agentMemory = getAgentMemory(this.agentId, "copilot");
          const relevantMemories = await agentMemory.recall(request.message, {
            limit: 10,
          });
          memories.push(...relevantMemories);
        } catch (error) {
          console.warn(
            "[Copilot] Memory retrieval failed, continuing without memory:",
            error,
          );
        }
      }

      // 4. Build enhanced prompt with context
      const systemPrompt = this.buildSystemPrompt(
        knowledgeContext,
        memories,
        request.context,
      );
      const userMessageContent = this.buildUserMessage(
        request.message,
        knowledgeContext,
        memories,
      );

      // 5. Call AI directly (real AI, not mock)
      // Build messages for AI
      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [];

      // Add system prompt
      messages.push({
        role: "system",
        content: systemPrompt,
      });

      // Add conversation history (last 10 messages)
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
        content: userMessageContent,
      });

      // Call AI - use direct provider calls when server-side for better reliability
      // This avoids issues with server-side fetch and ensures API keys from .env.local are used
      let aiResponse: { content: string; tokensUsed?: number; model?: string };
      let confidence = 0.8;
      let taskResult: TaskResult;

      try {
        // Server-side: Call providers directly using the same logic as /api/ai/chat
        // Client-side: Use the API route proxy
        if (typeof window === "undefined") {
          // Server-side: Call AI providers directly
          // Check both server-side and client-side env vars (for Next.js compatibility)
          const openaiKey =
            process.env.OPENAI_API_KEY ||
            process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
            "";
          const anthropicKey =
            process.env.ANTHROPIC_API_KEY ||
            process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
            "";

          // DEBUG: Log what we found (without exposing full keys)
          console.log("[Copilot] API Key Check:", {
            hasOpenAIKey: !!openaiKey,
            openaiKeyLength: openaiKey?.length || 0,
            openaiKeyPrefix: openaiKey?.substring(0, 10) || "none",
            hasAnthropicKey: !!anthropicKey,
            anthropicKeyLength: anthropicKey?.length || 0,
            anthropicKeyPrefix: anthropicKey?.substring(0, 15) || "none",
            envVarsAvailable: Object.keys(process.env).filter((k) =>
              k.includes("API_KEY"),
            ).length,
          });

          // Determine provider
          let provider: "openai" | "anthropic" = "openai";
          let apiKey: string | null = null;

          // More lenient key validation - just check it exists and has reasonable length
          const isValidOpenAIKey =
            openaiKey &&
            openaiKey.trim().length > 20 &&
            (openaiKey.trim().startsWith("sk-") ||
              openaiKey.trim().startsWith("sk_") ||
              openaiKey.trim().startsWith("sk-proj-")) &&
            !openaiKey.includes("your-") &&
            !openaiKey.includes("placeholder") &&
            !openaiKey.includes("example");

          const isValidAnthropicKey =
            anthropicKey &&
            anthropicKey.trim().length > 20 &&
            (anthropicKey.trim().startsWith("sk-ant-") ||
              anthropicKey.trim().startsWith("sk-ant_")) &&
            !anthropicKey.includes("your-") &&
            !anthropicKey.includes("placeholder") &&
            !anthropicKey.includes("example");

          console.log("[Copilot] Key Validation:", {
            isValidOpenAIKey,
            isValidAnthropicKey,
            openaiKeyStartsWith: openaiKey?.trim().substring(0, 10),
            anthropicKeyStartsWith: anthropicKey?.trim().substring(0, 15),
          });

          if (isValidOpenAIKey) {
            provider = "openai";
            apiKey = openaiKey.trim();
          } else if (isValidAnthropicKey) {
            provider = "anthropic";
            apiKey = anthropicKey.trim();
          } else {
            // Provide detailed error message with diagnostics
            const missingKeys = [];
            const openaiIssues = [];
            const anthropicIssues = [];

            if (!openaiKey) {
              missingKeys.push("OPENAI_API_KEY");
              openaiIssues.push("key is missing");
            } else if (
              openaiKey.includes("your-") ||
              openaiKey.includes("placeholder") ||
              openaiKey.includes("example")
            ) {
              missingKeys.push("OPENAI_API_KEY");
              openaiIssues.push("key appears to be a placeholder");
            } else if (openaiKey.trim().length < 20) {
              missingKeys.push("OPENAI_API_KEY");
              openaiIssues.push(
                `key is too short (${openaiKey.length} chars, need >20)`,
              );
            } else if (
              !openaiKey.trim().startsWith("sk-") &&
              !openaiKey.trim().startsWith("sk_") &&
              !openaiKey.trim().startsWith("sk-proj-")
            ) {
              missingKeys.push("OPENAI_API_KEY");
              openaiIssues.push(
                `key has invalid prefix (starts with: ${openaiKey.trim().substring(0, 10)})`,
              );
            }

            if (!anthropicKey) {
              missingKeys.push("ANTHROPIC_API_KEY");
              anthropicIssues.push("key is missing");
            } else if (
              anthropicKey.includes("your-") ||
              anthropicKey.includes("placeholder") ||
              anthropicKey.includes("example")
            ) {
              missingKeys.push("ANTHROPIC_API_KEY");
              anthropicIssues.push("key appears to be a placeholder");
            } else if (anthropicKey.trim().length < 20) {
              missingKeys.push("ANTHROPIC_API_KEY");
              anthropicIssues.push(
                `key is too short (${anthropicKey.length} chars, need >20)`,
              );
            } else if (
              !anthropicKey.trim().startsWith("sk-ant-") &&
              !anthropicKey.trim().startsWith("sk-ant_")
            ) {
              missingKeys.push("ANTHROPIC_API_KEY");
              anthropicIssues.push(
                `key has invalid prefix (starts with: ${anthropicKey.trim().substring(0, 15)})`,
              );
            }

            const errorDetails = [
              `OpenAI: ${openaiKey ? `found (${openaiKey.length} chars) - ${openaiIssues.join(", ") || "validation failed"}` : "not found"}`,
              `Anthropic: ${anthropicKey ? `found (${anthropicKey.length} chars) - ${anthropicIssues.join(", ") || "validation failed"}` : "not found"}`,
            ].join(" | ");

            console.error("[Copilot] API Key Validation Failed:", {
              openaiKey: openaiKey
                ? `${openaiKey.substring(0, 10)}... (${openaiKey.length} chars)`
                : "missing",
              anthropicKey: anthropicKey
                ? `${anthropicKey.substring(0, 15)}... (${anthropicKey.length} chars)`
                : "missing",
              issues: { openai: openaiIssues, anthropic: anthropicIssues },
            });

            throw new Error(
              `No valid API key found. Please set ${missingKeys.join(" or ")} in .env.local with a valid key (not a placeholder). Details: ${errorDetails}`,
            );
          }

          // Call provider directly
          const model =
            provider === "openai"
              ? "gpt-4o-mini"
              : "claude-3-5-sonnet-20241022";
          const temperature = request.options?.temperature || 0.7;
          const maxTokens = request.options?.maxTokens || 2000;

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
                    content: m.content,
                  })),
                  temperature,
                  max_tokens: maxTokens,
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
            aiResponse = {
              content: data.choices?.[0]?.message?.content || "",
              tokensUsed: data.usage?.total_tokens,
              model: data.model,
            };
          } else {
            // Anthropic
            const system = messages.find((m) => m.role === "system")?.content;
            const conversation = messages.filter((m) => m.role !== "system");

            const response = await fetch(
              "https://api.anthropic.com/v1/messages",
              {
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
                  messages: conversation.map((m) => ({
                    role: m.role === "assistant" ? "assistant" : "user",
                    content: m.content,
                  })),
                }),
              },
            );

            if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              const errorMessage =
                err?.error?.message ||
                err?.message ||
                `Anthropic API error: ${response.status}`;
              console.error("[Copilot] Anthropic API Error:", {
                status: response.status,
                statusText: response.statusText,
                error: errorMessage,
                errorDetails: err,
              });
              throw new Error(errorMessage);
            }

            const data = await response.json();
            aiResponse = {
              content: data.content?.[0]?.text || "",
              tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
              model: data.model,
            };
          }
        } else {
          // Client-side: Use API route proxy
          const { callAI } = await import("@/utils/aiClient");
          aiResponse = await callAI({
            messages,
            provider: "auto",
            model: "gpt-4o-mini",
            temperature: request.options?.temperature || 0.7,
            maxTokens: request.options?.maxTokens || 2000,
          });
        }

        const content = aiResponse.content || "";
        confidence =
          content.length > 50 ? 0.85 : content.length > 20 ? 0.75 : 0.65;

        // Create task result structure for compatibility
        taskResult = {
          taskId: `copilot-${Date.now()}`,
          agentId: this.agentId,
          status: "success",
          output: {
            result: content,
            content: content,
            tokensUsed: aiResponse.tokensUsed,
          },
          confidence: confidence * 100, // Convert to percentage
          processingTime: Date.now() - startTime,
        };
      } catch (aiError: any) {
        console.error("[Copilot] AI call failed:", aiError);
        console.error("[Copilot] Error details:", {
          message: aiError?.message,
          stack: aiError?.stack,
          name: aiError?.name,
        });

        // Provide more helpful error message
        let fallbackContent =
          "I'm here to help! Could you please rephrase your question? I want to make sure I understand what you need.";

        // Check if it's an API key issue
        if (
          aiError?.message?.includes("API key") ||
          aiError?.message?.includes("Missing") ||
          aiError?.message?.includes("invalid") ||
          aiError?.message?.includes("No valid")
        ) {
          fallbackContent =
            'I need an API key to work properly. Please check your .env.local file has OPENAI_API_KEY or ANTHROPIC_API_KEY set with a valid key (not a placeholder like "sk-your-...").';
        } else if (
          aiError?.message?.includes("Rate limit") ||
          aiError?.message?.includes("429")
        ) {
          fallbackContent =
            "I'm receiving too many requests right now. Please wait a moment and try again.";
        } else if (
          aiError?.message?.includes("network") ||
          aiError?.message?.includes("fetch") ||
          aiError?.message?.includes("ECONNREFUSED")
        ) {
          fallbackContent =
            "I'm having trouble connecting to the AI service. Please check your internet connection and try again.";
        }

        confidence = 0.5;

        taskResult = {
          taskId: `copilot-${Date.now()}`,
          agentId: this.agentId,
          status: "partial",
          output: {
            result: fallbackContent,
            content: fallbackContent,
          },
          confidence: 50, // Minimum confidence
          processingTime: Date.now() - startTime,
        };

        aiResponse = {
          content: fallbackContent,
          tokensUsed: 0,
        };
      }

      // 6. Detect and execute tool calls if AI suggests them
      const toolCalls: ToolCall[] = [];
      const toolResults: ToolResult[] = [];

      // Parse AI response for tool calls (simplified - real implementation would use function calling)
      const aiResponseText =
        taskResult.output?.result || taskResult.output?.content || "";
      const toolCallMatches = aiResponseText.match(/\[TOOL:(\w+):(.*?)\]/g);

      if (toolCallMatches && request.options?.useTools !== false) {
        for (const match of toolCallMatches) {
          const [, toolId, inputStr] =
            match.match(/\[TOOL:(\w+):(.*?)\]/) || [];
          if (toolId && toolRegistry.get(toolId)) {
            try {
              const toolInput = inputStr ? JSON.parse(inputStr) : {};
              const toolCall: ToolCall = {
                id: `tool-call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                toolId,
                name: toolRegistry.get(toolId)!.name,
                input: toolInput,
              };
              toolCalls.push(toolCall);

              // Execute tool
              const toolResult = await toolExecutor.execute(
                {
                  toolId,
                  input: toolInput,
                  confirm: false, // Would check if tool requires confirmation
                },
                {
                  tenantId,
                  userId,
                  moduleId: request.context?.moduleId,
                  featureId: request.context?.featureId,
                },
              );

              toolResults.push({
                id: `tool-result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                toolCallId: toolCall.id,
                success: toolResult.success,
                output: toolResult.success ? toolResult.output : undefined,
                error: toolResult.success ? undefined : toolResult.error,
              });
            } catch (error) {
              console.error("[Copilot] Tool execution error:", error);
            }
          }
        }
      }

      // 7. Create response message
      // Ensure we always have a good response
      let responseContent =
        taskResult.output?.result || taskResult.output?.content || "";

      // If response is an error message or too low confidence, provide helpful fallback
      if (
        !responseContent ||
        responseContent.toLowerCase().includes("error") ||
        (taskResult.confidence || 0) < 30
      ) {
        responseContent =
          "I'm here to help! Could you please rephrase your question? I want to make sure I understand what you need.";
        // Update confidence to minimum acceptable level
        taskResult.confidence = Math.max(taskResult.confidence || 0, 50);
      }

      const responseMessage: CopilotMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
        metadata: {
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          toolResults: toolResults.length > 0 ? toolResults : undefined,
          knowledgeUsed: knowledgeContext.map((k) => k.entry.id),
          confidence: Math.max(taskResult.confidence || 0.8, 0.5), // Never show below 50%
          tokensUsed: taskResult.output?.tokensUsed,
          processingTime: Date.now() - startTime,
        },
      };

      // 8. Update conversation (with database persistence)
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

      // Persist to database if available
      const prisma = await this.getPrisma();
      if (prisma) {
        try {
          // Save messages to database
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

          // Update conversation timestamp
          await prisma.copilotConversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });
        } catch (error) {
          console.warn("[Copilot] Failed to persist messages to DB:", error);
        }
      }

      // 9. Learn from interaction (store in knowledge base if valuable)
      if (confidence > 0.8 && knowledgeContext.length === 0) {
        // This might be new knowledge worth storing
        try {
          await knowledgeBaseService.create({
            tenantId,
            type: "insight",
            category: "general" as KnowledgeCategory,
            content: `User asked: "${request.message}". Assistant responded: "${responseMessage.content}"`,
            summary: `Q&A: ${request.message.substring(0, 100)}`,
            metadata: {
              source: "copilot_interaction",
              userId,
              conversationId: conversation.id,
            },
            keywords: this.extractKeywords(request.message),
            searchableText: `${request.message} ${responseMessage.content}`,
            source: "user_input",
            confidence: Math.round(confidence * 100),
            verified: false,
            feedbackScore: 0,
            usageCount: 0,
            status: "active",
            version: 1,
          });
        } catch (error) {
          console.warn("[Copilot] Failed to store knowledge:", error);
        }
      }

      // 10. Track analytics
      try {
        copilotAnalytics.trackMessage(tenantId, userId, {
          usedRAG: knowledgeContext.length > 0,
          usedMemory: memories.length > 0,
          usedTools: toolCalls.length > 0,
          usedStreaming: false, // Would be set if streaming was used
          confidence: taskResult.confidence || 0.8,
          responseTime: Date.now() - startTime,
          knowledgeRetrieved: knowledgeContext.length,
          memoriesRetrieved: memories.length,
          error: taskResult.status !== "success",
        });
      } catch (error) {
        console.warn("[Copilot] Failed to track analytics:", error);
      }

      // 11. Publish events for cross-module awareness
      try {
        // Main event
        await eventBus.publish(
          createEvent(
            "copilot.message.processed",
            tenantId,
            "Tenant",
            {
              conversationId: conversation.id,
              messageId: responseMessage.id,
              confidence: taskResult.confidence,
              knowledgeUsed: knowledgeContext.length,
              memoriesUsed: memories.length,
              processingTime: Date.now() - startTime,
            },
            1,
            { tenantId, userId },
          ),
        );

        // If knowledge was used, publish that too
        if (knowledgeContext.length > 0) {
          await eventBus.publish(
            createEvent(
              "copilot.knowledge.used",
              tenantId,
              "Tenant",
              {
                conversationId: conversation.id,
                knowledgeEntries: knowledgeContext.map((k) => k.entry.id),
                categories: [
                  ...new Set(knowledgeContext.map((k) => k.entry.category)),
                ],
              },
              1,
              { tenantId, userId },
            ),
          );
        }

        // If new knowledge was created, publish that
        if (taskResult.confidence > 0.8 && knowledgeContext.length === 0) {
          await eventBus.publish(
            createEvent(
              "copilot.knowledge.created",
              tenantId,
              "Tenant",
              {
                conversationId: conversation.id,
                source: "copilot_interaction",
              },
              1,
              { tenantId, userId },
            ),
          );
        }
      } catch (error) {
        console.warn("[Copilot] Failed to publish events:", error);
      }

      return {
        conversationId: conversation.id, // CRITICAL: Return conversationId for frontend memory
        message: responseMessage,
        knowledgeUsed: knowledgeContext,
        memoriesUsed: memories,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        confidence: taskResult.confidence || 0.8,
        processingTime: Date.now() - startTime,
        suggestedActions: this.generateSuggestedActions(
          request.message,
          knowledgeContext,
        ),
      };
    } catch (error: any) {
      console.error("[Copilot] Error processing message:", error);
      console.error("[Copilot] Error type:", error?.constructor?.name);
      console.error("[Copilot] Error message:", error?.message);
      console.error("[Copilot] Error stack:", error?.stack);

      // Provide more specific error message
      let errorContent =
        "I apologize, but I encountered an issue processing your request. Please try rephrasing your question or contact support if the problem persists.";

      if (error?.message) {
        // Include the actual error message for debugging
        if (error.message.includes("API key")) {
          errorContent =
            "I need an API key to work properly. Please check your .env.local file has OPENAI_API_KEY or ANTHROPIC_API_KEY set with a valid key.";
        } else if (
          error.message.includes("Tenant ID") ||
          error.message.includes("User ID")
        ) {
          errorContent =
            "Authentication error. Please refresh the page and try again.";
        } else if (error.message.includes("Message is required")) {
          errorContent = "Please provide a message to send.";
        } else {
          // In development, show more details
          if (process.env.NODE_ENV === "development") {
            errorContent = `Error: ${error.message}. Please check the console for more details.`;
          }
        }
      }

      // Always return a response, never fail silently
      const errorMessage: CopilotMessage = {
        id: `msg-error-${Date.now()}`,
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
        metadata: {
          confidence: 0.5,
          processingTime: Date.now() - startTime,
          error: error?.message,
        },
      };

      // Generate a new conversation ID for error responses if we don't have one
      const errorConversationId = `conv-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        conversationId: errorConversationId,
        message: errorMessage,
        knowledgeUsed: [],
        memoriesUsed: [],
        confidence: 0.5,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get or create a conversation (with database persistence)
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
          // Convert DB format to service format
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
          "[Copilot] Failed to load conversation from DB, using in-memory:",
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
        console.warn("[Copilot] Failed to save conversation to DB:", error);
      }
    }

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Build system prompt with RAG and memory context
   */
  private buildSystemPrompt(
    knowledge: SearchResult[],
    memories: MemoryEntry[],
    context?: CopilotRequest["context"],
  ): string {
    let prompt = `You are HazalyzeCopilot, an ADVANCED AUTONOMOUS AI AGENT integrated into the BlueDXP Platform.
You help users with warehouse management, transportation, compliance, and all platform operations.
You have access to real-time knowledge, memory, and tools to provide accurate, contextual assistance.

⚡ CRITICAL: CONVERSATION MEMORY ⚡
You MUST remember and reference previous messages in this conversation! The conversation history is provided to you in the messages - USE IT! If the user says "do what you just said", "yes go ahead", or references something from earlier, LOOK AT THE PREVIOUS MESSAGES and execute what was discussed.

Platform Context:
- BlueDXP is an enterprise intelligence operating system
- Multi-module platform: WMS, TMS, ISO-IMS, MSDS, QHSE, Trade Compliance, Proposals/RFQ, MaaS
- 4IR & 5IR aligned with IoT, AI/ML, automation, and human-centric collaboration
`;

    if (context?.moduleId) {
      prompt += `\nCurrent Module: ${context.moduleId}\n`;
    }

    if (knowledge.length > 0) {
      prompt += `\nRelevant Knowledge Base Information:\n`;
      knowledge.slice(0, 5).forEach((k, i) => {
        prompt += `${i + 1}. ${k.entry.summary || k.entry.content.substring(0, 200)}\n`;
      });
    }

    if (memories.length > 0) {
      prompt += `\nRelevant Context from Previous Interactions:\n`;
      memories.slice(0, 5).forEach((m, i) => {
        prompt += `${i + 1}. ${m.content.substring(0, 200)}\n`;
      });
    }

    prompt += `\nGuidelines:
- CONVERSATION MEMORY: Always check conversation history! If user references "what you said" or "above" or "that", look back!
- AUTOPILOT MODE: When user says "yes", "go ahead", "do it" - EXECUTE what was discussed immediately!
- Be concise but thorough
- Use the knowledge base information when relevant
- Reference previous context when appropriate
- If you don't know something, say so rather than guessing
- Always consider multi-tenant isolation and security
- Provide actionable insights aligned with 4IR/5IR principles
- When asked to create something with test data - DO IT immediately, don't ask for details!

Available Tools:
When the user asks for an action, use the following syntax: [TOOL:tool_id:json_input]
Navigation syntax: [NAVIGATE:"/path"]

Tools available:
${toolRegistry
  .getAll()
  .map((t) => `- ${t.name} (ID: ${t.id}): ${t.description}`)
  .join("\n")}
`;

    return prompt;
  }

  /**
   * Build user message with context
   */
  private buildUserMessage(
    message: string,
    knowledge: SearchResult[],
    memories: MemoryEntry[],
  ): string {
    let userMessage = message;

    if (knowledge.length > 0) {
      userMessage += `\n\n[Context: I have access to ${knowledge.length} relevant knowledge entries from the knowledge base]`;
    }

    if (memories.length > 0) {
      userMessage += `\n[Context: I remember ${memories.length} relevant items from previous interactions]`;
    }

    return userMessage;
  }

  /**
   * Extract keywords from text
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
   * Generate suggested actions based on message
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
   * Get conversation by ID
   */
  getConversation(
    conversationId: string,
    tenantId: string,
  ): CopilotConversation | null {
    const conversation = this.conversations.get(conversationId);
    if (conversation && conversation.tenantId === tenantId) {
      return conversation;
    }
    return null;
  }

  /**
   * List conversations for a tenant/user
   */
  listConversations(tenantId: string, userId?: string): CopilotConversation[] {
    return Array.from(this.conversations.values()).filter(
      (c) => c.tenantId === tenantId && (!userId || c.userId === userId),
    );
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId: string, tenantId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (conversation && conversation.tenantId === tenantId) {
      this.conversations.delete(conversationId);
      return true;
    }
    return false;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const copilotService = new HazalyzeCopilotService();
export default copilotService;
